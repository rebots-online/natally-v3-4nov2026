// Voice state that works outside React: setup progress, speech state and events, the stored profile, and the log.
import { create } from 'zustand';
import { config } from '../config';
import type { SpeechEvent, SpeechState, VoiceProfile, VoiceProgress } from '../types';

const PROFILE_KEY = 'natally.voice.profile';
const SKIPPED_KEY = 'natally.voice.skipped';

const ABSENT: VoiceProgress = {
  phase: 'absent', downloadedBytes: 0, totalBytes: 0, sessionsLoaded: 0, sessionsTotal: 3, candidatesDone: 0, candidatesTotal: 0, error: null,
};

export const useProgressStore = create<VoiceProgress>(() => ABSENT);
export const setProgress = (patch: Partial<VoiceProgress>): void => useProgressStore.setState(patch);
export const resetProgress = (): void => useProgressStore.setState(ABSENT, true);

export const useSpeechStore = create<{ state: SpeechState }>(() => ({ state: 'idle' }));
export const setSpeechState = (state: SpeechState): void => useSpeechStore.setState({ state });

const listeners = new Set<(e: SpeechEvent) => void>();
export function onSpeechEvent(cb: (e: SpeechEvent) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
export function emitSpeech(event: SpeechEvent): void {
  for (const cb of listeners) cb(event);
}

/** Indices and counts only: never the customer's words. */
export function voiceLog(event: string, fields: Record<string, unknown> = {}): void {
  console.debug(`[voice] ${event} ${JSON.stringify(fields)}`);
}

let weightsStale = false;
export function takeWeightsStale(): boolean {
  const stale = weightsStale;
  weightsStale = false;
  return stale;
}

export function getVoiceProfile(): VoiceProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  let profile: VoiceProfile | null = null;
  try {
    profile = JSON.parse(raw) as VoiceProfile;
  } catch {
    // An unreadable profile is treated as a changed one.
  }
  const { repo, revision, voiceId } = config.voice;
  if (profile?.schema === 'natally.voiceprofile/v1' && profile.modelRepo === repo && profile.modelRevision === revision && profile.voiceId === voiceId) {
    return profile;
  }
  if (profile && (profile.modelRepo !== repo || profile.modelRevision !== revision)) weightsStale = true;
  localStorage.removeItem(PROFILE_KEY);
  return null;
}

export function saveVoiceProfile(profile: VoiceProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  localStorage.removeItem(SKIPPED_KEY);
}

export const clearVoiceProfile = (): void => localStorage.removeItem(PROFILE_KEY);
export const markVoiceSkipped = (): void => localStorage.setItem(SKIPPED_KEY, '1');
