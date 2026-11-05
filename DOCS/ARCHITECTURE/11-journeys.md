# 11 — Journeys

Format: state → what the customer sees → event → next. Text in `code` that names a key is in §11.11, which holds every string the frozen screens lack.

## 11.1 First visit on the web

| State | Sees | Event → next |
|---|---|---|
| `landing` | Landing | CTA or `landing-create-chart-button` → `signin` (CTA stores pending product) |
| `signin` | Sign in | Success → `reconcile`. Firebase error → same screen, `auth.*` |
| `reconcile` | Next screen, reconcile runs in the background | Then `birth` if no chart, or pending product → `checkout` (11.6) |
| `birth` | Birth details | Submit → `computing`; validation → field `birth.*` |
| `computing` | Submit shows `birth.computing`, disabled | Done → `voice`; WASM load failure → `birth.chartFailed`, button again |
| `voice` | Voice setup (§12.2) | `ready` + Continue, or skip → `atelier` |
| `atelier` | Atelier, welcome bubble | End |

## 11.2 Opening the installed app

| State | Sees | Event → next |
|---|---|---|
| `boot` | Canvas, version badge | Session known → `pick`. Boot also calls `reconcileNow('app_open')` if signed in, `resumeSouvenirs()` |
| `pick` | Pick a modality | Begin → gates: A → `signin`; B → `birth`; V → `voice`; else `atelier` |

## 11.3 Free lesson

| State | Sees | Event → next |
|---|---|---|
| `choosing` | Atelier | Select, chip, or wheel tap → `lesson` |
| `lesson` | Chart main with highlight, lesson text, You and [element], invitation. `#chart-status` Speaking while the lesson is spoken (if read-aloud and voice ready), else `Here with you` | New element → `lesson`. Hear my personal reading → 11.4 |
| No credits | `lesson-personal-reading-button` stays; `Add credits` bubble and `lesson-topup-button` visible only when `balance < VITE_READING_MIN_MILLI` | Top Up → 11.5 |

## 11.4 Personal reading

| State | Sees (status line) | Event → next |
|---|---|---|
| `checking` | Thinking | Balance low → `no_credits`; no key → `minting` |
| `no_credits` | Bubble `Add credits for your personal reading.` + Top Up button | Top Up → 11.5, then back with the request kept in `reading.pendingRequest` memory → `checking` |
| `minting` | Thinking | 402 → `no_credits`. Network or 503 → `failed` |
| `thinking` | Thinking; bubble with gold border and three-dot text `reading.thinking` | First sentence → `speaking` |
| `speaking` | Speaking; text appears sentence by sentence; wheel highlights | Stream cut → `resuming`. Done, queue drained → `done` |
| `resuming` | Speaking continues for queued sentences; `reading.resuming` under the bubble | Success → `speaking`. Three failures → `cut` |
| `cut` | Whole sentences stay; `reading.cut` with `reading.tryAgain` link | Try again → `checking`, same turn id, resume |
| `done` | Here with you | Settle runs; balance drops live |
| `failed` | `reading.failed` bubble, effect `reading_failed` | Try again → `checking` |
| Read-aloud off or voice absent | Same states, text only, status Thinking then Here with you | |

## 11.5 Top Up

| State | Sees | Event → next |
|---|---|---|
| `picking` | Top Up, packs with live prices. Catalogue loading: rows show `billing.loading`, continue disabled. Failed: `billing.catalogFailed` + retry on tap | Continue → `checkout` |
| `checkout` | Provider checkout mounted at `#rcb-ui-root` | Purchased → `confirming`. Cancelled → `picking`. Failed → `picking`, toast `billing.failed`, effect `purchase_failed` |
| Android | Native paywall is `picking` and `checkout` together | Result as above |
| `confirming` | Full-width `billing.confirming` | `reconcileNow('checkout_return')` credited ≥ 1 → `done`. 0 credited: retry at 2, 4, 8, 16 s → `slow` |
| `slow` | `billing.slow` with Close | Live balance change also ends this state; app-open reconcile picks it up |
| `done` | Toast `billing.added` (n), effect `credit_arrived`; navigate back to the Atelier | A pending reading → continues |

Pending purchases (`outcome: 'pending'`) show `billing.pending`, and credits follow from the webhook or the next reconcile.

## 11.6 Landing purchase

