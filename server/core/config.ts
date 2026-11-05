// §4.13, §5.20: the only file in server/ that reads process.env. Memoised; a malformed variable throws naming only the variable.
import type { ServerConfig } from '../../src/types/index.ts';

/** ServerConfig of §4.13 plus the three server values that §7 needs and the type does not carry. */
export type ServerConfigX = ServerConfig & {
  readingMinMilli: number;       // VITE_READING_MIN_MILLI, §7.4 step 3
  allowSandbox: boolean;         // REVENUECAT_ALLOW_SANDBOX, §7.2 step 3
  version: string;               // VITE_APP_VERSION, answered by /api/health
};

class ConfigError extends Error {}

function text(name: string, fallback = ''): string {
  const v = process.env[name];
  return v === undefined || v.trim() === '' ? fallback : v.trim();
}
function num(name: string, fallback: number | null, integer = false): number {
  const raw = text(name);
  if (raw === '') {
    if (fallback === null) throw new ConfigError(`${name} is required`);
    return fallback;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || (integer && !Number.isInteger(n))) throw new ConfigError(`${name} is not a valid number`);
  return n;
}
function flag(name: string, fallback: boolean): boolean {
  const raw = text(name).toLowerCase();
  if (raw === '') return fallback;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new ConfigError(`${name} must be true or false`);
}
function list(name: string): string[] {
  return text(name).split(',').map((s) => s.trim()).filter(Boolean);
}
function record<T>(name: string, check: (v: unknown) => v is T): Record<string, T> {
  const raw = text(name, '{}');
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new ConfigError(`${name} is not valid JSON`); }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new ConfigError(`${name} must be a JSON object`);
  for (const v of Object.values(parsed)) if (!check(v)) throw new ConfigError(`${name} has a value of the wrong type`);
  return parsed as Record<string, T>;
}

function build(): ServerConfigX {
  const slots = list('VITE_PRODUCT_TOPUP_SLOTS');   // client-only; carried because ClientConfig['products'] requires it
  return {
    firebaseAdmin: {
      projectId: text('FIREBASE_ADMIN_PROJECT_ID'),
      clientEmail: text('FIREBASE_ADMIN_CLIENT_EMAIL'),
      privateKey: text('FIREBASE_ADMIN_PRIVATE_KEY').replaceAll('\\n', '\n'),
    },
    revenueCat: { secretKey: text('REVENUECAT_SECRET_KEY'), webhookAuth: text('REVENUECAT_WEBHOOK_AUTH') },
    openRouter: {
      managementKey: text('OPENROUTER_MANAGEMENT_KEY'),
      souvenirKey: text('OPENROUTER_SOUVENIR_KEY'),
      keyTtlSeconds: num('OPENROUTER_KEY_TTL_SECONDS', null, true),
      retireGraceSeconds: num('OPENROUTER_RETIRE_GRACE_SECONDS', null, true),
      souvenirModel: text('OPENROUTER_SOUVENIR_MODEL', 'openrouter/auto'),
    },
    ga: { measurementId: text('VITE_GA_MEASUREMENT_ID'), apiSecret: text('GA_API_SECRET') },
    sftp: {
      host: text('SFTP_HOST'), port: num('SFTP_PORT', 22, true), user: text('SFTP_USER'), password: text('SFTP_PASSWORD'),
      basePath: text('SFTP_BASE_PATH'), publicBaseUrl: text('SFTP_PUBLIC_BASE_URL'),
    },
    smtp: {
      host: text('SMTP_HOST'), port: num('SMTP_PORT', 587, true), secure: flag('SMTP_SECURE', false),
      user: text('SMTP_USER'), password: text('SMTP_PASSWORD'), from: text('SMTP_FROM'),
    },
    allowedOrigins: list('API_ALLOWED_ORIGINS'),
    products: {
      credits: record<number>('VITE_PRODUCT_CREDITS_JSON', (v): v is number => typeof v === 'number' && Number.isFinite(v)),
      topUpSlots: [slots[0] ?? '', slots[1] ?? '', slots[2] ?? ''],
      souvenirIds: list('VITE_PRODUCT_SOUVENIR_IDS'),
      entitlements: record<string>('VITE_PRODUCT_ENTITLEMENTS_JSON', (v): v is string => typeof v === 'string'),
    },
    creditUsdValue: num('VITE_CREDIT_USD_VALUE', null),
    appName: text('VITE_APP_NAME'),
    port: num('SERVER_PORT', 41873, true),
    readingMinMilli: num('VITE_READING_MIN_MILLI', null),
    allowSandbox: flag('REVENUECAT_ALLOW_SANDBOX', false),
    version: text('VITE_APP_VERSION', 'unstamped'),
  };
}

let memo: ServerConfigX | null = null;

export function loadServerConfig(): ServerConfigX {
  memo ??= build();
  return memo;
}
