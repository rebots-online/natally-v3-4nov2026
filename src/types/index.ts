// The shared types of §4, verbatim. Closed-set arrays are the only runtime code from §4.
import type * as React from 'react';
import type { AnalyticsCatalog } from './analytics';

export type { AnalyticsCatalog } from './analytics';
export { ANALYTICS_EVENT_NAMES } from './analytics';
export type { ApiErrorBody, ApiErrorCode } from './api';
export { GLYPHS } from './glyphs';

// §4.1 Primitive aliases
export type Uid = string;              // Firebase uid; also the RevenueCat app user id
export type IsoInstant = string;       // ISO 8601 UTC with seconds
export type MilliCredits = number;     // integer; 1 Cr = 1000. All balances and ledger amounts
export type Usd = number;

// §4.2 Chart
export const PLANET_KEYS = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','north_node'] as const;
export const ANGLE_KEYS = ['ascendant','midheaven','descendant','ic'] as const;
export const SIGN_KEYS = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'] as const;
export const HOUSE_KEYS = ['house_1','house_2','house_3','house_4','house_5','house_6','house_7','house_8','house_9','house_10','house_11','house_12'] as const;
export const ASPECT_TYPES = ['conjunction','sextile','square','trine','opposition'] as const;
export type PlanetKey = typeof PLANET_KEYS[number];
export type AngleKey = typeof ANGLE_KEYS[number];
export type SignKey = typeof SIGN_KEYS[number];
export type HouseKey = typeof HOUSE_KEYS[number];
export type AspectType = typeof ASPECT_TYPES[number];
/** A lesson subject. */
export type LessonKey = PlanetKey | AngleKey | SignKey | HouseKey | AspectType;
/** One lightable thing on a wheel. An aspect instance is `aspect:<planetA>:<type>:<planetB>` with A before B in PLANET_KEYS order. */
export type AspectInstanceKey = `aspect:${PlanetKey}:${AspectType}:${PlanetKey}`;
export type ChartElementKey = PlanetKey | AngleKey | SignKey | HouseKey | AspectInstanceKey;
export type ChartElementKind = 'planet' | 'angle' | 'sign' | 'house' | 'aspect';
export type HouseSystem = 'placidus' | 'whole_sign';
export type HouseSystemReason = 'chosen' | 'time_unknown' | 'polar_latitude';

export interface BirthPlace { label: string; latitude: number; longitude: number; timeZone: string; }
export interface BirthDetails {
  name: string;
  year: number; month: number; day: number;        // month 1 to 12
  hour: number | null; minute: number | null;       // local clock; both null when unknown
  timeUnknown: boolean;
  place: BirthPlace;
}
export interface PlanetPosition {
  key: PlanetKey; longitude: number; sign: SignKey;
  degree: number; minute: number;                  // within the sign
  house: number;                                   // 1 to 12
  speed: number; retrograde: boolean;
}
export interface AnglePosition { key: AngleKey; longitude: number; sign: SignKey; degree: number; minute: number; }
export interface HouseCusp { house: number; longitude: number; sign: SignKey; }
export interface ChartAspect { key: AspectInstanceKey; a: PlanetKey; b: PlanetKey; type: AspectType; orb: number; applying: boolean; }
export interface Chart {
  schema: 'natally.chart/v1';
  julianDayUt: number; computedAt: IsoInstant;
  houseSystem: HouseSystem; houseSystemReason: HouseSystemReason;
  planets: PlanetPosition[];
  angles: AnglePosition[];                          // empty when time is unknown
  houses: HouseCusp[];                              // always 12
  aspects: ChartAspect[];                           // sorted by orb ascending
  firstHouseFrom: 'ascendant' | 'sun_sign';
}
export interface ChartElementView {
  key: ChartElementKey; kind: ChartElementKind; lessonKey: LessonKey;
  glyph: string;                                    // with U+FE0E
  name: string;                                     // "Venus", "7th House", "Sun Trine Jupiter"
  optionLabel: string;                              // "Venus in Libra (7th House)"
}
export interface YouAndElement { key: ChartElementKey; heading: string; text: string; }
export interface SynastryPair { self: Chart; other: Chart; otherName: string; crossAspects: ChartAspect[]; }
export interface TransitSnapshot { at: IsoInstant; planets: PlanetPosition[]; aspectsToNatal: ChartAspect[]; }

// §4.3 Lessons
export interface Lesson { key: LessonKey; title: string; glyph: string; body: string[]; invitation: string; }

