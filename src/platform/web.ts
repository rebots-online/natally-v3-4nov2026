// §1.3 Web column: the page itself. Google sign-in is the Firebase popup, files download or share, links open in a tab.
import { config } from '../config';
import { checkedExternalUrl, copyTextBrowser, saveFileBrowser } from './browser';
import { createOpfsStore, opfsUsable } from './opfs-store';
import type { ModelStore, PlatformAdapter } from '../types';

export function createWebPlatform(): PlatformAdapter {
  let store: ModelStore | null | undefined;
  return {
    kind: 'web',
    analyticsTransport: 'gtag',
    railKey: 'revenuecat_web',
    poolCap: 4,
    showInstallOptions: config.buildTarget === 'web',
    googleSignIn: async () => 'popup',
    async openExternal(url) {
      window.open(checkedExternalUrl(url), '_blank', 'noopener,noreferrer');
    },
    saveFile: saveFileBrowser,
    copyText: copyTextBrowser,
    async modelStore() {
      if (store === undefined) store = (await opfsUsable()) ? createOpfsStore() : null;
      return store;
    },
    checkForShellUpdate: async () => null, // The service worker updates the web build itself (§16.5).
  };
}
