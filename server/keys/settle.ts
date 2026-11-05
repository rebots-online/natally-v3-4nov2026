// §7.4 settleUsage: turns OpenRouter's reported usage into ledger debits, for the current key and every retiring key.
import type { Firestore } from 'firebase-admin/firestore';
import type { AccountDoc, IsoInstant, LedgerEntry, MilliCredits, Uid, Usd } from '../../src/types/index.ts';
import type { HandlerContext } from '../core/index.ts';
import { deleteKey, getKeyUsage } from './openrouter.ts';

type Ctx = Pick<HandlerContext, 'cfg' | 'db'>;
export interface CurrentKeyRecord { currentHash: string; limitUsd: Usd; settledUsd: Usd; settleSeq: number; createdAt: IsoInstant; expiresAt: IsoInstant; }
export interface RetiringKeyRecord { settledUsd: Usd; settleSeq: number; retiredAt: IsoInstant; }

const USAGE_EPSILON_USD = 0.000001;

export function isoNow(): IsoInstant {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}
export const currentKeyRef = (db: Firestore, uid: Uid) => db.collection('serverKeys').doc(uid);
export const retiringKeyRef = (db: Firestore, uid: Uid, hash: string) => currentKeyRef(db, uid).collection('retiring').doc(hash);

/** ceil(usd / value * 1000). The toFixed drops binary noise, so 0.05 / 0.025 is exactly 2000 and not 2001. */
function milli(usd: Usd, creditUsdValue: number): MilliCredits {
  return Math.ceil(Number((usd / creditUsdValue * 1000).toFixed(6)));
}

/**
 * Step 2. Everything is re-read inside the transaction, which may run more than once: a concurrent settle leaves no delta,
 * and a concurrent mint may have moved the record to `retiring`, which carries its settledUsd and settleSeq along.
 */
function debit(uid: Uid, hash: string, usage: Usd, ctx: Ctx): Promise<MilliCredits> {
  const { db, cfg } = ctx;
  const currentRef = currentKeyRef(db, uid);
  const retiringRef = retiringKeyRef(db, uid, hash);
  const accountRef = db.collection('users').doc(uid);
  return db.runTransaction(async (tx) => {
    const [currentSnap, retiringSnap, accountSnap] = await Promise.all([tx.get(currentRef), tx.get(retiringRef), tx.get(accountRef)]);
    const current = currentSnap.data() as CurrentKeyRecord | undefined;
    const holder = current?.currentHash === hash ? { ref: currentRef, record: current } : retiringSnap.exists ? { ref: retiringRef, record: retiringSnap.data() as RetiringKeyRecord } : null;
    if (!holder) return 0;
    const delta = usage - holder.record.settledUsd;
    if (delta <= USAGE_EPSILON_USD) return 0;

    const debitMilli = milli(delta, cfg.creditUsdValue);
    const settleSeq = holder.record.settleSeq + 1;
    const now = isoNow();
    const account: AccountDoc = accountSnap.exists
      ? (accountSnap.data() as AccountDoc)
      : { uid, balanceMilli: 0, entitlements: [], lifetimeGrantedMilli: 0, lifetimeDebitedMilli: 0, createdAt: now, updatedAt: now };
    const balanceMilli = account.balanceMilli - debitMilli;   // may end slightly below zero; the client shows 0
    const entryId = `usage:${hash}:${settleSeq}`;
    const entry: LedgerEntry = {
      id: entryId, kind: 'usage', amountMilli: -debitMilli, balanceAfterMilli: balanceMilli,
      rail: null, providerTransactionId: null, productId: null, priceLabel: null,
      usageUsd: delta, keyHash: hash, souvenir: null, occurredAt: now, recordedAt: now,
    };
    tx.create(accountRef.collection('ledger').doc(entryId), entry);
    tx.set(accountRef, { ...account, balanceMilli, lifetimeDebitedMilli: account.lifetimeDebitedMilli + debitMilli, updatedAt: now });
    tx.update(holder.ref, { settledUsd: usage, settleSeq });
    return debitMilli;
  });
}

/** Step 1, the 404 case: the key is gone, so whichever record still holds it goes too. */
async function forget(uid: Uid, hash: string, db: Firestore): Promise<void> {
  const currentRef = currentKeyRef(db, uid);
  await db.runTransaction(async (tx) => {
    const current = (await tx.get(currentRef)).data() as CurrentKeyRecord | undefined;
    if (current?.currentHash === hash) tx.delete(currentRef);
    tx.delete(retiringKeyRef(db, uid, hash));
  });
}

async function settleOne(uid: Uid, hash: string, ctx: Ctx): Promise<{ debitedMilli: MilliCredits; gone: boolean }> {
  const usage = await getKeyUsage(ctx.cfg, hash);
  if (usage === null) {
    await forget(uid, hash, ctx.db);
    return { debitedMilli: 0, gone: true };
  }
  return { debitedMilli: await debit(uid, hash, usage, ctx), gone: false };
}

export async function settleUsage(uid: Uid, ctx: Ctx): Promise<{ debitedMilli: MilliCredits; balanceMilli: MilliCredits }> {
  const { db, cfg } = ctx;
  const [currentSnap, retiringSnap] = await Promise.all([currentKeyRef(db, uid).get(), currentKeyRef(db, uid).collection('retiring').get()]);
  let debitedMilli = 0;

  const current = currentSnap.data() as CurrentKeyRecord | undefined;
  if (current) debitedMilli += (await settleOne(uid, current.currentHash, ctx)).debitedMilli;

  for (const doc of retiringSnap.docs) {
    const settled = await settleOne(uid, doc.id, ctx);
    debitedMilli += settled.debitedMilli;
    if (settled.gone) continue;
    // Step 3: usage can post after a stream ends, so a retired key stays readable until the grace has passed.
    const ageMs = Date.now() - Date.parse((doc.data() as RetiringKeyRecord).retiredAt);
    if (ageMs > cfg.openRouter.retireGraceSeconds * 1000) {
      await deleteKey(cfg, doc.id);
      await doc.ref.delete();
    }
  }

  const account = (await db.collection('users').doc(uid).get()).data() as AccountDoc | undefined;
  return { debitedMilli, balanceMilli: account?.balanceMilli ?? 0 };
}
