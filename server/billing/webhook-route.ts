// §7.3: POST /api/webhooks/revenuecat. The event only says "look"; the purchases come from RevenueCat through reconcile.
import { HttpError, jsonError, jsonOk, type Route } from '../core/index.ts';
import { reconcileWithHint } from './reconcile.ts';
import { priceHintFromWebhook, revenueCatRail } from './rails/revenuecat.ts';

export const webhookRoute: Route = {
  method: 'POST', path: '/api/webhooks/revenuecat', auth: 'webhook',
  handle: async (ctx) => {
    if (!ctx.cfg.revenueCat.webhookAuth) throw new HttpError('provider_unavailable', 503);   // §7.7
    const rail = revenueCatRail(ctx.cfg);
    if (!rail.verifyWebhook(ctx.req, ctx.rawBody)) return jsonError('unauthenticated', 401);
    const hint = priceHintFromWebhook(ctx.json);
    try {
      for (const uid of rail.uidFromWebhook(ctx.json)) await reconcileWithHint(uid, ctx, hint);
    } catch (e) {
      // RevenueCat or Firestore could not finish: 503 makes RevenueCat retry, and repeating writes nothing twice.
      console.warn('webhook: retry requested:', e instanceof Error ? e.name : typeof e);
      return jsonError('provider_unavailable', 503);
    }
    return jsonOk({ ok: true });
  },
};
