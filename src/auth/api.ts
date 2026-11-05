// apiFetch (§5.5, §7): POST JSON to the server with the customer's ID token.
import { config } from '../config';
import type { ApiErrorBody, ApiErrorCode } from '../types';
import { getIdToken } from './session';

export class ApiError extends Error {
  override readonly name = 'ApiError';
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
  }
}

const CODES: readonly ApiErrorCode[] = ['bad_request', 'unauthenticated', 'forbidden', 'not_found', 'method_not_allowed', 'no_credits', 'provider_unavailable', 'conflict', 'too_large', 'internal'];

function codeForStatus(status: number): ApiErrorCode {
  if (status === 400) return 'bad_request';
  if (status === 401) return 'unauthenticated';
  if (status === 402) return 'no_credits';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 405) return 'method_not_allowed';
  if (status === 409) return 'conflict';
  if (status === 413) return 'too_large';
  if (status === 502 || status === 503) return 'provider_unavailable';
  return 'internal';
}

function errorFrom(status: number, text: string): ApiError {
  try {
    const body = JSON.parse(text) as Partial<ApiErrorBody>;
    const code = body.error?.code;
    if (code && CODES.includes(code)) return new ApiError(status, code, body.error?.message ?? code);
  } catch {
    // Not the server's envelope (a gateway page, for example): the status alone decides.
  }
  return new ApiError(status, codeForStatus(status), `HTTP ${status}`);
}

/**
 * POST `body` as JSON to `apiBaseUrl + path`. With `auth` (the default) the ID token is sent, and one 401 is retried with a
 * refreshed token. Throws ApiError; a request that never reached the server is status 0, `provider_unavailable`.
 */
export async function apiFetch<T>(path: string, body?: unknown, opts: { auth?: boolean; keepalive?: boolean } = {}): Promise<T> {
  const url = config.apiBaseUrl.replace(/\/+$/, '') + (path.startsWith('/') ? path : `/${path}`);
  const withAuth = opts.auth ?? true;

  const send = async (forceToken: boolean): Promise<Response> => {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (withAuth) {
      try {
        headers.authorization = `Bearer ${await getIdToken(forceToken)}`;
      } catch {
        throw new ApiError(401, 'unauthenticated', 'signed_out');
      }
    }
    try {
      return await fetch(url, { method: 'POST', headers, body: JSON.stringify(body ?? {}), keepalive: opts.keepalive });
    } catch {
      throw new ApiError(0, 'provider_unavailable', 'network');
    }
  };

  let response = await send(false);
  if (response.status === 401 && withAuth) response = await send(true);
  const text = await response.text();
  if (!response.ok) throw errorFrom(response.status, text);
  return (text ? JSON.parse(text) : undefined) as T;
}
