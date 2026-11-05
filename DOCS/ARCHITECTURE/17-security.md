# 17 — Security and privacy

## 17.1 Secrets

| Secret | Lives in | Never |
|---|---|---|
| `OPENROUTER_MANAGEMENT_KEY`, `OPENROUTER_SOUVENIR_KEY`, `REVENUECAT_SECRET_KEY`, `REVENUECAT_WEBHOOK_AUTH`, `GA_API_SECRET`, `FIREBASE_ADMIN_*`, `SFTP_PASSWORD`, `SMTP_PASSWORD` | Admin-Manual pointer → `.generated/server.env` → Netlify env | In the bundle, repo, or logs |
| `SURGE_TOKEN`, `NETLIFY_AUTH_TOKEN`, `ANDROID_KEY*`, `FIREBASE_DEPLOY_SA_FILE` | Same → `.generated/build.json` | In the bundle |
| Per-user reading key | Client memory only | Written to disk; stored on the server in plaintext |

Public by nature: Firebase web config, RevenueCat public keys, GA measurement id, product ids. Security comes from the rules and the server.

## 17.2 What leaves the device

| Data | Goes to | Why |
|---|---|---|
| Birth details, chart, conversation | Customer's Firestore | Account |
| Chart facts, question, history | OpenRouter, in reading prompts, by customer's own key | Readings |
| Snapshot chart | OpenRouter by server key | Souvenir chapters |
| Souvenir page and PDF | Shared host, at an unguessable path | Bought feature |
| Anonymous events | GA4 | Consent only |
| Voice text, audio, calibration | Nowhere, except replay audio in the bought souvenir; the calibration result as anonymous numbers with consent | |

Synastry partner's birth details stay in memory and in the prompt; they are never stored. Share documents hold no birth date, time or place.

## 17.3 Shell content rules

Set `app.security.csp` in `src-tauri/tauri.conf.json`:

```
default-src 'self' tauri: https://tauri.localhost ipc: http://ipc.localhost;
script-src 'self' 'wasm-unsafe-eval' https://apis.google.com https://www.gstatic.com https://www.google.com https://js.stripe.com;
worker-src 'self' blob:;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: blob: https:;
font-src 'self' data: https://fonts.gstatic.com;
media-src 'self' blob:;
connect-src 'self' ipc: http://ipc.localhost https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://openrouter.ai https://api.revenuecat.com https://*.revenuecat.com https://api.stripe.com https://huggingface.co https://*.hf.co https://*.huggingface.co <VITE_API_BASE_URL origin>;
frame-src https://*.firebaseapp.com https://www.google.com https://www.recaptcha.net https://js.stripe.com https://*.stripe.com https://*.revenuecat.com;
```

`scripts/resolve-env.mjs` injects the API origin and voice base host into `.generated/tauri.override.json`. No cross-origin isolation headers are set on any origin (§2.5). Tauri capabilities allow only `core:default`, `opener:allow-open-url` for https, `dialog:allow-save`, `fs:allow-write-file` and `fs` read and write scoped to `$APPDATA/voice/**` and the saved path, and our own commands. Android's manifest has `INTERNET` only, and the build has no web billing rail or install link. Desktop loopback binds to `127.0.0.1`, validates a random `state`, and shuts down after one request.

## 17.4 Licences

| Thing | Obligation | Where |
|---|---|---|
| This repo | AGPL-3.0-only, source offered | About, `about-licence-notices` page links the repository |
| Swiss Ephemeris | AGPL-3.0 route, attribution | `about-licence-swisseph` |
| Supertonic | BigScience OpenRAIL-M: terms passed on; disclose speech is machine generated | `about-licence-voice`, `about.machineSpeech`, Terms. Not in readings |
| Fonts | OFL files in `public/fonts/` | `about-licence-fonts` |
| lamejs | LGPL-3.0, dynamically loaded chunk, replaceable | Notices |
| GeoNames data | CC BY 4.0 attribution | Notices |
| Brand art | Owner's; not licensed to forks | README |

Terms and Privacy text are authored in `src/info/legal/terms.ts` and `privacy.ts`, with no disclaimers in product flow, naming `VITE_LEGAL_ENTITY`, GA use and consent, OpenRouter, RevenueCat, Firebase, and the machine-generated voice.
