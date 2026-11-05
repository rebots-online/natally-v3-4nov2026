# 13 — Reading pipeline

Files in `src/reading/`: `prompt.ts`, `stream.ts`, `run.ts`, `keys.ts`, `cues.ts`, `conversation.ts`, `store.ts`, `strings.ts`.

## 13.1 Prompt

`buildMessages(req, chart, birth, turns)` returns OpenAI-style messages:

| Part | Role | Content |
|---|---|---|
| Persona | system | `brand.character.reading`, `aside`, `continuity`, `care` verbatim from `public/brand/brand.json`, then the rules below |
| Rules | system | "You are {appName}." Use only the facts given; never invent a placement. Speak in full sentences of plain text with no markdown or lists. Say plainly when the birth time is unknown. Add no disclaimers. No more than 180 words unless asked. Before a sentence about a placement, put its marker `{{el:<key>}}` using a key from the list |
| Chart facts | system | Computed block: name; date, and time or `time unknown`; place label; house system and reason; every planet (`Venus: Libra 28°14', house 7, direct`); angles; aspects to orb 3° first, up to 20; the allowed keys |
| Transits | system | `horoscope` only: today's date, planets by sign and degree, top 8 aspects to natal |
| Other chart | system | `synastry` only: other person's name and positions, top 12 cross aspects. Never stored |
| Focus | system | `personal_reading`: "Speak about {element name}, in the context of the whole chart." |
| History | user, assistant | Up to the last 12 turns of this conversation, text only |
| Request | user | The customer's turn. For `personal_reading` without a typed question, the constant `Please give me my personal reading.` Horoscope and synastry use the §11.11 asks |

## 13.2 Streaming

`stream.ts`: `fetch('https://openrouter.ai/api/v1/chat/completions', { method:'POST', headers:{ Authorization:'Bearer <key>', 'Content-Type':'application/json', 'HTTP-Referer': referer, 'X-Title': appName }, body: { model, messages, stream:true, max_tokens, temperature, usage:{ include:true } } })`. It parses SSE lines: `data: {...}`, ignores comment lines starting `:`, stops at `[DONE]`. `choices[0].delta.content` is text; `choices[0].finish_reason === 'error'` or a top-level `error` is a cut; final `usage.cost` adds to `costSoFar`. An idle gap over 30 s aborts and counts as a cut.

## 13.3 Run (`run.ts`)

1. Check: signed in, chart present, `getBalanceMilli() >= VITE_READING_MIN_MILLI`, else `no_credits` or `no_chart`. Offline: `offline`. Track `reading_request`.
2. `ensureReadingKey(reason)`; `'no_credits'` returns the refusal.
3. Create the `ReadingTurn` `natally`, status `streaming`, in Firestore; `openSpeech(turnId)` if `readAloud` and `ensureVoicePool()` true.
4. Stream. Each delta goes through `cues.split(text)`: `{{el:key}}` markers are removed and remembered as the pending cue; then `SentenceSegmenter.push`.
5. Each whole sentence becomes a `SpokenSentence` with the pending cue, or `null`; invalid keys are dropped by `parseElementKey`. If a sentence has no marker, `cues.detect` looks for one element name in `listChartElements` and uses it if the name is unique. The sentence goes to the store (visible text), to `SpeechSession.pushSentence`, and is debounced into Firestore every 2 s.
6. End: `flush`, `endInput`, turn `complete`, `apiFetch('/api/keys/settle')`, track `reading_result`.

Sentences are shown as segmented: when speaking, each is revealed at its `sentence_start`; when not, at once.

## 13.4 Key handling (`keys.ts`)

In-memory `{ key, keyHash, limitUsd, expiresAt, costSoFar }`. `ensureReadingKey` reuses it unless expired within 60 s, or `limitUsd - costSoFar < VITE_KEY_LOW_LIMIT_USD`, then mints with the fitting `MintReason`. The first use mints with `first_use`. On `natally:signed-out`, it is cleared.

## 13.5 Failure and resume

| Failure | Action |
|---|---|
| HTTP 401 | Mint `http_401`; repeat the same request (no text received yet) or resume |
| HTTP 402 | Mint `http_402`; `no_credits` from the mint ends with the Add-credits state, keeping sentences so far |
| 429, 5xx before any text | Next model in `VITE_OPENROUTER_MODELS`, then back off 2 s, 4 s; then `failed` |
| Cut after text (network, error chunk, idle) | Resume |

Resume: discard text after the last whole sentence (segmenter buffer). New key with reason `resume`. New request: same messages plus `assistant` = all whole sentences so far, plus system line `Your previous message was cut off. Continue from the very next sentence. Do not repeat anything or greet again.` New text goes through a fresh segmenter; the sentence index continues. Up to 3 attempts, 2 s apart, then status `cut`. Continue link retries with the same turn. Sentences already queued keep playing throughout.

## 13.6 Saving and accounting

Turns are written by the client to the customer's own documents; only the server moves credits. Real usage is read by the server from OpenRouter, never trusted from the client. `conversation-save-button` sets `saved` and saves `<name>-conversation.txt` through `platform.saveFile`. Active conversation: most recent by `updatedAt`, else created on the first turn. Title = first 60 characters of the first customer turn.

Welcome bubble `Welcome back, [Name]. Tap any placement on your chart and I'll explain it.` is not a turn and costs nothing.
