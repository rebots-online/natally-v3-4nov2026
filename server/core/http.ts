// §5.19: router, CORS, body parse, auth, error envelope. Every handler is a Route; adapters only convert to and from Request/Response.
import type { Firestore } from 'firebase-admin/firestore';
import type { ApiErrorCode, Uid } from '../../src/types/index.ts';
import { loadServerConfig, type ServerConfigX } from './config.ts';
import { HttpError, MESSAGES } from './errors.ts';
import { getDb, verifyIdToken } from './firebase.ts';

export { HttpError } from './errors.ts';

export type { ApiErrorCode } from '../../src/types/index.ts';

export type HandlerContext = {
  req: Request; cfg: ServerConfigX; db: Firestore; uid: Uid | null;
  /** Text body. Empty for `application/octet-stream`, whose bytes stay unread on `req` for the handler. */
  rawBody: string;
  /** Parsed JSON body, or null when the body is empty or not read. */
  json: unknown;
};
export interface Route { method: 'GET' | 'POST'; path: string; auth: 'id_token' | 'none' | 'webhook'; handle(ctx: HandlerContext): Promise<Response>; }

const MAX_BODY_BYTES = 5 * 1024 * 1024;   // the upload handler holds its own 4 MiB limit; 6 MB is the Netlify payload ceiling
const MAX_JSON_BYTES = 1024 * 1024;

export function jsonOk(body: unknown, status = 200): Response {
  if (status === 204 || status === 205 || status === 304) return new Response(null, { status });
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
export function jsonError(code: ApiErrorCode, status: number, message?: string): Response {
  return jsonOk({ error: { code, message: message ?? MESSAGES[code] } }, status);
}

function corsHeaders(origin: string | null, allowed: string[]): Record<string, string> {
  if (!origin || !allowed.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin, 'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '600',
  };
}
function finish(res: Response, extra: Record<string, string>): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(extra)) headers.set(k, v);
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

async function readBody(req: Request): Promise<{ rawBody: string; json: unknown }> {
  if (req.method !== 'POST') return { rawBody: '', json: null };
  const declared = Number(req.headers.get('content-length') ?? '0');
  if (declared > MAX_BODY_BYTES) throw new HttpError('too_large', 413);
  if ((req.headers.get('content-type') ?? '').toLowerCase().startsWith('application/octet-stream')) return { rawBody: '', json: null };
  const rawBody = await req.text();
  if (Buffer.byteLength(rawBody) > MAX_JSON_BYTES) throw new HttpError('too_large', 413);
  if (rawBody.trim() === '') return { rawBody, json: null };
  try { return { rawBody, json: JSON.parse(rawBody) as unknown }; } catch { throw new HttpError('bad_request', 400, 'The body is not valid JSON.'); }
}

function bearerOf(req: Request): string | null {
  const m = /^Bearer\s+(\S+)$/i.exec(req.headers.get('authorization') ?? '');
  return m ? m[1]! : null;
}

export async function routeRequest(req: Request, routes: Route[]): Promise<Response> {
  let cfg: ServerConfigX;
  try { cfg = loadServerConfig(); } catch (e) {
    console.error('config:', e instanceof Error ? e.message : 'invalid');
    return finish(jsonError('internal', 500), {});
  }
  const cors = corsHeaders(req.headers.get('origin'), cfg.allowedOrigins);
  try {
    const path = new URL(req.url).pathname.replace(/\/+$/, '') || '/';
    if (req.method === 'OPTIONS') return finish(new Response(null, { status: 204 }), cors);
    const onPath = routes.filter((r) => r.path === path);
    if (onPath.length === 0) return finish(jsonError('not_found', 404), cors);
    const route = onPath.find((r) => r.method === req.method);
    if (!route) {
      const res = jsonError('method_not_allowed', 405);
      return finish(res, { ...cors, Allow: onPath.map((r) => r.method).join(', ') });
    }
    const { rawBody, json } = await readBody(req);
    let uid: Uid | null = null;
    if (route.auth === 'id_token') {
      const bearer = bearerOf(req);
      if (!bearer) throw new HttpError('unauthenticated', 401);
      uid = await verifyIdToken(cfg, bearer);
      if (!uid) throw new HttpError('unauthenticated', 401);
    }
    const ctx: HandlerContext = {
      req, cfg, uid, rawBody, json,
      get db(): Firestore { return getDb(cfg); },   // lazy: a handler that never touches Firestore works without admin access
    };
    return finish(await route.handle(ctx), cors);
  } catch (e) {
    if (e instanceof HttpError) return finish(jsonError(e.code, e.status, e.message), cors);
    console.error('unhandled:', e instanceof Error ? e.name : typeof e);   // never the message: it may carry a value
    return finish(jsonError('internal', 500), cors);
  }
}
