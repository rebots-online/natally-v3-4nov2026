# Natally v3 — Architecture

The snapshot of the finished product. Nothing may be built that is not here; everything the brief requires is here. `CHECKLIST.md` is the build recipe.

## Index

| File | Contents |
|---|---|
| `DOCS/ARCHITECTURE.md` | This index, system shape, authorities, entity table |
| `DOCS/ARCHITECTURE/01-scope-platforms.md` | Product scope, platform matrix, platform adapter |
| `DOCS/ARCHITECTURE/02-technology.md` | Pinned dependencies and tools |
| `DOCS/ARCHITECTURE/03-modules.md` | Repository tree, module catalogue, import rules, file ownership |
| `DOCS/ARCHITECTURE/04-types.md` | Shared TypeScript types |
| `DOCS/ARCHITECTURE/05-interfaces.md` | Cross-module signatures |
| `DOCS/ARCHITECTURE/06-data.md` | Firestore, security rules, on-device storage |
| `DOCS/ARCHITECTURE/07-server.md` | Handlers and the credit and key algorithms |
| `DOCS/ARCHITECTURE/08-config.md` | Every environment variable, pointer rules |
| `DOCS/ARCHITECTURE/09-screens.md` | Routes, screen components |
| `DOCS/ARCHITECTURE/10-elements.md` | All 174 interactive elements and their actions |
| `DOCS/ARCHITECTURE/11-journeys.md` | The ten journeys as state machines, added strings |
| `DOCS/ARCHITECTURE/12-voice.md` | Voice pipeline |
| `DOCS/ARCHITECTURE/13-reading.md` | Reading pipeline |
| `DOCS/ARCHITECTURE/14-souvenir.md` | Souvenir pipeline |
| `DOCS/ARCHITECTURE/15-analytics.md` | Event catalogue, consent, transports |
| `DOCS/ARCHITECTURE/16-build.md` | `build_all.sh`, manifest, PWA update, signing |
| `DOCS/ARCHITECTURE/17-security.md` | Secrets, privacy, shell content rules, licences |
| `DOCS/ARCHITECTURE/18-verification.md` | One real-flow procedure per journey |
| `DOCS/ARCHITECTURE/19-appendices.md` | A: facts verified. B: not verified |
| `DOCS/ARCHITECTURE/modules.json` | Machine-readable module list |

## System shape

```
                     ┌────────────────────────── one Vite + React + TS build ──────────────────────────┐
                     │  Web/PWA (Surge)     Android (Tauri, Play)     Linux, Windows (Tauri)           │
 customer ──────────►│  src/app → screens → modules → src/platform (web | android | desktop)            │
                     │  Workers: Supertonic ORT pool   WASM: Swiss Ephemeris   three.js wheel           │
                     └──┬──────────┬─────────────┬──────────────┬────────────────┬─────────────┬───────┘
        ID token/live   │          │ JS SDK /    │ SSE with     │ weights        │ gtag        │ POST /api/*
                        ▼          ▼ Paywalls    ▼ per-user key ▼ (first run)    ▼ (web only)  ▼
                  Firebase Auth  RevenueCat    OpenRouter     Hugging Face      GA4     ┌── server/ handlers ──┐
                  Cloud Firestore  ▲ ▲           ▲ ▲                             ▲      │ Netlify │ Node        │
                        ▲          │ └ webhook ──┼─┼─────────────────────────────┼────►│ reconcile, keys,      │
                        │          └ confirm ◄───┼─┼─────────────────────────────┼─────│ souvenir, collect     │
                        │                        └─┴ mint, usage, chapters ◄─────┼─────│                       │
                        └ ledger, balance writes (server only) ◄─────────────────┼─────│                       │
                                                                  Measurement ◄──┘     └──┬────────────────────┘
                                                                  Protocol                ├─ SFTP ► shared host: PDF, frozen atelier
                                                                                          └─ SMTP ► customer's email
```

## Authorities

| Fact | Single authority | Working copy |
|---|---|---|
| Identity | Firebase Auth | SDK session, `useSession` |
| Purchase happened | RevenueCat (via its API) | `users/{uid}/ledger` entry |
| Balance | `users/{uid}.balanceMilli`, server written | `useAccount` live listener |
| Real spend | OpenRouter key `usage` | `usage` ledger entries |
| Price text | RevenueCat product data, at run time | `useCatalog` memory |
| Credits per product | `VITE_PRODUCT_CREDITS_JSON` | `config`, `ServerConfig` |
| Chart numbers | `computeChart` from birth details | `users/{uid}/charts/primary` |
| Birth details | `users/{uid}/private/profile` | `useChart` |
| Conversation | `users/{uid}/conversations` | `useConversation` |
| Saved souvenir | Create-only `users/{uid}/souvenirs/{id}` | Page `data.json`, PDF |
| Souvenir links | Ledger entry `souvenir` | Profile row, email |
| Voice profile, weights | Device | `natally.voice.profile`, OPFS |
| Settings | Device `natally.settings` | `useSettings` |
| Version | `scripts/version-state.json` + stamp | `config.version` |
| Colour, type, motion | `design-system/tokens*.json` | `tokens.css` |
| UI | `LIBS/UI/STITCH/` | Components |

