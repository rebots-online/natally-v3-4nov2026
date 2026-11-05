// §7.7: the Netlify adapter. netlify/functions/api.mts re-exports this handler with its path.
import type { Context } from '@netlify/functions';
import { routeRequest } from '../core/index.ts';
import { allRoutes } from './routes.ts';

export function handler(req: Request, _ctx: Context): Promise<Response> {
  return routeRequest(req, allRoutes);
}
