// The public door of server/core (§5.19, §5.20).
export { loadServerConfig, type ServerConfigX } from './config.ts';
export { getDb, verifyIdToken } from './firebase.ts';
export { HttpError } from './errors.ts';
export { jsonError, jsonOk, routeRequest, type ApiErrorCode, type HandlerContext, type Route } from './http.ts';
import type { Route } from './http.ts';
import { healthRoute } from './health.ts';

export const coreRoutes: Route[] = [healthRoute];