## Entities

Exhaustive. "Engaged by" names what uses it; a thing that nothing engages must not exist.

| Entity | Kind | Defined | Engaged by |
|---|---|---|---|
| Account | Firestore | §6.1 `AccountDoc` | `reconcileUser`, `settleUsage`, `useAccount`, `CreditPill`, Top Up gating |
| Ledger entry | Firestore | §6.1, §6.2 | Reconcile, settle, finalize, `useLedger`, Profile rows, souvenir trigger |
| Profile | Firestore | `ProfileDoc` | `saveBirth`, `useProfile`, headers, Profile screen |
| Chart | Firestore, type | `Chart` | `saveBirth`, wheel, lessons, reading prompt, share, snapshot, PDF |
| Birth details | Type | `BirthDetails` | `BirthFields`, `computeChart`, prompt, snapshot |
| Place | Static data | `public/geo/cities.json`, `BirthPlace` | `searchPlaces` (built by `src/chart/tools/build-cities.mjs` from GeoNames `cities15000`) |
| Chart element | Closed sets | §4.2 | Selects, chips, wheel tap, cues, lessons, plan |
| Lesson | Bundled text | `src/lessons/content/` for 11 planets and points, 4 angles, 12 signs, 12 houses, 5 aspect types | `ScreenLesson`, spoken lesson |
| You and element | Computed | `youAndElement` | `ScreenLesson` |
| Conversation, turn | Firestore | §4.4 | `reading`, panels, `loadSavedTurns`, erase |
| Reading key | Memory, OpenRouter | `MintedKey`, `serverKeys` | `ensureReadingKey`, stream, mint, settle |
| Transit snapshot | Computed | `TransitSnapshot` | Horoscope prompt |
| Synastry pair | Memory | `SynastryPair` | Sheet, prompt |
| Rail (client) | Interface | `BillingRail` | `src/billing/rails/revenuecatWeb.ts`, `revenuecatPlay.ts` |
| Rail (server) | Interface | `ServerRail` | `server/billing/rails/revenuecat.ts` |
| Catalogue product | Runtime | `CatalogProduct` | Top Up, landing, souvenir offer |
| Pending product | sessionStorage | `natally.pendingProduct` | Landing, `/checkout` |
| Offerings | RevenueCat, config | `VITE_RC_OFFERING_CREDITS`, `VITE_RC_OFFERING_SOUVENIR` | Rails; `offerings.all[id]`, `getOffering(id)`; never current |
| Entitlement | Account field | `EntitlementKey` | Modality gate |
| Modality manifest | Folder | `src/modalities/<key>/manifest.ts` | Registry, splash, routes |
| Voice profile | localStorage | `VoiceProfile` | Queue, setup screen, analytics |
| Voice worker | Worker | §12.5 | Pool |
| Speech session | Runtime | `SpeechSession` | `reading`, lesson, souvenir excluded |
| Status line | Derived | `StatusLineState` | `#atelier-status`, `#chart-status` |
| 3D wheel | Component | `ChartWheel` | Stage, landing inset, frozen page |
| Flat wheel | Function | `flatWheelShapes` | Share, PDF, WebGL fallback |
| Room stage, sounds | Component | §9.4 | Stage, landing, frozen page |
| Snapshot | Firestore | `SouvenirSnapshot` | Pipeline, element handler |
| Element content | Firestore | `SouvenirElementContent` | PDF, element handler |
| Souvenir job | Firestore | `SouvenirJob` | Offer screen, resume |
| Frozen atelier | Remote files | §14.6 | Customer, PDF links, Profile row, email |
| Souvenir PDF | Remote file | §14.5 | Customer, Profile row, email |
| Delivery adapter | Interface | `DeliveryAdapter` | Upload, finalize |
| Public share | Firestore | `publicShares` | Copy link, `/shared/:id` |
| Analytics event | Catalogue | §15 | Every funnel step |
| Platform adapter | Interface | `PlatformAdapter` | Auth, billing, voice, save, analytics, updates |
| Configuration | `.env` | §8 | `src/config`, `server/core/config.ts`, scripts |
| Deploy target | Config | `WEB_DEPLOY_TARGETS` | `deploy-web`, canonical origin, CORS, authorized domains |
| Handler | Route | §7.1 | Client, RevenueCat |
| Release manifest | File | §16.3 | Operator |
| Service worker | Generated | §16.5 | PWA update |
| Design tokens | Files | `design-system/` | `tokens.css`, `src/ui`, wheel, PDF |
| Brand files | Files | `public/brand`, `public/atelier` | §9.4, §14 |