// §4.4 Conversation
export type ReadingKind = 'question' | 'personal_reading' | 'horoscope' | 'synastry';
export type TurnRole = 'customer' | 'natally';
export type TurnStatus = 'streaming' | 'complete' | 'cut';   // 'cut': stream ended and could not resume
export interface SpokenSentence { index: number; text: string; cue: ChartElementKey | null; }
export interface ReadingTurn {
  id: string; conversationId: string; role: TurnRole; kind: ReadingKind | 'lesson_note';
  text: string; sentences: SpokenSentence[];         // empty for customer turns
  status: TurnStatus; model: string | null; createdAt: IsoInstant;
}
export interface Conversation { id: string; modality: ModalityKey; title: string; createdAt: IsoInstant; updatedAt: IsoInstant; saved: boolean; }
export type ReadingRefusal = 'no_credits' | 'no_chart' | 'offline';
export type ReadingPhase = 'idle' | 'minting' | 'thinking' | 'streaming' | 'resuming' | 'done' | 'failed';
export interface ReadingRequest { kind: ReadingKind; question: string | null; focus: ChartElementKey | null; synastry: SynastryPair | null; }

// §4.5 Account and ledger
export interface AccountDoc {
  uid: Uid; balanceMilli: MilliCredits; entitlements: EntitlementKey[];
  lifetimeGrantedMilli: MilliCredits; lifetimeDebitedMilli: MilliCredits;
  createdAt: IsoInstant; updatedAt: IsoInstant;
}
export type EntitlementKey = 'natal' | 'tarot' | 'iching' | (string & {});
export type LedgerKind = 'purchase' | 'souvenir_purchase' | 'usage';
export interface LedgerEntry {
  id: string;                                       // see §6.2
  kind: LedgerKind; amountMilli: MilliCredits;      // positive grant, negative debit
  balanceAfterMilli: MilliCredits;
  rail: RailKey | null;
  providerTransactionId: string | null; productId: string | null;
  priceLabel: string | null;                        // provider's price text for the row, for example "US$10.00"
  usageUsd: Usd | null; keyHash: string | null;
  souvenir: { snapshotId: string | null; pdfUrl: string | null; atelierUrl: string | null } | null;
  occurredAt: IsoInstant; recordedAt: IsoInstant;
}
export interface ProfileDoc {
  displayName: string | null; email: string | null;
  birth: BirthDetails | null; onboardedVoice: boolean; updatedAt: IsoInstant;
}
export interface LocalSettings {
  readAloud: boolean; roomSounds: boolean; roomVolume: number; // 0 to 100
  pauseMotion: boolean; analyticsConsent: boolean;
  chartMain: 'room' | 'chart';
}

// §4.6 Billing
export type RailKey = 'revenuecat_web' | 'revenuecat_play' | 'chargebee' | 'woocommerce';
export type RailCapability = 'embedded_checkout' | 'native_paywall' | 'hosted_checkout';
export type ProductRole = 'credits' | 'souvenir';
export type PurchaseOutcome = 'purchased' | 'cancelled' | 'pending' | 'failed';
export interface CatalogProduct { productId: string; role: ProductRole; priceLabel: string; credits: number; title: string; }
export interface PurchaseAttempt { outcome: PurchaseOutcome; productId: string | null; message: string | null; }
/** Client side of a rail. */
export interface BillingRail {
  key: RailKey; capability: RailCapability;
  identify(uid: Uid | null): Promise<void>;
  loadCatalog(): Promise<CatalogProduct[]>;
  purchase(product: CatalogProduct, email: string | null, target: HTMLElement | null): Promise<PurchaseAttempt>;
  presentPaywall(role: ProductRole): Promise<PurchaseAttempt>;    // native_paywall rails only
  restore(): Promise<void>;                                        // tells the provider, then the caller reconciles
}
/** Server side of a rail: one confirmed purchase, read from the provider itself. */
export interface ProviderPurchase {
  rail: RailKey; transactionId: string; productId: string;
  purchasedAt: IsoInstant; priceLabel: string | null; sandbox: boolean;
}
export interface ServerRail {
  key: RailKey;
  listPurchases(uid: Uid): Promise<ProviderPurchase[]>;
  verifyWebhook(req: Request, rawBody: string): boolean;
  uidFromWebhook(body: unknown): Uid[];                           // user ids to reconcile
}
export interface ReconcileResult { credited: number; alreadyKnown: number; unmappedProducts: string[]; balanceMilli: MilliCredits; souvenirEntryIds: string[]; }

