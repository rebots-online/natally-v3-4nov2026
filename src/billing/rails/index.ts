// Rail registry (§5.7, §7.6). A future rail registers here. §1.4 requires the Android build to contain no other payment method,
// which only a literal build-time branch can give: `config.buildTarget` is a runtime value and eliminates nothing, so this is the
// one read of import.meta.env outside src/config.
import { getPlatform } from '../../platform';
import type { BillingRail, RailKey } from '../../types';
import { createRevenueCatPlayRail } from './revenuecatPlay';
import { createRevenueCatWebRail } from './revenuecatWeb';

const FACTORIES: Partial<Record<RailKey, () => BillingRail>> =
  import.meta.env.VITE_BUILD_TARGET === 'android'
    ? { revenuecat_play: createRevenueCatPlayRail }
    : { revenuecat_web: createRevenueCatWebRail };

let rail: BillingRail | null = null;

export function getRail(): BillingRail {
  if (rail) return rail;
  const { railKey } = getPlatform();
  const create = FACTORIES[railKey];
  if (!create) throw new Error(`Rail ${railKey} is not in this build`);
  rail = create();
  return rail;
}
