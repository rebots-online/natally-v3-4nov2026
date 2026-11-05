// /checkout, status only (§11.6): buys `natally.pendingProduct` once, then moves on. The id is cleared as the purchase starts, so a
// reload never buys twice.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';
import { VersionBadge } from '../ui';
import { useCheckoutHost } from './purchase';
import { strings } from './strings';
import { usePurchaseFlow } from './usePurchaseFlow';

const PENDING_KEY = 'natally.pendingProduct';

export default function ScreenCheckout() {
  const navigate = useNavigate();
  const host = useCheckoutHost();
  const started = useRef(false);
  const [mounted, setMounted] = useState(false);
  const { phase, start } = usePurchaseFlow({
    onDone: (role) => navigate(role === 'souvenir' ? '/souvenir' : '/atelier', { replace: true }),
    onNotBought: () => navigate('/atelier', { replace: true }),
  });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const productId = sessionStorage.getItem(PENDING_KEY);
    if (!productId) {
      navigate('/atelier', { replace: true });
      return;
    }
    sessionStorage.removeItem(PENDING_KEY);
    void start(productId, config.products.souvenirIds.includes(productId) ? 'souvenir' : 'credits');
  }, [navigate, start]);

  // `billing.opening` lasts until the provider has drawn something in its host.
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const observer = new MutationObserver(() => setMounted(element.childElementCount > 0));
    observer.observe(element, { childList: true });
    return () => observer.disconnect();
  }, [host]);

  const text =
    phase === 'slow' ? strings['billing.slow']
    : phase === 'confirming' ? strings['billing.confirming']
    : mounted ? null
    : strings['billing.opening'];

  return (
    <div className="min-h-screen bg-[#120c1c] text-[#f1e8d8] flex flex-col relative pb-12">
      <main className="w-full max-w-[420px] mx-auto px-[20px] pt-6 flex-1 flex flex-col items-center justify-center">
        {text && <p id="checkout-status" role="status" className="font-nunito text-[15px] text-[#f1e8d8] leading-relaxed text-center m-0">{text}</p>}
        {phase === 'slow' && (
          <button
            id="checkout-close-button"
            type="button"
            onClick={() => navigate('/atelier', { replace: true })}
            className="font-cinzel uppercase text-[13px] tracking-[0.18em] text-[#f1e8d8] h-[44px] px-3 mt-3 flex items-center justify-center border border-transparent hover:border-[#3a2d50] active:bg-[#1a1226] rounded transition-colors"
          >
            {strings['topup.close']}
          </button>
        )}
      </main>
      <div id="rcb-ui-root" ref={host} />
      <VersionBadge version={config.version} />
    </div>
  );
}
