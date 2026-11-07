// §12.5: the worker pool. One job per worker at a time; the queue and calibration pick free slots.
import brand from '../../public/brand/brand.json';
import type { CalibrationCandidate, ModelSource, ModelStore, VoiceBackend } from '../types';
import type { VoiceFile } from './download';
import type { MainToWorker, WorkerInit, WorkerToMain } from './worker/tts.worker';

/** §12.5: the model has no pitch input. It speaks at rate / pitch and playback raises it, so the net tempo is `rate`. */
export const PLAYBACK_RATE = brand.voice.pitch;
export const MODEL_SPEED = brand.voice.rate / brand.voice.pitch;

export interface PoolConfig { workers: number; threads: number; backend: VoiceBackend; }
export interface SynthResult { pcm: Float32Array; sampleRate: number; synthMs: number; }
export class SynthFailure extends Error {
  constructor(message: string, readonly fatal: boolean) { super(message); }
}

interface Slot { worker: Worker; id: number; jobId: number | null; alive: boolean; }
interface Job { resolve(r: SynthResult): void; reject(e: SynthFailure): void; slot: Slot; }
export interface RunningJob { jobId: number; slotId: number; result: Promise<SynthResult>; }

const OOM = /memory|allocat|\boom\b|bad_alloc|out of range/i;
export const isOutOfMemory = (err: unknown): boolean => err instanceof Error && OOM.test(err.message);

let nextJobId = 1;
let active: VoicePool | null = null;
export const getActivePool = (): VoicePool | null => (active && active.size > 0 ? active : null);
export const setActivePool = (pool: VoicePool | null): void => { active = pool; };

export interface PoolLoad {
  store: ModelStore; files: VoiceFile[]; voiceId: string; config: PoolConfig;
  onSessions?: (loaded: number, total: number) => void;
}

export class VoicePool {
  readonly slots: Slot[] = [];
  private readonly jobs = new Map<number, Job>();
  private readonly idleListeners = new Set<() => void>();
  loadMs = 0;

  private constructor(readonly config: PoolConfig) {}

  get size(): number { return this.slots.filter((s) => s.alive).length; }
  get idleCount(): number { return this.slots.filter((s) => s.alive && s.jobId === null).length; }

  static async load({ store, files, voiceId, config, onSessions }: PoolLoad): Promise<VoicePool> {
    const pool = new VoicePool(config);
    const source: ModelSource = store.workerSource();
    const repoFiles = Object.fromEntries(files.map((f) => [f.repoPath, f.storePath]));
    const started = performance.now();
    try {
      await Promise.all(
        Array.from({ length: config.workers }, async (_, id) => {
          const init: WorkerInit = { type: 'init', source, repoFiles, backend: config.backend, threads: config.threads, voiceId };
          if (source.kind === 'bytes') {
            init.bytes = {};
            for (const f of files) init.bytes[f.storePath] = await store.read(f.storePath);
          }
          await pool.startSlot(id, init, id === 0 ? onSessions : undefined);
        }),
      );
    } catch (err) {
      await pool.dispose();
      throw err;
    }
    pool.loadMs = performance.now() - started;
    return pool;
  }

