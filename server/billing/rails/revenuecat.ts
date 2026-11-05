// §7.2 steps 1 and 2, §7.3, §7.6: the RevenueCat rail. It reads the provider and judges nothing about credits.
import { createHash, timingSafeEqual } from 'node:crypto';
import type { HandlerContext } from '../../core/index.ts';
import { HttpError } from '../../core/index.ts';
import type { Uid } from '../../../src/types/index.ts';
import type { RailPurchase, RegisteredRail } from './index.ts';

const SUBSCRIBERS_URL = 'https://api.revenuecat.com/v1/subscribers/';
const TIMEOUT_MS = 10_000;
const RELEVANT_EVENTS = new Set(['NON_RENEWING_PURCHASE', 'INITIAL_PURCHASE', 'TRANSFER']);
const ANONYMOUS_PREFIX = '$RCAnonymousID';

/** The webhook's price for one transaction, used only if that transaction is written by this reconcile. */
export interface PriceHint { transactionId: string; priceLabel: string; }

interface NonSubscriptionEntry {
  id?: unknown; store_transaction_id?: unknown; purchase_date?: unknown; is_sandbox?: unknown; store?: unknown;
}

function unavailable(): HttpError {
  return new HttpError('provider_unavailable', 503);
}
function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}
function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

/** Every non-subscription purchase on the account, old or new. A non-2xx throws, so the caller writes nothing. */
async function listPurchases(secretKey: string, uid: Uid): Promise<RailPurchase[]> {
  if (!secretKey) throw unavailable();
  let res: Response;
  try {
    res = await fetch(SUBSCRIBERS_URL + encodeURIComponent(uid), {
      headers: { Authorization: `Bearer ${secretKey}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw unavailable();
  }
  if (!res.ok) throw unavailable();
  let body: unknown;
  try { body = await res.json(); } catch { throw unavailable(); }
  const subscriber = asRecord(asRecord(body)?.subscriber);
  if (!subscriber) throw unavailable();   // a 2xx without a subscriber proves nothing about the account

  const purchases: RailPurchase[] = [];
  for (const [productId, entries] of Object.entries(asRecord(subscriber.non_subscriptions) ?? {})) {
    if (!Array.isArray(entries)) continue;
    for (const raw of entries as NonSubscriptionEntry[]) {
      // Empty counts as absent: a blank id would make every such purchase share one ledger entry.
      const ids = [raw.store_transaction_id, raw.id].filter((id): id is string => typeof id === 'string' && id !== '');
      const transactionId = ids[0];
      if (!transactionId || typeof raw.purchase_date !== 'string') {
        console.warn('revenuecat: purchase entry without an id or date, product', productId);
        continue;
      }
      purchases.push({
        rail: raw.store === 'play_store' ? 'revenuecat_play' : 'revenuecat_web',
        transactionId, claimIds: [...new Set(ids)], productId, purchasedAt: raw.purchase_date, priceLabel: null, sandbox: raw.is_sandbox === true,
      });
    }
  }
  return purchases;
}

function eventOf(body: unknown): Record<string, unknown> | null {
  return asRecord(asRecord(body)?.event);
}

/**
 * §7.3 step 3. A TRANSFER event carries no app_user_id: RevenueCat names the receiver in `transferred_to`.
 * Anonymous ids are never a Firebase uid. `aliases` are not reconciled: each would be credited the same purchases.
 */
function uidFromWebhook(body: unknown): Uid[] {
  const event = eventOf(body);
  if (!event || typeof event.type !== 'string' || !RELEVANT_EVENTS.has(event.type)) return [];
  const named = event.type === 'TRANSFER' && Array.isArray(event.transferred_to) ? (event.transferred_to as unknown[]) : [event.app_user_id];
  const uids = named.filter((id): id is string => typeof id === 'string' && id !== '' && !id.startsWith(ANONYMOUS_PREFIX));
  return [...new Set(uids)];
}

/** The webhook's `price` is always USD, so it is only used with `currency` when that currency is USD. */
export function priceHintFromWebhook(body: unknown): PriceHint | null {
  const event = eventOf(body);
  if (!event || typeof event.transaction_id !== 'string' || typeof event.currency !== 'string') return null;
  const inCurrency = event.price_in_purchased_currency;
  const amount = typeof inCurrency === 'number' ? inCurrency : event.currency === 'USD' ? event.price : null;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return null;
  try {
    const priceLabel = new Intl.NumberFormat('en-US', { style: 'currency', currency: event.currency }).format(amount);
    return { transactionId: event.transaction_id, priceLabel };
  } catch {
    return null;   // not an ISO 4217 code: the row falls back to the live catalogue price
  }
}

export function revenueCatRail(cfg: HandlerContext['cfg']): RegisteredRail {
  const { secretKey, webhookAuth } = cfg.revenueCat;
  return {
    key: 'revenuecat_web',
    ledgerPrefix: 'rc:',
    listPurchases: (uid) => listPurchases(secretKey, uid),
    // Hashing first gives both sides one length, so the comparison is constant time. No secret configured admits nobody.
    verifyWebhook: (req) => webhookAuth !== '' && timingSafeEqual(digest(req.headers.get('authorization') ?? ''), digest(webhookAuth)),
    uidFromWebhook,
  };
}
