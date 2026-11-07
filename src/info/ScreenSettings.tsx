// Port of the frozen `settings` screen (LIBS/UI/STITCH/screens/settings/index.html): same ids, classes and text, colours as tokens.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';
import { track } from '../analytics';
import { useChart } from '../chart';
import { eraseConversationHistory } from '../reading';
import { updateSettings, useSettings } from '../settings';
import { Button, Dialog, showToast } from '../ui';
import type { LocalSettings } from '../types';
import { Chevron, SECTION_CAPTION, useCloseScreen } from './Chrome';
import { fill, strings } from './strings';

const GROUP = 'bg-panel border border-hairline rounded-[16px] overflow-hidden';
const ROW_BUTTON =
  'w-full h-[52px] px-4 flex items-center justify-between bg-transparent border-none text-left cursor-pointer hover:bg-elevated/50 transition-colors';
const LABEL = 'text-sm font-normal text-cream';

type Flag = 'readAloud' | 'roomSounds' | 'pauseMotion' | 'analyticsConsent';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <div className={`${SECTION_CAPTION} mb-2 px-1`}>{title}</div>
      <div className={GROUP}>{children}</div>
    </section>
  );
}

/** The frozen switch: gold track and dark knob when on, elevated track and muted knob when off. */
function Switch({ id, on, onFlip, shrink }: { id: string; on: boolean; onFlip: () => void; shrink?: boolean }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onFlip}
      className={`w-[44px] h-[24px] rounded-full relative p-[2px] flex items-center cursor-pointer ${shrink ? 'shrink-0 ' : ''}${on ? 'bg-gold justify-end' : 'bg-elevated justify-start'}`}
    >
      <span className={`w-[20px] h-[20px] rounded-full block ${on ? 'bg-canvas' : 'bg-muted'}`}></span>
    </button>
  );
}

