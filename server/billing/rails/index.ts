// §7.6: the registered server rails. A new rail is one file here and one line below; core code does not change.
import type { ServerRail } from '../../../src/types/index.ts';
import type { HandlerContext } from '../../core/index.ts';
import { revenueCatRail } from './revenuecat.ts';

/** A rail plus its ledger id prefix (§6.2). */
export interface RegisteredRail extends ServerRail { ledgerPrefix: string; }

export function serverRails(cfg: HandlerContext['cfg']): RegisteredRail[] {
  return [revenueCatRail(cfg)];
}
