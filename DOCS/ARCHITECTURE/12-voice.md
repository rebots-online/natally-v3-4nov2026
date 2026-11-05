# 12 — Voice pipeline

Files in `src/voice/`: `setup.ts`, `download.ts`, `calibrate.ts`, `segmenter.ts`, `pool.ts`, `queue.ts`, `player.ts`, `worker/tts.worker.ts`, `worker/supertonic.ts`, `store.ts`, `ScreenVoiceSetup.tsx`, `strings.ts`.

## 12.1 Files and cache

Files, under `<VITE_VOICE_BASE_URL>/<VITE_VOICE_REPO>/resolve/<VITE_VOICE_REVISION>/`:

`onnx/text_encoder.onnx`, `.onnx_data` (28 MB); `onnx/latent_denoiser.onnx`, `.onnx_data` (132 MB); `onnx/voice_decoder.onnx`, `.onnx_data` (101 MB); `tokenizer.json`, `tokenizer_config.json`, `config.json`, `voices/<VITE_VOICE_ID>.bin`.

`download.ts`: for each file, `HEAD` for size (total shown is the true sum). `GET` with `Range` from the bytes already in `<path>.part`, streaming each chunk to `ModelStore.writer`, updating `VoiceProgress.downloadedBytes` from actual bytes written; on close, rename to `<path>`. `navigator.storage.persist()` is requested first. An `estimate()` short of remaining bytes, or `QuotaExceededError`, fails with `voice.storage`. ORT WASM is served from `/ort/`.

## 12.2 Setup order

`absent` → `downloading` → `loading` (create one session set in one worker, bar shows sessions of 3) → `calibrating` → `ready` | `failed`. `unsupported` when `platform.modelStore()` is null, or no WASM SIMD. Progress displays measured values only.

## 12.3 Calibration

Fixed sentence: `The Moon in your chart keeps her own quiet time, and tonight she is listening.` (constant `CALIBRATION_SENTENCE`).

Memory cap: `maxWorkers = clamp(min(hardwareConcurrency - 1, floor(((deviceMemoryGb ?? 4) - 1) * 1024 / 450), platform.poolCap), 1, 4)` (450 MB per loaded copy). `poolCap`: 4 web, Linux, Windows; 2 Android.

Candidates, in order, stopping early if `realTimeFactor` at the previous step already exceeds 2.5 with 5 steps:

| # | Candidate | Runs when |
|---|---|---|
| 1 | 1 worker, 1 thread, wasm, 5 steps | Always |
| 2 | 1 worker, 1 thread, webgpu, 5 steps | `navigator.gpu` and an adapter probe: a one-sentence synth succeeds with non-silent output |
| 3 | 1 worker, `min(4, hardwareConcurrency)` threads, wasm, 5 steps | `crossOriginIsolated === true` |
| 4 | `maxWorkers` workers, 1 thread, wasm, 5 steps | `maxWorkers > 1` |
| 5 | Best above with 3 steps | Best `realTimeFactor < 1.2` |
| 6 | Best above with 8 steps | Best `realTimeFactor > 3` |

Each candidate: load, synthesize the sentence once to warm, then twice measured. `realTimeFactor = audioMs / synthMs`, per worker times worker count measured as parallel wall time. Pick by: highest steps with `realTimeFactor >= 1.3`; among equals, least workers; if none reach it, the highest `realTimeFactor`. `sentencesAhead = clamp(ceil(2.5 / realTimeFactor) + 1, 1, 4)`, and at least `chosen.workers`. `VoiceProfile` (§4.8) goes to `localStorage`. A stored profile whose repo, revision or voice differ from config is discarded, and calibration runs again. Track `voice_calibrated`.

## 12.4 Sentence segmentation (`SentenceSegmenter`)

Input is streamed text with cue markers already removed. `push` returns only whole sentences; `flush` returns the rest at the end of input. A sentence is never split, with one exception below.

| Rule | Behaviour |
|---|---|
| Terminators | `.` `!` `?` `…` and `...`, followed by optional closing quotes or brackets (`" ” ' ’ ) ]`), then whitespace or end of input |
| Waiting | Text is held until the character after the terminator has arrived; if the terminator is last in the buffer, wait |
| Abbreviations | No end after: `Mr. Mrs. Ms. Dr. Prof. St. Mt. vs. etc. e.g. i.e. a.m. p.m. No. approx. Jan. Feb. Mar. Apr. Jun. Jul. Aug. Sep. Sept. Oct. Nov. Dec.` unless the next word starts a new capitalised sentence after `etc.`, `a.m.` or `p.m.` |
| Initials | Single capital + `.` is no end (`J. K.`) |
| Numbers | A `.` between digits is no end (`16.5`, `3.14`). Degree text `16°` is untouched |
| Ellipsis | `…` or `...` ends only if the next character after whitespace is upper case or an opening quote; otherwise it stays inside |
| Quotes | A terminator inside an open double quote ends only with its closing quote |
| Newlines | A blank line ends a sentence, even without a terminator |
| Markdown | `*`, `_`, `#`, and list bullets are stripped before speech; the display text keeps none either |
| Minimum | A fragment of fewer than 2 words joins the following sentence |
| Very long | Above 400 characters without a terminator: split only at the last `;`, `:` or `, ` before 400. This is the only allowed non-sentence cut; it exists because the model truncates very long input. Above 400 with no punctuation at all, split at the last space |

