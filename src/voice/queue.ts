// §12.6, §12.8: the open session. Dispatches lowest index first, keeps results by index, plays strictly in order.
import type { SpeechSession, SpokenSentence } from '../types';
import { MODEL_SPEED, getActivePool, type RunningJob, type VoicePool, SynthFailure } from './pool';
import { SpeechTimeline } from './player';
import { emitSpeech, getVoiceProfile, setSpeechState, voiceLog } from './store';

interface Item {
  sentence: SpokenSentence;
  status: 'pending' | 'running' | 'ready';
  pcm: Float32Array | null;
  sampleRate: number;
  attempts: number;
  lastSlot: number | undefined;
  job: RunningJob | null;
}

const announceSpeaking = (speaking: boolean): void => {
  window.dispatchEvent(new CustomEvent('natally:speaking', { detail: speaking }));
};

export class Session implements SpeechSession {
  private readonly items: Item[] = [];
  private readonly timeline: SpeechTimeline;
  private readonly pool: VoicePool | null;
  private readonly steps: number;
  private readonly ahead: number;
  private readonly offIdle: () => void;
  private playing = 0;
  private scheduled = 0;
  private ended = 0;
  private started = false;
  private inputEnded = false;
  private closed = false;
  private announced = false;

  constructor(readonly utteranceId: string) {
    const profile = getVoiceProfile();
    this.pool = getActivePool();
    this.steps = profile?.chosen.steps ?? 5;
    this.ahead = profile?.sentencesAhead ?? 1;
    this.timeline = new SpeechTimeline({ onStart: (i) => this.onStart(i), onEnd: (i) => this.onEnd(i) });
    this.offIdle = this.pool ? this.pool.onIdle(() => this.dispatch()) : () => undefined;
    setSpeechState('preparing');
    if (!this.pool || !profile) queueMicrotask(() => this.fail());
  }

  pushSentence(sentence: SpokenSentence): void {
    if (this.closed) return;
    this.items.push({ sentence, status: 'pending', pcm: null, sampleRate: 44100, attempts: 0, lastSlot: undefined, job: null });
    voiceLog('sentence_queued', { index: this.items.length - 1, chars: sentence.text.length });
    this.dispatch();
  }

  endInput(): void {
    if (this.closed) return;
    this.inputEnded = true;
    this.advance();
  }

  cancel(): void {
    if (this.closed) return;
    this.close();
    setSpeechState('idle');
    this.release();
  }

  private close(): void {
    this.closed = true;
    this.offIdle();
    this.timeline.stop();
    for (const item of this.items) if (item.job) this.pool?.cancel(item.job.jobId);
  }

  private release(): void {
    if (this.announced) announceSpeaking(false);
    this.announced = false;
  }

  /** Fatal, or every worker lost: audio ends here, the text carries on (§12.8). */
  private fail(): void {
    if (this.closed) return;
    this.close();
    setSpeechState('idle');
    this.release();
    setActivePoolLost(this.pool);
    emitSpeech({ type: 'failed', utteranceId: this.utteranceId, sentenceIndex: this.playing, cue: null });
  }

  private dispatch(): void {
    if (this.closed || !this.pool) return;
    const limit = this.playing + this.ahead + this.pool.size - 1;
    for (let i = 0; i < this.items.length && i <= limit; i += 1) {
      const item = this.items[i]!;
      if (item.status !== 'pending') continue;
      const job = this.pool.tryRun(item.sentence.text, this.steps, MODEL_SPEED, item.lastSlot);
      if (!job) return;
      item.status = 'running';
      item.job = job;
      item.lastSlot = job.slotId;
      voiceLog('synth_start', { index: i, worker: job.slotId, playing: this.started ? this.playing : null, limit });
      job.result.then(
        (result) => this.onAudio(i, item, result.pcm, result.sampleRate, result.synthMs),
        (err: unknown) => this.onError(i, item, err),
      );
    }
  }

