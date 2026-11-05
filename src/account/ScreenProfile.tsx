// Port of the frozen `profile` screen (LIBS/UI/STITCH/screens/profile/index.html): same ids, classes and text.
// Imports `../billing` for the Top Up, Restore and price fallback behaviour §10 and §7.2 give this screen.
import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback, useState, type MouseEvent } from 'react';
import { config } from '../config';
import { getPlatform } from '../platform';
import { signOutNow, useSession } from '../auth';
import { restorePurchases, useCatalog, useOpenTopUp } from '../billing';
import { showToast } from '../ui';
import { formatBalance, toRow } from './format';
import { useAccount, useLedger, useProfile } from './hooks';
import { strings } from './strings';

const BUTTON_SMALL =
  'h-[38px] px-3.5 bg-panel border border-hairline rounded-[12px] text-cream font-body text-xs font-semibold hover:border-gold active:scale-95 transition-all duration-150 focus:outline-none';
const LIST_ROW =
  'h-[52px] w-full bg-panel border border-hairline rounded-[16px] px-4 flex items-center justify-between text-cream font-body text-[15px] hover:border-gold active:scale-[0.99] transition-all duration-150';

/** Material Symbols `chevron_right`, drawn inline (§3.2 rule 7). */
const Chevron = () => (
  <svg className="text-muted w-5 h-5 shrink-0" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true">
    <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
  </svg>
);

