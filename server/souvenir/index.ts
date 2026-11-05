// The public door of server/souvenir (§5.19).
import type { Route } from '../core/index.ts';
import { elementRoute } from './element-route.ts';
import { finalizeRoute } from './finalize-route.ts';
import { uploadRoute } from './upload-route.ts';

export const souvenirRoutes: Route[] = [elementRoute, uploadRoute, finalizeRoute];
