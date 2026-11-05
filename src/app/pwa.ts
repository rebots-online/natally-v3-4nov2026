// §16.5: service worker registration and the one-shot reload when a new version takes over.
import { Workbox } from 'workbox-window';
import { config } from '../config';

const RELOADED_FOR = 'natally.pwa.reloadedFor';
const RELOADED_FROM = 'natally.pwa.reloadedFrom'; // the version that was running before the reload, for pwa_update_applied
const HOUR_MS = 60 * 60 * 1000;
const TYPING_QUIET_MS = 30_000;
const POLL_MS = 1_000;

let typing = false;
let lastKeyAt = 0;
let speaking = false;
let pending = false;

window.addEventListener('natally:typing', (e) => {
  typing = (e as CustomEvent<boolean>).detail === true;
  if (typing) lastKeyAt = Date.now();
});
window.addEventListener('natally:speaking', (e) => {
  speaking = (e as CustomEvent<boolean>).detail === true;
});

const typingActive = () => typing && Date.now() - lastKeyAt < TYPING_QUIET_MS;

function whenQuiet(): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      if (typingActive() || speaking) {
        setTimeout(check, POLL_MS);
        return;
      }
      resolve();
    };
    check();
  });
}

/** The version the new worker serves: written next to the build by the deploy step, never cached. */
async function servedVersion(): Promise<string | null> {
  try {
    const res = await fetch('/release.json', { cache: 'no-store' });
    if (!res.ok) return null;
    const { version } = (await res.json()) as { version?: unknown };
    return typeof version === 'string' && version !== '' ? version : null;
  } catch {
    return null;
  }
}

async function applyUpdate() {
  if (pending) return;
  pending = true;
  try {
    const v = await servedVersion();
    // Unknown version, the version already running, or one we already reloaded for: no reload, so no loop.
    if (v === null || v === config.version || sessionStorage.getItem(RELOADED_FOR) === v) return;
    await whenQuiet();
    sessionStorage.setItem(RELOADED_FOR, v);
    sessionStorage.setItem(RELOADED_FROM, config.version);
    location.reload();
  } finally {
    pending = false;
  }
}

/** Step 3: after the reload, say once which version it replaced. Called by lifecycle once analytics is running. */
export function announceAppliedUpdate(track: (name: 'pwa_update_applied', params: { from_version: string }) => void) {
  const from = sessionStorage.getItem(RELOADED_FROM);
  if (from === null || sessionStorage.getItem(RELOADED_FOR) !== config.version) return;
  sessionStorage.removeItem(RELOADED_FROM);
  track('pwa_update_applied', { from_version: from });
}

export default function startPwa(): void {
  if (config.buildTarget !== 'web' || !window.isSecureContext || !('serviceWorker' in navigator)) return;
  const wb = new Workbox('/sw.js');
  wb.addEventListener('controlling', (event) => {
    if (event.isUpdate) void applyUpdate();
  });
  const check = () => void wb.update().catch(() => undefined); // offline checks simply wait for the next one
  wb.register().then(
    () => {
      setInterval(check, HOUR_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
    () => undefined, // no worker (development server, or blocked): the app runs without one
  );
}