## 12.5 Worker protocol (`tts.worker.ts`)

Worker per pool slot, each with own sessions, `ort.env.wasm.numThreads = threadsPerWorker`, `wasmPaths = '/ort/'`. Sources per `ModelSource`: `opfs` opens files itself; `bytes` gets them by message.

| Main → worker | Fields |
|---|---|
| `init` | `{ source, repoFiles, backend, threads, voiceId, bytes? }` |
| `synth` | `{ jobId, text, steps, speed }` |
| `cancel` | `{ jobId }` drops it if not yet started |
| `dispose` | none |

| Worker → main | Fields |
|---|---|
| `ready` | `{ loadMs }` |
| `progress` | `{ sessionsLoaded, sessionsTotal }` |
| `audio` | `{ jobId, pcm: Float32Array (transferred), sampleRate: 44100, synthMs }` |
| `error` | `{ jobId | null, message, fatal }` |

`worker/supertonic.ts` follows the repo's model card: tokenise → `text_encoder(input_ids, attention_mask, style)` → `durations = raw / speed * 44100` → latent length `ceil(durations / (512*6))` → random normal latents, shape `[1, 24*6, len]`, masked → loop `latent_denoiser(noisy_latents, latent_mask, style, encoder_outputs, attention_mask, timestep, num_inference_steps)` `steps` times → `voice_decoder(latents)` → trim to `length * 3072`. Style from `voices/<id>.bin`, Float32, reshape `[1, -1, 128]`.

Pitch and rate: brand `pitch = 1.15`, `rate = 0.9`. The model has no pitch input. Model `speed = rate / pitch`; playback `AudioBufferSourceNode.playbackRate = pitch`. Net tempo = `rate`, pitch raised by `pitch`. Read from `public/brand/brand.json` at build.

## 12.6 Queue, ordering, gapless playback

`queue.ts` holds sentences of the open `SpeechSession` in index order.

1. Dispatch: any free worker takes the lowest unsynthesized index, while `index <= playing + sentencesAhead + workers - 1`. So at least one whole sentence is always ahead, in parallel.
2. Results sit in a map by index. `player.ts` schedules with one `AudioContext`: `start(nextStartTime)` where `nextStartTime = max(previousEnd, ctx.currentTime + 0.03)`. Sentences join without a gap, with 60 ms of written silence after each sentence for natural pause.
3. Playback begins when index 0 and `sentencesAhead` further sentences are ready, or input ended. If the next sentence is not ready at the end of the current one, playback waits (status stays Speaking).
4. `sentence_start` and `sentence_end` fire by an `AudioContext`-time timer. `queue_drained` fires after the last ends with input closed.

## 12.7 What speech drives

| Event | Effect |
|---|---|
| `sentence_start` | `reading.cue` = sentence cue (keeps last non-null); `ChartWheel.highlight`; `RoomStage.speaking` true; status Speaking; text of that sentence revealed if not already |
| Composer focused, nothing speaking | Status Listening |
| `queue_drained` | Highlight cleared 1.5 s later; status Here with you; `natally:speaking` false |

## 12.8 Controls and failure

| Action | Behaviour |
|---|---|
| `pauseSpeech` | `ctx.suspend()`; state `paused` |
| `resumeSpeech` | `ctx.resume()` |
| `setSpeechMuted` | Gain 0; timeline and highlights continue |
| Read-aloud off | `stopSpeech`; further sentences are text only |
| New utterance | `openSpeech` cancels jobs, stops sources |
| App hidden | Continues; on Android, `visibilitychange` hidden suspends, visible resumes |
| Worker error, non-fatal | Retry that sentence once on another worker; failed again: skip audio for it, text remains, playback continues |
| Fatal, or all workers lost | Emit `failed`; text continues silently; status follows reading phases; `voice_error` tracked; next utterance tries `ensureVoicePool` once |
| Out of memory while loading a pool | Reduce workers by one, retry; store the new `chosen.workers` |
