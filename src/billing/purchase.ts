// Purchases and reconcile (§5.7, §11.5, §15.2). The server's ledger is the only truth: a purchase here only asks it to look.
import { useEffect, useRef, type RefObject } from 'react';
import { collection, getDocs, getFirestore, limit, orderBy, query } from 'firebase/firestore';
import { track } from '../analytics';
import { apiFetch, firebaseApp, getSession } from '../auth';
import type { BillingRail, LedgerEntry, ProductRole, PurchaseAttempt, ReconcileResult, Uid } from '../types';
import { showToast } from '../ui';
import { ensureCatalog } from './catalog';
import { getRail } from './rails';
import { strings } from './strings';

type ReconcileTrigger = 'app_open' | 'sign_in' | 'checkout_return' | 'restore';

// §9.4 asks for this effect on a failed checkout, but `room` sits above `billing` in the layer order and no window event carries
// it (§5.18). Loaded only on that failure, and only if the module is present.
const room = import.meta.glob<{ playRoomEffect(name: 'purchase_failed'): void }>('../room/index.ts');

async function hash(text: string): Promise<string | null> {
  if (!crypto.subtle) return null;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest).slice(0, 16), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** One `purchase` event per new ledger entry, read back from the customer's own ledger. Usage entries can sit between them. */
async function trackNewEntries(uid: Uid, count: number) {
  const ledger = collection(getFirestore(firebaseApp), 'users', uid, 'ledger');
  const newest = await getDocs(query(ledger, orderBy('recordedAt', 'desc'), limit(count + 20)));
  const bought = newest.docs
    .map((doc) => ({ id: doc.id, kind: (doc.data() as LedgerEntry).kind }))
    .filter((entry) => entry.kind !== 'usage')
    .slice(0, count);
  for (const entry of bought) {
    const transactionId = await hash(entry.id);
    if (transactionId) {
      track('purchase', { transaction_id: transactionId, items_count: 1, role: entry.kind === 'souvenir_purchase' ? 'souvenir' : 'credits' });
    }
  }
}

let reconciling: Promise<ReconcileResult> | null = null;

export function reconcileNow(trigger: ReconcileTrigger): Promise<ReconcileResult> {
  reconciling ??= apiFetch<ReconcileResult>('/api/purchases/reconcile', { trigger })
    .then((result) => {
      if (result.credited > 0) {
        track('credits_granted', { credited: result.credited, trigger });
        window.dispatchEvent(new CustomEvent('natally:credits-arrived', { detail: { credited: result.credited } }));
        const { uid } = getSession();
        if (uid) void trackNewEntries(uid, result.credited).catch(() => undefined);
      }
      return result;
    })
    .finally(() => {
      reconciling = null;
    });
  return reconciling;
}

export async function restorePurchases(): Promise<ReconcileResult> {
  const { uid } = getSession();
  if (!uid) throw new Error('signed_out');
  const rail = getRail();
  await rail.identify(uid);
  await rail.restore();
  return reconcileNow('restore');
}

let activeHost: RefObject<HTMLDivElement | null> | null = null;

/** The ref for the element `#rcb-ui-root`. While its screen is mounted, a checkout opens inside it. */
export function useCheckoutHost(): RefObject<HTMLDivElement> {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    activeHost = host;
    return () => {
      if (activeHost === host) activeHost = null;
    };
  }, []);
  return host as RefObject<HTMLDivElement>;
}

async function attemptPurchase(rail: BillingRail, productId: string | null, role: ProductRole): Promise<PurchaseAttempt> {
  const { uid, email } = getSession();
  if (!uid) return { outcome: 'failed', productId, message: 'signed_out' };
  try {
    if (rail.capability === 'native_paywall') {
      track('paywall_view', { surface: 'android_paywall' });
      await rail.identify(uid);
      return await rail.presentPaywall(role);
    }
    const products = await ensureCatalog(uid);
    const product = products.find((p) => p.productId === productId && p.role === role);
    if (!product) return { outcome: 'failed', productId, message: 'not_in_catalogue' };
    return await rail.purchase(product, email, activeHost?.current ?? null);
  } catch (err) {
    return { outcome: 'failed', productId, message: err instanceof Error ? err.message : String(err) };
  }
}

export interface BuyRun { attempt: PurchaseAttempt; reconciled: ReconcileResult | null }

/** A null product id is the native paywall's own choice. */
export async function runBuy(productId: string | null, role: ProductRole): Promise<BuyRun> {
  const rail = getRail();
  track('checkout_start', { role, product_id: productId ?? '', rail: rail.key });
  const attempt = await attemptPurchase(rail, productId, role);
  track('checkout_result', { role, product_id: attempt.productId ?? productId ?? '', rail: rail.key, outcome: attempt.outcome });
  if (attempt.outcome === 'failed') {
    showToast(strings['billing.failed'], 'error');
    void room['../room/index.ts']?.().then(({ playRoomEffect }) => playRoomEffect('purchase_failed'));
  }
  if (attempt.outcome === 'pending') showToast(strings['billing.pending']);
  if (attempt.outcome !== 'purchased') return { attempt, reconciled: null };
  // 0 credited or a server hiccup here is normal: the caller keeps asking (§11.5).
  return { attempt, reconciled: await reconcileNow('checkout_return').catch(() => null) };
}

export async function buyProduct(productId: string, role: ProductRole): Promise<PurchaseAttempt> {
  return (await runBuy(productId, role)).attempt;
}
