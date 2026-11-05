// Web transport (§15.3): gtag.js, loaded only after consent. No page_view is sent by the library; `track` is the sender.
import type { AnalyticsParams } from '../types';
import type { Transport } from './transport';

type Gtag = (...args: unknown[]) => void;
interface GtagWindow { dataLayer?: unknown[]; gtag?: Gtag; [flag: string]: unknown }

const ALL_DENIED = {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
} as const;

export function createGtagTransport(measurementId: string): Transport {
  const w = window as unknown as GtagWindow;
  let loaded = false;
  let signedIn: boolean | null = null;

  const call = (...args: unknown[]) => w.gtag?.(...args);
  const userProperty = () => call('set', 'user_properties', { signed_in: String(signedIn) });
  // Google's documented opt-out switch: while true, the library collects nothing at all, whatever its consent state.
  const disabled = (value: boolean) => {
    w[`ga-disable-${measurementId}`] = value;
  };

  function load(): void {
    if (loaded) return;
    loaded = true;
    w.dataLayer = w.dataLayer ?? [];
    const layer = w.dataLayer;
    // gtag.js reads the `arguments` object itself from the data layer; an array of the same values is not understood.
    w.gtag = function pushArguments() {
      // eslint-disable-next-line prefer-rest-params
      layer.push(arguments);
    };
    call('consent', 'default', ALL_DENIED);
    call('js', new Date());
    call('config', measurementId, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
    if (signedIn !== null) userProperty();
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  }

  return {
    send(name: string, params: AnalyticsParams) {
      call('event', name, params);
    },
    setConsent(granted) {
      if (granted) {
        load();
        disabled(false);
        call('consent', 'update', { analytics_storage: 'granted' });
      } else {
        disabled(true);
        if (loaded) call('consent', 'update', { analytics_storage: 'denied' });
      }
    },
    setSignedIn(value) {
      signedIn = value;
      if (loaded) userProperty();
    },
    flush() {
      // gtag.js sends each event as it is pushed.
    },
  };
}
