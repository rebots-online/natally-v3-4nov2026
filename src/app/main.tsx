// Entry: secure-origin rule (§1.5), then mount. Nothing imported statically here may reach src/config, which throws on a
// missing required variable: a build without its settings shows the configuration state, never a blank page.
import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import '../../design-system/tokens.css';
import { applySecureOriginRule } from './boot';
import NotFound from './NotFound';
import { strings } from './strings';

import.meta.glob('../ui/fonts.css', { eager: true });

interface ConfigFailure { name: 'ConfigError'; variables: string[]; version: string; webCanonicalOrigin: string }
const isConfigFailure = (err: unknown): err is ConfigFailure => (err as ConfigFailure | null)?.name === 'ConfigError';

function ConfigurationNeeded({ failure }: { failure: ConfigFailure }) {
  return (
    <NotFound version={failure.version}>
      <main
        id="configuration-state"
        style={{
          maxWidth: 560, margin: '0 auto', padding: 'var(--space-12) var(--space-4)',
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-md-size)', lineHeight: 'var(--text-body-md-line-height)',
        }}
      >
        <h1
          style={{
            margin: '0 0 var(--space-3)', fontFamily: 'var(--font-display)', fontWeight: 400,
            fontSize: 'var(--text-headline-md-size)', lineHeight: 'var(--text-headline-md-line-height)',
          }}
        >
          {strings['app.configNeededTitle']}
        </h1>
        <p style={{ margin: '0 0 var(--space-4)', color: 'var(--color-muted)' }}>{strings['app.configNeededBody']}</p>
        <ul
          style={{
            margin: 0, padding: 'var(--space-4)', listStyle: 'none', background: 'var(--color-panel)',
            border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)',
            fontFamily: 'var(--font-mono)', fontSize: 'var(--text-data-mono-size)', lineHeight: 'var(--space-6)',
          }}
        >
          {failure.variables.map((name) => <li key={name}>{name}</li>)}
        </ul>
      </main>
    </NotFound>
  );
}

/** §16.5: the entry's own chunks can vanish in a new deploy. Reload once, then wait for the network. */
function recoverFromChunkFailure(root: Root) {
  if (sessionStorage.getItem('natally.chunkReloaded') === null) {
    sessionStorage.setItem('natally.chunkReloaded', '1');
    location.reload();
    return;
  }
  window.addEventListener('online', () => location.reload(), { once: true });
  root.render(<NotFound version=""><p style={{ padding: 'var(--space-4)', margin: 0 }}>{strings['app.chunkFailed']}</p></NotFound>);
}

async function start() {
  const root = createRoot(document.getElementById('root')!);
  try {
    const { config } = await import('../config');
    if (applySecureOriginRule(config.webCanonicalOrigin)) return;
    const { AppBoundary, createAppRouter, startShellModules } = await import('./routes');
    const router = await createAppRouter();
    root.render(
      <StrictMode>
        <AppBoundary>
          <RouterProvider router={router} />
        </AppBoundary>
      </StrictMode>,
    );
    startShellModules();
  } catch (err) {
    if (!isConfigFailure(err)) {
      recoverFromChunkFailure(root);
      return;
    }
    if (!applySecureOriginRule(err.webCanonicalOrigin)) root.render(<ConfigurationNeeded failure={err} />);
  }
}

void start();
