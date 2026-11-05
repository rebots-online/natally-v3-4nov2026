# 05 — Cross-module interfaces

Each is exported from the module's `index.ts`. Contract in one or two lines. Nothing else crosses a module boundary.

## 5.1 `config`, `settings`

```ts
export const config: ClientConfig;                 // frozen object; throws at boot naming any missing required variable
export function useSettings(): LocalSettings;
export function getSettings(): LocalSettings;
export function updateSettings(patch: Partial<LocalSettings>): void; // persists to localStorage key natally.settings
```
Defaults: `readAloud` true, `roomSounds` true, `roomVolume` 70, `pauseMotion` false, `analyticsConsent` true, `chartMain` `'room'`.

## 5.2 `ui`

Components, all tokens-only, props exactly as named. Each renders the frozen classes.

```ts
Button(props: { id: string; variant: 'primary'|'secondary'|'ghost'; disabled?: boolean; busy?: boolean; onClick?: () => void; type?: 'button'|'submit'; children })
Input(props: { id: string; label?: string; type?: string; value: string; onChange(v: string): void; placeholder?: string; error?: string|null; autoComplete?: string })
Select(props: { id: string; value: string; options: {value: string; label: string}[]; onChange(v: string): void; disabled?: boolean })
Checkbox(props: { id: string; checked: boolean; onChange(v: boolean): void; label: string })
Toggle(props: { id: string; checked: boolean; onChange(v: boolean): void })
Slider(props: { id: string; value: number; min: number; max: number; onChange(v: number): void; label: string })
Card, OfferCard, ElementChip, ChatBubble, CalloutCard, CreditPill, StatusLine, SegmentedTabs, PackRow, ListRow, BottomSheet, Dialog, SceneCard, ChartInset, ModalityCard, ProgressRow, VersionBadge
export function showToast(text: string, tone?: 'neutral'|'success'|'error'): void;
export function ToastHost(): JSX.Element;
```
`StatusLine(props: { id: string; state: StatusLineState; text: string })`. `CreditPill(props: { id: string; balanceMilli: MilliCredits; onClick(): void })` renders `<n> Cr · Top Up`, `n = max(0, floor(balanceMilli/1000))`. `ChartInset(props: { id: string; handleId: string; title: string; onTap(): void; children })` drags by its handle, keeps position in `sessionStorage` `natally.inset.<id>`, calls `onTap` when released without having moved more than 6 px. `VersionBadge(props: { version: string })`. `ProgressRow(props: { id: string; label: string; state: 'waiting'|'active'|'done'|'failed'; detail: string; fraction: number|null })`: `null` shows no bar, so nothing is simulated.

## 5.3 `platform`

```ts
export function getPlatform(): PlatformAdapter;     // chosen once; contract in §4.11
```

## 5.4 `analytics`

```ts
export function initAnalytics(): void;              // installs transport, consent, web-vitals observer, global error capture
export function track<K extends keyof AnalyticsCatalog>(name: K, params: AnalyticsCatalog[K]): void; // silently dropped without consent
export function setAnalyticsUser(signedIn: boolean): void;  // sets the signed_in user property; never a uid
```

## 5.5 `auth`

```ts
export const firebaseApp: FirebaseApp;              // the single initialised app
export interface Session { status: 'loading'|'signed_out'|'signed_in'; uid: Uid|null; email: string|null; displayName: string|null; isNew: boolean; }
export function useSession(): Session;
export function getSession(): Session;
export function getIdToken(force?: boolean): Promise<string>;  // rejects 'signed_out'
export function signOutNow(): Promise<void>;        // also clears key cache via 'natally:signed-out' window event
export class ApiError extends Error { status: number; code: ApiErrorCode; }
export function apiFetch<T>(path: string, body?: unknown, opts?: { auth?: boolean; keepalive?: boolean }): Promise<T>; // POST JSON to apiBaseUrl with ID token; throws ApiError
export const ScreenSignIn: React.ComponentType;
export const ScreenDesktopBridge: React.ComponentType; // route /auth/desktop
```

## 5.6 `account`

```ts
export function useAccount(): { status: 'loading'|'ready'; account: AccountDoc|null; balanceMilli: MilliCredits };  // live onSnapshot of users/{uid}
export function useLedger(): { status: 'loading'|'ready'; entries: LedgerEntry[] };         // live, occurredAt descending, limit 200
export function useProfile(): { status: 'loading'|'ready'; profile: ProfileDoc|null };      // live
export function saveProfile(patch: Partial<ProfileDoc>): Promise<void>;                      // merge into users/{uid}/private/profile
export function getBalanceMilli(): MilliCredits;
export const ScreenProfile: React.ComponentType;
```

