// §5.19: every module's route list, concatenated. No core code changes when a module adds a route.
import { billingRoutes } from '../billing/index.ts';
import { coreRoutes, type Route } from '../core/index.ts';
import { collectRoutes } from '../collect/index.ts';
import { keyRoutes } from '../keys/index.ts';
import { souvenirRoutes } from '../souvenir/index.ts';

export const allRoutes: Route[] = [...coreRoutes, ...billingRoutes, ...keyRoutes, ...souvenirRoutes, ...collectRoutes];
