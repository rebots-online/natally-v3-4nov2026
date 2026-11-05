// Row formatting for the Profile transaction list (§9.2 `profile`).
import type { LedgerEntry } from '../types';
import { strings } from './strings';

export interface ProfileRow {
  id: string;
  title: string;
  amount: string;
  detail: string;
  isSouvenir: boolean;
  atelierUrl: string | null;
  pdfUrl: string | null;
}

const credits = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });
const TITLE = {
  purchase: strings['billing.rowCredits'],
  souvenir_purchase: strings['billing.rowSouvenir'],
  usage: strings['billing.rowUsage'],
} as const;

/** `+39 Cr`, or `−0.35 Cr` for a debit. */
export function formatCredits(amountMilli: number): string {
  const sign = amountMilli < 0 ? '−' : '+';
  return `${sign}${credits.format(Math.abs(amountMilli) / 1000)} Cr`;
}

/** The balance as a whole number of credits, never below zero. */
export function formatBalance(balanceMilli: number): string {
  return `${Math.max(0, Math.floor(balanceMilli / 1000))} Cr`;
}

export function formatDate(iso: string): string {
  const at = new Date(iso);
  return Number.isNaN(at.getTime()) ? '' : at.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * `<priceLabel> · <date> · paid` for a purchase; the price is the ledger's own, else the live catalogue's, else left out (§7.2).
 * A debit for a reading has no price and was not paid for in money: its date stands alone.
 */
export function toRow(entry: LedgerEntry, catalogPrice: (productId: string) => string | null): ProfileRow {
  const date = formatDate(entry.occurredAt);
  const detail =
    entry.kind === 'usage'
      ? date
      : [entry.priceLabel ?? (entry.productId ? catalogPrice(entry.productId) : null), date, strings['profile.paid']].filter(Boolean).join(' · ');
  return {
    id: entry.id,
    title: TITLE[entry.kind],
    amount: formatCredits(entry.amountMilli),
    detail,
    isSouvenir: entry.kind === 'souvenir_purchase',
    atelierUrl: entry.souvenir?.atelierUrl ?? null,
    pdfUrl: entry.souvenir?.pdfUrl ?? null,
  };
}
