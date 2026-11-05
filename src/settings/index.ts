// The per-device settings store (§5.1, §6.5). One localStorage key, read once, shared by every caller in the tab.
import { useSyncExternalStore } from 'react';
import type { LocalSettings } from '../types';

const STORAGE_KEY = 'natally.settings';

const DEFAULTS: Readonly<LocalSettings> = Object.freeze({
  readAloud: true,
  roomSounds: true,
  roomVolume: 70,
  pauseMotion: false,
  analyticsConsent: true,
  chartMain: 'room',
});

const flag = (value: unknown, fallback: boolean): boolean => (typeof value === 'boolean' ? value : fallback);

/** Keeps only well-formed fields of a stored or incoming value; anything else takes the default (or the current value). */
function clean(raw: unknown, base: LocalSettings): LocalSettings {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const volume = source.roomVolume;
  return Object.freeze({
    readAloud: flag(source.readAloud, base.readAloud),
    roomSounds: flag(source.roomSounds, base.roomSounds),
    roomVolume: typeof volume === 'number' && Number.isFinite(volume) ? Math.min(100, Math.max(0, Math.round(volume))) : base.roomVolume,
    pauseMotion: flag(source.pauseMotion, base.pauseMotion),
    analyticsConsent: flag(source.analyticsConsent, base.analyticsConsent),
    chartMain: source.chartMain === 'room' || source.chartMain === 'chart' ? source.chartMain : base.chartMain,
  });
}

function readStored(): LocalSettings {
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    if (text) return clean(JSON.parse(text), DEFAULTS);
  } catch {
    // unreadable or blocked storage: the defaults stand
  }
  return clean(null, DEFAULTS);
}

let current: LocalSettings = readStored();
const listeners = new Set<() => void>();

function publish(next: LocalSettings): void {
  current = next;
  listeners.forEach((listener) => listener());
}

// Another tab changed the stored value: take it, so every open tab agrees.
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY || event.key === null) publish(readStored());
});

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSettings(): LocalSettings {
  return current;
}

export function useSettings(): LocalSettings {
  return useSyncExternalStore(subscribe, getSettings, getSettings);
}

export function updateSettings(patch: Partial<LocalSettings>): void {
  const next = clean({ ...current, ...patch }, current);
  if (Object.keys(next).every((key) => next[key as keyof LocalSettings] === current[key as keyof LocalSettings])) return;
  publish(next);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage full or blocked: the choice holds for this session only
  }
}
