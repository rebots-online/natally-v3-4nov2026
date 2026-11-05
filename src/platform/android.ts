// §1.3 Android column: Tauri webview plus the `natally-android` plugin (§5.21). Billing, files and Google sign-in are native.
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { config } from '../config';
import { checkedExternalUrl, copyTextBrowser } from './browser';
import { createOpfsStore, opfsUsable } from './opfs-store';
import type { GoogleCredential, ModelStore, PlatformAdapter, SaveFileRequest, SaveOutcome } from '../types';

const CHUNK = 0x8000;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(binary);
}

export function createAndroidPlatform(): PlatformAdapter {
  let store: ModelStore | null | undefined;
  return {
    kind: 'android',
    analyticsTransport: 'collect',
    railKey: 'revenuecat_play',
    poolCap: 2,
    showInstallOptions: false,
    async googleSignIn(): Promise<GoogleCredential> {
      const { idToken } = await invoke<{ idToken: string }>('plugin:natally-android|googleSignIn', {
        webClientId: config.googleWebClientId,
      });
      return { idToken, accessToken: null };
    },
    async openExternal(url) {
      await openUrl(checkedExternalUrl(url));
    },
    async saveFile(req: SaveFileRequest): Promise<SaveOutcome> {
      await invoke<{ uri: string }>('plugin:natally-android|saveToDownloads', {
        fileName: req.fileName,
        mimeType: req.mimeType,
        base64: toBase64(req.bytes),
      });
      return 'saved';
    },
    copyText: copyTextBrowser,
    async modelStore() {
      // No file-system fallback on Android: a webview without OPFS reports voice as unsupported (§19).
      if (store === undefined) store = (await opfsUsable()) ? createOpfsStore() : null;
      return store;
    },
    checkForShellUpdate: async () => null, // Google Play delivers updates.
  };
}
