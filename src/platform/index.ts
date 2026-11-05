// §5.3: the one place that decides which PlatformAdapter this process runs on. Chosen once, on first use.
import { config } from '../config';
import { createAndroidPlatform } from './android';
import { createDesktopPlatform } from './desktop';
import { createWebPlatform } from './web';
import type { PlatformAdapter } from '../types';

let chosen: PlatformAdapter | null = null;

const insideTauri = (): boolean => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export function getPlatform(): PlatformAdapter {
  if (chosen) return chosen;
  if (!insideTauri()) chosen = createWebPlatform();
  else if (config.buildTarget === 'android') chosen = createAndroidPlatform();
  else chosen = createDesktopPlatform();
  return chosen;
}
