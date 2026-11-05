import { strings } from './strings';

/** Fixed bottom right on every screen. `version` is the stamp from `./build_all.sh`, without the leading v. */
export function VersionBadge({ version }: { version: string }) {
  return (
    <aside
      id="version-badge"
      className="pointer-events-none fixed right-3 bottom-3 z-(--layer-version-badge) rounded-[4px] border border-hairline bg-canvas-deep px-2 py-1 font-mono text-[12px] leading-4 text-gold-light select-none"
    >
      {strings['ui.versionPrefix']}{version}
    </aside>
  );
}
