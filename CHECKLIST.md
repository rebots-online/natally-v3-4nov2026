# Checklist — Natally v3

Each task is self-contained against `DOCS/ARCHITECTURE.md` and `DOCS/ARCHITECTURE/`. Section numbers (§) are those files. No file is owned by two tasks. No unit tests: verification is running the real flow and reading the code against the architecture. Commit and push after each task; never stamp a version by hand.

## Rules for every task

1. Write only owned files. A needed change elsewhere goes back to the architect.
2. Import siblings through `src/<module>/index.ts` exactly as §5 declares them, even if the sibling has not landed. Type errors that are only about an absent sibling are acceptable until it lands; all others are not.
3. Every verify step needs real neighbours. If they have not landed when the code is done, record `committed; flow pending <task ids>`. V1 runs them all.
4. Screens are ported from `LIBS/UI/STITCH/screens/<slug>/index.html` per §3.2 rule 7. Strings per §3.2 rule 5.
5. Under 500 lines per source file. Dev ports only from `VITE_DEV_PORT` and `SERVER_PORT`.

## Foundation batch (in order, F1 to F7)

### F1 — Scaffold

- **Owns:** `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `vite.config.ts`, `vite.souvenir.config.ts`, `.gitignore`, `index.html`
- **Obeys:** §2, §3.1, §16.5
- **Frozen screens wired (ids in §10):** none
- **Build:** Every dependency of §2 at its exact pin, installed now so no later task edits `package.json`. `vite.config.ts`: `envDir: '.generated'`, React, Tailwind, PWA plugin per §16.5, port `VITE_DEV_PORT`, `outDir: dist-web`. `vite.souvenir.config.ts` per §14.6.
- **Verify:** `pnpm install` then `pnpm vite build` succeeds once F6 is in; no later task edits these files.

### F2 — Shared types

- **Owns:** `src/types/**`
- **Obeys:** §4, §15.2, §5.19
- **Frozen screens wired (ids in §10):** none
- **Build:** Copy §4 verbatim. Add `src/types/analytics.ts` (`AnalyticsCatalog`, `ANALYTICS_EVENT_NAMES`), `src/types/api.ts`, `src/types/glyphs.ts`.
- **Verify:** `pnpm tsc --noEmit` clean on `src/types`.

### F3 — Client configuration

- **Owns:** `src/config/**`, `.env.example`
- **Obeys:** §4.13, §8.1
- **Frozen screens wired (ids in §10):** none
- **Build:** `.env.example` lists every §8.1 row, neutral default, one comment line each. `config` throws naming a missing required variable.
- **Verify:** Build with `.env.example` values; the app name shown is the neutral one.

### F4 — Env pointer resolver and version

- **Owns:** `scripts/resolve-env.mjs`, `scripts/stamp-version.mjs`, `scripts/check-no-secrets.mjs`, `scripts/version-state.json`
- **Obeys:** §8.2, §8.3, §16.2, §1.5
- **Frozen screens wired (ids in §10):** none
- **Build:** Writes `.generated/*` with mode 600, derives canonical origin. Never prints a value.
- **Verify:** Run with a pointer to a temp file and with a missing key; files correct, error names only the variable. Run twice: minor +1.

### F5 — Tokens

- **Owns:** `scripts/build-tokens.mjs`, `design-system/tokens.css`
- **Obeys:** `design-system/README.md`, §16.1 step 3
- **Frozen screens wired (ids in §10):** none
- **Build:** CSS custom properties for every token of `tokens.json`, `tokens.extra.json`, plus the `@font-face` rules' family names and the reduced-motion rule.
- **Verify:** Open generated file; every token present; rerun gives identical bytes.

### F6 — Web build path

- **Owns:** `build_all.sh`, `scripts/copy-ort-assets.mjs`, `scripts/third-party.mjs`, `scripts/postbuild-web.mjs`, `scripts/deploy-web.mjs`, `src/app/main.tsx`, `src/app/routes.tsx`, `src/app/NotFound.tsx`
- **Obeys:** §16.1 steps 1 to 8, §9.1, §1.5
- **Frozen screens wired (ids in §10):** none
- **Build:** `build_all.sh` complete with all 15 steps; a script not yet present counts as `skipped`. `main.tsx` runs the §1.5 boot rule, then mounts; `routes.tsx` is the whole route table with `import.meta.glob` for screens and for `./Gate.tsx`, `./lifecycle.ts`, `./pwa.ts`, `../modalities/index.ts`, so a missing file never breaks the build.
- **Verify:** Fresh clone + `.env.example`: `./build_all.sh --web-only --skip-deploy` succeeds; `dist-web/200.html` exists; served page shows canvas and `v3.N.BBBBB`.

### F7 — First live deploy

- **Owns:** none
- **Obeys:** §16.1 step 8, §18 Insecure, Clone, No secret
- **Frozen screens wired (ids in §10):** none
- **Build:** Owner's `.env`. `./build_all.sh --web-only`. Commit `scripts/version-state.json`. Do not plan any DNS change.
- **Verify:** Fetch `https://natally-v3.surge.sh/` and a deep path (200 fallback): badge shows the new version. Fetch `https://natally-v3.robin.mba` and `http://natally-v3.robin.mba`; report both outcomes to the coordinator, who decides `https` on that target.

## Parallel batch (any order, after Foundation)

### T01 — UI kit

- **Owns:** `src/ui/**`
- **Obeys:** §5.2, §3.2 rule 7, `design-system/README.md`
- **Frozen screens wired (ids in §10):** none directly; every screen uses it
- **Build:** All 23 design-system components, `fonts.css` from `public/fonts/`, `frozen-theme.css`, `icons.tsx`, toast host.
- **Verify:** Render each in a dev page beside the frozen look; touch targets ≥ 44 px; no colour outside tokens.

### T02 — Platform adapter

- **Owns:** `src/platform/**`
- **Obeys:** §1.3, §1.4, §4.11, §5.3, §5.21
- **Frozen screens wired (ids in §10):** none
- **Build:** `web.ts`, `desktop.ts`, `android.ts`, `opfs-store.ts`, `tauri-fs-store.ts`.
- **Verify:** Web: save file, copy text, OPFS round trip. Shells: same via T27/T28.

### T03 — Analytics

- **Owns:** `src/analytics/**`
- **Obeys:** §15, §5.4
- **Frozen screens wired (ids in §10):** none
- **Build:** Both transports; web-vitals through `PerformanceObserver`; error capture.
- **Verify:** GA4 DebugView on web; toggle consent off: no requests. §18 Analytics.

### T04 — Sign-in

- **Owns:** `src/auth/**`
- **Obeys:** §5.5, §1.3, §11.1, §11.11 `auth.*`, `bridge.*`
- **Frozen screens wired (ids in §10):** `sign-in`
- **Build:** Three tabs, Google per platform, phone with reCAPTCHA, `apiFetch`, desktop bridge page.
- **Verify:** Sign up and log in by each method on web; `/auth/desktop` hands off to a loopback on Linux.

### T05 — Account and Profile

- **Owns:** `src/account/**`
- **Obeys:** §5.6, §6, §9.2
- **Frozen screens wired (ids in §10):** `profile`
- **Build:** Live hooks, row formatting.
- **Verify:** With seeded ledger through the server, rows and balance update live without reload. §18 J10.

### T06 — Billing client

- **Owns:** `src/billing/**`
- **Obeys:** §4.6, §5.7, §11.5, §11.6, §1.3
- **Frozen screens wired (ids in §10):** `top-up`
- **Build:** `revenuecatWeb.ts`, `revenuecatPlay.ts`, rail selection by build target, `useCatalog` from `offerings.all[configured id]` (never current; products outside the map are ignored), `ScreenTopUp`, `ScreenCheckout`, `useOpenTopUp`.
- **Verify:** §18 J5, J6, Offering. Prices equal provider data.

### T07 — Chart engine

- **Owns:** `src/chart/** except src/chart/tools/**`
- **Obeys:** §4.2, §5.8, §9.2, §11.1
- **Frozen screens wired (ids in §10):** `birth-details`
- **Build:** `@swisseph/browser` wrapper: `julianDay`, positions, `calculateHouses` Placidus; local time to UT via IANA zone and `Intl`; time unknown: noon local, `whole_sign` from Sun sign, no angles; latitude beyond ±66°: `whole_sign` from Ascendant, `polar_latitude`. Aspect orbs: conjunction, opposition 8°, trine, square 7°, sextile 5°. `BirthFields`, `ScreenBirthDetails`.
- **Verify:** Enter a known birth; degrees match a published ephemeris to the minute; unknown time shows Whole Sign and no angles.

### T08 — Places data

- **Owns:** `src/chart/tools/**`, `public/geo/**`
- **Obeys:** Entity table, §17.4
- **Frozen screens wired (ids in §10):** none
- **Build:** `build-cities.mjs` turns GeoNames `cities15000` into `public/geo/cities.json`: `[label, lat, lon, tz, population]`, sorted by population; committed.
- **Verify:** `searchPlaces('toronto')` returns the right zone; file under 2 MB.

### T09 — Chart wheel

- **Owns:** `src/wheel/**`
- **Obeys:** §5.9, §9.3
- **Frozen screens wired (ids in §10):** none directly; `#atelier-inset`, `#chart-main-view`
- **Build:** 3D wheel, flat shapes, PNG.
- **Verify:** Spin, drag, zoom, tap; highlight an aspect; motion paused stops spin; large and inset both; PNG correct.

### T10 — Lessons

- **Owns:** `src/lessons/**`
- **Obeys:** §4.3, §5.9, §13.6
- **Frozen screens wired (ids in §10):** none
- **Build:** Real authored text for all 44 subjects, 80 to 160 words each, in Natally's voice, plus an invitation sentence; `youAndElement`.
- **Verify:** Read every lesson; You and Venus states the true sign, house, closest aspect, with no network call.

### T11 — Voice

- **Owns:** `src/voice/**`
- **Obeys:** §12, §5.10, §9.2, §11.11 `voice.*`
- **Frozen screens wired (ids in §10):** `voice-setup`
- **Build:** Everything in §12.
- **Verify:** §18 Voice. Throttle the network: bytes are real. Log proves ahead count; long sentences uncut.

### T12 — Room

- **Owns:** `src/room/**`
- **Obeys:** §5.11, §9.4
- **Frozen screens wired (ids in §10):** none directly; `#atelier-scene`
- **Build:** Layers, sounds, motion rule.
- **Verify:** Head and hands move only while allowed; every sound obeys the toggle; reduced motion gives a still.

### T13 — Reading

- **Owns:** `src/reading/**`
- **Obeys:** §13, §5.13, §7.4
- **Frozen screens wired (ids in §10):** none directly; composer ids through T15
- **Build:** Prompt, stream, cues, resume, key cache, storage.
- **Verify:** §18 J4, J4b, J8.

### T14 — Sheets

- **Owns:** `src/share/**`
- **Obeys:** §5.14, §11.8, §11.9, §6.1
- **Frozen screens wired (ids in §10):** `synastry-share-sheets`
- **Build:** Both sheets, public page.
- **Verify:** §18 J8, J9.

### T15 — Atelier

- **Owns:** `src/atelier/**`
- **Obeys:** §5.12, §9.1 to §9.3, §11.3, §11.4, §11.11 `status.*`, `conversation.*`
- **Frozen screens wired (ids in §10):** `atelier`, `atelier-desktop`, `atelier-chart-lesson`
- **Build:** Phone and desktop layouts, `AtelierStage`, `ConversationPanel`, `LessonPanel`.
- **Verify:** §18 J3, J4; swap views; drag inset; compare screenshots.

### T16 — Modalities

- **Owns:** `src/modalities/**`
- **Obeys:** §4.9, §5.16, §9.2
- **Frozen screens wired (ids in §10):** `pick-a-modality`
- **Build:** Registry by glob; `natal/manifest.ts`; `tarot/manifest.ts`, `iching/manifest.ts` locked. Proof of the contract: nothing outside this folder names a modality.
- **Verify:** §18 J2; adding a temporary folder in a dev run lists it with no core change.

### T17 — Landing

- **Owns:** `src/landing/**`
- **Obeys:** §5.16, §9.2, §11.1, §11.6, §15.2
- **Frozen screens wired (ids in §10):** `landing-desktop`, `landing-phone`
- **Build:** Both layouts, example Aurelia chart computed live with constants in `example.ts`, live prices, section analytics.
- **Verify:** §18 J1, J6; prices from catalogue; screenshots.

### T18 — Settings, About, legal

- **Owns:** `src/info/**`
- **Obeys:** §5.16, §9.2, §17.4, §11.10
- **Frozen screens wired (ids in §10):** `settings`, `about`
- **Build:** Licence pages, authored Terms and Privacy.
- **Verify:** §18 J10; machine-speech line present.

### T19 — Souvenir pipeline

- **Owns:** `src/souvenir/*`
- **Obeys:** §14.1 to §14.4, §14.6, §5.15, §11.7
- **Frozen screens wired (ids in §10):** `souvenir-offer`
- **Build:** Everything in `src/souvenir/` except `pdf/`.
- **Verify:** §18 J7; kill the tab mid-stage; reopen resumes.

### T20 — Souvenir PDF

- **Owns:** `src/souvenir/pdf/**`
- **Obeys:** §14.5, §9.1, §10
- **Frozen screens wired (ids in §10):** `souvenir-pdf-opening`, `souvenir-pdf-elements`
- **Build:** `renderSouvenirPdf(snapshot, elements, links): AsyncGenerator<{pagesDone,pagesTotal}, Uint8Array>` exported from `pdf/render.ts`, used by T19.
- **Verify:** Open output in a viewer beside the frozen screenshots: Letter, frame, fonts, working links.

### T21 — Frozen atelier page

- **Owns:** `src/souvenir-runtime/**`, `souvenir.html`
- **Obeys:** §14.6, §9.2, §10
- **Frozen screens wired (ids in §10):** `souvenir-atelier`
- **Build:** Stand-alone page; network log shows only own folder.
- **Verify:** Open a sample package from a static folder; replay, wheel, Ask reply; zero model calls.

### T22 — App shell

- **Owns:** `src/app/Gate.tsx`, `src/app/lifecycle.ts`, `src/app/pwa.ts`, `src/app/ErrorBoundary.tsx`
- **Obeys:** §9.1, §16.5, §5.17, §1.5
- **Frozen screens wired (ids in §10):** none
- **Build:** Gates; lifecycle runs `reconcileNow('app_open'|'sign_in')`, then `resumeSouvenirs`; analytics init, shell update notice, offline toast.
- **Verify:** §18 Update, Chunk, Insecure.

### T23 — Server core

- **Owns:** `server/core/**`, `server/adapters/**`, `netlify/**`
- **Obeys:** §5.19, §5.20, §7.1, §7.7
- **Frozen screens wired (ids in §10):** none
- **Build:** Router, CORS, `health`, config, Firestore admin, both adapters.
- **Verify:** `GET /api/health` on Node port and on Netlify; bad origin gets no CORS.

### T24 — Firestore rules

- **Owns:** `firestore.rules`, `firestore.indexes.json`, `firebase.json`
- **Obeys:** §6.3, §6.4
- **Frozen screens wired (ids in §10):** none
- **Build:** Verbatim rules.
- **Verify:** §18 Rules, after deployment by the owner or T29.

### T25 — Server billing

- **Owns:** `server/billing/**`
- **Obeys:** §7.2, §7.3, §7.6, §4.6
- **Frozen screens wired (ids in §10):** none
- **Build:** Reconcile, webhook, rail.
- **Verify:** §18 J5, J5b, J5c.

### T26 — Server keys

- **Owns:** `server/keys/**`
- **Obeys:** §7.4, §6.1
- **Frozen screens wired (ids in §10):** none
- **Build:** Mint, settle, retire.
- **Verify:** Mint: OpenRouter key has correct limit, no reset, right expiry. Spend, mint again: debit equals real usage, old key disabled, then deleted after grace.

### T27 — Tauri desktop

- **Owns:** `src-tauri/** except src-tauri/gen/android/** and src-tauri/plugins/natally-android/**`
- **Obeys:** §1.3, §5.21, §17.3, §16.1 steps 11, 13
- **Frozen screens wired (ids in §10):** none
- **Build:** Commands, loopback, CSP, capabilities; `useHttpsScheme`; no isolation headers.
- **Verify:** `pnpm tauri dev`; Google via system browser; voice setup; save file; AppImage and NSIS build.

### T28 — Tauri Android

- **Owns:** `src-tauri/gen/android/**`, `src-tauri/plugins/natally-android/**`
- **Obeys:** §1.3, §5.21, §16.4
- **Frozen screens wired (ids in §10):** none
- **Build:** Plugin, `MainActivity` launcher in `onCreate`, Gradle deps, signing.
- **Verify:** APK and AAB built; emulator launch; paywall opens if an emulator with Play is available, else recorded per the brief.

### T29 — Deploy steps

- **Owns:** `scripts/deploy-server.mjs`, `scripts/firebase-setup.mjs`
- **Obeys:** §16.1 steps 9, 10
- **Frozen screens wired (ids in §10):** none
- **Build:** Soft failures print the exact action.
- **Verify:** §18 No Firebase admin; run with no Netlify token: action printed, build continues.

### T30 — Package steps

- **Owns:** `scripts/build-android.mjs`, `scripts/release-manifest.mjs`, `scripts/publish-packages.mjs`
- **Obeys:** §16.1 steps 12, 14, 15, §16.3
- **Frozen screens wired (ids in §10):** none
- **Build:** Per §16.
- **Verify:** §18 Packages.

### T31 — Server souvenir

- **Owns:** `server/souvenir/**`
- **Obeys:** §7.5, §14.3, §14.7, §4.10
- **Frozen screens wired (ids in §10):** none
- **Build:** Element, upload, finalize, SFTP adapter, mail with `mail.*` strings.
- **Verify:** §18 J7; repeat each call: no duplicate; resume a chunk at a wrong offset gets 409 with the true one.

### T32 — Server collect

- **Owns:** `server/collect/**`
- **Obeys:** §7.1, §15.3
- **Frozen screens wired (ids in §10):** none
- **Build:** Relay.
- **Verify:** Shell event in GA4 DebugView; unknown name dropped.

### T33 — Documents

- **Owns:** `DOCS/PRD.md`, `DOCS/ANALYTICS.md`, `DOCS/HOSTING.md`, `DOCS/WOOCOMMERCE-PLUGIN.md`, `README.md`
- **Obeys:** §7.6, §15, §16
- **Frozen screens wired (ids in §10):** none
- **Build:** Derived from these sections, restating nothing that differs. WooCommerce document expands the §7.6 column.
- **Verify:** Read against the sources.

## Final

### V1 — Whole-product verification

- **Owns:** none
- **Obeys:** §18, all
- **Frozen screens wired (ids in §10):** all 174 of §10
- **Build:** Run every §18 row on the live deploy after T01 to T33 land; fix through the owning task's files.
- **Verify:** Report committed, deployed and verified-live as separate states.

## Done by the coordinator, not coders

Admin-Manual project section and credentials; RevenueCat v3 webhook and configured offerings; Firebase and Netlify access; KStore archival of documents.