  private startSlot(id: number, init: WorkerInit, onSessions?: (loaded: number, total: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./worker/tts.worker.ts', import.meta.url), { type: 'module' });
      const slot: Slot = { worker, id, jobId: null, alive: true };
      let ready = false;
      this.slots.push(slot);
      worker.onmessage = (event: MessageEvent<WorkerToMain>) => {
        const message = event.data;
        if (message.type === 'progress') onSessions?.(message.sessionsLoaded, message.sessionsTotal);
        else if (message.type === 'ready') {
          ready = true;
          resolve();
        } else if (message.type === 'audio') this.settle(message.jobId, { pcm: message.pcm, sampleRate: message.sampleRate, synthMs: message.synthMs });
        else if (message.jobId !== null && !message.fatal) this.settle(message.jobId, new SynthFailure(message.message, false));
        else {
          this.lose(slot, message.message);
          if (!ready) reject(new SynthFailure(message.message, true));
        }
      };
      worker.onerror = (event) => {
        event.preventDefault();
        const message = event.message || 'The voice worker stopped';
        this.lose(slot, message);
        if (!ready) reject(new SynthFailure(message, true));
      };
      const transfer = Object.values(init.bytes ?? {}).map((b) => b.buffer as ArrayBuffer);
      worker.postMessage(init satisfies MainToWorker, transfer);
    });
  }

  private settle(jobId: number, outcome: SynthResult | SynthFailure): void {
    const job = this.jobs.get(jobId);
    if (!job) return;
    this.jobs.delete(jobId);
    job.slot.jobId = null;
    if (outcome instanceof SynthFailure) job.reject(outcome);
    else job.resolve(outcome);
    for (const cb of [...this.idleListeners]) cb();
  }

  /** A worker that crashed takes its job with it; the caller retries that sentence elsewhere. */
  private lose(slot: Slot, message: string): void {
    if (!slot.alive) return;
    slot.alive = false;
    slot.worker.terminate();
    if (slot.jobId !== null) this.settle(slot.jobId, new SynthFailure(message, true));
    for (const cb of [...this.idleListeners]) cb();
  }

  /** Starts a job on a free worker, or null if none is free. `avoid` is a worker that already failed this sentence. */
  tryRun(text: string, steps: number, speed: number, avoid?: number): RunningJob | null {
    const free = this.slots.filter((s) => s.alive && s.jobId === null);
    const others = free.filter((s) => s.id !== avoid);
    const slot = others[0] ?? (this.size === 1 ? free[0] : undefined);
    if (!slot) return null;
    const jobId = nextJobId++;
    slot.jobId = jobId;
    const result = new Promise<SynthResult>((resolve, reject) => this.jobs.set(jobId, { resolve, reject, slot }));
    slot.worker.postMessage({ type: 'synth', jobId, text, steps, speed } satisfies MainToWorker);
    return { jobId, slotId: slot.id, result };
  }

  /** Runs one job on a free worker, waiting for one if all are busy. */
  async run(text: string, steps: number, speed: number): Promise<SynthResult> {
    for (;;) {
      if (this.size === 0) throw new SynthFailure('No voice worker is left', true);
      const job = this.tryRun(text, steps, speed);
      if (job) return job.result;
      await new Promise<void>((resolve) => {
        const off = this.onIdle(() => {
          off();
          resolve();
        });
      });
    }
  }

  /** One job per live worker at once, for calibration: the wall time of this call is the pool's real speed. */
  runOnEach(text: string, steps: number, speed: number): Promise<SynthResult[]> {
    const jobs = this.slots.filter((s) => s.alive).map(() => this.tryRun(text, steps, speed));
    return Promise.all(jobs.map((job) => {
      if (!job) throw new SynthFailure('A voice worker was busy during calibration', false);
      return job.result;
    }));
  }

  cancel(jobId: number): void {
    const job = this.jobs.get(jobId);
    if (job) job.slot.worker.postMessage({ type: 'cancel', jobId } satisfies MainToWorker);
  }

  onIdle(cb: () => void): () => void {
    this.idleListeners.add(cb);
    return () => this.idleListeners.delete(cb);
  }

  matches(c: CalibrationCandidate): boolean {
    return this.config.workers === c.workers && this.config.threads === c.threadsPerWorker && this.config.backend === c.backend && this.size === c.workers;
  }

  async dispose(): Promise<void> {
    for (const slot of this.slots) {
      if (slot.alive) slot.worker.postMessage({ type: 'dispose' } satisfies MainToWorker);
      slot.alive = false;
    }
    for (const [jobId, job] of this.jobs) {
      this.jobs.delete(jobId);
      job.reject(new SynthFailure('cancelled', false));
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
    for (const slot of this.slots) slot.worker.terminate();
  }
}
