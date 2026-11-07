// Port of the frozen `pick-a-modality` screen (LIBS/UI/STITCH/screens/pick-a-modality/index.html): same ids, classes and text.
// The cards come from the registry; nothing here names a modality. Locked cards have no action.
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '../account';
import { track } from '../analytics';
import { useSession } from '../auth';
import { config } from '../config';
import type { ModalityManifest } from '../types';
import { listModalities, modalityIcon } from './registry';
import { fill, strings } from './strings';

const BEGIN =
  'bg-[#c9a24a] hover:bg-[#f2ca50] text-[#120c1c] font-semibold px-4 py-2 rounded-lg text-sm transition-colors duration-150 flex-shrink-0 active:scale-95';

/** Shown for a folder that has a manifest but no icon of its own. */
const FallbackIcon = () => (
  <svg className="w-6 h-6 stroke-current" fill="none" strokeWidth="1.5" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9.5" />
  </svg>
);

const Lock = () => (
  <svg className="w-4 h-4 stroke-[#a698b5]" fill="none" strokeWidth="1.75" viewBox="0 0 24 24">
    <rect height="10" rx="2" width="14" x="5" y="11" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
  </svg>
);

export default function ScreenPickModality() {
  const navigate = useNavigate();
  const session = useSession();
  const { account } = useAccount();

  const begin = async (manifest: ModalityManifest) => {
    track('modality_choose', { modality: manifest.key });
    const { entryPath } = await manifest.load();
    navigate(entryPath);
  };

  const signIn = (event: MouseEvent) => {
    event.preventDefault();
    navigate('/sign-in?next=/pick');
  };

  return (
    <div className="bg-[#120c1c] text-[#f1e8d8] font-sans min-h-screen flex flex-col justify-between items-center antialiased selection:bg-[#2a1d3d] selection:text-[#f2ca50]">
      {/* Main Container */}
      <main className="w-full max-w-[430px] mx-auto px-4 pt-10 pb-16 flex flex-col items-center flex-grow justify-center text-center">
        {/* 1. App Icon */}
        <div className="w-[72px] h-[72px] rounded-[17px] border border-[#c9a24a] overflow-hidden bg-[#1a1226] mb-5 flex-shrink-0" id="natally-app-icon">
          <img alt={fill(strings['pick.iconAlt'])} className="w-full h-full object-cover" src="/brand/192x192.png" />
        </div>
        {/* 2. Eyebrow Brand Stamp */}
        <p className="font-cinzel font-bold text-[#c9a24a] tracking-[0.25em] text-xs uppercase mb-2">{fill(strings['pick.eyebrow'])}</p>
        {/* 3. Heading */}
        <h1 className="font-fraunces text-[34px] leading-tight text-[#f1e8d8] tracking-tight mb-2 font-normal">{strings['pick.heading']}</h1>
        {/* 4. Subtitle */}
        <p className="text-[#a698b5] text-sm mb-7 font-normal">{strings['pick.subtitle']}</p>
        {/* 5. Vertical list of modality cards */}
        <div className="flex flex-col gap-3.5 w-full mb-3 text-left" id="modality-list">
          {listModalities().map((manifest) => {
            const Icon = modalityIcon(manifest.key) ?? FallbackIcon;
            const locked = manifest.status === 'locked' || (manifest.entitlement !== null && !account?.entitlements.includes(manifest.entitlement));
            return (
              <div
                key={manifest.key}
                id={manifest.cardElementId}
                aria-disabled={locked || undefined}
                className={
                  locked
                    ? 'bg-[#1a1226] border border-[#3a2d50] rounded-[16px] min-h-[88px] p-4 flex items-center justify-between opacity-70 cursor-not-allowed'
                    : 'bg-[#1a1226] border border-[#c9a24a] rounded-[16px] min-h-[88px] p-4 flex items-center justify-between transition-colors'
                }
              >
                <div className="w-12 h-12 rounded-full bg-[#2a1d3d] flex items-center justify-center flex-shrink-0 text-[#f1e8d8]">
                  <Icon />
                </div>
                <span className="font-fraunces text-[20px] text-[#f1e8d8] flex-1 px-4 leading-snug">{manifest.title}</span>
                {locked ? (
                  <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0 px-1">
                    <Lock />
                    <span className="font-mono text-xs text-[#a698b5] leading-none">{strings['pick.addOn']}</span>
                  </div>
                ) : (
                  <button className={BEGIN} id={`modality-${manifest.key}-begin`} type="button" onClick={() => void begin(manifest)}>
                    {strings['pick.begin']}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {/* 6. Small Muted Disclaimer Line */}
        <p className="text-xs text-[#a698b5] text-center mb-8">{strings['pick.addOnNote']}</p>
        {/* 7. Bottom Ghost Link: only for a visitor who has not signed in */}
        <div className="mt-auto">
          {session.status === 'signed_out' ? (
            <a className="text-[#a698b5] hover:text-[#f1e8d8] text-sm underline underline-offset-4 transition-colors" href="/sign-in?next=/pick" id="modality-signin-link" onClick={signIn}>
              {strings['pick.signIn']}
            </a>
          ) : null}
        </div>
      </main>
      {/* Fixed Bottom Right Version Badge */}
      <aside className="fixed bottom-3 right-3 font-mono text-[11px] text-[#f2ca50] bg-[#0b0712] border border-[#3a2d50] px-2 py-1 rounded select-none z-50 pointer-events-none" id="version-badge">
        v{config.version}
      </aside>
    </div>
  );
}
