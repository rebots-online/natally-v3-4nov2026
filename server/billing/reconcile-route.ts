// §7.1, §5.20: POST /api/purchases/reconcile. Grants first, then settles usage.
import type { ReconcileResult } from '../../src/types/index.ts';
import { HttpError, jsonOk, type Route } from '../core/index.ts';
import { settleUsage } from '../keys/index.ts';
import { reconcileUser } from './reconcile.ts';

const TRIGGERS: readonly unknown[] = ['app_open', 'sign_in', 'checkout_return', 'restore'];

export const reconcileRoute: Route = {
  method: 'POST', path: '/api/purchases/reconcile', auth: 'id_token',
  handle: async (ctx) => {
    if (!ctx.uid) throw new HttpError('unauthenticated', 401);
    if (!TRIGGERS.includes((ctx.json as { trigger?: unknown } | null)?.trigger)) throw new HttpError('bad_request', 400);
    const result: ReconcileResult = await reconcileUser(ctx.uid, ctx);
    try {
      const settled = await settleUsage(ctx.uid, ctx);
      return jsonOk({ ...result, balanceMilli: settled.balanceMilli });
    } catch (e) {
      // The grant is committed and `credited` would read 0 on a retry, so the customer still hears it. Settling repeats on the next trigger.
      console.warn('reconcile: settle deferred:', e instanceof Error ? e.name : typeof e);
      return jsonOk(result);
    }
  },
};
