# 03 — Repository and modules

## 3.1 Tree

| Path | Purpose |
|---|---|
| `build_all.sh` | The only build entry |
| `.env.example` | Every variable with a neutral default |
| `index.html`, `souvenir.html` | Vite entries: the app; the frozen atelier page |
| `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `vite.config.ts` | Toolchain |
| `firestore.rules`, `firestore.indexes.json`, `firebase.json` | Firestore deploy inputs |
| `netlify/functions/api.mts` | One Netlify function, path `/api/*`, calls the Netlify adapter |
| `src/<module>/` | One folder per client module; `index.ts` is its only public door |
| `server/<module>/` | Server modules; `server/adapters/netlify.ts`, `server/adapters/node.ts` |
| `src-tauri/` | Tauri config, Rust, `gen/android`, `plugins/natally-android/` |
| `scripts/` | Build scripts (§16) and existing `kstore-remember.sh`, `build-frozen-index.py` |
| `public/` | Brand files (never edited), fonts, `geo/cities.json`, `ort/` (copied at build, git-ignored) |
| `design-system/` | Tokens; `tokens.css` is generated |
| `LIBS/UI/STITCH/` | The frozen UI; read-only reference for coders, never imported at run time |
| `.generated/` | Git-ignored files written by the resolver (§8.3) |
| `dist-web/`, `dist/` | Git-ignored web build and packages; `dist/RELEASE-MANIFEST.json` is tracked |

Add to `.gitignore` in Foundation: `.generated/`, `public/ort/`, `public/third-party.json`, `.netlify/`.

## 3.2 Import rules

1. A module imports another only through its `index.ts`, and only if listed under "Depends on". `import.meta.env` appears only in `src/config`; `process.env` only in `server/core/config.ts` and `scripts/`.
2. Layers run from low to high, no cycles: `types`, `config` → `settings`, `platform`, `ui` → `analytics` → `auth` → `account` → `billing`, `chart`, `voice` → `wheel`, `lessons`, `room` → `reading` → `share`, `souvenir` → `atelier` → `modalities`, `landing`, `info` → `app`. `wheel`, `lessons`, `room` import only lower layers in their list.
3. Exception to 1: `src/app/routes.tsx` and `src/modalities/*/manifest.ts` import `Screen*.tsx` files directly through dynamic import, for code splitting.
3b. `server/` imports nothing from `src/` except `src/types`. `src/` imports nothing from `server/`.
4. `souvenir-runtime` may not import `auth`, `reading`, `billing`, `chart`, `voice` or `config`: the frozen page has no Firebase, no model and no ephemeris.
5. Each module's user-facing text is in one file, `src/<module>/strings.ts`, exporting `const strings`. Frozen text is copied exactly. Source files stay under 500 lines.
6. Astrological glyphs come only from `src/types/glyphs.ts` (`GLYPHS: Record<PlanetKey | AngleKey | SignKey | AspectType, string>`), each followed by U+FE0E.
7. A frozen screen is ported by copying the `<body>` markup of its `index.html` into JSX: same element ids, same classes, same text; bracket placeholders and example values replaced by live data. Google Fonts and Tailwind CDN tags are dropped: fonts come from `src/ui/fonts.css`, utilities from `@tailwindcss/vite`, the screens' custom colours from `src/ui/frozen-theme.css`. The Material Symbols used by frozen screens become inline SVG from `src/ui/icons.tsx`.

## 3.3 Module catalogue and ownership

No file is owned by two modules. A coder may add private helpers in owned files; every name crossing a module boundary is fixed in §4 and §5. Obeys-column numbers are the `DOCS/ARCHITECTURE/NN-*.md` files.

| Key | Folder | Responsibility | Exports | Depends on | Frozen screens | Owns | Obeys |
|---|---|---|---|---|---|---|---|
| `config` | `src/config` | Only reader of import.meta.env; exposes the typed client configuration. | `config` | — | — | `src/config/**` | §04, §08 |
| `types` | `src/types` | Every type and closed set that crosses a module boundary. | all of §4 | — | — | `src/types/**` | §04 |
| `settings` | `src/settings` | Persisted per-device customer settings store. | `useSettings`, `getSettings`, `updateSettings` | types | — | `src/settings/**` | §04, §05, §06 |
| `ui` | `src/ui` | Fonts, token CSS import, frozen theme, the design-system components, version badge, toast, icons. | §5.2 components | types | — | `src/ui/**` | §05, §09 |
| `platform` | `src/platform` | Hides web, Android and desktop differences behind PlatformAdapter. | `getPlatform` | config, types | — | `src/platform/**` | §01, §04, §05 |
| `analytics` | `src/analytics` | Typed event catalogue, consent, the gtag and collect transports, page-speed and error capture. | `track`, `initAnalytics`, `setAnalyticsUser` | config, types, settings, platform | — | `src/analytics/**` | §04, §05, §15 |
| `auth` | `src/auth` | Firebase Auth session, all sign-in methods, the desktop bridge page, ID tokens for server calls. | `useSession`, `getIdToken`, `signOutNow`, `apiFetch`, `firebaseApp` | config, types, platform, analytics, ui | `sign-in` | `src/auth/**` | §01, §05, §09, §10, §11 |
| `account` | `src/account` | Live account and ledger, profile document, Profile screen. | `useAccount`, `useLedger`, `useProfile`, `saveProfile` | config, types, auth, analytics, ui | `profile` | `src/account/**` | §05, §06, §09, §10, §11 |
| `billing` | `src/billing` | Client rails, catalogue, purchases, reconcile triggers, Top Up screen. | `useCatalog`, `buyProduct`, `reconcileNow`, `restorePurchases`, `getRail` | config, types, platform, auth, account, analytics, ui | `top-up` | `src/billing/**` | §01, §04, §05, §07, §09, §10, §11 |
| `chart` | `src/chart` | Swiss Ephemeris calculation, places, time zones, element views, Birth details screen. | `computeChart`, `computeTransits`, `computeSynastry`, `listChartElements`, `elementView`, `useChart`, `saveBirth`, `searchPlaces`, `BirthFields`, `parseBirthFields` | config, types, auth, account, analytics, ui | `birth-details` | `src/chart/**`, `public/geo/**` | §04, §05, §06, §09, §10, §11 |
| `wheel` | `src/wheel` | The real 3D wheel and the flat vector wheel used by share and PDF. | `ChartWheel`, `flatWheelShapes`, `renderWheelPng` | types, settings, ui | — | `src/wheel/**` | §04, §05 |
| `lessons` | `src/lessons` | Authored lesson text and the computed You and [element]. | `getLesson`, `youAndElement` | types | — | `src/lessons/**` | §04, §05 |
| `voice` | `src/voice` | Supertonic download, calibration, sentence segmenting, worker pool, gapless queue, Voice setup screen. | §5.10 | config, types, settings, platform, analytics, ui | `voice-setup` | `src/voice/**`, `public/ort/**` | §04, §05, §09, §10, §11, §12 |
| `room` | `src/room` | Puppet motion over the clean plate, ambience and sound effects, motion pause rule. | `RoomStage`, `useRoomAudio`, `playRoomEffect`, `useMotionPaused` | types, settings, ui | — | `src/room/**` | §05, §09 |
| `reading` | `src/reading` | Prompt assembly, key cache, streaming, resume, sentence and cue hand-off, conversation storage. | §5.13 | config, types, auth, account, chart, voice, analytics | — | `src/reading/**` | §04, §05, §06, §07, §13 |
| `share` | `src/share` | Synastry sheet, Share sheet, the public shared chart page. | `SheetSynastry`, `SheetShare`, `createShareLink` | config, types, platform, auth, chart, wheel, analytics, ui | `synastry-share-sheets` | `src/share/**` | §05, §06, §09, §10, §11 |
| `souvenir` | `src/souvenir` | Snapshot, element generation client, replay audio, PDF renderer, atelier package, delivery client, Souvenir offer screen. | `SouvenirOfferRoute`, `useSouvenirJob`, `resumeSouvenirs` | config, types, platform, auth, account, billing, chart, wheel, voice, reading, analytics, ui | `souvenir-offer`, `souvenir-pdf-opening`, `souvenir-pdf-elements` | `src/souvenir/**` | §04, §05, §06, §07, §09, §10, §11, §14 |
| `souvenir-runtime` | `src/souvenir-runtime` | The stand-alone static page that replays a saved reading; second Vite entry. | nothing; it is a page | types, wheel, room, ui | `souvenir-atelier` | `src/souvenir-runtime/**`, `souvenir.html` | §09, §10, §14 |
| `atelier` | `src/atelier` | The atelier screens, stage swap, conversation panel, lesson view, status line. | `ScreenAtelier`, `ScreenLesson` | config, types, settings, platform, auth, account, billing, chart, wheel, lessons, voice, room, reading, share, analytics, ui | `atelier`, `atelier-desktop`, `atelier-chart-lesson` | `src/atelier/**` | §05, §09, §10, §11, §12, §13 |
| `modalities` | `src/modalities` | Modality registry, the splash, natal as module one, locked manifests. | `listModalities`, `getModality`, `allModalityRoutes` | types, auth, account, atelier, analytics, ui | `pick-a-modality` | `src/modalities/**` | §04, §05, §09, §10, §11 |
| `landing` | `src/landing` | Both landing layouts, live example chart, product-preselecting buttons, install links. | `ScreenLanding` | config, types, platform, auth, billing, chart, wheel, room, analytics, ui | `landing-desktop`, `landing-phone` | `src/landing/**` | §05, §09, §10, §11, §15 |
| `info` | `src/info` | Settings, About, licence texts, Terms and Privacy pages. | `ScreenSettings`, `ScreenAbout`, `ScreenLegal` | config, types, settings, platform, auth, voice, reading, chart, analytics, ui | `settings`, `about` | `src/info/**` | §05, §09, §10, §11, §17 |
| `app` | `src/app` | Boot, secure-origin rule, routes and gates, lifecycle reconcile, PWA update, lazy-chunk recovery. | nothing; entry | config, types, settings, platform, ui, analytics, auth, account, billing, chart, voice, modalities, landing, info, souvenir, share | — | `src/app/**`, `index.html` | §01, §05, §09, §16 |
| `server-core` | `server/core` | Router, adapters, CORS, auth, Firestore admin, errors, Firestore rules and indexes. | §5.20 | types | — | `server/core/**`, `server/adapters/**`, `netlify/**`, `firestore.rules`, `firestore.indexes.json`, `firebase.json` | §05, §06, §07, §08 |
| `server-billing` | `server/billing` | Server rails, reconcile and credit grant, webhook handler. | `reconcileUser`, handlers | server-core, server-keys, types | — | `server/billing/**` | §04, §06, §07 |
| `server-keys` | `server/keys` | OpenRouter key mint, usage settlement, key retirement. | `settleUsage`, handlers | server-core, types | — | `server/keys/**` | §04, §06, §07 |
| `server-souvenir` | `server/souvenir` | Keepsake element generation, chunk upload, publish, email, links on the ledger. | handlers | server-core, types | — | `server/souvenir/**` | §04, §06, §07, §14 |
| `server-collect` | `server/collect` | Measurement Protocol relay for the shells. | handler | server-core, types | — | `server/collect/**` | §07, §15 |
| `shells` | `src-tauri` | Tauri config, Rust commands, Android plugin and activity, signing wiring. | Commands in §5.21 | — | — | `src-tauri/**` | §01, §16, §17 |
| `docs` | `DOCS` | The PRD, analytics contract, hosting note, WooCommerce plugin requirements, README. | nothing | — | — | `DOCS/PRD.md`, `DOCS/ANALYTICS.md`, `DOCS/HOSTING.md`, `DOCS/WOOCOMMERCE-PLUGIN.md`, `README.md` | §07, §15, §16 |
| `build` | `scripts` | build_all.sh, env resolver, tokens, deploy, packages, manifest, .env.example. | Scripts in §16 | — | — | `build_all.sh`, `scripts/*.mjs`, `scripts/version-state.json`, `.env.example`, `.gitignore`, `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `vite.souvenir.config.ts`, `tsconfig.json`, `design-system/tokens.css` | §08, §16 |
