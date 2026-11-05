// ModelStore over tauri-plugin-fs, under $APPDATA/voice/. Used where OPFS fails its probe (WebKitGTK on Linux). Same
// contract as the OPFS store: a writer fills `<path>.part`, close() publishes it, and workers receive bytes by message.
import { BaseDirectory, create, exists, mkdir, readFile, remove, rename, stat } from '@tauri-apps/plugin-fs';
import { PART_SUFFIX, splitStorePath } from './store-path';
import type { ModelStore } from '../types';

const ROOT = 'voice';
const where = { baseDir: BaseDirectory.AppData };
const relative = (segments: string[]): string => [ROOT, ...segments].join('/');

async function completeFile(path: string): Promise<{ size: number } | null> {
  const full = relative(splitStorePath(path));
  if (!(await exists(full, where))) return null;
  const info = await stat(full, where);
  return info.isFile ? { size: info.size } : null;
}

export function createTauriFsStore(): ModelStore {
  return {
    async has(path) {
      return (await completeFile(path)) !== null;
    },
    async size(path) {
      return (await completeFile(path))?.size ?? 0;
    },
    async writer(path) {
      const segments = splitStorePath(path);
      const final = relative(segments);
      const partPath = final + PART_SUFFIX;
      await mkdir(relative(segments.slice(0, -1)), { ...where, recursive: true });
      const handle = await create(partPath, where);
      return {
        async write(chunk) {
          let done = 0;
          while (done < chunk.byteLength) done += await handle.write(done === 0 ? chunk : chunk.subarray(done));
        },
        async close() {
          await handle.close();
          if (await exists(final, where)) await remove(final, where);
          await rename(partPath, final, { oldPathBaseDir: where.baseDir, newPathBaseDir: where.baseDir });
        },
        async abort() {
          await handle.close().catch(() => undefined);
          if (await exists(partPath, where)) await remove(partPath, where);
        },
      };
    },
    async read(path) {
      return new Uint8Array(await readFile(relative(splitStorePath(path)), where));
    },
    async clear() {
      if (await exists(ROOT, where)) await remove(ROOT, { ...where, recursive: true });
    },
    workerSource: () => ({ kind: 'bytes' }),
  };
}
