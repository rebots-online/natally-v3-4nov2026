# 02 — Technology

Versions from `npm view` and the crates.io and Maven indexes on 5 November 2026. Exact pins: no `^` or `~` in `package.json`.

## 2.1 Client runtime

| Package | Version | Why |
|---|---|---|
| `react`, `react-dom` | 19.3.1 | Owner decision |
| `react-router-dom` | 7.18.5 | Browser routes; Surge serves `200.html` fallback |
| `zustand` | 5.0.16 | Small stores that work outside React (voice, session) |
| `firebase` | 13.2.0 | Auth and Firestore |
| `@revenuecat/purchases-js` | 1.74.0 | Web Billing rail |
| `three` | 0.187.0 | The 3D wheel; no framework layer needed |
| `onnxruntime-web` | 1.31.1 | Supertonic in workers |
| `@huggingface/tokenizers` | 0.2.0 | Reads the repo's `tokenizer.json`; no pipeline library, so sessions, threads and steps stay ours |
| `@swisseph/browser` | 1.4.0 | Swiss Ephemeris WASM, AGPL-3.0 matches the repo; built-in Moshier ephemeris works offline with no data files |
| `pdf-lib` | 1.17.1 | Writes the PDF and link annotations |
| `fontkit` | 2.0.4 | Reads the variable WOFF2 fonts and gives weighted glyph outlines (§14.5) |
| `@breezystack/lamejs` | 1.2.7 | MP3 encoding of replay audio in JS on all webviews; LGPL-3.0 |
| `workbox-window` | 7.4.1 | Service worker lifecycle events |
| `@tauri-apps/api` | 2.12.4 | Shell bridge |
| `@tauri-apps/plugin-dialog` | 2.8.4 | Desktop save dialog |
| `@tauri-apps/plugin-fs` | 2.7.1 | Desktop file writes; Linux weights fallback |
| `@tauri-apps/plugin-opener` | 2.7.2 | System browser |

## 2.2 Server runtime

| Package | Version | Why |
|---|---|---|
| `firebase-admin` | 14.5.0 | Verify ID tokens, write ledger |
| `ssh2-sftp-client` | 12.1.1 | SFTP delivery adapter |
| `nodemailer` | 10.3.1 | SMTP links email |

`fetch` calls OpenRouter, RevenueCat and GA4; no vendor SDK on the server.

## 2.3 Build tools

| Tool | Version | Why |
|---|---|---|
| `vite` | 8.3.6 | Owner decision |
| `@vitejs/plugin-react` | 6.2.1 | React transform |
| `typescript` | 7.0.2 | Type checking (`tsc --noEmit`) |
| `@types/react`, `@types/react-dom` | 19.3.0 | Types |
| `@types/three` | 0.187.0 | Types |
| `vite-plugin-pwa` | 2.0.0 | Generates the service worker and manifest |
| `@tailwindcss/vite`, `tailwindcss` | 4.3.4 | Frozen screens are Tailwind utility markup; copied classes keep them pixel-identical |
| `esbuild` | 0.28.2 | Bundles `server/` for Node adapter and `scripts/` where needed |
| `tsx` | 4.23.15 | Runs the Node adapter in development |
| `@netlify/functions` | 6.1.0 | Types for the adapter |
| `netlify-cli` | 27.16.2 | Function deploy |
| `surge` | 0.56.0 | Web deploy |
| `firebase-tools` | 15.35.0 | Rules and index deploy |
| `@tauri-apps/cli` | 2.12.4 | Package builds; the 2.11.4 on the machine is not used, `pnpm exec tauri` runs this pin |
| pnpm | 10 | Package manager; `packageManager` set in `package.json` |
| Node | 26 | Runtime for scripts and adapter; Netlify runtime set by `AWS_LAMBDA_JS_RUNTIME` is left at platform default |

## 2.4 Native

| Crate or artifact | Version | Why |
|---|---|---|
| `tauri` | 2.12.5 | Shell; 3.0 alpha exists on crates.io and is not used |
| `tauri-build` | 2.7.4 | Build |
| `tauri-plugin` (build dep of `natally-android`) | 2.7.2 | Plugin definition |
| `tauri-plugin-opener` | 2.7.2 | System browser |
| `tauri-plugin-dialog` | 2.8.4 | Save dialog |
| `tauri-plugin-fs` | 2.7.1 | File writes |
| `tauri-plugin-single-instance` | 2.5.5 | One desktop window |
| `com.revenuecat.purchases:purchases` | 11.1.0 | Android rail |
| `com.revenuecat.purchases:purchases-ui` | 11.1.0 | Paywalls |
| `androidx.credentials:credentials`, `credentials-play-services-auth` | 1.6.0 | Credential Manager; stable line, 1.7.0-alpha not used (Appendix B) |
| `com.google.android.libraries.identity.googleid:googleid` | 1.2.1 | Google ID token option |

Rust 1.97, Android SDK 36 (`compileSdk`/`targetSdk`), `minSdk` 26, NDK 27, `cargo-ndk`, `cargo-xwin`.

## 2.5 Not used, on purpose

| Thing | Reason |
|---|---|
| `@huggingface/transformers` | Pulls a dev build of ORT and hides session options |
| `@react-three/fiber` | Imperative wheel with no React re-render path is simpler |
| `html2canvas`, headless browsers | Raster PDFs are large and need a browser on the server |
| `tauri-plugin-updater` | Needs update hosting and signing outside the brief |
| COOP/COEP on any origin | Would block the checkout and sign-in frames; `crossOriginIsolated` stays false on our own builds, and the in-model thread candidate only runs if some host ever provides it |
