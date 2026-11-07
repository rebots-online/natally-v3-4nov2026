// §5.10: what the voice module offers the rest of the app.
import type { SpeechState, VoiceProgress } from '../types';
import { pauseContext, resumeContext, setMuted } from './player';
import { useProgressStore, useSpeechStore, setSpeechState } from './store';
import { openSpeech, stopSpeech } from './queue';

export { isVoiceSupported, beginVoiceSetup, ensureVoicePool, synthesizeToPcm } from './setup';
export { getVoiceProfile, onSpeechEvent } from './store';
export { SentenceSegmenter } from './segmenter';
export { openSpeech, stopSpeech };
export { ScreenVoiceSetup } from './ScreenVoiceSetup';
export type { SpeechSession } from '../types';

export const useVoiceProgress = (): VoiceProgress => useProgressStore();
export const useSpeechState = (): SpeechState => useSpeechStore((s) => s.state);

export function pauseSpeech(): void {
  if (useSpeechStore.getState().state !== 'speaking') return;
  pauseContext();
  setSpeechState('paused');
}

export function resumeSpeech(): void {
  if (useSpeechStore.getState().state !== 'paused') return;
  resumeContext();
  setSpeechState('speaking');
}

export function setSpeechMuted(muted: boolean): void {
  setMuted(muted);
}
