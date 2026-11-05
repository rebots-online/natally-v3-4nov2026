// §7.1: POST /api/keys/mint.
import type { MintReason } from '../../src/types/index.ts';
import { HttpError, jsonOk, type Route } from '../core/index.ts';
import { mintKey } from './mint.ts';

const REASONS: readonly unknown[] = ['first_use', 'expired', 'http_401', 'http_402', 'low_limit', 'resume'] satisfies MintReason[];

export const mintRoute: Route = {
  method: 'POST', path: '/api/keys/mint', auth: 'id_token',
  handle: async (ctx) => {
    if (!ctx.uid) throw new HttpError('unauthenticated', 401);
    if (!REASONS.includes((ctx.json as { reason?: unknown } | null)?.reason)) throw new HttpError('bad_request', 400);
    return jsonOk(await mintKey(ctx.uid, ctx));
  },
};