// §4.7 Reading keys
export type MintReason = 'first_use' | 'expired' | 'http_401' | 'http_402' | 'low_limit' | 'resume';
export interface MintedKey { key: string; keyHash: string; limitUsd: Usd; expiresAt: IsoInstant; balanceMilli: MilliCredits; }

// §4.8 Voice
export type VoicePhase = 'unsupported' | 'absent' | 'downloading' | 'loading' | 'calibrating' | 'ready' | 'failed';
export type VoiceBackend = 'wasm' | 'webgpu';
export interface VoiceProgress {
  phase: VoicePhase; downloadedBytes: number; totalBytes: number;
  sessionsLoaded: number; sessionsTotal: number;
  candidatesDone: number; candidatesTotal: number;
  error: string | null;
}
export interface CalibrationCandidate { workers: number; threadsPerWorker: number; backend: VoiceBackend; steps: number; }
export interface CalibrationMeasurement extends CalibrationCandidate { realTimeFactor: number; loadMs: number; synthMs: number; audioMs: number; }
export interface VoiceProfile {
  schema: 'natally.voiceprofile/v1';
  modelRepo: string; modelRevision: string; voiceId: string;
  chosen: CalibrationCandidate;
  realTimeFactor: number;                           // pool-wide seconds of audio per second of wall time
  sentencesAhead: number;                           // at least 1
  measurements: CalibrationMeasurement[];
  deviceMemoryGb: number | null; hardwareConcurrency: number;
  calibratedAt: IsoInstant; appVersion: string;
}
export type SpeechState = 'idle' | 'preparing' | 'speaking' | 'paused';
export type StatusLineState = 'idle' | 'listening' | 'thinking' | 'speaking';
export interface SpeechEvent { type: 'sentence_start' | 'sentence_end' | 'queue_drained' | 'failed'; utteranceId: string; sentenceIndex: number; cue: ChartElementKey | null; }

// §4.9 Modalities
export type ModalityKey = 'natal' | 'tarot' | 'iching' | (string & {});
export type ModalityStatus = 'available' | 'locked';
export interface ModalityManifest {
  key: ModalityKey; title: string; status: ModalityStatus;
  entitlement: EntitlementKey | null;               // null: free to enter
  cardElementId: string;                            // the frozen card id
  load(): Promise<ModalityModule>;
}
export interface ModalityModule { routes: ModalityRoute[]; entryPath: string; }
export interface ModalityRoute { path: string; load: () => Promise<{ default: React.ComponentType }>; requiresAuth: boolean; requiresBirth: boolean; requiresVoiceStep: boolean; }

// §4.10 Souvenir
export type SouvenirStage = 'awaiting_snapshot' | 'generating' | 'audio' | 'pdf' | 'atelier' | 'uploading' | 'finalizing' | 'ready' | 'failed';
export type SouvenirGroup = 'planets' | 'signs' | 'houses' | 'aspects';
export interface SouvenirElementPlan { key: ChartElementKey; group: SouvenirGroup; order: number; }
export type SouvenirElementId = ChartElementKey | 'opening_reading';   // opening_reading only when the conversation has no Natally turn; its text is in `relation`
export interface SouvenirElementContent { key: SouvenirElementId; subtitle: string; relation: string; aside: string; origins: string; traditional: string; lore: string; examples: string; model: string; }
export interface SouvenirSnapshot {
  schema: 'natally.souvenir/v1'; id: string; uid: Uid; ledgerEntryId: string;
  customerName: string; customerEmail: string | null;
  birth: BirthDetails; chart: Chart;
  turns: ReadingTurn[]; plan: SouvenirElementPlan[]; createdAt: IsoInstant;
}
export interface SouvenirAudioIndex { byTurn: Record<string, SouvenirAudioSpan[]>; byElement: Record<string, SouvenirAudioSpan[]>; }
export interface SouvenirAudioSpan { file: string; durationMs: number; text: string; cue: ChartElementKey | null; }
export interface SouvenirPublicData { appName: string; snapshot: Omit<SouvenirSnapshot,'uid'|'customerEmail'|'ledgerEntryId'>; audio: SouvenirAudioIndex | null; pdfFileName: string; purchaseDateLabel: string; topUpUrl: string; }
export interface SouvenirJob { snapshotId: string; stage: SouvenirStage; elementsDone: number; elementsTotal: number; pdfUrl: string | null; atelierUrl: string | null; error: string | null; updatedAt: IsoInstant; }
export interface DeliveryFile { remotePath: string; contentType: string; bytes: number; }
export interface DeliveryAdapter {
  key: 'sftp';
  appendChunk(snapshotId: string, path: string, offset: number, chunk: Uint8Array): Promise<number>;
  publish(snapshotId: string, files: DeliveryFile[]): Promise<{ pdfUrl: string; atelierUrl: string }>;
  notify(to: string, name: string, links: { pdfUrl: string; atelierUrl: string }): Promise<void>;
}

