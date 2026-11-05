// §7.4: OpenRouter's key management API. Any failure other than "gone" is provider_unavailable. No value from here is ever logged.
import { HttpError, type HandlerContext } from '../core/index.ts';

const KEYS_URL = 'https://openrouter.ai/api/v1/keys';
const TIMEOUT_MS = 10_000;
type Cfg = HandlerContext['cfg'];

function unavailable(): HttpError {
  return new HttpError('provider_unavailable', 503);
}

async function call(cfg: Cfg, method: string, path: string, body?: unknown): Promise<Response> {
  const { managementKey } = cfg.openRouter;
  if (!managementKey) throw unavailable();
  try {
    return await fetch(KEYS_URL + path, {
      method,
      headers: { Authorization: `Bearer ${managementKey}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw unavailable();
  }
}
const byHash = (hash: string): string => `/${encodeURIComponent(hash)}`;

/** Total USD used by a key, or null when the key is gone. */
export async function getKeyUsage(cfg: Cfg, hash: string): Promise<number | null> {
  const res = await call(cfg, 'GET', byHash(hash));
  if (res.status === 404) return null;
  if (!res.ok) throw unavailable();
  const usage = ((await res.json().catch(() => null)) as { data?: { usage?: unknown } } | null)?.data?.usage;
  if (typeof usage !== 'number' || !Number.isFinite(usage)) throw unavailable();
  return usage;
}

/** Returns false when the key is already gone. */
export async function disableKey(cfg: Cfg, hash: string): Promise<boolean> {
  const res = await call(cfg, 'PATCH', byHash(hash), { disabled: true });
  if (res.status === 404) return false;
  if (!res.ok) throw unavailable();
  return true;
}

export async function deleteKey(cfg: Cfg, hash: string): Promise<void> {
  const res = await call(cfg, 'DELETE', byHash(hash));
  if (!res.ok && res.status !== 404) throw unavailable();
}

export async function createKey(cfg: Cfg, request: { name: string; limit: number; expiresAt: string }): Promise<{ key: string; hash: string }> {
  const res = await call(cfg, 'POST', '', {
    name: request.name, limit: request.limit, limit_reset: null, expires_at: request.expiresAt, include_byok_in_limit: true,
  });
  if (!res.ok) throw unavailable();
  const created = (await res.json().catch(() => null)) as { key?: unknown; data?: { hash?: unknown } } | null;
  if (typeof created?.key !== 'string' || typeof created.data?.hash !== 'string') throw unavailable();
  return { key: created.key, hash: created.data.hash };
}
