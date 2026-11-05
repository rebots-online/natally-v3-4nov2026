// RevenueCat Web Billing in the page (§1.3, §1.4). The SDK is imported on first use, so a build without this rail has none of it.
import type { Offering, Package, Purchases } from '@revenuecat/purchases-js';
import { config } from '../../config';
import type { BillingRail, CatalogProduct, ProductRole, PurchaseAttempt, Uid } from '../../types';
import { fromOfferings, type OfferedProduct } from './catalogMap';

const sdk = () => import('@revenuecat/purchases-js');

const offered = (offering: Offering | undefined): OfferedProduct[] =>
  (offering?.availablePackages ?? []).map((pkg) => ({
    productId: pkg.webBillingProduct.identifier,
    priceLabel: pkg.webBillingProduct.currentPrice.formattedPrice,
    title: pkg.webBillingProduct.title,
  }));

export function createRevenueCatWebRail(): BillingRail {
  let instance: Purchases | null = null;
  let signedIn = false;
  let queue: Promise<void> = Promise.resolve();
  const packages = new Map<string, Package>();

  const applyIdentity = async (uid: Uid | null) => {
    const { Purchases } = await sdk();
    if (!instance) {
      if (!config.revenueCat.webApiKey) throw new Error('VITE_RC_WEB_API_KEY is not set');
      instance = Purchases.configure({
        apiKey: config.revenueCat.webApiKey,
        appUserId: uid ?? Purchases.generateRevenueCatAnonymousAppUserId(),
      });
    } else if (uid) {
      if (instance.getAppUserId() !== uid) await instance.changeUser(uid);
    } else if (signedIn) {
      await instance.changeUser(Purchases.generateRevenueCatAnonymousAppUserId());
    }
    signedIn = uid !== null;
  };

  return {
    key: 'revenuecat_web',
    capability: 'embedded_checkout',

    identify(uid) {
      const step = queue.then(() => applyIdentity(uid));
      queue = step.catch(() => undefined);
      return step;
    },

    async loadCatalog(): Promise<CatalogProduct[]> {
      if (!instance) throw new Error('identify must run before loadCatalog');
      const offerings = await instance.getOfferings();
      packages.clear();
      const all = [offerings.all[config.revenueCat.offeringCredits], offerings.all[config.revenueCat.offeringSouvenir]];
      for (const offering of all) {
        for (const pkg of offering?.availablePackages ?? []) packages.set(pkg.webBillingProduct.identifier, pkg);
      }
      return fromOfferings((id) => offered(offerings.all[id]));
    },

    async purchase(product, email, target): Promise<PurchaseAttempt> {
      const { ErrorCode } = await sdk();
      const rcPackage = packages.get(product.productId);
      if (!instance || !signedIn || !rcPackage) {
        return { outcome: 'failed', productId: product.productId, message: 'not_ready' };
      }
      try {
        await instance.purchase({ rcPackage, customerEmail: email ?? undefined, htmlTarget: target ?? undefined });
        return { outcome: 'purchased', productId: product.productId, message: null };
      } catch (err) {
        const code = (err as { errorCode?: number }).errorCode;
        if (code === ErrorCode.UserCancelledError) return { outcome: 'cancelled', productId: product.productId, message: null };
        if (code === ErrorCode.PaymentPendingError) return { outcome: 'pending', productId: product.productId, message: null };
        return { outcome: 'failed', productId: product.productId, message: err instanceof Error ? err.message : String(err) };
      }
    },

    presentPaywall(_role: ProductRole): Promise<PurchaseAttempt> {
      return Promise.reject(new Error('revenuecat_web has no native paywall'));
    },

    async restore() {
      // Web Billing purchases live on the RevenueCat account, so telling the provider is reading the customer afresh.
      if (!instance) throw new Error('identify must run before restore');
      await instance.getCustomerInfo();
    },
  };
}
