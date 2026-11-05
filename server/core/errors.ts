// The error type every handler may throw; routeRequest turns it into the envelope of §7.
import type { ApiErrorCode } from '../../src/types/index.ts';

export const MESSAGES: Record<ApiErrorCode, string> = {
  bad_request: 'The request is not valid.', unauthenticated: 'Sign in again.', forbidden: 'Not allowed.', not_found: 'Not found.',
  method_not_allowed: 'Method not allowed.', no_credits: 'No credits left.', provider_unavailable: 'A service this needs is not available.',
  conflict: 'The request conflicts with the stored state.', too_large: 'The request is too large.', internal: 'Something went wrong.',
};

/** Thrown anywhere under a handler. */
export class HttpError extends Error {
  constructor(readonly code: ApiErrorCode, readonly status: number, message?: string) { super(message ?? MESSAGES[code]); }
}
