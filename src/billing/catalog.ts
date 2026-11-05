// The live catalogue (§5.7, §11.5): one store for the app, loaded for the current account. Prices are the provider's, never typed.
import { useEffect, useSyncExternalStore } from 'react';
import { useSession } from '../auth';
import { config } from '../config';
import type { CatalogProduct, Uid } from '../types';
import { getRail } from './rails';

export interface CatalogState { status: 'loading' | 'ready' | 'failed'; products: CatalogProduct[]; credits: CatalogProduct[]; souvenir: CatalogProduct | null }

let state: CatalogState = { status: 'loading', products: [], credits: [], souvenir: null };
let loadedFor: Uid | null | undefined;
let loading: Promise<CatalogProduct[]> | null = null;
const listeners = new Set<() => void>();

function publish(next: CatalogState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function arrange(products: CatalogProduct[]): CatalogState {
  const slots: readonly string[] = config.products.topUpSlots;
  const rank = (p: CatalogProduct) => {
    const slot = slots.indexOf(p.productId);
    return slot === -1 ? slots.length : slot;
  };
  return {
    status: 'ready',
    products,
    credits: products.filter((p) => p.role === 'credits').sort((a, b) => rank(a) - rank(b)),
    souvenir: products.find((p) => p.role === 'souvenir') ?? null,
  };
}

/** Identifies the rail and loads the catalogue for this account, sharing a load in progress. Rejects if the provider cannot answer. */
export function ensureCatalog(uid: Uid | null): Promise<CatalogProduct[]> {
  if (loadedFor === uid) {
    if (loading) return loading;
    if (state.status === 'ready') return Promise.resolve(state.products);
  }
  loadedFor = uid;
  if (state.products.length === 0) publish({ ...state, status: 'loading' });
  const load: Promise<CatalogProduct[]> = (async () => {
    const rail = getRail();
    await rail.identify(uid);
    return rail.loadCatalog();
  })();
  loading = load;
  load.then(
    (products) => {
      if (loading !== load) return;
      loading = null;
      publish(arrange(products));
    },
    () => {
      if (loading !== load) return;
      loading = null;
      publish({ status: 'failed', products: [], credits: [], souvenir: null });
    },
  );
  return load;
}

export function retryCatalog(uid: Uid | null) {
  loadedFor = undefined;
  void ensureCatalog(uid).catch(() => undefined);
}

// §5.18: signing out puts the rail back on an anonymous visitor, and the old account's catalogue goes with it.
window.addEventListener('natally:signed-out', () => retryCatalog(null));

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

export function useCatalog(): CatalogState {
  const { status, uid } = useSession();
  useEffect(() => {
    if (status === 'loading') return;
    // A failure is retried whenever a screen that shows prices opens.
    if (state.status === 'failed' && loadedFor === uid) loadedFor = undefined;
    void ensureCatalog(uid).catch(() => undefined);
  }, [status, uid]);
  return useSyncExternalStore(subscribe, () => state);
}