// §4.11 Platform
export type PlatformKind = 'web' | 'android' | 'linux' | 'windows';
export type AnalyticsTransport = 'gtag' | 'collect';
export interface SaveFileRequest { fileName: string; mimeType: string; bytes: Uint8Array; }
export type SaveOutcome = 'saved' | 'shared' | 'cancelled';
export interface GoogleCredential { idToken: string; accessToken: string | null; }
export interface ModelStore {
  has(path: string): Promise<boolean>; size(path: string): Promise<number>;
  writer(path: string): Promise<{ write(chunk: Uint8Array): Promise<void>; close(): Promise<void>; abort(): Promise<void> }>;
  read(path: string): Promise<Uint8Array>; clear(): Promise<void>;
  workerSource(): ModelSource;
}
export type ModelSource = { kind: 'opfs'; root: string } | { kind: 'bytes' };
export interface PlatformAdapter {
  kind: PlatformKind; analyticsTransport: AnalyticsTransport; railKey: RailKey; poolCap: number;
  googleSignIn(): Promise<GoogleCredential | 'popup'>;   // 'popup': caller uses signInWithPopup
  openExternal(url: string): Promise<void>;
  saveFile(req: SaveFileRequest): Promise<SaveOutcome>;
  copyText(text: string): Promise<void>;
  modelStore(): Promise<ModelStore | null>;              // null: voice unsupported here
  checkForShellUpdate(currentVersion: string): Promise<string | null>; // download URL if newer
  showInstallOptions: boolean;
}

// §4.12 Analytics
export type ConsentState = 'granted' | 'denied';
export type AnalyticsParams = Record<string, string | number | boolean>;
export type AnalyticsEvent = { [K in keyof AnalyticsCatalog]: { name: K; params: AnalyticsCatalog[K] } }[keyof AnalyticsCatalog];
// AnalyticsCatalog is the interface mapping each event in §15.2 to its parameter object, in src/types/analytics.ts.

// §4.13 Configuration
export interface ClientConfig {
  appName: string; appId: string; supportEmail: string; legalEntity: string; version: string;
  buildTarget: 'web' | 'android' | 'desktop';
  webCanonicalOrigin: string; webDomains: string[]; apiBaseUrl: string;
  firebase: { apiKey: string; authDomain: string; projectId: string; appId: string; messagingSenderId: string; };
  revenueCat: { webApiKey: string; androidApiKey: string; offeringCredits: string; offeringSouvenir: string; };
  products: { credits: Record<string, number>; topUpSlots: [string, string, string]; souvenirIds: string[]; entitlements: Record<string, string>; };
  creditUsdValue: number; readingMinMilli: MilliCredits; keyLowLimitUsd: number;
  openRouter: { models: string[]; maxTokens: number; temperature: number; referer: string; };
  voice: { baseUrl: string; repo: string; revision: string; voiceId: string; };
  analytics: { measurementId: string; };
  links: { play: string; windows: string; linux: string; terms: string; privacy: string; contact: string; };
  devPort: number; googleWebClientId: string; releaseInfoUrl: string;
}
export interface ServerConfig {
  firebaseAdmin: { projectId: string; clientEmail: string; privateKey: string };
  revenueCat: { secretKey: string; webhookAuth: string };
  openRouter: { managementKey: string; souvenirKey: string; keyTtlSeconds: number; retireGraceSeconds: number; souvenirModel: string };
  ga: { measurementId: string; apiSecret: string };
  sftp: { host: string; port: number; user: string; password: string; basePath: string; publicBaseUrl: string };
  smtp: { host: string; port: number; secure: boolean; user: string; password: string; from: string };
  allowedOrigins: string[];
  products: ClientConfig['products']; creditUsdValue: number; appName: string; port: number;
}