## 5.7 `billing`

```ts
export function getRail(): BillingRail;             // from platform.railKey; future rails register in src/billing/rails/index.ts
export function useCatalog(): { status: 'loading'|'ready'|'failed'; products: CatalogProduct[]; credits: CatalogProduct[]; souvenir: CatalogProduct|null };
export function buyProduct(productId: string, role: ProductRole): Promise<PurchaseAttempt>;  // purchase or paywall, then reconcileNow; fires checkout analytics
export function reconcileNow(trigger: 'app_open'|'sign_in'|'checkout_return'|'restore'): Promise<ReconcileResult>; // POST /api/purchases/reconcile; coalesces concurrent calls
export function restorePurchases(): Promise<ReconcileResult>;
export function useCheckoutHost(): React.RefObject<HTMLDivElement>; // element #rcb-ui-root rendered by ScreenTopUp, ScreenLanding, souvenir offer
export function useOpenTopUp(): () => void;        // Android: presentPaywall('credits') then reconcile. Others: navigate('/top-up')
export const ScreenTopUp: React.ComponentType;
export const ScreenCheckout: React.ComponentType;   // /checkout: buys natally.pendingProduct once, then navigates per §11
```

## 5.8 `chart`

```ts
export function computeChart(birth: BirthDetails): Promise<Chart>;
export function computeTransits(natal: Chart, at: Date): Promise<TransitSnapshot>;
export function computeSynastry(self: Chart, other: BirthDetails): Promise<SynastryPair>;
export function listChartElements(chart: Chart): ChartElementView[];  // order: planets, angles, houses 1-12, aspects by orb; signs excluded (they are reached through a wheel tap or a chapter)
export function elementView(chart: Chart, key: ChartElementKey): ChartElementView;
export function parseElementKey(raw: string): ChartElementKey | null;
export function useChart(): { status: 'loading'|'absent'|'ready'; birth: BirthDetails|null; chart: Chart|null };
export function saveBirth(birth: BirthDetails): Promise<Chart>;      // computes, writes users/{uid}/private/profile.birth and users/{uid}/charts/primary, tracks chart_calculated
export function searchPlaces(query: string, limit: number): Promise<BirthPlace[]>; // lazy-loads /geo/cities.json
export function BirthFields(props: { idPrefix: 'birth'|'synastry'; value: BirthFieldValues; onChange(v: BirthFieldValues): void; strings: BirthFieldStrings }): JSX.Element;
export function parseBirthFields(v: BirthFieldValues): { birth: BirthDetails } | { error: keyof BirthFieldErrors };
export const ScreenBirthDetails: React.ComponentType;
```
`BirthFieldValues`, `BirthFieldStrings`, `BirthFieldErrors` are exported types of this module (name, day, month, year, time, timeUnknown, place text, selected place).

## 5.9 `wheel`, `lessons`

```ts
export function ChartWheel(props: { chart: Chart; highlight: ChartElementKey|null; mode: 'main'|'inset'; onSelect?: (key: ChartElementKey) => void; id?: string }): JSX.Element;
   // three.js canvas. Respects useMotionPaused rule through settings and prefers-reduced-motion: no spin, instant pulse.
export interface FlatWheelShapes { circles: {cx:number;cy:number;r:number;stroke:string;width:number}[]; lines: {x1:number;y1:number;x2:number;y2:number;stroke:string;width:number}[]; glyphs: {x:number;y:number;text:string;size:number;fill:string}[]; }
export function flatWheelShapes(chart: Chart, size: number, withHouseNumbers: boolean): FlatWheelShapes; // ascendant at nine o'clock; used by canvas and PDF
export function renderWheelPng(chart: Chart, sizePx: number): Promise<Uint8Array>;    // flat wheel on chart ground for Save image

export function getLesson(key: LessonKey): Lesson;  // synchronous, bundled, never a model
export function youAndElement(chart: Chart, key: ChartElementKey): YouAndElement;     // computed text: sign, house, closest aspect
```

## 5.10 `voice`

