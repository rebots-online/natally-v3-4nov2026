# 09 — Screens and routes

## 9.1 Routes

Router: `createBrowserRouter`; unknown paths on Surge get `200.html`, a copy of `index.html`. **Gates** (`src/app/Gate.tsx`, in order): `A` signed in, else `/sign-in?next=<path>`. `B` `useChart` ready, else `/birth`. `V` voice step done (profile stored, or `natally.voice.skipped`, or unsupported), else `/voice`.

| Route | Screen slug | Component file | Gates |
|---|---|---|---|
| `/` | `landing-desktop`, `landing-phone` | `src/landing/ScreenLanding.tsx` + `LandingDesktop.tsx`, `LandingPhone.tsx`. Redirects to `/pick` in shells and installed PWA (`display-mode: standalone`) | — |
| `/pick` | `pick-a-modality` | `src/modalities/ScreenPickModality.tsx` | — |
| `/sign-in` | `sign-in` | `src/auth/ScreenSignIn.tsx`; on success navigates to `next`; `src/app/lifecycle.ts` sees the session change and runs `reconcileNow('sign_in')` | — |
| `/auth/desktop` | (bridge, no frozen screen) | `src/auth/ScreenDesktopBridge.tsx` | — |
| `/checkout` | (status only) | `src/billing/ScreenCheckout.tsx` | A |
| `/birth` | `birth-details` | `src/chart/ScreenBirthDetails.tsx` | A |
| `/voice` | `voice-setup` | `src/voice/ScreenVoiceSetup.tsx` | A B |
| `/atelier` | `atelier`, `atelier-desktop` | `src/atelier/ScreenAtelier.tsx` + `AtelierPhone.tsx`, `AtelierDesktop.tsx` | A B V |
| `/atelier/lesson/:elementKey` | `atelier-chart-lesson` | `src/atelier/ScreenLesson.tsx` | A B V |
| `?sheet=synastry`, `?sheet=share` on the two above | `synastry-share-sheets` | `src/share/SheetSynastry.tsx`, `SheetShare.tsx` | — |
| `/top-up` | `top-up` | `src/billing/ScreenTopUp.tsx`; on Android `useOpenTopUp` presents the paywall instead and this route redirects to `/atelier` | A |
| `/profile` | `profile` | `src/account/ScreenProfile.tsx` | A |
| `/settings` | `settings` | `src/info/ScreenSettings.tsx` | — |
| `/about` | `about` | `src/info/ScreenAbout.tsx` | — |
| `/legal/:doc` | (text page in About's layout) | `src/info/ScreenLegal.tsx` | — |
| `/souvenir` | `souvenir-offer` | `src/souvenir/ScreenSouvenirOffer.tsx` | A |
| `/shared/:shareId` | (read-only `#share-sheet` layout) | `src/share/ScreenSharedChart.tsx` | — |
| `<host>/<token>/index.html` | `souvenir-atelier` | `src/souvenir-runtime/main.tsx`, `SouvenirAtelier.tsx`; entry `souvenir.html` | — |
| PDF pages, no route | `souvenir-pdf-opening`, `souvenir-pdf-elements` | `src/souvenir/pdf/pageCover.ts`, `pageChart.ts`, `pagePositions.ts`, `pageConversation.ts`, `pageGroupCover.ts`, `pageElementCover.ts`, `pageDeepDive.ts` | — |

`/birth`, `/atelier`, `/atelier/lesson/:elementKey` are declared by `src/modalities/natal/manifest.ts`. All others are `src/app/routes.tsx`. Every screen is `React.lazy`, and its file exports `default`. `src/app/routes.tsx` finds screens with `import.meta.glob`, so an absent screen falls through to `src/app/NotFound.tsx` (canvas and version badge).

Layouts: phone below `tablet-min` (768 px), desktop at `desktop-min` (1101 px) for the atelier. Between 768 and 1100 the atelier uses the phone layout at content width and landing uses desktop. `ScreenLesson` above `desktop-min` puts `#chart-main-view` and controls left, `#lesson-conversation` right, same columns as `atelier-desktop`.

## 9.2 Regions

| Screen | Region → component |
|---|---|
| `pick-a-modality` | `#natally-app-icon` icon; `#modality-list` maps `listModalities()` to `ModalityCard`; `#version-badge` `VersionBadge`. Locked cards have no action |
| `landing-*` | `#landing-nav`; hero, calculated, wheel, keep-asking sections as `LandingSection` with `OfferCard` (prices from `useCatalog`, empty until loaded, never typed); `#landing-atelier` is `RoomStage` plus `ChartInset` with the live example wheel; `#landing-prices`; steps; `#landing-install` shown only if `platform.showInstallOptions` |
| `sign-in` | `#signin-card`; `SegmentedTabs` at `#signin-mode-tabs`; phone mode adds the invisible reCAPTCHA container `#signin-recaptcha` |
| `birth-details` | `#birth-form` is `BirthFields` idPrefix `birth`; the Whole Sign note stays visible as frozen |
| `voice-setup` | `#voice-download-progress`, `#voice-load-progress`, `#voice-tune-progress` are `ProgressRow`; `#voice-calibration-result` values from `VoiceProfile`, hidden until `ready`. `Speed` = `realTimeFactor` to one decimal; `Sentences ready ahead` = `sentencesAhead`; `Voices working at once` = `chosen.workers` |
| `atelier`, `atelier-desktop` | `#atelier-header`, `CreditPill` at `#atelier-topup-button`; `#atelier-scene` is `AtelierStage`; `#atelier-status` `StatusLine`; `#atelier-conversation` is `ConversationPanel` |
| `atelier-chart-lesson` | Header pill; `#chart-main-view` is `AtelierStage` forced to chart main; `#chart-status`; `#element-chip-row` shows the seven frozen chips; `#lesson-conversation` is `LessonPanel` |
| `synastry-share-sheets` | Each sheet in `BottomSheet`. The `SHEET 1` and `SHEET 2` captions are design labels and are not ported |
| `top-up` | `#topup-pack-list` is `PackRow` with `role=radio`; prices from catalogue |
| `profile` | `#profile-balance-card`; `#profile-transactions` maps `useLedger()`: title `billing.rowCredits`, `billing.rowSouvenir` or `billing.rowUsage`; amount in `Cr` with sign; `<priceLabel> · <date> · paid`; souvenir rows add the two buttons |
| `settings`, `about` | As frozen. `#about-version` is `config.version` with `v` prefix. About's "Her voice" paragraph gains `about.machineSpeech`, required by the licence |
| `souvenir-offer` | Offer always; `#souvenir-ready-card` when the job is `ready`; while working, the buy block is replaced by `ProgressRow`s (§11, journey 7). "AFTER PURCHASE" is a design caption and is not ported |
| `souvenir-atelier` | `#souvenir-scene`, `#souvenir-inset-handle` with a real `ChartWheel` from snapshot data; `#souvenir-conversation` saved turns; the `[a new question]` reply card appears only after Ask |
| `souvenir-pdf-*` | Each `TEMPLATE:` caption is a design label, not printed. Pages drawn per §14.5 |

## 9.3 Stage, wheel, room

`AtelierStage` (`src/atelier/AtelierStage.tsx`): main is `RoomStage` or `ChartWheel` by `chartMain`; the other sits in `ChartInset` with title `Move chart` or `Move room`. Tapping the inset swaps them. Room inset is `RoomStage`; the same `Chart` and highlight feed both modes.

`ChartWheel` (`src/wheel/ChartWheel.tsx`): one `THREE.WebGLRenderer`, orthographic-feel `PerspectiveCamera` tilted 18 degrees. Group of ring meshes: outer gold ring, sign band with glyph sprites from a canvas atlas drawn in Natally Symbols, house cusps as thin boxes, planet spheres with glyph sprites, aspect lines as `Line2`-free thin boxes. Colours only from `chart-*` and `aspect-*` tokens. Ascendant at nine o'clock at rest. Idle spin 1 revolution per 240 s about the axis; pointer drag rotates and pauses the spin for 4 s; wheel or pinch zooms 0.7× to 2.5×. Pointer tap ray-casts: planet, angle, house sector or sign → `onSelect`. Highlight: non-selected meshes fade to `chart-dim`, selected gets `chart-halo` ring with a `highlight-pulse` opacity pulse; an aspect key lights both planets and the line. Motion paused: no spin, no pulse, static halo; drag still works. WebGL unavailable: draws `flatWheelShapes` to a 2D canvas, same highlight, no rotation. `onSelect` navigates to the lesson.

## 9.4 Room motion and sound

`RoomStage` layers: `puppet-cleanplate.webp` at the bottom; two copies of `room.webp` above it, clipped with `clip-path: polygon()` around head and hands (polygons measured by the coder against the art in `src/room/geometry.ts`, in 1586×992 coordinates). Head: slow idle sway ±1.2 degrees over 6 s; while `speaking`, a smaller bob of 280 ms. Hands: ±0.8 degrees over 4 s. Paused motion shows `poster.webp` alone. No other art is added.

| Brand file | Use |
|---|---|
| `natally-guide-512.png` | Atelier header icon crossfades to it while she speaks, if motion is allowed |
| `natally-mascot.webp` | Replaces the still cameo on `voice-setup` during download and tuning, if motion is allowed |
| `natally-still.webp`, `192x192.png` | As frozen |
| `180x180.png`, `192x192.png`, `512x512.png` | `apple-touch-icon` and PWA manifest icons; `natally-icon-master.png` and `natally-guide.png` are the Tauri icon source and the larger guide source, passed to `tauri icon` by the `shells` task |

| Sound | File | When (only if `roomSounds`) |
|---|---|---|
| Room ambience | `workshop-ambience.mp3` | Loop while room is main |
| Chart ambience | `chart-ambience.mp3` | Loop while chart is main |
| `credit_arrived` | `cookie-bite-crunch.mp3` or `cookie-bite-crunch-v2.mp3`, picked at random | `natally:credits-arrived` |
| `swap` | `bowlingball.mp3` | Main view swap |
| `idle_shelf` | `shelf-wobble.mp3` | Random every 120 to 300 s while idle in the room |
| `idle_brass` | `brass-clatter.mp3` | Random, same timer |
| `reading_failed` | `crystal-break.mp3` | Reading phase `failed` |
| `purchase_failed` | `glass-shatter.mp3` | Checkout outcome `failed` |
| `souvenir_ready` | `brass-clatter.mp3` | Job `ready` |

Ambience gain = `roomVolume / 100`. Audio starts only after a first user gesture, as webviews require.
