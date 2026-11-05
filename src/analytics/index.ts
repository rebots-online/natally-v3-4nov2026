// §5.4: the only sender. Nothing is loaded or sent unless the measurement id is set and `analyticsConsent` is true.
import { config } from '../config';
import { getPlatform } from '../platform';
import { getSettings } from '../settings';
import { ANALYTICS_EVENT_NAMES, type AnalyticsCatalog, type AnalyticsParams } from '../types';
import { createCollectTransport } from './collect';
import { installErrorCapture } from './errors';
import { createGtagTransport } from './gtag';
import type { Transport } from './transport';
import { installVitals } from './vitals';

const KNOWN_EVENTS: ReadonlySet<string> = new Set(ANALYTICS_EVENT_NAMES);
const CONSENT_POLL_MS = 1000;
const MAX_STRING = 100; // GA4 truncates longer parameter values anyway.

let transport: Transport | null = null;
let consent = false;
let signedIn: boolean | null = null;
let started = false;

const hasMeasurementId = (): boolean => config.analytics.measurementId !== '';

function ensureTransport(): Transport {
  if (transport) return transport;
  transport = getPlatform().analyticsTransport === 'gtag' ? createGtagTransport(config.analytics.measurementId) : createCollectTransport();
  if (signedIn !== null) transport.setSignedIn(signedIn);
  return transport;
}

/** Reads the stored choice and moves the transport to match it. True while sending is allowed. */
function syncConsent(): boolean {
  const wanted = hasMeasurementId() && getSettings().analyticsConsent;
  if (wanted !== consent) {
    consent = wanted;
    if (wanted || transport) ensureTransport().setConsent(wanted);
  }
  return consent;
}

/** Scalars only; a string is cut to what GA4 keeps. Anything else is dropped, never converted. */
function scalarParams(raw: object): AnalyticsParams {
  const clean: AnalyticsParams = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string') clean[key] = value.slice(0, MAX_STRING);
    else if (typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) clean[key] = value;
  }
  return clean;
}

export function track<K extends keyof AnalyticsCatalog>(name: K, params: AnalyticsCatalog[K]): void {
  if (!KNOWN_EVENTS.has(name) || !syncConsent()) return;
  ensureTransport().send(name, scalarParams(params));
}

export function setAnalyticsUser(isSignedIn: boolean): void {
  signedIn = isSignedIn;
  transport?.setSignedIn(isSignedIn);
}

export function initAnalytics(): void {
  if (started || !hasMeasurementId()) return;
  started = true;
  syncConsent();

  // The settings module offers no change notice, so the stored choice is re-read. A toggle off is honoured by the next
  // `track` at once, and this loop stops the library's own collection within a second.
  window.setInterval(syncConsent, CONSENT_POLL_MS);
  window.addEventListener('storage', (event) => {
    if (event.key === 'natally.settings') syncConsent();
  });

  const vitals = installVitals((metric, value) => track('page_speed', { metric, value }));
  installErrorCapture((kind, hash) => track('app_error', { kind, hash }));

  const leave = () => {
    vitals.flush();
    transport?.flush();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') leave();
  });
  window.addEventListener('pagehide', leave);
}
