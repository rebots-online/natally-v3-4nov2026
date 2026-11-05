// §11.2, §9.1: what runs once the app has mounted. Analytics starts first; then each session change reconciles purchases
// (`app_open` for a session restored at start, `sign_in` for one that begins later) and resumes any unfinished souvenir.
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { setAnalyticsUser, initAnalytics, track } from '../analytics';
import { firebaseApp } from '../auth';
import { config } from '../config';
import { getPlatform } from '../platform';
import { showToast } from '../ui';
import { announceAppliedUpdate } from './pwa';
import { strings } from './strings';

let started = false;

async function reconcileAndResume(trigger: 'app_open' | 'sign_in') {
  try {
    const { reconcileNow } = await import('../billing');
    await reconcileNow(trigger);
  } catch {
    // The server is asked again at the next trigger; a failed attempt must not stop the souvenir check.
  }
  try {
    const { resumeSouvenirs } = await import('../souvenir');
    await resumeSouvenirs();
  } catch {
    // Resumes at the next app start.
  }
}

function watchSession() {
  let first = true;
  let wasSignedIn = false;
  onAuthStateChanged(getAuth(firebaseApp), (user) => {
    const signedIn = user !== null;
    setAnalyticsUser(signedIn);
    if (signedIn && !wasSignedIn) void reconcileAndResume(first ? 'app_open' : 'sign_in');
    wasSignedIn = signedIn;
    first = false;
  });
}

function watchConnection() {
  const tell = () => showToast(strings['app.offline'], 'neutral');
  window.addEventListener('offline', tell);
  if (!navigator.onLine) tell();
}

/** §16.6: shells only. A newer release shows a notice whose action opens that platform's file. */
async function checkShellUpdate() {
  if (config.buildTarget === 'web') return;
  let url: string | null;
  try {
    url = await getPlatform().checkForShellUpdate(config.version);
  } catch {
    return; // offline or the release file is unreachable: ask again at the next start
  }
  if (url === null) return;
  const target = url;

  const notice = document.createElement('div');
  notice.id = 'shell-update-notice';
  notice.setAttribute('role', 'status');
  Object.assign(notice.style, {
    position: 'fixed', left: '50%', bottom: 'var(--space-6)', transform: 'translateX(-50%)', zIndex: 'var(--layer-toast)',
    display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-4)',
    background: 'var(--color-panel)', color: 'var(--color-cream)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-body)',
  });
  const text = document.createElement('span');
  text.textContent = strings['shell.updateAvailable'];
  const action = document.createElement('button');
  action.id = 'shell-update-action';
  action.type = 'button';
  action.textContent = strings['shell.updateAction'];
  Object.assign(action.style, {
    padding: 'var(--space-1) var(--space-3)', border: '0', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
    background: 'var(--color-gold)', color: 'var(--color-on-gold)', fontFamily: 'var(--font-body)',
  });
  action.addEventListener('click', () => {
    void getPlatform().openExternal(target);
    notice.remove();
  });
  notice.append(text, action);
  document.body.append(notice);
}

export default function startLifecycle(): void {
  if (started) return;
  started = true;
  initAnalytics();
  announceAppliedUpdate(track);
  watchConnection();
  watchSession();
  void checkShellUpdate();
}
