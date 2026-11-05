// ModelStore over the origin-private file system. Files live under `natally-voice/<path>`; the voice workers open the same
// files themselves through ModelSource { kind: 'opfs', root }. A writer fills `<path>.part` and close() publishes it as
// `<path>`, so a path that `has` answers true is always complete (§6.5).
import { PART_SUFFIX, splitStorePath } from './store-path';
import type { ModelSource, ModelStore } from '../types';

export const OPFS_ROOT = 'natally-voice';

const isNotFound = (err: unknown): boolean => err instanceof DOMException && err.name === 'NotFoundError';

let probe: Promise<boolean> | null = null;

/** True only when this webview can create, write and remove a file in OPFS from the main thread. */
export function opfsUsable(): Promise<boolean> {
  probe ??= (async () => {
    if (!window.isSecureContext || typeof navigator.storage?.getDirectory !== 'function') return false;
    if (typeof FileSystemFileHandle === 'undefined' || typeof FileSystemFileHandle.prototype.createWritable !== 'function') return false;
    try {
      const root = await navigator.storage.getDirectory();
      const dir = await root.getDirectoryHandle('natally-probe', { create: true });
      const handle = await dir.getFileHandle('probe', { create: true });
      const writable = await handle.createWritable();
      await writable.write(new Uint8Array([1]));
      await writable.close();
      await root.removeEntry('natally-probe', { recursive: true });
      return true;
    } catch {
      return false;
    }
  })();
  return probe;
}

async function parentOf(segments: string[], create: boolean): Promise<FileSystemDirectoryHandle | null> {
  try {
    let dir = await (await navigator.storage.getDirectory()).getDirectoryHandle(OPFS_ROOT, { create });
    for (const segment of segments.slice(0, -1)) dir = await dir.getDirectoryHandle(segment, { create });
    return dir;
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

async function fileOf(path: string): Promise<File | null> {
  const segments = splitStorePath(path);
  const dir = await parentOf(segments, false);
  if (!dir) return null;
  try {
    return await (await dir.getFileHandle(segments[segments.length - 1]!)).getFile();
  } catch (err) {
    if (isNotFound(err) || (err instanceof DOMException && err.name === 'TypeMismatchError')) return null;
    throw err;
  }
}

async function removeIfPresent(dir: FileSystemDirectoryHandle, name: string): Promise<void> {
  try {
    await dir.removeEntry(name);
  } catch (err) {
    if (!isNotFound(err)) throw err;
  }
}

/** `move` is in the File System spec's current draft and in shipping browsers, but not in every lib.dom. */
type Movable = FileSystemFileHandle & { move?(destination: FileSystemDirectoryHandle, name: string): Promise<void> };

async function publish(dir: FileSystemDirectoryHandle, part: FileSystemFileHandle, name: string): Promise<void> {
  await removeIfPresent(dir, name);
  const movable = part as Movable;
  if (typeof movable.move === 'function') {
    await movable.move(dir, name);
    return;
  }
  const target = await (await dir.getFileHandle(name, { create: true })).createWritable();
  await (await part.getFile()).stream().pipeTo(target);
  await removeIfPresent(dir, part.name);
}

export function createOpfsStore(): ModelStore {
  const source: ModelSource = { kind: 'opfs', root: OPFS_ROOT };
  return {
    async has(path) {
      return (await fileOf(path)) !== null;
    },
    async size(path) {
      return (await fileOf(path))?.size ?? 0;
    },
    async writer(path) {
      const segments = splitStorePath(path);
      const name = segments[segments.length - 1]!;
      const dir = (await parentOf(segments, true))!;
      const part = await dir.getFileHandle(name + PART_SUFFIX, { create: true });
      const writable = await part.createWritable({ keepExistingData: false });
      return {
        write: (chunk) => writable.write(chunk as Uint8Array<ArrayBuffer>),
        async close() {
          await writable.close();
          await publish(dir, part, name);
        },
        async abort() {
          await writable.abort().catch(() => undefined);
          await removeIfPresent(dir, name + PART_SUFFIX);
        },
      };
    },
    async read(path) {
      const file = await fileOf(path);
      if (!file) throw new Error(`${path} is not in the model store`);
      return new Uint8Array(await file.arrayBuffer());
    },
    async clear() {
      try {
        await (await navigator.storage.getDirectory()).removeEntry(OPFS_ROOT, { recursive: true });
      } catch (err) {
        if (!isNotFound(err)) throw err;
      }
    },
    workerSource: () => source,
  };
}