  private onAudio(index: number, item: Item, pcm: Float32Array, sampleRate: number, synthMs: number): void {
    item.job = null;
    if (this.closed) return;
    item.status = 'ready';
    item.pcm = pcm.length > 0 ? pcm : null;
    item.sampleRate = sampleRate;
    voiceLog('synth_done', { index, synthMs: Math.round(synthMs), audioMs: Math.round((pcm.length / sampleRate) * 1000) });
    this.advance();
  }

  private onError(index: number, item: Item, err: unknown): void {
    item.job = null;
    if (this.closed) return;
    item.attempts += 1;
    voiceLog('synth_error', { index, attempts: item.attempts, fatal: err instanceof SynthFailure && err.fatal });
    if (!this.pool || this.pool.size === 0) {
      this.fail();
      return;
    }
    if (item.attempts < 2) item.status = 'pending';
    else {
      item.status = 'ready';
      item.pcm = null;
    }
    this.advance();
    this.dispatch();
  }

  /** Starts playback once index 0 and `ahead` more are ready (or input ended), then schedules everything ready, in order. */
  private advance(): void {
    if (this.closed) return;
    if (!this.started) {
      let ready = 0;
      while (ready < this.items.length && this.items[ready]!.status === 'ready') ready += 1;
      const enough = ready >= this.ahead + 1;
      const inputDone = this.inputEnded && ready >= 1;
      if (!enough && !inputDone) {
        this.checkDrained();
        return;
      }
      this.started = true;
      voiceLog('playback_begin', { readyAtStart: ready, ahead: this.ahead, inputEnded: this.inputEnded });
    }
    while (this.scheduled < this.items.length && this.items[this.scheduled]!.status === 'ready') {
      const index = this.scheduled;
      const item = this.items[index]!;
      const slot = this.timeline.schedule(index, item.pcm, item.sampleRate);
      voiceLog('scheduled', { index, start: Number(slot.start.toFixed(3)), end: Number(slot.end.toFixed(3)) });
      item.pcm = null;
      this.scheduled += 1;
    }
    this.checkDrained();
  }

  private readyAhead(index: number): number {
    let count = 0;
    for (let i = index + 1; i < this.items.length && this.items[i]!.status === 'ready'; i += 1) count += 1;
    return count;
  }

  private onStart(index: number): void {
    const { sentence } = this.items[index]!;
    this.playing = index;
    if (!this.announced) {
      this.announced = true;
      announceSpeaking(true);
    }
    setSpeechState('speaking');
    voiceLog('sentence_start', {
      index, readyAhead: this.readyAhead(index), running: this.items.filter((it) => it.status === 'running').length, ahead: this.ahead,
    });
    emitSpeech({ type: 'sentence_start', utteranceId: this.utteranceId, sentenceIndex: sentence.index, cue: sentence.cue });
    this.dispatch();
  }

  private onEnd(index: number): void {
    const { sentence } = this.items[index]!;
    this.ended = index + 1;
    voiceLog('sentence_end', { index });
    emitSpeech({ type: 'sentence_end', utteranceId: this.utteranceId, sentenceIndex: sentence.index, cue: sentence.cue });
    this.checkDrained();
  }

  private checkDrained(): void {
    if (this.closed || !this.inputEnded || this.ended < this.items.length) return;
    this.close();
    setSpeechState('idle');
    this.release();
    voiceLog('queue_drained', { sentences: this.items.length });
    emitSpeech({ type: 'queue_drained', utteranceId: this.utteranceId, sentenceIndex: Math.max(0, this.items.length - 1), cue: null });
  }
}

let onPoolLost: (pool: VoicePool | null) => void = () => undefined;
export const setPoolLostHandler = (cb: (pool: VoicePool | null) => void): void => { onPoolLost = cb; };
const setActivePoolLost = (pool: VoicePool | null): void => onPoolLost(pool);

let current: Session | null = null;

export function openSpeech(utteranceId: string): SpeechSession {
  current?.cancel();
  current = new Session(utteranceId);
  return current;
}

export function stopSpeech(): void {
  current?.cancel();
  current = null;
}
