// §7.1: POST /api/keys/settle.
import { HttpError, jsonOk, type Route } from '../core/index.ts';
import { settleUsage } from './settle.ts';

export const settleRoute: Route = {
  method: 'POST', path: '/api/keys/settle', auth: 'id_token',
  handle: async (ctx) => {
    if (!ctx.uid) throw new HttpError('unauthenticated', 401);
    if (!ctx.cfg.openRouter.managementKey) throw new HttpError('provider_unavailable', 503);   // §7.7
    return jsonOk(await settleUsage(ctx.uid, ctx));
  },
};