export default function ScreenSettings() {
  const navigate = useNavigate();
  const close = useCloseScreen();
  const settings = useSettings();
  const { chart } = useChart();
  const [confirming, setConfirming] = useState(false);
  const [erasing, setErasing] = useState(false);
  const pendingVolume = useRef<{ timer: number; decile: number } | null>(null);
  const app = { app: config.appName };

  // A slider sends one event for the whole drag, not one per step, and an unmount does not lose it.
  useEffect(
    () => () => {
      const pending = pendingVolume.current;
      if (!pending) return;
      window.clearTimeout(pending.timer);
      track('setting_change', { setting: 'roomVolume', value: pending.decile });
    },
    [],
  );

  const flip = (key: Flag) => {
    const value = !settings[key];
    updateSettings({ [key]: value } as Partial<LocalSettings>);
    // Sent after the change is stored: switching analytics off makes `track` see the withdrawal and drop this very event.
    track('setting_change', { setting: key, value });
  };

  const setVolume = (value: number) => {
    updateSettings({ roomVolume: value });
    if (pendingVolume.current) window.clearTimeout(pendingVolume.current.timer);
    const decile = Math.floor(value / 10);
    const timer = window.setTimeout(() => {
      pendingVolume.current = null;
      track('setting_change', { setting: 'roomVolume', value: decile });
    }, 800);
    pendingVolume.current = { timer, decile };
  };

  const erase = async () => {
    setErasing(true);
    try {
      await eraseConversationHistory();
      setConfirming(false);
      showToast(strings['settings.erased'], 'success');
    } catch {
      showToast(strings['settings.failed'], 'error');
    } finally {
      setErasing(false);
    }
  };

  const whole = chart?.houseSystem === 'whole_sign';
  const reason = !whole ? null : chart?.houseSystemReason === 'polar_latitude' ? strings['chart.polarReason'] : strings['chart.wholeSignReason'];
  const houseLabel = whole ? strings['settings.wholeSign'] : strings['settings.placidus'];

  return (
    <div className="min-h-screen relative flex flex-col justify-between selection:bg-gold selection:text-canvas">
      {/* Main Container: 20px side margins */}
      <main className="w-full max-w-[430px] mx-auto px-5 pt-7 pb-20 box-border">
        {/* 1. Header row */}
        <header className="flex items-center justify-between mb-8">
          <h1 className="font-fraunces text-[28px] font-normal tracking-tight text-cream m-0">{strings['settings.title']}</h1>
          <button
            id="settings-close-button"
            type="button"
            onClick={close}
            className="font-cinzel tracking-widest text-xs uppercase text-cream min-h-[44px] px-3 flex items-center justify-center bg-transparent border-none cursor-pointer hover:text-gold transition-colors"
          >
            {strings['settings.close']}
          </button>
        </header>

        {/* 2. Five sections */}
        <div className="space-y-6">
          <Section title={strings['settings.sound']}>
            <div className="h-[52px] px-4 flex items-center justify-between border-b border-hairline">
              <span className={LABEL}>{strings['settings.readAloud']}</span>
              <Switch id="settings-read-aloud-toggle" on={settings.readAloud} onFlip={() => flip('readAloud')} />
            </div>
            <div className="h-[52px] px-4 flex items-center justify-between border-b border-hairline">
              <span className={LABEL}>{strings['settings.roomSounds']}</span>
              <Switch id="settings-room-sounds-toggle" on={settings.roomSounds} onFlip={() => flip('roomSounds')} />
            </div>
            <div className="h-[52px] px-4 flex items-center justify-between border-b border-hairline">
              <span className={`${LABEL} pr-4 whitespace-nowrap`}>{strings['settings.roomVolume']}</span>
              <div className="w-32 flex items-center">
                <input
                  id="settings-room-volume-slider"
                  type="range"
                  min={0}
                  max={100}
                  value={settings.roomVolume}
                  aria-label={strings['settings.roomVolume']}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  className="nat-range w-full"
                />
              </div>
            </div>
            <button id="settings-retune-voice-button" type="button" onClick={() => navigate('/voice?retune=1')} className={ROW_BUTTON}>
              <span className={LABEL}>{strings['settings.retune']}</span>
              <Chevron />
            </button>
          </Section>

          <Section title={strings['settings.chart']}>
            <div className="h-[52px] px-4 flex items-center justify-between">
              <label htmlFor="settings-house-system-select" className={LABEL}>
                {strings['settings.houseSystem']}
              </label>
              <div className="relative flex items-center">
                {/* Read-only by design: the chart's own system is the only option. */}
                <select
                  id="settings-house-system-select"
                  value={whole ? 'whole_sign' : 'placidus'}
                  onChange={() => undefined}
                  className="appearance-none bg-transparent text-cream text-sm pr-6 pl-2 py-1 text-right border-none cursor-pointer"
                >
                  <option value={whole ? 'whole_sign' : 'placidus'} className="bg-panel text-cream">
                    {houseLabel}
                  </option>
                </select>
                <svg className="w-4 h-4 text-muted pointer-events-none absolute right-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {reason ? <p id="settings-house-system-reason" className="m-0 px-4 pb-3 text-xs leading-[18px] text-muted">{reason}</p> : null}
          </Section>

          <Section title={strings['settings.motion']}>
            <div className="h-[52px] px-4 flex items-center justify-between">
              <span className={LABEL}>{strings['settings.pauseMotion']}</span>
              <Switch id="settings-pause-motion-toggle" on={settings.pauseMotion} onFlip={() => flip('pauseMotion')} />
            </div>
          </Section>

          <Section title={strings['settings.privacy']}>
            <div className="h-[52px] px-4 flex items-center justify-between border-b border-hairline">
              <span className={`${LABEL} pr-2`}>{fill(strings['settings.analytics'], app)}</span>
              <Switch id="settings-analytics-toggle" on={settings.analyticsConsent} onFlip={() => flip('analyticsConsent')} shrink />
            </div>
            <button id="settings-erase-history-button" type="button" onClick={() => setConfirming(true)} className={ROW_BUTTON}>
              <span className="text-sm font-normal text-error">{strings['settings.erase']}</span>
              <Chevron />
            </button>
          </Section>

          <Section title={strings['settings.account']}>
            <button id="settings-profile-link" type="button" onClick={() => navigate('/profile')} className={ROW_BUTTON}>
              <span className={LABEL}>{strings['settings.profile']}</span>
              <Chevron />
            </button>
            <button id="settings-about-link" type="button" onClick={() => navigate('/about')} className={ROW_BUTTON}>
              <span className={LABEL}>{fill(strings['settings.about'], app)}</span>
              <Chevron />
            </button>
          </Section>
        </div>
      </main>

      {/* Fixed bottom right: version badge */}
      <div className="fixed bottom-3 right-3 z-50 pointer-events-none">
        <span className="font-mono text-[11px] leading-none px-2 py-1 rounded bg-deepGround text-goldLight border border-hairline/60">v{config.version}</span>
      </div>

      <Dialog
        id="settings-erase-dialog"
        open={confirming}
        onClose={() => (erasing ? undefined : setConfirming(false))}
        title={strings['settings.eraseConfirm']}
        actions={
          <>
            <Button id="settings-erase-confirm-button" variant="secondary" busy={erasing} onClick={() => void erase()}>
              {strings['settings.eraseYes']}
            </Button>
            <Button id="settings-erase-cancel-button" variant="primary" disabled={erasing} onClick={() => setConfirming(false)}>
              {strings['settings.eraseNo']}
            </Button>
          </>
        }
      />
    </div>
  );
}
