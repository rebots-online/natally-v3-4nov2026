// The only reader of import.meta.env (§3.2 rule 1). Importing this module throws ConfigError when a required variable is absent.
import type { ClientConfig } from '../types';

const env = import.meta.env as unknown as Record<string, string | undefined>;

/** Names only, never a value. Carries what the app shell still needs to show a configuration state and to run the secure-origin rule. */
class ConfigError extends Error {
  override readonly name = 'ConfigError';
  constructor(
    readonly variables: string[],
    readonly version: string,
    readonly webCanonicalOrigin: string,
  ) {
    super(`Missing or invalid configuration: ${variables.join(', ')}`);
  }
}

const problems: string[] = [];
const flag = (name: string) => {
  if (!problems.includes(name)) problems.push(name);
};

const optional = (name: string): string => (env[name] ?? '').trim();
const required = (name: string): string => {
  const value = optional(name);
  if (!value) flag(name);
  return value;
};
const list = (raw: string): string[] => raw.split(',').map((s) => s.trim()).filter(Boolean);
const toNumber = (name: string, raw: string): number => {
  const n = Number(raw);
  if (raw && !Number.isFinite(n)) flag(name);
  return n;
};
const requiredNumber = (name: string): number => toNumber(name, required(name));
function jsonRecord<V>(name: string): Record<string, V> {
  const raw = optional(name);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, V>;
  } catch {
    // reported below, by name
  }
  flag(name);
  return {};
}
function buildTarget(): ClientConfig['buildTarget'] {
  const value = optional('VITE_BUILD_TARGET') || 'web';
  if (value === 'web' || value === 'android' || value === 'desktop') return value;
  flag('VITE_BUILD_TARGET');
  return 'web';
}
function topUpSlots(): [string, string, string] {
  const slots = list(optional('VITE_PRODUCT_TOPUP_SLOTS'));
  if (slots.length !== 0 && slots.length !== 3) flag('VITE_PRODUCT_TOPUP_SLOTS');
  return [slots[0] ?? '', slots[1] ?? '', slots[2] ?? ''];
}
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

const built: ClientConfig = {
  appName: required('VITE_APP_NAME'),
  appId: required('VITE_APP_ID'),
  supportEmail: required('VITE_SUPPORT_EMAIL'),
  legalEntity: required('VITE_LEGAL_ENTITY'),
  version: required('VITE_APP_VERSION'),
  buildTarget: buildTarget(),
  webCanonicalOrigin: optional('VITE_WEB_CANONICAL_ORIGIN'),
  webDomains: list(optional('VITE_WEB_DOMAINS')),
  apiBaseUrl: required('VITE_API_BASE_URL'),
  firebase: {
    apiKey: required('VITE_FIREBASE_API_KEY'),
    authDomain: required('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: required('VITE_FIREBASE_PROJECT_ID'),
    appId: required('VITE_FIREBASE_APP_ID'),
    messagingSenderId: required('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  },
  revenueCat: {
    webApiKey: optional('VITE_RC_WEB_API_KEY'),
    androidApiKey: optional('VITE_RC_ANDROID_API_KEY'),
    offeringCredits: optional('VITE_RC_OFFERING_CREDITS'),
    offeringSouvenir: optional('VITE_RC_OFFERING_SOUVENIR'),
  },
  products: {
    credits: jsonRecord<number>('VITE_PRODUCT_CREDITS_JSON'),
    topUpSlots: topUpSlots(),
    souvenirIds: list(optional('VITE_PRODUCT_SOUVENIR_IDS')),
    entitlements: jsonRecord<string>('VITE_PRODUCT_ENTITLEMENTS_JSON'),
  },
  creditUsdValue: requiredNumber('VITE_CREDIT_USD_VALUE'),
  readingMinMilli: requiredNumber('VITE_READING_MIN_MILLI'),
  keyLowLimitUsd: requiredNumber('VITE_KEY_LOW_LIMIT_USD'),
  openRouter: {
    models: list(required('VITE_OPENROUTER_MODELS')),
    maxTokens: requiredNumber('VITE_OPENROUTER_MAX_TOKENS'),
    temperature: requiredNumber('VITE_OPENROUTER_TEMPERATURE'),
    referer: optional('VITE_OPENROUTER_REFERER'),
  },
  voice: {
    baseUrl: required('VITE_VOICE_BASE_URL'),
    repo: required('VITE_VOICE_REPO'),
    revision: required('VITE_VOICE_REVISION'),
    voiceId: required('VITE_VOICE_ID'),
  },
  analytics: { measurementId: optional('VITE_GA_MEASUREMENT_ID') },
  links: {
    play: optional('VITE_LINK_PLAY'),
    windows: optional('VITE_LINK_WINDOWS'),
    linux: optional('VITE_LINK_LINUX'),
    terms: optional('VITE_LINK_TERMS'),
    privacy: optional('VITE_LINK_PRIVACY'),
    contact: optional('VITE_LINK_CONTACT'),
  },
  devPort: toNumber('VITE_DEV_PORT', optional('VITE_DEV_PORT')),
  googleWebClientId: optional('VITE_GOOGLE_WEB_CLIENT_ID'),
  releaseInfoUrl: optional('VITE_RELEASE_INFO_URL'),
};

if (problems.length > 0) throw new ConfigError(problems, built.version, built.webCanonicalOrigin);

export const config: ClientConfig = deepFreeze(built);
