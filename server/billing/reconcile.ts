// §7.2: reconcile and credit grant. The provider's list is the only proof of a purchase; each grant is one transaction keyed by provider transaction id.
import type { Firestore } from 'firebase-admin/firestore';
import type { AccountDoc, IsoInstant, LedgerEntry, ProviderPurchase, ReconcileResult, Uid } from '../../src/types/index.ts';
import type { HandlerContext } from '../core/index.ts';
import { serverRails } from './rails/index.ts';
import type { PriceHint } from './rails/revenuecat.ts';

type Ctx = Pick<HandlerContext, 'cfg' | 'db'>;
type Products = HandlerContext['cfg']['products'];

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
 * The ledger entry and the balance commit together or not at all; an existing entry stops it, so an id can only ever be granted once.
 */
function grant(db: Firestore, uid: Uid, entryId: string, purchase: ProviderPurchase, credits: number, products: Products): Promise<'credited' | 'known'> {
  const accountRef = db.collection('users').doc(uid);
  const entryRef = accountRef.collection('ledger').doc(entryId);
  return db.runTransaction(async (tx) => {
    if ((await tx.get(entryRef)).exists) return 'known';
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
      if ((await grant(db, uid, entryId, priced, credits, products)) === 'credited') credited++;
      else alreadyKnown++;
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
