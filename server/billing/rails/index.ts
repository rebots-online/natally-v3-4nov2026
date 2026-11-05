// §7.6: the registered server rails. A new rail is one file here and one line below; core code does not change.
import type { ProviderPurchase, ServerRail, Uid } from '../../../src/types/index.ts';
import type { HandlerContext } from '../../core/index.ts';
import { revenueCatRail } from './revenuecat.ts';

/** A purchase plus every id the provider knows it by. All of them are claimed, so a change of id cannot grant it twice. */
export interface RailPurchase extends ProviderPurchase { claimIds: string[]; }
/** A rail plus its ledger id prefix (§6.2). */
export interface RegisteredRail extends ServerRail { ledgerPrefix: string; listPurchases(uid: Uid): Promise<RailPurchase[]>; }

export function serverRails(cfg: HandlerContext['cfg']): RegisteredRail[] {
  return [revenueCatRail(cfg)];
}
