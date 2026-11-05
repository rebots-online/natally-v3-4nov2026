// The public door of server/keys (§5.19, §5.20).
import type { Route } from '../core/index.ts';
import { mintRoute } from './mint-route.ts';
import { settleRoute } from './settle-route.ts';

export { settleUsage } from './settle.ts';
export const keyRoutes: Route[] = [mintRoute, settleRoute];
