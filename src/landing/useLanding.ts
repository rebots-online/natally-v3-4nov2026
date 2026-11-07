// What both landing layouts do (§10 `landing-*`, §11.6, §15.2): live prices, the product-preselecting buttons, install links,
// the example wheel and its select, and the room sound switch.
import { useCallback, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { track } from '../analytics';
import { useSession } from '../auth';
import { useCatalog } from '../billing';
import { config } from '../config';
import { getPlatform } from '../platform';
import { useRoomAudio } from '../room';
import { updateSettings, useSettings } from '../settings';
import type { ChartElementKey, ProductRole } from '../types';
import { useExampleChart } from './example';
import { say } from './strings';

const PENDING_KEY = 'natally.pendingProduct';
type Store = 'play' | 'windows' | 'linux';

/** "200, 400 or 1,000" */
function countList(counts: number[]): string {
  const words = counts.map((n) => n.toLocaleString('en-US'));
  return words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} or ${words[words.length - 1]}`;
}

export function useLanding() {
  const navigate = useNavigate();
  const { status } = useSession();
  const catalog = useCatalog();
  const { roomSounds } = useSettings();
  const platform = getPlatform();
  const example = useExampleChart();
  const [highlight, setHighlight] = useState<ChartElementKey | null>(null);
  useRoomAudio('room');

  const credits = catalog.credits;
  const prices = {
    souvenir: catalog.souvenir?.priceLabel ?? '',
    creditsFrom: credits[0] ? `${say('offer.from')} ${credits[0].priceLabel}` : '',
    creditsAll: credits.map((p) => p.priceLabel).join(' · '),
    creditsCounts: credits.length > 0 ? say('prices.creditsCount', { counts: countList(credits.map((p) => p.credits)) }) : '',
  };

  const productFor = (role: ProductRole): string => (role === 'souvenir' ? config.products.souvenirIds[0] : config.products.topUpSlots[0]) ?? '';

  /** The button that was pressed decides the product; the customer is not asked again (§11.6). */
  const buy = (button: string, role: ProductRole) => {
    const productId = productFor(role);
    if (!productId) return;
    track('landing_cta_click', { button, product_role: role });
    sessionStorage.setItem(PENDING_KEY, productId);
    navigate(status === 'signed_out' ? '/sign-in?next=/checkout' : '/checkout');
  };

  const scrollTo = (id: string) => (event: MouseEvent) => {
    event.preventDefault();
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
  };
  const toTop = (event: MouseEvent) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  const openLink = (url: string) => (event: MouseEvent) => {
    event.preventDefault();
    if (url.startsWith('/')) navigate(url);
    else void platform.openExternal(url);
  };
  const go = (path: string) => (event?: MouseEvent) => {
    event?.preventDefault();
    navigate(path);
  };
  const install = (store: Store) => {
    track('install_click', { store });
    void platform.openExternal(config.links[store]);
  };

  return {
    prices,
    productReady: { souvenir: productFor('souvenir') !== '', credits: productFor('credits') !== '' },
    buy, scrollTo, toTop, openLink, go, install,
    installShown: platform.showInstallOptions,
    chart: example.chart,
    elements: example.elements,
    highlight,
    select: (raw: string) => setHighlight(example.elements.find((e) => e.key === raw)?.key ?? null),
    roomSounds,
    toggleSound: () => updateSettings({ roomSounds: !roomSounds }),
    signInPath: '/sign-in?next=/atelier',
  };
}
