// RevenueCat Paywalls on Play Billing, through the natally-android plugin (§1.3, §5.21). Its only surface is the native paywall.
import { invoke } from '@tauri-apps/api/core';
import { config } from '../../config';
import type { BillingRail, CatalogProduct, ProductRole, PurchaseAttempt, PurchaseOutcome, Uid } from '../../types';
import { fromOfferings, type OfferedProduct } from './catalogMap';

const OUTCOMES: readonly PurchaseOutcome[] = ['purchased', 'cancelled', 'pending', 'failed'];

export function createRevenueCatPlayRail(): BillingRail {
  let appUserId: Uid | null = null;

  /** The plugin needs an account: Android has no signed-out surface that shows prices (§1.3). */
  const account = () => {
    if (!appUserId) throw new Error('signed_out');
    return { appUserId, apiKey: config.revenueCat.androidApiKey };
  };

  const loadOffering = async (offeringId: string): Promise<[string, OfferedProduct[]]> => {
    const { products } = await invoke<{ products: OfferedProduct[] }>('plugin:natally-android|loadOffering', { offeringId, ...account() });
    return [offeringId, products];
  };

  const presentPaywall = async (role: ProductRole): Promise<PurchaseAttempt> => {
    const offeringId = role === 'souvenir' ? config.revenueCat.offeringSouvenir : config.revenueCat.offeringCredits;
    try {
      const { outcome } = await invoke<{ outcome: string }>('plugin:natally-android|presentPaywall', { offeringId, ...account() });
      if (OUTCOMES.includes(outcome as PurchaseOutcome)) return { outcome: outcome as PurchaseOutcome, productId: null, message: null };
      return { outcome: 'failed', productId: null, message: outcome };
    } catch (err) {
      return { outcome: 'failed', productId: null, message: err instanceof Error ? err.message : String(err) };
    }
  };

  return {
    key: 'revenuecat_play',
    capability: 'native_paywall',

    async identify(uid) {
      appUserId = uid;
    },

    async loadCatalog(): Promise<CatalogProduct[]> {
      const ids = [config.revenueCat.offeringCredits, config.revenueCat.offeringSouvenir].filter(Boolean);
      const offerings = new Map(await Promise.all(ids.map(loadOffering)));
      return fromOfferings((id) => offerings.get(id) ?? []);
    },

    purchase(product) {
      return presentPaywall(product.role);
    },

    presentPaywall,

    async restore() {
      await invoke('plugin:natally-android|restore', account());
    },
  };
}
