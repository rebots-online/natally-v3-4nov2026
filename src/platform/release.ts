// Desktop launch check of release.json (§16.6): `{ version, urls: { android, windows, linux } }`, written by postbuild-web.
import { config } from '../config';

/** Versions are MAJOR.MINOR.BUILD (§16.2). Compared field by field as numbers; anything else is never "newer". */
export function isNewerVersion(candidate: string, current: string): boolean {
  const a = candidate.split('.').map(Number);
  const b = current.split('.').map(Number);
  if (a.some((n) => !Number.isInteger(n)) || b.some((n) => !Number.isInteger(n))) return false;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}

/**
 * The download URL for `platform` when release.json names a newer version, else null. The check is best effort: offline,
 * unreachable or unreadable release info simply means "no notice this launch", so those cases answer null.
 */
export async function newerShellUrl(currentVersion: string, platform: 'linux' | 'windows' | 'android'): Promise<string | null> {
  if (!config.releaseInfoUrl) return null;
  let body: unknown;
  try {
    const res = await fetch(config.releaseInfoUrl, { cache: 'no-store' });
    if (!res.ok) return null;
    body = await res.json();
  } catch {
    return null;
  }
  const info = body as { version?: unknown; urls?: Record<string, unknown> } | null;
  if (typeof info?.version !== 'string' || !isNewerVersion(info.version, currentVersion)) return null;
  const link = info.urls?.[platform];
  return typeof link === 'string' && link.length > 0 ? link : null;
}