export default function ScreenProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useSession();
  const { profile } = useProfile();
  const { balanceMilli } = useAccount();
  const { entries } = useLedger();
  const catalog = useCatalog();
  const openTopUp = useOpenTopUp();
  const [restoring, setRestoring] = useState(false);

  const name = profile?.displayName ?? session.displayName ?? profile?.birth?.name ?? '';
  const email = profile?.email ?? session.email ?? '';

  const catalogPrice = useCallback(
    (productId: string) => [...catalog.products, ...(catalog.souvenir ? [catalog.souvenir] : [])].find((p) => p.productId === productId)?.priceLabel ?? null,
    [catalog.products, catalog.souvenir],
  );
  let souvenirNumber = 0;
  const rows = entries.map((entry) => ({ ...toRow(entry, catalogPrice), n: entry.kind === 'souvenir_purchase' ? ++souvenirNumber : 0 }));

  const close = () => (location.key !== 'default' ? navigate(-1) : navigate('/atelier'));

  const restore = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      const { credited } = await restorePurchases();
      showToast(credited > 0 ? strings['billing.restored'].replace('{}', String(credited)) : strings['billing.nothing'], 'success');
    } catch {
      showToast(strings['share.failed'], 'error');
    } finally {
      setRestoring(false);
    }
  };

  const signOut = async () => {
    // Shells and the installed app have no landing page (§1.3): they return to Pick a modality.
    const standalone = getPlatform().kind !== 'web' || window.matchMedia('(display-mode: standalone)').matches;
    try {
      await signOutNow();
    } catch {
      showToast(strings['share.failed'], 'error');
    } finally {
      navigate(standalone ? '/pick' : '/', { replace: true });
    }
  };

  const go = (path: string) => (event: MouseEvent) => {
    event.preventDefault();
    navigate(path);
  };

  return (
    <div className="bg-canvas text-cream font-body antialiased min-h-[max(884px,100dvh)] flex flex-col justify-between selection:bg-elevated selection:text-goldLight">
      <main className="w-full max-w-md mx-auto px-5 pt-6 pb-20 flex flex-col space-y-5">
        {/* 1. Header row */}
        <header className="flex items-center justify-between min-h-[44px]">
          <h1 className="font-fraunces text-[28px] text-cream leading-none tracking-tight">{strings['profile.title']}</h1>
          <button
            className="font-cinzel font-bold text-xs tracking-widest text-cream uppercase min-h-[44px] px-3 py-2 flex items-center justify-center hover:text-gold active:scale-95 transition-transform duration-150 focus:outline-none"
            id="profile-close-button"
            type="button"
            onClick={close}
          >
            {strings['profile.close']}
          </button>
        </header>
        {/* 2. Identity card */}
        <section className="bg-panel border border-hairline rounded-[16px] p-5 flex flex-col space-y-1">
          <span className="font-fraunces text-[22px] text-cream leading-tight">{name}</span>
          <span className="font-mono text-[13px] text-muted tracking-tight">{email}</span>
        </section>
        {/* 3. Balance card */}
        <section className="bg-panel border border-hairline rounded-[16px] p-5 flex items-center justify-between" id="profile-balance-card">
          <div className="flex flex-col space-y-1">
            <span className="font-cinzel text-[11px] font-bold text-gold tracking-widest uppercase">{strings['profile.balance']}</span>
            <span className="font-fraunces text-[40px] text-goldLight leading-none tracking-tight">{formatBalance(balanceMilli)}</span>
          </div>
          <button
            className="h-[44px] px-5 bg-panel border border-gold rounded-[12px] text-cream font-body text-sm font-bold flex items-center justify-center hover:bg-elevated hover:text-goldLight active:scale-95 transition-all duration-150 focus:outline-none"
            id="profile-topup-button"
            type="button"
            onClick={openTopUp}
          >
            {strings['profile.topUp']}
          </button>
        </section>
        {/* 4. Transactions section */}
        <section className="flex flex-col space-y-3 pt-2">
          <h2 className="font-fraunces text-[20px] text-cream leading-tight">{strings['profile.transactions']}</h2>
          <div className="flex flex-col space-y-3" id="profile-transactions">
            {rows.map((row) => (
              <article key={row.id} className={`bg-panel border border-hairline rounded-[16px] p-4 flex flex-col ${row.isSouvenir ? 'space-y-3' : 'space-y-2'}`}>
                <div className="flex items-baseline justify-between">
                  <span className="font-body font-bold text-cream text-[15px]">{row.title}</span>
                  <span className="font-mono text-[14px] text-goldLight">{row.amount}</span>
                </div>
                <div className="font-body text-xs text-muted">{row.detail}</div>
                {row.isSouvenir &&
                  (row.atelierUrl && row.pdfUrl ? (
                    <div className="flex items-center space-x-2 pt-1">
                      <button className={BUTTON_SMALL} id={`profile-souvenir-atelier-${row.n}`} type="button" onClick={() => void getPlatform().openExternal(row.atelierUrl!)}>
                        {strings['profile.openAtelier']}
                      </button>
                      <button className={BUTTON_SMALL} id={`profile-souvenir-pdf-${row.n}`} type="button" onClick={() => void getPlatform().openExternal(row.pdfUrl!)}>
                        {strings['profile.souvenirPdf']}
                      </button>
                    </div>
                  ) : (
                    <div className="font-body text-xs text-muted">{strings['souvenir.preparing']}</div>
                  ))}
              </article>
            ))}
          </div>
        </section>
        {/* 5. One small muted line */}
        <div className="pt-1">
          <p className="font-body text-xs text-muted">{strings['profile.everyPurchase']}</p>
        </div>
        {/* 6. Restore purchases ghost link */}
        <div>
          <a
            className="font-body text-sm text-cream underline underline-offset-4 hover:text-goldLight transition-colors duration-150 inline-block py-1"
            href="#"
            id="profile-restore-link"
            onClick={(event) => {
              event.preventDefault();
              void restore();
            }}
          >
            {strings['profile.restore']}
          </a>
        </div>
        {/* 7. Two full-width list rows with chevron */}
        <section className="flex flex-col space-y-2 pt-1">
          <a className={LIST_ROW} href="/settings" id="profile-settings-link" onClick={go('/settings')}>
            <span>{strings['profile.settings']}</span>
            <Chevron />
          </a>
          <a className={LIST_ROW} href="/about" id="profile-about-link" onClick={go('/about')}>
            <span>{strings['profile.about']}</span>
            <Chevron />
          </a>
        </section>
        {/* 8. Bottom full-width secondary button */}
        <div className="pt-2">
          <button
            className="h-[52px] w-full bg-panel border border-hairline rounded-[12px] text-cream font-body text-[15px] font-bold flex items-center justify-center hover:border-gold active:scale-[0.99] transition-all duration-150 focus:outline-none"
            id="profile-signout-button"
            type="button"
            onClick={() => void signOut()}
          >
            {strings['profile.signOut']}
          </button>
        </div>
      </main>
      {/* 9. Version badge fixed bottom right */}
      <aside className="fixed bottom-3 right-3 z-50 pointer-events-none">
        <div className="bg-deepGround border border-hairline px-2.5 py-1 rounded-[6px]">
          <span className="font-mono text-xs text-goldLight tracking-tight">v{config.version}</span>
        </div>
      </aside>
    </div>
  );
}
