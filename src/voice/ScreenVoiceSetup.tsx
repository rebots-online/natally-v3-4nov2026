// /voice (§9.2, §10 `voice-setup`): ported from the frozen screen. Every number on it is measured.
import { useEffect, type MouseEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { track } from '../analytics';
import { config } from '../config';
import { updateSettings, useSettings } from '../settings';
import { ProgressRow, VersionBadge, type ProgressRowProps } from '../ui';
import type { VoiceProgress } from '../types';
import { abortVoiceSetup, beginVoiceSetup } from './setup';
import { getVoiceProfile, markVoiceSkipped, useProgressStore } from './store';
import { fill, strings } from './strings';

type Row = Pick<ProgressRowProps, 'state' | 'detail' | 'fraction'>;
const WAITING: Row = { state: 'waiting', detail: strings['voice.waiting'], fraction: null };
const DONE: Row = { state: 'done', detail: strings['voice.done'], fraction: null };
const FAILED: Row = { state: 'failed', detail: '', fraction: null };
const mb = (bytes: number): number => Math.round(bytes / 1e6);
const share = (done: number, total: number): number | null => (total > 0 ? done / total : null);

const failedAt = (p: VoiceProgress): 'download' | 'load' | 'tune' =>
  p.totalBytes === 0 || p.downloadedBytes < p.totalBytes ? 'download' : p.sessionsLoaded < p.sessionsTotal ? 'load' : 'tune';

function downloadRow(p: VoiceProgress): Row {
  if (p.phase === 'absent' || p.phase === 'unsupported') return WAITING;
  if (p.phase === 'failed' && failedAt(p) === 'download') return FAILED;
  if (p.phase !== 'downloading') return DONE;
  if (p.totalBytes === 0) return { state: 'active', detail: strings['voice.waiting'], fraction: null };
  return { state: 'active', detail: fill(strings['voice.bytes'], mb(p.downloadedBytes), mb(p.totalBytes)), fraction: share(p.downloadedBytes, p.totalBytes) };
}

function loadRow(p: VoiceProgress): Row {
  if (p.phase === 'ready' || p.phase === 'calibrating') return DONE;
  if (p.phase === 'failed') return failedAt(p) === 'load' ? FAILED : failedAt(p) === 'tune' ? DONE : WAITING;
  if (p.phase !== 'loading') return WAITING;
  return { state: 'active', detail: fill(strings['voice.loaded'], p.sessionsLoaded, p.sessionsTotal), fraction: share(p.sessionsLoaded, p.sessionsTotal) };
}

function tuneRow(p: VoiceProgress): Row {
  if (p.phase === 'ready') return DONE;
  if (p.phase === 'failed') return failedAt(p) === 'tune' ? FAILED : WAITING;
  if (p.phase !== 'calibrating') return WAITING;
  return { state: 'active', detail: fill(strings['voice.candidate'], p.candidatesDone, p.candidatesTotal), fraction: share(p.candidatesDone, p.candidatesTotal) };
}

/** Only a path inside this app: `next` comes from the address bar. */
const safeNext = (next: string | null, retune: boolean): string =>
  next && next.startsWith('/') && !next.startsWith('//') ? next : retune ? '/settings' : '/atelier';

function Divider() {
  return <div className="h-[1px] w-full bg-hairline" />;
}

export function ScreenVoiceSetup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const retune = params.get('retune') === '1';
  const progress = useProgressStore();
  const { pauseMotion } = useSettings();
  const next = safeNext(params.get('next'), retune);
  const profile = progress.phase === 'ready' ? getVoiceProfile() : null;

  useEffect(() => {
    void beginVoiceSetup({ force: retune });
  }, [retune]);

  const working = progress.phase === 'downloading' || progress.phase === 'loading' || progress.phase === 'calibrating';
  const motionAllowed = !pauseMotion && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cameo = working && motionAllowed ? '/brand/natally-mascot.webp' : '/brand/natally-still.webp';
  const ready = progress.phase === 'ready';

  const onSkip = (event: MouseEvent) => {
    event.preventDefault();
    abortVoiceSetup();
    markVoiceSkipped();
    updateSettings({ readAloud: false });
    track('voice_skipped', {});
    navigate(next, { replace: true });
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-canvas text-cream selection:bg-gold selection:text-canvas">
      <main className="mx-auto flex w-full max-w-md flex-col items-center px-4 pt-10 pb-16">
        <div className="mb-6 flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold bg-panel">
          <img src={cameo} alt={strings['voiceSetup.cameoAlt']} className="h-full w-full object-cover object-center" />
        </div>

        <h1 className="mb-2 text-center font-fraunces text-[28px] leading-tight font-normal text-cream">{strings['voiceSetup.title']}</h1>

        <p className="mb-6 text-center text-[15px] leading-relaxed text-muted">{progress.error ?? strings['voiceSetup.subtitle']}</p>

        <section id="voice-setup-steps" className="mb-4 w-full overflow-hidden rounded-xl border border-hairline bg-panel">
          <ProgressRow id="voice-download-progress" label={strings['voiceSetup.download']} {...downloadRow(progress)} />
          <Divider />
          <ProgressRow id="voice-load-progress" label={strings['voiceSetup.load']} {...loadRow(progress)} />
          <Divider />
          <ProgressRow id="voice-tune-progress" label={strings['voiceSetup.tune']} {...tuneRow(progress)} />
        </section>

        <section id="voice-calibration-result" hidden={!profile} className="mb-6 w-full rounded-xl border border-hairline bg-panel p-4">
          <div className="mb-3 font-cinzel text-[11px] font-semibold tracking-widest text-gold uppercase">{strings['voiceSetup.found']}</div>
          {profile ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-muted">{strings['voiceSetup.speed']}</span>
                <span className="font-mono text-[12px] text-cream">{fill(strings['voiceSetup.speedValue'], profile.realTimeFactor.toFixed(1))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-muted">{strings['voiceSetup.ahead']}</span>
                <span className="font-mono text-[12px] text-cream">{profile.sentencesAhead}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-muted">{strings['voiceSetup.workers']}</span>
                <span className="font-mono text-[12px] text-cream">{profile.chosen.workers}</span>
              </div>
            </div>
          ) : null}
        </section>

        <button
          id="voice-continue-button"
          disabled={!ready}
          onClick={() => navigate(next, { replace: true })}
          className={`mb-4 flex h-[52px] w-full items-center justify-center rounded-xl bg-gold text-[16px] font-bold tracking-wide text-canvas select-none ${ready ? '' : 'cursor-not-allowed opacity-40'}`}
        >
          {strings['voiceSetup.continue']}
        </button>

        <a
          href="#"
          id="voice-skip-link"
          onClick={onSkip}
          className="text-[14px] text-muted underline decoration-hairline underline-offset-4 transition-colors duration-150 hover:text-cream hover:decoration-muted"
        >
          {strings['voiceSetup.skip']}
        </a>
      </main>

      <VersionBadge version={config.version} />
    </div>
  );
}

export default ScreenVoiceSetup;
