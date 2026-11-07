// §12.5: one pool slot. Holds its own sessions; takes jobs one at a time, in the order they arrive.
import type { ModelSource, VoiceBackend } from '../../types';
import { SESSIONS_TOTAL, Supertonic, SynthCancelled } from './supertonic';

export type WorkerInit = {
  type: 'init'; source: ModelSource; repoFiles: Record<string, string>; backend: VoiceBackend; threads: number; voiceId: string;
  bytes?: Record<string, Uint8Array>;
};
export type MainToWorker =
  | WorkerInit
  | { type: 'synth'; jobId: number; text: string; steps: number; speed: number }
  | { type: 'cancel'; jobId: number }
  | { type: 'dispose' };
export type WorkerToMain =
  | { type: 'ready'; loadMs: number }
  | { type: 'progress'; sessionsLoaded: number; sessionsTotal: number }
  | { type: 'audio'; jobId: number; pcm: Float32Array; sampleRate: 44100; synthMs: number }
  | { type: 'error'; jobId: number | null; message: string; fatal: boolean };

const post = (message: WorkerToMain, transfer: Transferable[] = []): void => self.postMessage(message, { transfer });
const messageOf = (err: unknown): string => (err instanceof Error ? err.message : String(err));

let model: Supertonic | null = null;
const cancelled = new Set<number>();
let work: Promise<void> = Promise.resolve();

function reader(init: WorkerInit): (repoPath: string) => Promise<Uint8Array> {
  const stored = (repoPath: string): string => {
    const path = init.repoFiles[repoPath];
    if (!path) throw new Error(`${repoPath} is not in the file list`);
    return path;
  };
  if (init.source.kind === 'bytes') {
    const bytes = init.bytes ?? {};
    return async (repoPath) => {
      const path = stored(repoPath);
      const data = bytes[path];
      if (!data) throw new Error(`${path} was not sent`);
      delete bytes[path];
      return data;
    };
  }
  const root = init.source.root;
  return async (repoPath) => {
    let dir = await (await navigator.storage.getDirectory()).getDirectoryHandle(root);
    const segments = stored(repoPath).split('/');
    for (const segment of segments.slice(0, -1)) dir = await dir.getDirectoryHandle(segment);
    const file = await (await dir.getFileHandle(segments[segments.length - 1]!)).getFile();
    return new Uint8Array(await file.arrayBuffer());
  };
}

async function load(init: WorkerInit): Promise<void> {
  const started = performance.now();
  const ort = init.backend === 'webgpu' ? await import('onnxruntime-web/webgpu') : await import('onnxruntime-web/wasm');
  ort.env.wasm.numThreads = init.threads;
  ort.env.wasm.wasmPaths = '/ort/';
  post({ type: 'progress', sessionsLoaded: 0, sessionsTotal: SESSIONS_TOTAL });
  model = await Supertonic.create(ort as typeof import('onnxruntime-web'), reader(init), init.voiceId, init.backend, (sessionsLoaded) =>
    post({ type: 'progress', sessionsLoaded, sessionsTotal: SESSIONS_TOTAL }),
  );
  post({ type: 'ready', loadMs: performance.now() - started });
}

async function synth(jobId: number, text: string, steps: number, speed: number): Promise<void> {
  const isCancelled = (): boolean => cancelled.has(jobId);
  try {
    if (!model) throw new Error('The voice is not loaded');
    if (isCancelled()) throw new SynthCancelled();
    const started = performance.now();
    const pcm = await model.synth(text, steps, speed, isCancelled);
    post({ type: 'audio', jobId, pcm, sampleRate: 44100, synthMs: performance.now() - started }, [pcm.buffer]);
  } catch (err) {
    post({ type: 'error', jobId, message: err instanceof SynthCancelled ? 'cancelled' : messageOf(err), fatal: false });
  } finally {
    cancelled.delete(jobId);
  }
}

self.onmessage = (event: MessageEvent<MainToWorker>) => {
  const message = event.data;
  switch (message.type) {
    case 'init':
      work = work.then(() => load(message)).catch((err: unknown) => post({ type: 'error', jobId: null, message: messageOf(err), fatal: true }));
      break;
    case 'synth':
      work = work.then(() => synth(message.jobId, message.text, message.steps, message.speed));
      break;
    case 'cancel':
      cancelled.add(message.jobId);
      break;
    case 'dispose':
      work = work.then(async () => {
        await model?.release();
        model = null;
        self.close();
      });
      break;
  }
};