```ts
export function isVoiceSupported(): Promise<boolean>;
export function useVoiceProgress(): VoiceProgress;
export function getVoiceProfile(): VoiceProfile | null;  // from localStorage natally.voice.profile
export function beginVoiceSetup(opts: { force: boolean }): Promise<VoiceProfile | null>; // download, load, calibrate; idempotent; force clears the profile but not the weights
export function ensureVoicePool(): Promise<boolean>;    // loads the calibrated pool lazily; false if absent or unsupported

export class SentenceSegmenter { push(text: string): string[]; flush(): string[]; }      // §12.4
export interface SpeechSession { utteranceId: string; pushSentence(s: SpokenSentence): void; endInput(): void; cancel(): void; }
export function openSpeech(utteranceId: string): SpeechSession;   // cancels the current session
export function pauseSpeech(): void;
export function resumeSpeech(): void;
export function setSpeechMuted(muted: boolean): void;
export function stopSpeech(): void;
export function onSpeechEvent(cb: (e: SpeechEvent) => void): () => void;
export function useSpeechState(): SpeechState;
export function synthesizeToPcm(text: string): Promise<{ pcm: Float32Array; sampleRate: number }>; // whole sentence, for souvenir replay audio; applies brand pitch and rate offline
export const ScreenVoiceSetup: React.ComponentType;
```

## 5.11 `room`

```ts
export function RoomStage(props: { speaking: boolean; className?: string; alt: string }): JSX.Element; // clean plate plus clipped head and hands layers; still image when motion paused
export function useRoomAudio(view: 'room'|'chart'|'off'): void;  // ambience loop while mounted and roomSounds on, at roomVolume
export function playRoomEffect(name: RoomEffect): void;          // no-op when roomSounds off
export function useMotionPaused(): boolean;                      // settings.pauseMotion OR prefers-reduced-motion
export type RoomEffect = 'credit_arrived'|'swap'|'idle_shelf'|'idle_brass'|'reading_failed'|'purchase_failed'|'souvenir_ready';
```

## 5.12 `atelier`

```ts
export const ScreenAtelier: React.ComponentType;    // chooses the phone or desktop layout at desktop-min
export const ScreenLesson: React.ComponentType;     // route param :elementKey
```

## 5.13 `reading`

```ts
export function startReading(req: ReadingRequest): Promise<ReadingRefusal | 'started'>; // checks balance, then runs §13; never throws to the caller
export function cancelReading(): void;
export function useReading(): { phase: ReadingPhase; currentTurnId: string|null; speakingSentence: SpokenSentence|null; cue: ChartElementKey|null; error: string|null };
export function useConversation(): { conversation: Conversation|null; turns: ReadingTurn[]; status: 'loading'|'ready' }; // active conversation, live
export function saveConversation(): Promise<void>;       // conversation.saved = true; also downloads transcript via platform.saveFile
export function eraseConversationHistory(): Promise<void>; // deletes every conversation and turn of this user; souvenir snapshots are untouched
export function loadSavedTurns(): Promise<ReadingTurn[]>;  // all turns of the active conversation, for the snapshot
export function appendCustomerTurn(text: string, kind: ReadingKind): Promise<ReadingTurn>;
export function ensureReadingKey(reason: MintReason): Promise<MintedKey | 'no_credits'>; // in-memory key cache
```

## 5.14 `share`

```ts
export function SheetSynastry(props: { onClose(): void; onSubmitted(pair: SynastryPair): void }): JSX.Element;
export function SheetShare(props: { chart: Chart; name: string; onClose(): void }): JSX.Element;
export function createShareLink(chart: Chart, name: string): Promise<string>; // writes publicShares/{id}; returns canonical /shared/{id}
export const ScreenSharedChart: React.ComponentType;     // route /shared/:shareId
```

## 5.15 `souvenir`

```ts
export const ScreenSouvenirOffer: React.ComponentType;
export function useSouvenirJob(): { job: SouvenirJob|null; ledgerEntry: LedgerEntry|null };
export function resumeSouvenirs(): Promise<void>;  // on app start after sign-in: continue any confirmed, unfinished souvenir (§14.2)
```

## 5.16 `modalities`, `landing`, `info`

```ts
export function listModalities(): ModalityManifest[];   // import.meta.glob('./*/manifest.ts'); order natal, then others by key
export function getModality(key: ModalityKey): ModalityManifest | null;
export function allModalityRoutes(): Promise<ModalityRoute[]>; // routes of every available manifest the customer may enter
export const ScreenPickModality: React.ComponentType;
export const ScreenLanding: React.ComponentType;        // chooses landing-desktop at tablet-min, else landing-phone
export const ScreenSettings: React.ComponentType;
export const ScreenAbout: React.ComponentType;
export const ScreenLegal: React.ComponentType;           // route /legal/:doc, doc 'terms'|'privacy'|'licence-<key>'
```

