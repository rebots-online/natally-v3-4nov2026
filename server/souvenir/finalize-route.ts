// §7.1, §7.5: POST /api/souvenir/finalize. Every step is safe to repeat:
// publish once by serverDelivery, ledger links set once, email once by emailedAt.
import type { DeliveryFile, LedgerEntry } from '../../src/types/index.ts';
import { HttpError, jsonOk, type HandlerContext, type Route } from '../core/index.ts';
import { deliveryFor } from './delivery.ts';
import { deliveryToken, isRecord, loadSnapshot, parseRemotePath, parseSnapshotId, requireUid } from './shared.ts';

const MAX_FILES = 500;
const EMAIL = /^[^\s@,;<>"]+@[^\s@,;<>"]+$/;

interface Body { snapshotId: string; files: DeliveryFile[]; pdfPath: string; atelierPath: string; }

function parseBody(json: unknown): Body {
  if (!isRecord(json)) throw new HttpError('bad_request', 400, 'The body must be an object.');
  if (!Array.isArray(json.files) || json.files.length === 0 || json.files.length > MAX_FILES) throw new HttpError('bad_request', 400, 'files must list 1 to 500 files.');
  const files: DeliveryFile[] = [];
  for (const f of json.files as unknown[]) {
    if (!isRecord(f) || typeof f.contentType !== 'string' || f.contentType.length === 0 || f.contentType.length > 100
      || typeof f.bytes !== 'number' || !Number.isSafeInteger(f.bytes) || f.bytes < 0) throw new HttpError('bad_request', 400, 'A file entry is not valid.');
    files.push({ remotePath: parseRemotePath(f.remotePath), contentType: f.contentType, bytes: f.bytes });
  }
  const paths = new Set(files.map((f) => f.remotePath));
  if (paths.size !== files.length) throw new HttpError('bad_request', 400, 'A path is listed twice.');
  const pdfPath = parseRemotePath(json.pdfPath);
  const atelierPath = parseRemotePath(json.atelierPath);
  if (!paths.has(pdfPath) || !paths.has(atelierPath)) throw new HttpError('bad_request', 400, 'pdfPath and atelierPath must be among files.');
  return { snapshotId: parseSnapshotId(json.snapshotId), files, pdfPath, atelierPath };
}

async function finalize(ctx: HandlerContext): Promise<Response> {
  const uid = requireUid(ctx);
  const { snapshotId, files, pdfPath, atelierPath } = parseBody(ctx.json);
  const snapshot = await loadSnapshot(ctx, uid, snapshotId);
  const ledgerRef = ctx.db.doc(`users/${uid}/ledger/${snapshotId}`);
  const ledger = await ledgerRef.get();
  const entry = ledger.data() as LedgerEntry | undefined;
  if (!entry || entry.kind !== 'souvenir_purchase') throw new HttpError('not_found', 404, 'No such souvenir purchase.');

  const delivery = deliveryFor(ctx.cfg, uid);
  const deliveryRef = ctx.db.doc(`serverDelivery/${snapshotId}`);
  const published = await deliveryRef.get();
  let links = entry.souvenir?.pdfUrl && entry.souvenir.atelierUrl ? { pdfUrl: entry.souvenir.pdfUrl, atelierUrl: entry.souvenir.atelierUrl } : null;

  if (!links || !published.exists || !published.data()?.publishedAt) {
    links = await delivery.publish(snapshotId, files, { pdfPath, atelierPath });
    if (!published.exists) {
      const token = deliveryToken(uid, snapshotId, ctx.cfg.revenueCat.webhookAuth);
      try {
        await deliveryRef.create({ uid, token, publishedAt: new Date().toISOString(), emailedAt: null });
      } catch (e) {
        if ((e as { code?: unknown }).code !== 6) throw e;   // a concurrent finalize created it first
      }
    } else {
      await deliveryRef.update({ publishedAt: new Date().toISOString() });
    }
  }

  // Links are set once: a second finalize keeps what the first wrote.
  const settled = await ctx.db.runTransaction(async (tx) => {
    const cur = (await tx.get(ledgerRef)).data() as LedgerEntry | undefined;
    if (cur?.souvenir?.pdfUrl && cur.souvenir.atelierUrl) return { pdfUrl: cur.souvenir.pdfUrl, atelierUrl: cur.souvenir.atelierUrl };
    tx.update(ledgerRef, { souvenir: { snapshotId, pdfUrl: links.pdfUrl, atelierUrl: links.atelierUrl } });
    return links;
  });

  let emailSent = (await deliveryRef.get()).data()?.emailedAt != null;
  const to = snapshot.customerEmail;
  if (!emailSent && to && EMAIL.test(to)) {
    try {
      await delivery.notify(to, snapshot.customerName, settled);
      await deliveryRef.update({ emailedAt: new Date().toISOString() });
      emailSent = true;
    } catch (e) {
      console.error('souvenir finalize: email not sent', e instanceof Error ? e.name : typeof e);   // a repeat finalize retries
    }
  }
  return jsonOk({ pdfUrl: settled.pdfUrl, atelierUrl: settled.atelierUrl, emailSent });
}

export const finalizeRoute: Route = { method: 'POST', path: '/api/souvenir/finalize', auth: 'id_token', handle: finalize };
