// §7.1: GET /api/health. No auth, no external call, no Firestore.
import { jsonOk, type Route } from './http.ts';

export const healthRoute: Route = {
  method: 'GET', path: '/api/health', auth: 'none',
  handle: async (ctx) => jsonOk({ ok: true, version: ctx.cfg.version }),
};
