// §7.4 mint: settle, retire the old key, check the balance, create a key capped at that balance. The plaintext key is stored nowhere.
import { createHash } from 'node:crypto';
import type { MintedKey, Uid } from '../../src/types/index.ts';
import { HttpError, type HandlerContext } from '../core/index.ts';
import { createKey, deleteKey, disableKey } from './openrouter.ts';
import { currentKeyRef, isoNow, retiringKeyRef, settleUsage, type CurrentKeyRecord, type RetiringKeyRecord } from './settle.ts';

type Ctx = Pick<HandlerContext, 'cfg' | 'db'>;

function retiringFrom(record: CurrentKeyRecord): RetiringKeyRecord {
  return { settledUsd: record.settledUsd, settleSeq: record.settleSeq, retiredAt: isoNow() };
}

/** Step 2. The record moves only after OpenRouter has disabled the key; a key already gone leaves nothing to settle. */
async function retireCurrent(uid: Uid, ctx: Ctx): Promise<void> {
  const { db, cfg } = ctx;
  const currentRef = currentKeyRef(db, uid);
  const seen = (await currentRef.get()).data() as CurrentKeyRecord | undefined;
  if (!seen) return;
  const hash = seen.currentHash;
  const stillThere = await disableKey(cfg, hash);
  await db.runTransaction(async (tx) => {
    const record = (await tx.get(currentRef)).data() as CurrentKeyRecord | undefined;
    if (record?.currentHash !== hash) return;   // a concurrent mint already moved it
    if (stillThere) tx.set(retiringKeyRef(db, uid, hash), retiringFrom(record));
    tx.delete(currentRef);
  });
}

/** Step 5. Last caller wins. Returns the hash of a key a concurrent mint stored meanwhile, which has now lost. */
function storeCurrent(uid: Uid, ours: CurrentKeyRecord, ctx: Ctx): Promise<string | null> {
  const { db } = ctx;
  const currentRef = currentKeyRef(db, uid);
  return db.runTransaction(async (tx) => {
    const other = (await tx.get(currentRef)).data() as CurrentKeyRecord | undefined;
    const displaced = other && other.currentHash !== ours.currentHash ? other : null;
    if (displaced) tx.set(retiringKeyRef(db, uid, displaced.currentHash), retiringFrom(displaced));
    tx.set(currentRef, ours);
    return displaced?.currentHash ?? null;
  });
}

export async function mintKey(uid: Uid, ctx: Ctx): Promise<MintedKey> {
  const { cfg } = ctx;
  if (!cfg.openRouter.managementKey) throw new HttpError('provider_unavailable', 503);   // §7.7

  const { balanceMilli } = await settleUsage(uid, ctx);
  await retireCurrent(uid, ctx);
  if (balanceMilli < cfg.readingMinMilli) throw new HttpError('no_credits', 402);

  const limitUsd = balanceMilli / 1000 * cfg.creditUsdValue;
  const expiresAt = new Date(Date.now() + cfg.openRouter.keyTtlSeconds * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const uidTag = createHash('sha256').update(uid).digest('hex').slice(0, 8);
  const created = await createKey(cfg, { name: `${cfg.appName} ${uidTag}`, limit: limitUsd, expiresAt });

  let displaced: string | null;
  try {
    displaced = await storeCurrent(uid, {
      currentHash: created.hash, limitUsd, settledUsd: 0, settleSeq: 0, createdAt: isoNow(), expiresAt,
    }, ctx);
  } catch (e) {
    // Unrecorded, this live key could never be settled or retired, and the customer never receives it.
    await deleteKey(cfg, created.hash).catch(() => console.error('mint: an unrecorded key could not be deleted'));
    throw e;
  }
  // A loser left enabled could spend the same balance twice. If this fails, the retire grace deletes it.
  if (displaced) await disableKey(cfg, displaced).catch(() => console.warn('mint: a displaced key could not be disabled'));

  return { key: created.key, keyHash: created.hash, limitUsd, expiresAt, balanceMilli };
}
