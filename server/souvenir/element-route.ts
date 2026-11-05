// §7.1, §7.5: POST /api/souvenir/element. One element's text for a souvenir, generated once and stored.
// These calls are paid for by the souvenir price and write no debit.
import type { SouvenirElementContent, SouvenirSnapshot } from '../../src/types/index.ts';
import { HttpError, jsonOk, type HandlerContext, type Route } from '../core/index.ts';
import { buildMessages } from './prompt.ts';
import { isRecord, loadSnapshot, parseElementKey, parseSnapshotId, requireUid } from './shared.ts';

const TEXT_FIELDS = ['subtitle', 'relation', 'aside', 'origins', 'traditional', 'lore', 'examples'] as const;
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

function parseBody(json: unknown): { snapshotId: string; key: ReturnType<typeof parseElementKey>; shorter: boolean } {
  if (!isRecord(json)) throw new HttpError('bad_request', 400, 'The body must be an object.');
  if (json.shorter !== undefined && typeof json.shorter !== 'boolean') throw new HttpError('bad_request', 400, 'shorter must be true or false.');
  return { snapshotId: parseSnapshotId(json.snapshotId), key: parseElementKey(json.key), shorter: json.shorter === true };
}

/** A model may wrap its object in a code fence. */
function unfence(text: string): string {
  const m = /^\s*```(?:json)?\s*([\s\S]*?)\s*```\s*$/i.exec(text);
  return m ? m[1]! : text;
}

/** Every field present and a string; non-empty, except that `opening_reading` keeps its reading in `relation` alone. */
function toContent(raw: unknown, key: SouvenirElementContent['key'], model: string): SouvenirElementContent | null {
  if (!isRecord(raw)) return null;
  const out: Record<string, string> = {};
  for (const f of TEXT_FIELDS) {
    const v = raw[f];
    if (typeof v !== 'string') return null;
    out[f] = v.trim();
  }
  const required = key === 'opening_reading' ? ['relation'] : TEXT_FIELDS;
  if (required.some((f) => (out[f] ?? '') === '')) return null;
  return { key, model, ...out } as SouvenirElementContent;
}

async function generate(ctx: HandlerContext, snapshot: SouvenirSnapshot, key: SouvenirElementContent['key'], shorter: boolean): Promise<SouvenirElementContent> {
  const { souvenirKey, souvenirModel } = ctx.cfg.openRouter;
  if (!souvenirKey) throw new HttpError('provider_unavailable', 503);
  const fail = (): never => { throw new HttpError('provider_unavailable', 502, 'The writing service did not answer. Try again.'); };
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${souvenirKey}`, 'Content-Type': 'application/json',
        'HTTP-Referer': ctx.cfg.allowedOrigins[0] ?? '', 'X-Title': ctx.cfg.appName,
      },
      body: JSON.stringify({
        model: souvenirModel, messages: buildMessages(ctx.cfg.appName, snapshot, key, shorter),
        response_format: { type: 'json_object' }, temperature: 0.8,
      }),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    console.error('souvenir element: model unreachable', e instanceof Error ? e.name : typeof e);
    return fail();
  }
  if (!res.ok) { console.error('souvenir element: model answered', res.status); return fail(); }
  let content: SouvenirElementContent | null = null;
  try {
    const data = (await res.json()) as { model?: unknown; choices?: { message?: { content?: unknown } }[] };
    const text = data.choices?.[0]?.message?.content;
    if (typeof text === 'string') content = toContent(JSON.parse(unfence(text)), key, typeof data.model === 'string' && data.model ? data.model : souvenirModel);
  } catch { content = null; }
  if (!content) { console.error('souvenir element: the model answer was not usable'); return fail(); }
  return content;
}

async function element(ctx: HandlerContext): Promise<Response> {
  const uid = requireUid(ctx);
  const { snapshotId, key, shorter } = parseBody(ctx.json);
  const snapshot = await loadSnapshot(ctx, uid, snapshotId);
  if (key === 'opening_reading' ? snapshot.turns.some((t) => t.role === 'natally') : !snapshot.plan.some((p) => p.key === key)) {
    throw new HttpError('not_found', 404, 'That element is not part of this souvenir.');
  }
  const ref = ctx.db.doc(`users/${uid}/souvenirs/${snapshotId}/elements/${encodeURIComponent(key)}`);
  if (!shorter) {
    const existing = await ref.get();
    if (existing.exists) return jsonOk(existing.data());
  }
  const content = await generate(ctx, snapshot, key, shorter);
  if (shorter) {
    await ref.set(content);   // the one case that replaces a stored element
    return jsonOk(content);
  }
  try {
    await ref.create(content);
  } catch (e) {
    if ((e as { code?: unknown }).code !== 6) throw e;   // ALREADY_EXISTS: a concurrent call stored first; its text is the one the customer keeps
    const winner = await ref.get();
    if (winner.exists) return jsonOk(winner.data());
  }
  return jsonOk(content);
}

export const elementRoute: Route = { method: 'POST', path: '/api/souvenir/element', auth: 'id_token', handle: element };
