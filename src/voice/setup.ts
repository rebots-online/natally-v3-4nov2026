// §12.2: absent → downloading → loading → calibrating → ready. Also the calibrated pool, loaded lazily, and whole-sentence synthesis.
import { track } from '../analytics';
import { getPlatform } from '../platform';
import type { ModelStore, VoiceProfile } from '../types';
import { calibrate, deviceMemoryGb } from './calibrate';
import { VoiceAborted, VoiceStorageError, downloadModel, voiceFiles } from './download';
import { MODEL_SPEED, VoicePool, getActivePool, isOutOfMemory, setActivePool } from './pool';
import { applyPitchOffline } from './player';
import { setPoolLostHandler } from './queue';
import { clearVoiceProfile, getVoiceProfile, resetProgress, saveVoiceProfile, setProgress, takeWeightsStale, useProgressStore, voiceLog } from './store';
import { strings } from './strings';

// wasm module with one SIMD instruction: the standard feature probe.
const SIMD_PROBE = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]);
const PROGRESS_INTERVAL_MS = 100;

async function usableStore(): Promise<ModelStore | null> {
  if (typeof Worker === 'undefined' || typeof WebAssembly === 'undefined' || !WebAssembly.validate(SIMD_PROBE)) return null;
  return getPlatform().modelStore();
}

export async function isVoiceSupported(): Promise<boolean> {
  return (await usableStore()) !== null;
}

let running: Promise<VoiceProfile | null> | null = null;
let aborter: AbortController | null = null;

export function beginVoiceSetup({ force }: { force: boolean }): Promise<VoiceProfile | null> {
  running ??= runSetup(force).finally(() => {
    running = null;
    aborter = null;
  });
  return running;
}

/** The customer chose to go on without sound: stop spending their bandwidth and CPU. */
export function abortVoiceSetup(): void {
  aborter?.abort();
}

async function runSetup(force: boolean): Promise<VoiceProfile | null> {
  if (force) {
    clearVoiceProfile();
    const pool = getActivePool();
    setActivePool(null);
    await pool?.dispose();
  }
  const existing = getVoiceProfile();
  if (existing) {
    setProgress({ phase: 'ready', error: null });
    return existing;
  }
  const store = await usableStore();
  if (!store) {
    setProgress({ phase: 'unsupported', error: strings['voice.unsupported'] });
    return null;
  }
  if (takeWeightsStale()) await store.clear();

  aborter = new AbortController();
  const { signal } = aborter;
  let stage = 'download';
  resetProgress();
  setProgress({ phase: 'downloading' });
  track('voice_setup_start', { retune: force });
  try {
    const files = voiceFiles();
    let lastPaint = 0;
    const report = await downloadModel(store, files, signal, (downloadedBytes, totalBytes) => {
      const now = performance.now();
      if (downloadedBytes < totalBytes && now - lastPaint < PROGRESS_INTERVAL_MS) return;
      lastPaint = now;
      setProgress({ downloadedBytes, totalBytes });
    });
    if (report.fetchedBytes > 0) track('voice_download_done', { bytes: report.fetchedBytes, ms: Math.round(report.ms) });

    stage = 'load';
    setProgress({ phase: 'loading', sessionsLoaded: 0, sessionsTotal: 3 });
    const { profile, pool } = await calibrate(store, files, {
      signal,
      onSessions: (sessionsLoaded, sessionsTotal) => setProgress({ sessionsLoaded, sessionsTotal }),
      onFirstLoaded: () => {
        stage = 'calibrate';
        setProgress({ phase: 'calibrating' });
      },
      onCandidates: (candidatesDone, candidatesTotal) => setProgress({ candidatesDone, candidatesTotal }),
    });
    saveVoiceProfile(profile);
    setActivePool(pool);
    setProgress({ phase: 'ready', error: null });
    voiceLog('profile', { ...profile, measurements: profile.measurements.length });
    track('voice_calibrated', {
      real_time_factor: profile.realTimeFactor, workers: profile.chosen.workers, threads: profile.chosen.threadsPerWorker,
      backend: profile.chosen.backend, steps: profile.chosen.steps, sentences_ahead: profile.sentencesAhead,
      device_memory: deviceMemoryGb() ?? 0, cores: profile.hardwareConcurrency,
    });
    return profile;
  } catch (err) {
    if (err instanceof VoiceAborted || signal.aborted) {
      resetProgress();
      return null;
    }
    const isStorage = err instanceof VoiceStorageError;
    voiceLog('setup_failed', { stage, reason: err instanceof Error ? err.message : String(err) });
    setProgress({ phase: 'failed', error: strings[isStorage ? 'voice.storage' : 'voice.retry'] });
    track('voice_error', { stage, category: isStorage ? 'storage' : isOutOfMemory(err) ? 'memory' : 'other' });
    return null;
  }
}

let loadingPool: Promise<boolean> | null = null;

export function ensureVoicePool(): Promise<boolean> {
  if (getActivePool()) return Promise.resolve(true);
  loadingPool ??= loadCalibratedPool().finally(() => {
    loadingPool = null;
  });
  return loadingPool;
}

async function loadCalibratedPool(): Promise<boolean> {
  const profile = getVoiceProfile();
  const store = await usableStore();
  if (!profile || !store) return false;
  const files = voiceFiles();
  if (!(await Promise.all(files.map((f) => store.has(f.storePath)))).every(Boolean)) return false;
  const { chosen, modelRepo: _repo } = profile;
  for (let workers = chosen.workers; workers >= 1; workers -= 1) {
    try {
      const pool = await VoicePool.load({
        store, files, voiceId: profile.voiceId,
        config: { workers, threads: chosen.threadsPerWorker, backend: chosen.backend },
      });
      setActivePool(pool);
      if (workers !== chosen.workers) saveVoiceProfile({ ...profile, chosen: { ...chosen, workers } });
      voiceLog('pool_loaded', { workers, loadMs: Math.round(pool.loadMs) });
      return true;
    } catch (err) {
      voiceLog('pool_load_failed', { workers, reason: err instanceof Error ? err.message : String(err) });
      if (!isOutOfMemory(err)) break;
    }
  }
  track('voice_error', { stage: 'pool', category: 'load' });
  return false;
}

setPoolLostHandler((pool) => {
  if (getActivePool() === pool || !getActivePool()) setActivePool(null);
  track('voice_error', { stage: 'speech', category: 'workers_lost' });
  void pool?.dispose();
});

export function currentVoiceProgress() {
  return useProgressStore.getState();
}

/** §5.10: one whole sentence as PCM, for souvenir replay audio, with the brand pitch and rate applied. */
export async function synthesizeToPcm(text: string): Promise<{ pcm: Float32Array; sampleRate: number }> {
  if (!(await ensureVoicePool())) throw new Error('The voice is not available');
  const pool = getActivePool();
  const profile = getVoiceProfile();
  if (!pool || !profile) throw new Error('The voice is not available');
  const steps = profile.chosen.steps;
  const result = await pool.run(text, steps, MODEL_SPEED).catch(() => pool.run(text, steps, MODEL_SPEED));
  return { pcm: await applyPitchOffline(result.pcm, result.sampleRate), sampleRate: result.sampleRate };
}
