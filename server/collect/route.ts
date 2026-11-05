// §7.1, §15.3: POST /api/collect. Relays shell analytics to the GA4 Measurement Protocol.
// Unknown event names are dropped, non-scalar parameters are dropped, nothing identifying is forwarded (no IP, no user agent).
import { ANALYTICS_EVENT_NAMES } from '../../src/types/index.ts';
import { HttpError, jsonOk, type HandlerContext, type Route } from '../core/index.ts';

const MAX_EVENTS = 25;
const MAX_PARAMS = 25;                       // GA4 limit per event
const PARAM_NAME = /^[A-Za-z][A-Za-z0-9_]{0,39}$/;
const MAX_STRING = 100;                      // GA4 limit per string value
const KNOWN = new Set<string>(ANALYTICS_EVENT_NAMES);
const ENDPOINT = 'https://www.google-analytics.com/mp/collect';

type Scalar = string | number | boolean;
interface Outgoing { name: string; params: Record<string, Scalar>; }

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}
function idOf(v: unknown): string | null {
  if (typeof v === 'number' && Number.isFinite(v)) return String(Math.trunc(v));
  if (typeof v === 'string' && v.length > 0 && v.length <= 100) return v;
  return null;
}

function cleanParams(raw: unknown, sessionId: string | null): Record<string, Scalar> {
  const out: Record<string, Scalar> = {};
  if (isRecord(raw)) {
    for (const [k, v] of Object.entries(raw)) {
      if (Object.keys(out).length >= MAX_PARAMS - 2) break;
      if (!PARAM_NAME.test(k)) continue;
      if (typeof v === 'string') out[k] = v.slice(0, MAX_STRING);
      else if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
      else if (typeof v === 'boolean') out[k] = v;
    }
  }
  if (sessionId !== null) out.session_id = sessionId;
  const engaged = out.engagement_time_msec;
  out.engagement_time_msec = typeof engaged === 'number' && engaged >= 1 ? Math.round(engaged) : 1;
  return out;
}

function parse(body: unknown): { clientId: string; events: Outgoing[] } {
  if (!isRecord(body)) throw new HttpError('bad_request', 400, 'The body must be an object.');
  const clientId = idOf(body.clientId);
  if (clientId === null) throw new HttpError('bad_request', 400, 'clientId is required.');
  const sessionId = body.sessionId === undefined || body.sessionId === null ? null : idOf(body.sessionId);
  if (body.sessionId !== undefined && body.sessionId !== null && sessionId === null) throw new HttpError('bad_request', 400, 'sessionId is not valid.');
  if (!Array.isArray(body.events) || body.events.length === 0) throw new HttpError('bad_request', 400, 'events must be a non-empty array.');
  if (body.events.length > MAX_EVENTS) throw new HttpError('bad_request', 400, `At most ${MAX_EVENTS} events.`);
  const events: Outgoing[] = [];
  for (const e of body.events as unknown[]) {
    if (!isRecord(e) || typeof e.name !== 'string' || !KNOWN.has(e.name)) continue;
    events.push({ name: e.name, params: cleanParams(e.params, sessionId) });
  }
  return { clientId, events };
}

async function collect(ctx: HandlerContext): Promise<Response> {
  const { clientId, events } = parse(ctx.json);
  const { measurementId, apiSecret } = ctx.cfg.ga;
  if (!measurementId || !apiSecret || events.length === 0) return jsonOk(null, 204);   // analytics disabled, or nothing known to send
  const url = `${ENDPOINT}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
  try {
    const res = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, events }), signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error('collect: GA4 answered', res.status);
  } catch (e) {
    console.error('collect: GA4 unreachable', e instanceof Error ? e.name : typeof e);   // best effort: the shell never sees this
  }
  return jsonOk(null, 204);
}

export const collectRoute: Route = { method: 'POST', path: '/api/collect', auth: 'none', handle: collect };
