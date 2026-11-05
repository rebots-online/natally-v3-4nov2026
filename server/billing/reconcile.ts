// §7.2: reconcile and credit grant. The provider's list is the only proof of a purchase; each grant is one transaction keyed by provider transaction id.
import type { Firestore } from 'firebase-admin/firestore';
import type { AccountDoc, IsoInstant, LedgerEntry, ReconcileResult, Uid } from '../../src/types/index.ts';
import type { HandlerContext } from '../core/index.ts';
import { serverRails, type RailPurchase } from './rails/index.ts';
import type { PriceHint } from './rails/revenuecat.ts';

type Ctx = Pick<HandlerContext, 'cfg' | 'db'>;
type Products = HandlerContext['cfg']['products'];
interface PurchaseClaim { uid: Uid; creditedAt: IsoInstant; }

function isoNow(): IsoInstant {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** Credits for a product, or null when it is unmapped. A souvenir id with no credits entry counts as 0. */
function creditsFor(products: Products, productId: string): number | null {
  if (Object.hasOwn(products.credits, productId)) return products.credits[productId]!;
  return products.souvenirIds.includes(productId) ? 0 : null;
}

/**
 * Step 5. Firestore may run this closure more than once, so it changes nothing outside the transaction and reports what it did by its return value.
 * The claims, the ledger entry and the balance commit together or not at all. `purchaseClaims` spans accounts, so a transaction is credited once ever:
 * any existing claim, under any of the purchase's ids, stops the grant. A later sight that adds an id claims it for the same owner.
 */
function grant(db: Firestore, uid: Uid, entryId: string, purchase: RailPurchase, credits: number, products: Products): Promise<'credited' | 'known' | 'claimed_elsewhere'> {
  const accountRef = db.collection('users').doc(uid);
  const entryRef = accountRef.collection('ledger').doc(entryId);
  const claimRefs = purchase.claimIds.map((id) => db.collection('purchaseClaims').doc(`${purchase.rail}_${encodeURIComponent(id)}`));
  return db.runTransaction(async (tx) => {
    const entrySnap = await tx.get(entryRef);
    const claimSnaps = await Promise.all(claimRefs.map((ref) => tx.get(ref)));
    const claim = claimSnaps.find((snap) => snap.exists)?.data() as PurchaseClaim | undefined;
    if (claim || entrySnap.exists) {
      const held: PurchaseClaim = claim ?? { uid, creditedAt: isoNow() };
      claimSnaps.forEach((snap, i) => { if (!snap.exists) tx.create(claimRefs[i]!, held); });
      return held.uid === uid ? 'known' : 'claimed_elsewhere';
    }
    const accountSnap = await tx.get(accountRef);
    const now = isoNow();
    const account: AccountDoc = accountSnap.exists
      ? (accountSnap.data() as AccountDoc)
      : { uid, balanceMilli: 0, entitlements: [], lifetimeGrantedMilli: 0, lifetimeDebitedMilli: 0, createdAt: now, updatedAt: now };
    const amountMilli = Math.round(credits * 1000);
    const balanceMilli = account.balanceMilli + amountMilli;
    const entitlement = Object.hasOwn(products.entitlements, purchase.productId) ? products.entitlements[purchase.productId] : undefined;
    const isSouvenir = products.souvenirIds.includes(purchase.productId);
    const next: AccountDoc = {
      ...account, balanceMilli,
      lifetimeGrantedMilli: account.lifetimeGrantedMilli + amountMilli,
      entitlements: entitlement && !account.entitlements.includes(entitlement) ? [...account.entitlements, entitlement] : account.entitlements,
      updatedAt: now,
    };
    const entry: LedgerEntry = {
      id: entryId, kind: isSouvenir ? 'souvenir_purchase' : 'purchase', amountMilli, balanceAfterMilli: balanceMilli,
      rail: purchase.rail, providerTransactionId: purchase.transactionId, productId: purchase.productId,
      priceLabel: purchase.priceLabel, usageUsd: null, keyHash: null,
      souvenir: isSouvenir ? { snapshotId: null, pdfUrl: null, atelierUrl: null } : null,
      occurredAt: purchase.purchasedAt, recordedAt: now,
    };
    tx.set(accountRef, next);
    tx.create(entryRef, entry);
    const ours: PurchaseClaim = { uid, creditedAt: now };
    for (const ref of claimRefs) tx.create(ref, ours);
    return 'credited';
  });
}

/** The webhook's entry: reconcileUser plus the price of the one transaction its event named. */
export async function reconcileWithHint(uid: Uid, ctx: Ctx, hint: PriceHint | null): Promise<ReconcileResult> {
  const { cfg, db } = ctx;
  const { products } = cfg;
  let credited = 0;
  let alreadyKnown = 0;
  const unmapped = new Set<string>();

  for (const rail of serverRails(cfg)) {
    const purchases = await rail.listPurchases(uid);
    for (const purchase of purchases) {
      if (purchase.sandbox && !cfg.allowSandbox) continue;
      const credits = creditsFor(products, purchase.productId);
      if (credits === null) {
        if (!unmapped.has(purchase.productId)) console.warn('reconcile: unmapped product', purchase.productId);
        unmapped.add(purchase.productId);
        continue;
      }
      const priced = hint?.transactionId === purchase.transactionId ? { ...purchase, priceLabel: hint.priceLabel } : purchase;
      const entryId = rail.ledgerPrefix + encodeURIComponent(purchase.transactionId);
      const outcome = await grant(db, uid, entryId, priced, credits, products);
      if (outcome === 'credited') credited++;
      else alreadyKnown++;
      if (outcome === 'claimed_elsewhere') console.warn('reconcile: transaction already credited to another account', purchase.transactionId);
    }
  }

  const accountRef = db.collection('users').doc(uid);
  const [accountSnap, souvenirs] = await Promise.all([
    accountRef.get(),
    accountRef.collection('ledger').where('kind', '==', 'souvenir_purchase').get(),
  ]);
  return {
    credited, alreadyKnown, unmappedProducts: [...unmapped],
    balanceMilli: (accountSnap.data() as AccountDoc | undefined)?.balanceMilli ?? 0,
    souvenirEntryIds: souvenirs.docs.filter((d) => !(d.data() as LedgerEntry).souvenir?.pdfUrl).map((d) => d.id),
  };
}

export function reconcileUser(uid: Uid, ctx: Ctx): Promise<ReconcileResult> {
  return reconcileWithHint(uid, ctx, null);
}
