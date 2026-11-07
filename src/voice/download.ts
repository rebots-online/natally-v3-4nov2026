// §12.1: measured bytes only. HEAD gives the true total; every chunk counts once it has been handed to the store. A stream
// that drops continues with `Range` from the bytes already written. The store's writer starts its `.part` afresh when opened
// (§4.11 offers no append), so a page reload restarts only the file that was unfinished.
import { config } from '../config';
import type { ModelStore } from '../types';
import { voiceLog } from './store';

export interface VoiceFile { repoPath: string; storePath: string; url: string; }
export class VoiceStorageError extends Error {}
export class VoiceAborted extends Error {}

const STREAM_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

export function voiceFiles(): VoiceFile[] {
  const { baseUrl, repo, revision, voiceId } = config.voice;
  const repoPaths = [
    'onnx/text_encoder.onnx', 'onnx/text_encoder.onnx_data',
    'onnx/latent_denoiser.onnx', 'onnx/latent_denoiser.onnx_data',
    'onnx/voice_decoder.onnx', 'onnx/voice_decoder.onnx_data',
    'tokenizer.json', 'tokenizer_config.json', 'config.json', `voices/${voiceId}.bin`,
  ];
  return repoPaths.map((repoPath) => ({
    repoPath,
    storePath: `${revision}/${repoPath}`,
    url: `${baseUrl}/${repo}/resolve/${revision}/${repoPath}`,
  }));
}

const isQuota = (err: unknown): boolean => err instanceof DOMException && err.name === 'QuotaExceededError';
const isAbort = (err: unknown, signal: AbortSignal): boolean => signal.aborted || (err instanceof DOMException && err.name === 'AbortError');

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new VoiceAborted());
    }, { once: true });
  });
}

async function headSize(file: VoiceFile, signal: AbortSignal): Promise<number> {
  const res = await fetch(file.url, { method: 'HEAD', signal, cache: 'no-store' });
  const size = Number(res.headers.get('content-length'));
  if (!res.ok || !Number.isFinite(size) || size <= 0) throw new Error(`HEAD ${file.repoPath} gave ${res.status}`);
  return size;
}

async function streamInto(file: VoiceFile, size: number, store: ModelStore, signal: AbortSignal, onBytes: (n: number) => void): Promise<number> {
  const writer = await store.writer(file.storePath);
  let written = 0;
  let failures = 0;
  try {
    while (written < size) {
      try {
        const headers: HeadersInit = written > 0 ? { Range: `bytes=${written}-` } : {};
        const res = await fetch(file.url, { headers, signal, cache: 'no-store' });
        if (!res.ok || !res.body) throw new Error(`GET ${file.repoPath} gave ${res.status}`);
        // A server that ignores Range sends the file from the start: skip what is already written, uncounted.
        let skip = written > 0 && res.status !== 206 ? written : 0;
        voiceLog('download_stream', { file: file.repoPath, from: written, status: res.status });
        const reader = res.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = skip > 0 ? value.subarray(Math.min(skip, value.byteLength)) : value;
          skip = Math.max(0, skip - value.byteLength);
          if (chunk.byteLength === 0) continue;
          await writer.write(chunk);
          written += chunk.byteLength;
          failures = 0;
          onBytes(chunk.byteLength);
        }
        if (written < size) throw new Error(`${file.repoPath} ended at ${written} of ${size}`);
      } catch (err) {
        if (isQuota(err)) throw new VoiceStorageError();
        if (isAbort(err, signal)) throw new VoiceAborted();
        failures += 1;
        voiceLog('download_retry', { file: file.repoPath, written, failures, reason: err instanceof Error ? err.message : String(err) });
        if (failures > STREAM_RETRIES) throw err;
        await sleep(RETRY_DELAY_MS * failures, signal);
      }
    }
    if (written !== size) throw new Error(`${file.repoPath} is ${written} bytes, expected ${size}`);
    await writer.close();
    return written;
  } catch (err) {
    await writer.abort().catch(() => undefined);
    if (isQuota(err)) throw new VoiceStorageError();
    throw err;
  }
}

export interface DownloadReport { fetchedBytes: number; ms: number; }

/** Brings every file into the store. `onProgress` carries bytes actually in the store, and the true total. */
export async function downloadModel(
  store: ModelStore,
  files: VoiceFile[],
  signal: AbortSignal,
  onProgress: (downloadedBytes: number, totalBytes: number) => void,
): Promise<DownloadReport> {
  await navigator.storage?.persist?.().catch(() => false);
  const started = performance.now();
  const plan = await Promise.all(
    files.map(async (file) =>
      (await store.has(file.storePath))
        ? { file, size: await store.size(file.storePath), present: true }
        : { file, size: await headSize(file, signal), present: false },
    ),
  );
  const totalBytes = plan.reduce((sum, item) => sum + item.size, 0);
  const remaining = plan.reduce((sum, item) => sum + (item.present ? 0 : item.size), 0);
  let downloaded = totalBytes - remaining;
  voiceLog('download_plan', { totalBytes, remaining, files: plan.length });
  onProgress(downloaded, totalBytes);

  if (remaining > 0 && store.workerSource().kind === 'opfs') {
    const estimate = await navigator.storage?.estimate?.();
    if (estimate?.quota !== undefined && estimate.quota - (estimate.usage ?? 0) < remaining) throw new VoiceStorageError();
  }

  let fetchedBytes = 0;
  for (const { file, size, present } of plan) {
    if (present) continue;
    await streamInto(file, size, store, signal, (n) => {
      downloaded += n;
      fetchedBytes += n;
      onProgress(downloaded, totalBytes);
    });
    voiceLog('download_file', { file: file.repoPath, bytes: size });
  }
  return { fetchedBytes, ms: performance.now() - started };
}
