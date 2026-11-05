// The public door of server/collect (§5.19).
import type { Route } from '../core/index.ts';
import { collectRoute } from './route.ts';

export const collectRoutes: Route[] = [collectRoute];
