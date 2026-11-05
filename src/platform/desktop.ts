// §1.3 Linux and Windows columns: Tauri webview. Sign-in goes through the system browser and a loopback listener (§1.4).
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { openUrl } from '@tauri-apps/plugin-opener';
import { config } from '../config';
import { checkedExternalUrl, copyTextBrowser } from './browser';
import { createOpfsStore, opfsUsable } from './opfs-store';
import { newerShellUrl } from './release';
import { strings } from './strings';
import { createTauriFsStore } from './tauri-fs-store';
import type { GoogleCredential, ModelStore, PlatformAdapter, SaveFileRequest, SaveOutcome } from '../types';

type DesktopKind = 'linux' | 'windows';

interface LoopbackStart { port: number; state: string }
interface LoopbackResult { id_token: string; access_token: string | null }

export function createDesktopPlatform(): PlatformAdapter {
  // `getPlatform()` is synchronous but the Rust command `app_platform` is not. The webview's user agent gives the answer
  // for the first synchronous read, and the shell's own answer replaces it as soon as it arrives.
  let kind: DesktopKind = /windows/i.test(navigator.userAgent) ? 'windows' : 'linux';
  const confirmed = invoke<string>('app_platform').then(
    (answer) => {
      if (answer === 'linux' || answer === 'windows') kind = answer;
    },
    () => undefined, // A shell without the command keeps the user-agent answer; nothing else depends on it.
  );
  let store: ModelStore | null | undefined;

  async function googleSignIn(): Promise<GoogleCredential> {
    if (!config.webCanonicalOrigin) throw new Error(strings['platform.bridgeNeedsOrigin']);
    const { port, state } = await invoke<LoopbackStart>('start_loopback');
    const bridge = new URL('/auth/desktop', config.webCanonicalOrigin);
    bridge.searchParams.set('port', String(port));
    bridge.searchParams.set('state', state);
    await openUrl(bridge.href);
    const result = await invoke<LoopbackResult>('await_loopback', { state });
    return { idToken: result.id_token, accessToken: result.access_token };
  }

  async function saveFile(req: SaveFileRequest): Promise<SaveOutcome> {
    const dot = req.fileName.lastIndexOf('.');
    const extension = dot > 0 ? req.fileName.slice(dot + 1) : '';
    const target = await save({
      defaultPath: req.fileName,
      filters: extension ? [{ name: extension.toUpperCase(), extensions: [extension] }] : undefined,
    });
    if (target === null) return 'cancelled';
    await writeFile(target, req.bytes);
    return 'saved';
  }

  return {
    get kind() {
      return kind;
    },
    analyticsTransport: 'collect',
    railKey: 'revenuecat_web',
    poolCap: 4,
    showInstallOptions: false,
    googleSignIn,
    async openExternal(url) {
      await openUrl(checkedExternalUrl(url));
    },
    saveFile,
    copyText: copyTextBrowser,
    async modelStore() {
      if (store === undefined) store = (await opfsUsable()) ? createOpfsStore() : createTauriFsStore();
      return store;
    },
    async checkForShellUpdate(currentVersion) {
      await confirmed;
      return newerShellUrl(currentVersion, kind);
    },
  };
}
