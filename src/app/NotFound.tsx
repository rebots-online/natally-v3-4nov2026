// §9.1: canvas and version badge, for an unknown path or a screen that has not landed. No configuration is read here,
// because the configuration state renders through this page too.
import { lazy, Suspense, type ReactNode } from 'react';

interface BadgeProps { version: string }
const ui = import.meta.glob<{ VersionBadge: (props: BadgeProps) => ReactNode }>('../ui/index.ts');
const loadUi = ui['../ui/index.ts'];

function PlainBadge({ version }: BadgeProps) {
  return (
    <aside
      id="version-badge"
      style={{
        position: 'fixed', bottom: 'var(--space-3)', right: 'var(--space-3)', zIndex: 'var(--layer-version-badge)',
        padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', pointerEvents: 'none', userSelect: 'none',
        fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-gold-light)',
        background: 'var(--color-ground-deep)', border: '1px solid var(--color-border)',
      }}
    >
      v{version}
    </aside>
  );
}

const Badge = loadUi
  ? lazy(async () => {
      const { VersionBadge } = await loadUi();
      return { default: VersionBadge };
    })
  : PlainBadge;

export default function NotFound({ version, children }: { version: string; children?: ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-canvas)', color: 'var(--color-cream)' }}>
      {children}
      {version ? (
        <Suspense fallback={<PlainBadge version={version} />}>
          <Badge version={version} />
        </Suspense>
      ) : null}
    </div>
  );
}
