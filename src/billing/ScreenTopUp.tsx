// /top-up, frozen screen `top-up` (§9.2, §10, §11.5). Rows and the button's price come only from the provider's catalogue.
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { track } from '../analytics';
import { useSession } from '../auth';
import { config } from '../config';
import type { CatalogProduct } from '../types';
import { Button, PackRow, VersionBadge } from '../ui';
import { retryCatalog, useCatalog } from './catalog';
import { useCheckoutHost } from './purchase';
import { getRail } from './rails';
import { fill, strings } from './strings';
import { usePurchaseFlow } from './usePurchaseFlow';

const ROW_IDS = ['topup-pack-5', 'topup-pack-10', 'topup-pack-25'];
const DEFAULT_SLOT = 1;
const WHAT_CREDITS_DO = [fill(strings['topup.what1'], config.appName), strings['topup.what2'], strings['topup.what3']];

function closeTopUp(navigate: ReturnType<typeof useNavigate>) {
  // The router keeps its position in history.state; 0 means this tab arrived straight here.
  if ((window.history.state as { idx?: number } | null)?.idx) navigate(-1);
  else navigate('/atelier');
}

function TopUp() {
  const navigate = useNavigate();
  const { uid } = useSession();
  const catalog = useCatalog();
  const host = useCheckoutHost();
  const [chosenSlot, setChosenSlot] = useState(DEFAULT_SLOT);
  const { phase, start } = usePurchaseFlow({
    onDone: () => navigate('/atelier'),
    onNotBought: () => undefined,
  });

  useEffect(() => track('paywall_view', { surface: '/top-up' }), []);

  const bySlot: (CatalogProduct | undefined)[] = config.products.topUpSlots.map((id) => catalog.credits.find((p) => p.productId === id));
  const hasPacks = bySlot.some(Boolean);
  const failed = catalog.status === 'failed' || (catalog.status === 'ready' && !hasPacks);
  const priced = catalog.status === 'ready' && hasPacks;
  const selectedSlot = bySlot[chosenSlot] ? chosenSlot : bySlot.findIndex(Boolean);
  const selected = priced ? bySlot[selectedSlot] : undefined;

  return (
    <div className="min-h-screen bg-[#120c1c] text-[#f1e8d8] flex flex-col justify-between selection:bg-[#c9a24a] selection:text-[#120c1c] relative pb-12">
      <main className="w-full max-w-[420px] mx-auto px-[20px] pt-6 flex-1 flex flex-col">
        <header className="flex items-center justify-between mb-6">
          <h1 className="font-fraunces text-[28px] font-semibold text-[#f1e8d8] leading-tight m-0">{strings['topup.title']}</h1>
          <button
            id="topup-close-button"
            type="button"
            onClick={() => closeTopUp(navigate)}
            className="font-cinzel uppercase text-[13px] tracking-[0.18em] text-[#f1e8d8] h-[44px] px-3 flex items-center justify-center border border-transparent hover:border-[#3a2d50] active:bg-[#1a1226] rounded transition-colors"
          >
            {strings['topup.close']}
          </button>
        </header>

        <section className="bg-[#1a1226] border border-[#3a2d50] rounded-[16px] p-5 mb-7">
          <h2 className="font-fraunces text-[20px] font-semibold text-[#f1e8d8] mb-3 leading-snug">{strings['topup.whatTitle']}</h2>
          <ul className="space-y-3 m-0 p-0 list-none">
            {WHAT_CREDITS_DO.map((line) => (
              <li key={line} className="flex items-start">
                <span className="w-[6px] h-[6px] rounded-full bg-[#c9a24a] inline-block mt-[8px] mr-3 shrink-0" />
                <span className="font-nunito text-[15px] text-[#f1e8d8] leading-relaxed">{line}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="font-cinzel uppercase text-[12px] tracking-[0.25em] text-[#c9a24a] font-semibold mb-3">{strings['topup.choose']}</div>

        <div id="topup-pack-list" role="radiogroup" aria-label={strings['topup.choose']} className="flex flex-col gap-3 mb-3">
          {ROW_IDS.map((id, slot) => {
            const product = bySlot[slot];
            if (priced && !product) return null;
            return (
              <PackRow
                key={id}
                id={id}
                label={product && priced ? fill(strings['topup.pack'], product.priceLabel, product.credits.toLocaleString('en-US')) : strings[failed ? 'billing.catalogFailed' : 'billing.loading']}
                selected={priced && slot === selectedSlot}
                onSelect={() => {
                  if (failed) retryCatalog(uid);
                  else if (priced) setChosenSlot(slot);
                }}
              />
            );
          })}
        </div>

        <p className="font-nunito text-[13px] text-[#a698b5] m-0 mb-6">{strings['topup.total']}</p>

        <div className="mt-auto pt-2">
          {phase === 'confirming' || phase === 'slow' ? (
            <p
              id="topup-status"
              role="status"
              className="w-full min-h-[52px] m-0 px-4 py-3 bg-[#1a1226] border border-[#3a2d50] rounded-[12px] flex items-center justify-center text-center font-nunito text-[15px] text-[#f1e8d8] leading-relaxed"
            >
              {strings[phase === 'slow' ? 'billing.slow' : 'billing.confirming']}
            </p>
          ) : (
            <Button
              id="topup-continue-button"
              variant="primary"
              disabled={!selected}
              busy={phase === 'checkout'}
              onClick={() => selected && void start(selected.productId, 'credits')}
            >
              {selected ? fill(strings['topup.continuePrice'], selected.priceLabel) : strings['topup.continue']}
            </Button>
          )}
        </div>
      </main>

      <div id="rcb-ui-root" ref={host} />
      <VersionBadge version={config.version} />
    </div>
  );
}

/** Android's paywall stands in for this whole screen (§9.1). */
export default function ScreenTopUp() {
  if (getRail().capability === 'native_paywall') return <Navigate to="/atelier" replace />;
  return <TopUp />;
}
