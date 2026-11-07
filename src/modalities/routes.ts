import type { ModalityRoute } from '../types';
import { guarded } from './EntitlementGuard';
import { listModalities } from './registry';

/** Routes of every available manifest. A manifest with an entitlement has its routes wrapped so only an account holding it enters. */
export async function allModalityRoutes(): Promise<ModalityRoute[]> {
  const out: ModalityRoute[] = [];
  for (const manifest of listModalities()) {
    if (manifest.status !== 'available') continue;
    const { routes } = await manifest.load();
    const { entitlement } = manifest;
    for (const route of routes) {
      out.push(
        entitlement === null
          ? route
          : { ...route, requiresAuth: true, load: async () => ({ default: guarded(entitlement, (await route.load()).default) }) },
      );
    }
  }
  return out;
}
