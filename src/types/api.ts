// The error envelope of every handler (§7, §5.19).
export type ApiErrorCode = 'bad_request'|'unauthenticated'|'forbidden'|'not_found'|'method_not_allowed'|'no_credits'|'provider_unavailable'|'conflict'|'too_large'|'internal';
export interface ApiErrorBody { error: { code: ApiErrorCode; message: string }; }
