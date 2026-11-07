// §12.3: tries the candidates on this device, measures real synthesis, and picks the profile.
import { config } from '../config';
import { getPlatform } from '../platform';
import type { CalibrationCandidate, CalibrationMeasurement, ModelStore, VoiceProfile } from '../types';
import type { VoiceFile } from './download';
import { VoiceAborted } from './download';
import { MODEL_SPEED, PLAYBACK_RATE, VoicePool } from './pool';
import { voiceLog } from './store';

export const CALIBRATION_SENTENCE = 'The Moon in your chart keeps her own quiet time, and tonight she is listening.';

const MB_PER_COPY = 450;
const clamp = (v: number, low: number, high: number): number => Math.min(high, Math.max(low, v));

interface NavigatorExtras { deviceMemory?: number; gpu?: { requestAdapter(): Promise<unknown> }; }
const extras = (): NavigatorExtras => navigator as unknown as NavigatorExtras;
export const deviceMemoryGb = (): number | null => extras().deviceMemory ?? null;

export function maxWorkers(): number {
  const byCores = navigator.hardwareConcurrency - 1;
  const byMemory = Math.floor((((deviceMemoryGb() ?? 4) - 1) * 1024) / MB_PER_COPY);
  return clamp(Math.min(byCores, byMemory, getPlatform().poolCap), 1, 4);
}

/** Audio as she is heard: playback at `pitch` shortens what the model wrote. */
const heardMs = (samples: number, sampleRate: number): number => (samples / sampleRate / PLAYBACK_RATE) * 1000;
const peak = (pcm: Float32Array): number => pcm.reduce((max, v) => Math.max(max, Math.abs(v)), 0);

export interface CalibrationHooks {
  signal: AbortSignal;
  onSessions(loaded: number, total: number): void;
  onFirstLoaded(): void;
  onCandidates(done: number, total: number): void;
}

async function measure(pool: VoicePool, candidate: CalibrationCandidate): Promise<CalibrationMeasurement> {
  const round = () => pool.runOnEach(CALIBRATION_SENTENCE, candidate.steps, MODEL_SPEED);
  const warm = await round();
  if (warm.some((r) => peak(r.pcm) < 0.001)) throw new Error('Synthesis came back silent');
  let audioMs = 0;
  let wallMs = 0;
  for (let i = 0; i < 2; i += 1) {
    const started = performance.now();
    const results = await round();
    wallMs += performance.now() - started;
    for (const r of results) audioMs += heardMs(r.pcm.length, r.sampleRate);
  }
  return { ...candidate, realTimeFactor: audioMs / wallMs, loadMs: pool.loadMs, synthMs: wallMs, audioMs };
}

/** Highest steps at or above 1.3; among equals least workers, then the fastest. If none reach it, the fastest. */
export function pickCandidate(all: CalibrationMeasurement[]): CalibrationMeasurement {
  const good = all.filter((m) => m.realTimeFactor >= 1.3);
  const pool = good.length > 0 ? good : all;
  const sorted = [...pool].sort((a, b) =>
    good.length > 0
      ? b.steps - a.steps || a.workers - b.workers || b.realTimeFactor - a.realTimeFactor
      : b.realTimeFactor - a.realTimeFactor,
  );
  return sorted[0]!;
}

export const aheadFor = (realTimeFactor: number, workers: number): number =>
  Math.max(clamp(Math.ceil(2.5 / realTimeFactor) + 1, 1, 4), workers);

async function webgpuAvailable(): Promise<boolean> {
  try {
    return (await extras().gpu?.requestAdapter()) != null;
  } catch {
    return false;
  }
}

