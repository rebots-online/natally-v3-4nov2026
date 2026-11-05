// §16.5 and §15.2: the last catch. A chunk that vanished in a new deploy reloads the page once, then waits for the network.
// Any other crash is counted as app_error and shows the canvas with the version badge.
import { Component, type ReactNode } from 'react';
import { config } from '../config';
import NotFound from './NotFound';
import { strings } from './strings';

const CHUNK_GUARD = 'natally.chunkReloaded';
const CHUNK_FAILURE = /dynamically imported module|importing a module script failed|error loading dynamically|ChunkLoadError|Unable to preload CSS/i;

const isChunkFailure = (error: unknown): boolean => error instanceof Error && CHUNK_FAILURE.test(`${error.name} ${error.message}`);

/** Returns true when it started the one reload. */
function reloadOnce(): boolean {
  try {
    if (sessionStorage.getItem(CHUNK_GUARD) !== null) return false;
    sessionStorage.setItem(CHUNK_GUARD, '1');
  } catch {
    return false; // without storage there is no loop guard, so do not reload
  }
  location.reload();
  return true;
}

// Vite reports a failed preload here, before the import itself rejects.
window.addEventListener('vite:preloadError', () => {
  reloadOnce();
});

/** A short stable fingerprint of the failure site; it carries no message text and nothing about the customer. */
function fingerprint(error: unknown): string {
  const site = error instanceof Error ? `${error.name}|${(error.stack ?? '').split('\n').slice(0, 3).join('|')}` : typeof error;
  let h = 0x811c9dc5;
  for (let i = 0; i < site.length; i += 1) h = Math.imul(h ^ site.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(16).padStart(8, '0');
}

function reportCrash(error: unknown) {
  const kind = error instanceof Error && error.name ? error.name : 'unknown';
  void import('../analytics')
    .then(({ track }) => track('app_error', { kind, hash: fingerprint(error) }))
    .catch(() => undefined); // reporting must never raise a second error
}

interface State { error: unknown; failed: boolean }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null, failed: false };

  static getDerivedStateFromError(error: unknown): State {
    return { error, failed: true };
  }

  override componentDidCatch(error: unknown) {
    if (isChunkFailure(error)) {
      if (!reloadOnce()) window.addEventListener('online', () => location.reload(), { once: true });
      return;
    }
    reportCrash(error);
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <NotFound version={config.version}>
        {isChunkFailure(this.state.error) && <p style={{ padding: 'var(--space-4)', margin: 0 }}>{strings['app.chunkFailed']}</p>}
      </NotFound>
    );
  }
}