Pending product id in `natally.pendingProduct`. `/checkout` reads it, clears it exactly when `buyProduct` starts, so a reload does not buy twice.

| State | Sees | Event → next |
|---|---|---|
| `signin` | Sign in | Success → `checkout` |
| `checkout` | `billing.opening`, then provider checkout | Purchased → `confirming`. Cancelled → `/atelier` |
| `confirming` | As 11.5 | Credits product → `/atelier` (gates add birth and voice). Souvenir product → `/souvenir` (journey 7) |

## 11.7 Souvenir

| State | Sees on `/souvenir` | Event → next |
|---|---|---|
| `offer` | Offer, live price | Buy → `checkout` |
| `checkout`, `confirming` | As 11.5 | Entry present → `awaiting_snapshot` |
| `awaiting_snapshot` | `souvenir.needChart` + link to `/birth`, only if no chart; otherwise skipped | Chart present → create snapshot → `generating` |
| `generating` | `ProgressRow` `souvenir.stepWriting`, `elementsDone of elementsTotal` | Each element persists; retry 3× per element, then `failed` |
| `audio` | `ProgressRow` `souvenir.stepVoice`, measured sentences | Voice absent: `beginVoiceSetup` measured rows; unsupported: skip with `audio: null` |
| `pdf` | `souvenir.stepPdf`, pages done of total | → `atelier` |
| `atelier` | `souvenir.stepAtelier` | → `uploading` |
| `uploading` | `souvenir.stepUpload`, measured bytes | Network failure pauses; resumes on return → `finalizing` |
| `finalizing` | `souvenir.stepFinish` | → `ready` |
| `ready` | `#souvenir-ready-card` "Your souvenir is ready"; `Also sent to [email]` only if `emailSent` | Open atelier or PDF |
| `failed` | `souvenir.failed` + `souvenir.tryAgain`; the purchase is safe and the entry remains | Try again → resume at stage |
| Leaving | Work continues while the tab lives; `resumeSouvenirs` continues on next open | Profile row shows `souvenir.preparing` until links exist |

## 11.8 Readings menu

| Trigger | State flow |
|---|---|
| `atelier-horoscope-button` | Customer turn `reading.horoscopeAsk`, then 11.4 with transits |
| `atelier-synastry-button` | Sheet → validation errors `birth.*` → submit `computing` → sheet closes → customer turn `reading.synastryAsk` (name) → 11.4. Synastry chart is held in memory and goes only into the prompt |

## 11.9 Share

| State | Sees | Event |
|---|---|---|
| `open` | Share sheet with `[Name]'s natal chart` and flat wheel | Copy link: `share.copying` then toast `share.copied`, or `share.failed`. Offline: `share.failed` |
| Save image, Save PDF | Button busy; `saved` toast `share.saved`; `cancelled` nothing | |
| `/shared/:id` | Read-only sheet, `share.notFound` if missing; link `share.makeYours` to `/` | |

## 11.10 Account

| Trigger | Result |
|---|---|
| `profile-restore-link` | `restorePurchases`: rail restore then reconcile; toast `billing.restored` (n) or `billing.nothing` |
| `profile-signout-button` | `signOutNow`; key dropped; Firestore cache cleared |
| Settings, About | Routes; `settings-retune-voice-button` runs voice setup on `/voice?retune=1` and returns to Settings |

## 11.11 Added strings (exact)

Module `strings.ts`, grouped by the key's prefix. `{}` is interpolated.

