// §7.1, §7.5: POST /api/souvenir/upload?snapshotId=&path=&offset=. Raw bytes, at most 4 MiB, appended at the remote size.
// A wrong offset answers 409 with the true size, so a repeated or lost chunk is never written twice.
import { HttpError, jsonOk, type HandlerContext, type Route } from '../core/index.ts';
import { deliveryFor } from './delivery.ts';
import { loadSnapshot, OffsetConflict, parseRemotePath, parseSnapshotId, requireUid } from './shared.ts';

const MAX_CHUNK = 4 * 1024 * 1024;
const MAX_FILE = 256 * 1024 * 1024;   // a ceiling no souvenir file approaches; stops an endless resume loop

function parseOffset(v: string | null): number {
  if (v === null || !/^\d{1,12}$/.test(v)) throw new HttpError('bad_request', 400, 'offset must be a whole number.');
  return Number(v);
}

async function upload(ctx: HandlerContext): Promise<Response> {
  const uid = requireUid(ctx);
  const q = new URL(ctx.req.url).searchParams;
  const snapshotId = parseSnapshotId(q.get('snapshotId'));
  const path = parseRemotePath(q.get('path'));
  const offset = parseOffset(q.get('offset'));
  if (!(ctx.req.headers.get('content-type') ?? '').toLowerCase().startsWith('application/octet-stream')) {
    throw new HttpError('bad_request', 400, 'The body must be application/octet-stream.');
  }
  if (Number(ctx.req.headers.get('content-length') ?? '0') > MAX_CHUNK) throw new HttpError('too_large', 413);
  const chunk = new Uint8Array(await ctx.req.arrayBuffer());
  if (chunk.byteLength > MAX_CHUNK) throw new HttpError('too_large', 413);
  if (offset + chunk.byteLength > MAX_FILE) throw new HttpError('too_large', 413);
  await loadSnapshot(ctx, uid, snapshotId);
  try {
    return jsonOk({ nextOffset: await deliveryFor(ctx.cfg, uid).appendChunk(snapshotId, path, offset, chunk) });
  } catch (e) {
    if (e instanceof OffsetConflict) {
      return jsonOk({ error: { code: 'conflict', message: 'The offset is not the size already stored.' }, nextOffset: e.nextOffset }, 409);
    }
    throw e;
  }
}

export const uploadRoute: Route = { method: 'POST', path: '/api/souvenir/upload', auth: 'id_token', handle: upload };
