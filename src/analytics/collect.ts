// Shell transport (§15.3): batches go to POST /api/collect, which relays to the GA4 Measurement Protocol.
import { config } from '../config';
import type { AnalyticsParams } from '../types';
import type { Transport } from './transport';

const CLIENT_KEY = 'natally.analytics.client';
const SESSION_KEY = 'natally.analytics.session';
const BATCH_SIZE = 25;
const BATCH_INTERVAL_MS = 5000;
const SESSION_IDLE_SECONDS = 30 * 60;

function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

let memoryClient: string | null = null;
function clientId(): string {
  try {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id = newId();
      localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  } catch {
    memoryClient ??= newId(); // Storage refused: the id then lasts for this page only.
    return memoryClient;
  }
}

let memorySession = { id: 0, last: 0 };
/** The session id is the epoch second it began; 30 minutes without an event begins a new one. */
function touchSession(nowSeconds: number): number {
  let current = memorySession;
  try {
    const [id, last] = (localStorage.getItem(SESSION_KEY) ?? '').split(':').map(Number);
    if (Number.isFinite(id) && Number.isFinite(last)) current = { id: id!, last: last! };
  } catch {
    // Storage refused: the in-memory copy is used.
  }
  const next = current.id > 0 && nowSeconds - current.last < SESSION_IDLE_SECONDS ? { id: current.id, last: nowSeconds } : { id: nowSeconds, last: nowSeconds };
  memorySession = next;
  try {
    localStorage.setItem(SESSION_KEY, `${next.id}:${next.last}`);
  } catch {
    // Same: nothing more to do.
  }
  return next.id;
}

export function createCollectTransport(): Transport {
  const endpoint = `${config.apiBaseUrl.replace(/\/+$/, '')}/api/collect`;
  let queue: { name: string; params: AnalyticsParams }[] = [];
  let timer: number | null = null;
  let enabled = false;
  let signedIn: boolean | null = null;
  let session = 0;

  // Time the page was visible since the last batch (GA's engagement_time_msec).
  let engagedMs = 0;
  let visibleSince: number | null = document.visibilityState === 'visible' ? performance.now() : null;
  document.addEventListener('visibilitychange', () => {
    const now = performance.now();
    if (document.visibilityState === 'visible') visibleSince = now;
    else if (visibleSince !== null) {
      engagedMs += now - visibleSince;
      visibleSince = null;
    }
  });
  function takeEngagement(): number {
    const now = performance.now();
    if (visibleSince !== null) {
      engagedMs += now - visibleSince;
      visibleSince = now;
    }
    const taken = Math.max(1, Math.round(engagedMs));
    engagedMs = 0;
    return taken;
  }

  function stopTimer(): void {
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
  }

  function flush(): void {
    stopTimer();
    while (enabled && queue.length > 0) {
      const events = queue.slice(0, BATCH_SIZE);
      queue = queue.slice(BATCH_SIZE);
      events.forEach((event, index) => {
        event.params = { ...event.params, session_id: session, engagement_time_msec: index === 0 ? takeEngagement() : 1 };
      });
      // Analytics never raises: a lost batch is a lost batch.
      void fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: clientId(), sessionId: session, events }),
        keepalive: true,
      }).catch(() => undefined);
    }
  }

  return {
    send(name, params) {
      if (!enabled) return;
      session = touchSession(Math.floor(Date.now() / 1000));
      queue.push({ name, params: signedIn === null ? params : { ...params, signed_in: signedIn } });
      if (queue.length >= BATCH_SIZE) flush();
      else if (timer === null) timer = window.setTimeout(flush, BATCH_INTERVAL_MS);
    },
    setConsent(granted) {
      enabled = granted;
      if (!granted) {
        queue = [];
        stopTimer();
      }
    },
    setSignedIn(value) {
      signedIn = value;
    },
    flush,
  };
}