| Key | Text |
|---|---|
| `auth.popupInsecure` | Google sign-in needs a secure page. Please use the https address of this site. |
| `auth.popupBlocked` | Your browser blocked the sign-in window. Please allow it and try again. |
| `auth.emailInvalid` | Please enter a valid email address. |
| `auth.wrongPassword` | That email and password don't match. |
| `auth.emailInUse` | That email already has an account. Log in instead. |
| `auth.weakPassword` | Please choose a password of at least 8 characters. |
| `auth.phoneInvalid` | Please enter your number with its country code, like +1 416 555 0100. |
| `auth.codeSent` | We sent you a code. Enter it below. |
| `auth.codeWrong` | That code didn't work. Please try again. |
| `auth.network` | We couldn't reach the sign-in service. Please try again. |
| `auth.phoneLabel` | Phone number |
| `auth.codeLabel` | Code |
| `bridge.signing` | Finishing your sign-in… |
| `bridge.done` | You're signed in. You can close this window and return to the app. |
| `bridge.failed` | Sign-in didn't finish. Please return to the app and try again. |
| `birth.computing` | Calculating your chart… |
| `birth.chartFailed` | We couldn't calculate your chart. Please try again. |
| `birth.nameRequired` | Please tell Natally what to call you. |
| `birth.dateInvalid` | That date doesn't exist. |
| `birth.timeInvalid` | Please enter a time like 7:05 PM, or tick the box. |
| `birth.placeRequired` | Please choose a place from the list. |
| `birth.noPlaces` | No matching place. Try the nearest city. |
| `chart.wholeSignReason` | Without a birth time your chart uses Whole Sign houses, counted from your Sun sign. |
| `chart.polarReason` | Placidus cannot be drawn at this latitude, so your chart uses Whole Sign houses. |
| `voice.unsupported` | Her voice can't run on this device. You can read everything instead. |
| `voice.waiting` | waiting |
| `voice.bytes` | {} MB of {} MB |
| `voice.loaded` | {} of {} loaded |
| `voice.candidate` | {} of {} tried |
| `voice.done` | done |
| `voice.retry` | Something stopped her voice from loading. Tap Continue without sound, or try again in Settings. |
| `voice.storage` | There isn't enough free space for her voice on this device. |
| `reading.thinking` | … |
| `reading.resuming` | One moment, the thread slipped. Picking it up. |
| `reading.cut` | The connection dropped before I finished. |
| `reading.tryAgain` | Continue |
| `reading.failed` | I lost my thread just now. Nothing was charged for what you didn't hear. |
| `reading.horoscopeAsk` | My horoscope, please. |
| `reading.synastryAsk` | Compare my chart with {}. |
| `status.idle` | Here with you |
| `status.listening` | Listening |
| `status.thinking` | Thinking |
| `status.speaking` | Speaking |
| `conversation.saved` | Saved. |
| `billing.loading` | Loading prices… |
| `billing.catalogFailed` | We couldn't load the prices. Tap to try again. |
| `billing.opening` | Opening checkout… |
| `billing.confirming` | Confirming your purchase… |
| `billing.slow` | Your payment went through and your credits are on their way. They'll appear here shortly. |
| `billing.pending` | Your payment is pending. Your credits will appear when it clears. |
| `billing.failed` | The payment didn't go through. You haven't been charged. |
| `billing.added` | {} credits added. |
| `billing.restored` | {} purchases restored. |
| `billing.nothing` | Everything is already on your account. |
| `billing.rowCredits` | Exploration credits |
| `billing.rowSouvenir` | Souvenir reading |
| `billing.rowUsage` | Personal reading |
| `souvenir.needChart` | Tell Natally when and where you were born, and your souvenir will begin. |
| `souvenir.stepWriting` | Writing your chapters |
| `souvenir.stepVoice` | Recording her voice |
| `souvenir.stepPdf` | Setting the pages |
| `souvenir.stepAtelier` | Freezing your atelier |
| `souvenir.stepUpload` | Sending it to its shelf |
| `souvenir.stepFinish` | Finishing up |
| `souvenir.failed` | Your purchase is safe, but the work stopped. |
| `souvenir.tryAgain` | Continue making my souvenir |
| `souvenir.preparing` | Being prepared |
| `share.copying` | Making your link… |
| `share.copied` | Link copied. |
| `share.saved` | Saved. |
| `share.failed` | That didn't work. Please try again. |
| `share.notFound` | This chart is no longer shared. |
| `share.makeYours` | Create your natal chart |
| `settings.eraseConfirm` | Erase every saved conversation? Your souvenirs stay. |
| `settings.eraseYes` | Erase |
| `settings.eraseNo` | Keep |
| `settings.erased` | Your conversation history is erased. |
| `about.machineSpeech` | Her voice is machine generated. |
| `shell.updateAvailable` | A new version is available. |
| `shell.updateAction` | Download |
| `app.offline` | You're offline. Lessons and your chart still work. |
| `app.chunkFailed` | Loading… |
| `mail.subject` | Your souvenir from {} |
| `mail.body` | Your souvenir is ready, {}.\n\nYour atelier: {}\nYour PDF: {}\n\nBoth links also live in your purchase history. |
