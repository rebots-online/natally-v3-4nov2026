// Validation and naming shared by the three souvenir handlers (§7.5, §6.1).
import { createHash } from 'node:crypto';
import { ANGLE_KEYS, ASPECT_TYPES, HOUSE_KEYS, PLANET_KEYS, SIGN_KEYS, type SouvenirElementId, type SouvenirSnapshot, type Uid } from '../../src/types/index.ts';
import { HttpError, type HandlerContext } from '../core/index.ts';

const SNAPSHOT_ID = /^[A-Za-z0-9:%._-]{1,300}$/;                 // a ledger entry id, `rc:<encoded transaction>`: never a path separator
const REMOTE_PATH = /^[a-z0-9][a-z0-9._/-]*$/;
const PLAIN_KEYS = new Set<string>([...PLANET_KEYS, ...ANGLE_KEYS, ...SIGN_KEYS, ...HOUSE_KEYS]);
const PLANETS = new Set<string>(PLANET_KEYS);
const ASPECTS = new Set<string>(ASPECT_TYPES);

export function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function parseSnapshotId(v: unknown): string {
  if (typeof v !== 'string' || !SNAPSHOT_ID.test(v) || v === '.' || v === '..' || v.startsWith('__')) throw new HttpError('bad_request', 400, 'snapshotId is not valid.');
  return v;
}

/** §7.5: `^[a-z0-9][a-z0-9._/-]*$`, no `..`; also no empty or dot segment and no `.part` ending, which belongs to the server. */
export function parseRemotePath(v: unknown): string {
  if (typeof v !== 'string' || v.length > 200 || !REMOTE_PATH.test(v) || v.includes('..') || v.endsWith('/') || v.endsWith('.part')) {
    throw new HttpError('bad_request', 400, 'path is not valid.');
  }
  for (const seg of v.split('/')) if (seg === '' || seg === '.') throw new HttpError('bad_request', 400, 'path is not valid.');
  return v;
}

/** A SouvenirElementId: a plain chart key, `opening_reading`, or `aspect:<planet>:<type>:<planet>`. */
export function parseElementKey(v: unknown): SouvenirElementId {
  if (typeof v !== 'string') throw new HttpError('bad_request', 400, 'key is not valid.');
  if (v === 'opening_reading' || PLAIN_KEYS.has(v)) return v as SouvenirElementId;
  const m = /^aspect:([a-z_]+):([a-z]+):([a-z_]+)$/.exec(v);
  if (m && PLANETS.has(m[1]!) && ASPECTS.has(m[2]!) && PLANETS.has(m[3]!)) return v as SouvenirElementId;
  throw new HttpError('bad_request', 400, 'key is not valid.');
}

/** First 32 hex of sha256(uid:snapshotId:REVENUECAT_WEBHOOK_AUTH). The secret makes the folder name unguessable from public ids. */
export function deliveryToken(uid: Uid, snapshotId: string, secret: string): string {
  return createHash('sha256').update(`${uid}:${snapshotId}:${secret}`).digest('hex').slice(0, 32);
}

export function requireUid(ctx: HandlerContext): Uid {
  if (!ctx.uid) throw new HttpError('unauthenticated', 401);
  return ctx.uid;
}

/** The snapshot under this uid, or 404. */
export async function loadSnapshot(ctx: HandlerContext, uid: Uid, snapshotId: string): Promise<SouvenirSnapshot> {
  const snap = await ctx.db.doc(`users/${uid}/souvenirs/${snapshotId}`).get();
  if (!snap.exists) throw new HttpError('not_found', 404, 'No such souvenir.');
  return snap.data() as SouvenirSnapshot;
}

/** An append whose offset is not the remote size. `nextOffset` is the true size. */
export class OffsetConflict extends Error {
  constructor(readonly nextOffset: number) { super('offset does not match the remote size'); }
}
