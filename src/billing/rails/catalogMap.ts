// What a rail's offering becomes on our side (§5.7): a product outside the configured maps is ignored.
import { config } from '../../config';
import type { CatalogProduct, ProductRole } from '../../types';

export interface OfferedProduct { productId: string; priceLabel: string; title: string }

export function toCatalogProduct(offered: OfferedProduct, role: ProductRole): CatalogProduct | null {
  const { credits, souvenirIds } = config.products;
  const isSouvenir = souvenirIds.includes(offered.productId);
  if (role === 'souvenir' ? !isSouvenir : isSouvenir) return null;
  const amount = credits[offered.productId];
  if (role === 'credits' && amount === undefined) return null;
  return { ...offered, role, credits: amount ?? 0 };
}

/** Both configured offerings, always by id. An unset id or a missing offering gives no products for that role. */
export function fromOfferings(listFor: (offeringId: string) => OfferedProduct[]): CatalogProduct[] {
  const { offeringCredits, offeringSouvenir } = config.revenueCat;
  const pick = (id: string, role: ProductRole) =>
    (id ? listFor(id) : []).flatMap((offered) => toCatalogProduct(offered, role) ?? []);
  return [...pick(offeringCredits, 'credits'), ...pick(offeringSouvenir, 'souvenir')];
}