## 5.17 `app`

`src/app/boot.ts` exports nothing to other modules. `src/app/pwa.ts` also listens for two window events other modules may dispatch: `natally:typing` (detail boolean) from any text input, `natally:speaking` (detail boolean) from `voice`. They defer the update reload (§16.5).

## 5.18 Window events (the only global channel)

| Event | Detail | Dispatched by | Heard by |
|---|---|---|---|
| `natally:signed-out` | none | `auth` | `reading`, `billing` |
| `natally:typing` | boolean | `ui` `Input`, `atelier` composer | `app` |
| `natally:speaking` | boolean | `voice` | `app` |
| `natally:credits-arrived` | `{ credited: number }` | `billing` | `room`, `atelier` |

## 5.19 `server` shared contract

```ts
// server/core/http.ts
export type HandlerContext = { req: Request; cfg: ServerConfig; db: Firestore; uid: Uid | null; rawBody: string; json: unknown };
export interface Route { method: 'GET'|'POST'; path: string; auth: 'id_token'|'none'|'webhook'; handle(ctx: HandlerContext): Promise<Response>; }
export function routeRequest(req: Request, routes: Route[]): Promise<Response>;  // CORS, parse, auth, errors
export function jsonOk(body: unknown, status?: number): Response;
export function jsonError(code: ApiErrorCode, status: number, message?: string): Response;
export type ApiErrorCode = 'bad_request'|'unauthenticated'|'forbidden'|'not_found'|'method_not_allowed'|'no_credits'|'provider_unavailable'|'conflict'|'too_large'|'internal';
```
`ApiErrorCode` is declared in `src/types/api.ts`, re-exported here. Route lists are exported as `billingRoutes`, `keyRoutes`, `souvenirRoutes`, `collectRoutes`, `coreRoutes` from each module; `server/adapters/routes.ts` concatenates them.

## 5.20 `server` cross-module functions

```ts
// server/core
export function loadServerConfig(): ServerConfig;      // server/core/config.ts, the only process.env reader
export function getDb(cfg: ServerConfig): Firestore;
export function verifyIdToken(cfg: ServerConfig, bearer: string | null): Promise<Uid | null>;
// server/billing
export function reconcileUser(uid: Uid, ctx: Pick<HandlerContext,'cfg'|'db'>): Promise<ReconcileResult>;
// server/keys
export function settleUsage(uid: Uid, ctx: Pick<HandlerContext,'cfg'|'db'>): Promise<{ debitedMilli: MilliCredits; balanceMilli: MilliCredits }>;
```
`POST /api/purchases/reconcile` calls `settleUsage` after `reconcileUser`, so `server-billing` imports it from `server/keys/index.ts` (the one permitted cross-server-module call; `server-keys` imports nothing from `server-billing`).

## 5.21 Shell commands and plugin

| Name | Where | Signature | Contract |
|---|---|---|---|
| `app_platform` | Rust `src-tauri/src/commands.rs` | `() -> String` | `linux`, `windows` or `android` |
| `start_loopback` | Rust | `() -> { port: u16, state: String }` | Binds `127.0.0.1:0`, single request listener, 5-minute timeout |
| `await_loopback` | Rust | `(state: String) -> { id_token: String, access_token: Option<String> }` | Resolves when `GET /cb?state=…&id_token=…&access_token=…` matches; answers a page with `bridge.done` text |
| `plugin:natally-android\|googleSignIn` | Kotlin | `{ webClientId } -> { idToken }` | Credential Manager `GetSignInWithGoogleOption`-style request |
| `plugin:natally-android\|presentPaywall` | Kotlin | `{ offeringId, appUserId, apiKey } -> { outcome }` | Calls `MainActivity.launchPaywall`; result maps to `PurchaseOutcome` |
| `plugin:natally-android\|loadOffering` | Kotlin | `{ offeringId, appUserId, apiKey } -> { products: [{ productId, priceLabel, title }] }` | `Purchases.getOfferings`, `offerings.getOffering(id)`; never `current` |
| `plugin:natally-android\|restore` | Kotlin | `{ appUserId, apiKey } -> {}` | `Purchases.restorePurchases` |
| `plugin:natally-android\|saveToDownloads` | Kotlin | `{ fileName, mimeType, base64 } -> { uri }` | MediaStore Downloads |
