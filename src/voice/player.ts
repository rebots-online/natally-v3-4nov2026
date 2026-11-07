// §12.6: one AudioContext, sentences joined without a gap, 60 ms of written silence after each. Events run off AudioContext time.
import { getPlatform } from '../platform';
import { PLAYBACK_RATE } from './pool';

const PAUSE_SECONDS = 0.06;
const LEAD_SECONDS = 0.03;
const TICK_MS = 20;

interface Entry { key: number; start: number; end: number; source: AudioBufferSourceNode | null; started: boolean; }
export interface PlayerHooks { onStart(key: number): void; onEnd(key: number): void; }

let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let muted = false;
let userPaused = false;

function context(): AudioContext {
  if (ctx) return ctx;
  ctx = new AudioContext({ latencyHint: 'playback' });
  gain = ctx.createGain();
  gain.gain.value = muted ? 0 : 1;
  gain.connect(ctx.destination);
  if (getPlatform().kind === 'android') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void ctx?.suspend();
      else if (!userPaused) void ctx?.resume();
    });
  }
  return ctx;
}

export function setMuted(value: boolean): void {
  muted = value;
  if (gain) gain.gain.value = value ? 0 : 1;
}
export function pauseContext(): void {
  userPaused = true;
  void ctx?.suspend();
}
export function resumeContext(): void {
  userPaused = false;
  void ctx?.resume();
}

/** One utterance's timeline on the shared context. */
export class SpeechTimeline {
  private readonly entries: Entry[] = [];
  private nextStart = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly hooks: PlayerHooks) {
    userPaused = false;
    void context().resume();
  }

  /** Puts a sentence next in line. `pcm` null means no audio: its events still fire, in order, so the text is revealed. */
  schedule(key: number, pcm: Float32Array | null, sampleRate: number): { start: number; end: number } {
    const audio = context();
    const start = Math.max(this.nextStart, audio.currentTime + LEAD_SECONDS);
    let source: AudioBufferSourceNode | null = null;
    let end = start;
    if (pcm) {
      const silence = Math.ceil(PAUSE_SECONDS * sampleRate * PLAYBACK_RATE);
      const buffer = audio.createBuffer(1, pcm.length + silence, sampleRate);
      buffer.copyToChannel(pcm as Float32Array<ArrayBuffer>, 0);
      source = audio.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = PLAYBACK_RATE;
      source.connect(gain!);
      source.start(start);
      end = start + buffer.length / sampleRate / PLAYBACK_RATE;
    }
    this.nextStart = end;
    this.entries.push({ key, start, end, source, started: false });
    this.timer ??= setInterval(() => this.tick(), TICK_MS);
    return { start, end };
  }

  private tick(): void {
    const now = context().currentTime;
    while (this.entries.length > 0) {
      const entry = this.entries[0]!;
      if (!entry.started && now >= entry.start) {
        entry.started = true;
        this.hooks.onStart(entry.key);
      }
      if (entry.started && now >= entry.end) {
        this.entries.shift();
        this.hooks.onEnd(entry.key);
        continue;
      }
      return;
    }
  }

  stop(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    for (const entry of this.entries) {
      try {
        entry.source?.stop();
      } catch {
        // Already ended.
      }
      entry.source?.disconnect();
    }
    this.entries.length = 0;
  }
}

/** §5.10: applies the brand pitch offline, so the file sounds the way live playback does. */
export async function applyPitchOffline(pcm: Float32Array, sampleRate: number): Promise<Float32Array> {
  const offline = new OfflineAudioContext(1, Math.ceil(pcm.length / PLAYBACK_RATE), sampleRate);
  const buffer = offline.createBuffer(1, Math.max(1, pcm.length), sampleRate);
  buffer.copyToChannel(pcm as Float32Array<ArrayBuffer>, 0);
  const source = offline.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = PLAYBACK_RATE;
  source.connect(offline.destination);
  source.start();
  return (await offline.startRendering()).getChannelData(0);
}