/** Runs every candidate that applies. Returns the profile, and the pool if the chosen one is the pool still loaded. */
export async function calibrate(store: ModelStore, files: VoiceFile[], hooks: CalibrationHooks): Promise<{ profile: VoiceProfile; pool: VoicePool | null }> {
  const { voiceId, repo, revision } = config.voice;
  const cores = navigator.hardwareConcurrency;
  const most = maxWorkers();
  const base: CalibrationCandidate = { workers: 1, threadsPerWorker: 1, backend: 'wasm', steps: 5 };
  const gpu = await webgpuAvailable();
  const queue: CalibrationCandidate[] = [
    ...(gpu ? [{ ...base, backend: 'webgpu' as const }] : []),
    ...(globalThis.crossOriginIsolated === true && cores > 1 ? [{ ...base, threadsPerWorker: Math.min(4, cores) }] : []),
    ...(most > 1 ? [{ ...base, workers: most }] : []),
  ];

  const measured: CalibrationMeasurement[] = [];
  let loaded: VoicePool | null = null;
  let done = 0;
  const tryCandidate = async (candidate: CalibrationCandidate, first: boolean): Promise<void> => {
    if (hooks.signal.aborted) throw new VoiceAborted();
    if (!loaded?.matches(candidate)) {
      await loaded?.dispose();
      loaded = null;
      loaded = await VoicePool.load({
        store, files, voiceId,
        config: { workers: candidate.workers, threads: candidate.threadsPerWorker, backend: candidate.backend },
        onSessions: first ? hooks.onSessions : undefined,
      });
    }
    if (first) hooks.onFirstLoaded();
    const result = await measure(loaded, candidate);
    measured.push(result);
    voiceLog('calibration_candidate', { ...result });
  };

  try {
    hooks.onCandidates(0, queue.length + 1);
    await tryCandidate(base, true);
    done = 1;
    hooks.onCandidates(done, queue.length + 1);

    // Past 2.5× at 5 steps no more hardware is needed; candidates 5 and 6 below still apply.
    let planned = queue.length + 1;
    for (const candidate of queue) {
      if (measured.some((m) => m.steps === 5 && m.realTimeFactor > 2.5)) {
        planned = done;
        break;
      }
      try {
        await tryCandidate(candidate, false);
      } catch (err) {
        if (hooks.signal.aborted) throw new VoiceAborted();
        voiceLog('calibration_candidate_failed', { ...candidate, reason: err instanceof Error ? err.message : String(err) });
      }
      done += 1;
      hooks.onCandidates(done, planned);
    }

    const bestAtFive = measured.reduce((a, b) => (b.realTimeFactor > a.realTimeFactor ? b : a));
    const extra = bestAtFive.realTimeFactor < 1.2 ? 3 : bestAtFive.realTimeFactor > 3 ? 8 : null;
    if (extra !== null) {
      hooks.onCandidates(done, done + 1);
      try {
        await tryCandidate({ workers: bestAtFive.workers, threadsPerWorker: bestAtFive.threadsPerWorker, backend: bestAtFive.backend, steps: extra }, false);
      } catch (err) {
        if (hooks.signal.aborted) throw new VoiceAborted();
        voiceLog('calibration_candidate_failed', { steps: extra, reason: err instanceof Error ? err.message : String(err) });
      }
      done += 1;
      hooks.onCandidates(done, done);
    }

    const pick = pickCandidate(measured);
    const chosen: CalibrationCandidate = { workers: pick.workers, threadsPerWorker: pick.threadsPerWorker, backend: pick.backend, steps: pick.steps };
    const profile: VoiceProfile = {
      schema: 'natally.voiceprofile/v1',
      modelRepo: repo, modelRevision: revision, voiceId,
      chosen,
      realTimeFactor: pick.realTimeFactor,
      sentencesAhead: aheadFor(pick.realTimeFactor, pick.workers),
      measurements: measured,
      deviceMemoryGb: deviceMemoryGb(), hardwareConcurrency: cores,
      calibratedAt: new Date().toISOString(), appVersion: config.version,
    };
    const finalPool = loaded as VoicePool | null;
    if (finalPool?.matches(chosen)) return { profile, pool: finalPool };
    await finalPool?.dispose();
    return { profile, pool: null };
  } catch (err) {
    await (loaded as VoicePool | null)?.dispose();
    throw err;
  }
}
