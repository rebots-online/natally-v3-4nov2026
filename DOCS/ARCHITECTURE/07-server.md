# 07 — Server API

Base: `VITE_API_BASE_URL` (Netlify site) + path. JSON unless stated. Auth `id_token` = `Authorization: Bearer <Firebase ID token>`. Every response carries CORS headers for an origin in `API_ALLOWED_ORIGINS`; other origins get no CORS headers. Errors: `{ "error": { "code": ApiErrorCode, "message": string } }`.

## 7.1 Handlers

| Method, path | Auth | Request | Response 200 | Errors | Idempotency | External calls | Firestore writes | File |
|---|---|---|---|---|---|---|---|---|
| GET `/api/health` | none | — | `{ ok: true, version }` | — | n/a | none | none | `server/core/health.ts` |
| POST `/api/purchases/reconcile` | id_token | `{ trigger: 'app_open'\|'sign_in'\|'checkout_return'\|'restore' }` | `ReconcileResult` | 401, 503 `provider_unavailable` | Ledger id | RevenueCat, OpenRouter (settle) | ledger, users | `server/billing/reconcile-route.ts` |
| POST `/api/webhooks/revenuecat` | webhook | RevenueCat event | `{ ok: true }` | 401 | Ledger id; all event types accepted, only `NON_RENEWING_PURCHASE`, `INITIAL_PURCHASE`, `TRANSFER` trigger work | RevenueCat | ledger, users | `server/billing/webhook-route.ts` |
| POST `/api/keys/mint` | id_token | `{ reason: MintReason }` | `MintedKey` | 401, 402 `no_credits`, 503 | Last caller wins; loser's key retires | OpenRouter | serverKeys, ledger, users | `server/keys/mint-route.ts` |
| POST `/api/keys/settle` | id_token | `{}` | `{ debitedMilli, balanceMilli }` | 401, 503 | `settleSeq` | OpenRouter | serverKeys, ledger, users | `server/keys/settle-route.ts` |
| POST `/api/souvenir/element` | id_token | `{ snapshotId, key, shorter?: boolean }` | `SouvenirElementContent` | 401, 404, 502 `provider_unavailable` | Existing element returned, unless `shorter`, which replaces it | OpenRouter (server key) | elements | `server/souvenir/element-route.ts` |
| POST `/api/souvenir/upload?snapshotId=&path=&offset=` | id_token | Raw bytes, at most 4 MiB | `{ nextOffset }` | 401, 404, 400, 409 `conflict` with `nextOffset`, 413 | Offset must equal remote size; a lower offset answers 409 with the true size | SFTP | none | `server/souvenir/upload-route.ts` |
| POST `/api/souvenir/finalize` | id_token | `{ snapshotId, files: DeliveryFile[], pdfPath, atelierPath }` | `{ pdfUrl, atelierUrl, emailSent }` | 401, 404, 409 size mismatch, 503 | Publish once by `serverDelivery`; ledger links set once; email once by `emailedAt` | SFTP, SMTP | ledger, serverDelivery | `server/souvenir/finalize-route.ts` |
| POST `/api/collect` | none | `{ clientId, sessionId, events: [{ name, params }] }` at most 25 | 204 | 400 | None; GA dedupes nothing | GA4 Measurement Protocol | none | `server/collect/route.ts` |

## 7.2 Reconcile and credit grant — `reconcileUser(uid)`

1. Call `revenueCatRail.listPurchases(uid)`: `GET https://api.revenuecat.com/v1/subscribers/{encodeURIComponent(uid)}` with `Authorization: Bearer REVENUECAT_SECRET_KEY`. A non-2xx throws `provider_unavailable`; nothing is written.
2. Flatten `subscriber.non_subscriptions[productId][]`. For each entry: `transactionId = entry.store_transaction_id ?? entry.id`, `purchasedAt = entry.purchase_date`, `sandbox = entry.is_sandbox`, `rail = entry.store === 'play_store' ? 'revenuecat_play' : 'revenuecat_web'`. This is the rail's "every purchase on the account", old or new.
3. Drop `sandbox` entries unless `REVENUECAT_ALLOW_SANDBOX=true`.
4. For each purchase: `credits = products.credits[productId]`. If undefined, add to `unmappedProducts`, log the product id (never the uid), write nothing. A souvenir product id with no `credits` entry counts as 0.
5. In one `runTransaction`: read `users/{uid}/ledger/rc:<id>`. If present: `alreadyKnown++`, stop. Read `users/{uid}`; create it with balance 0 if absent. `balanceMilli += credits*1000`; `lifetimeGrantedMilli` likewise; merge `products.entitlements[productId]` into `entitlements`; write the ledger entry with `kind` `souvenir_purchase` if `productId` is in `souvenirIds`, else `purchase`; `souvenir` is all-null for a souvenir, otherwise null.
6. Return counts, final balance, and `souvenirEntryIds` of every `souvenir_purchase` entry without `pdfUrl`, read after the loop. The client continues those (§14.2).

`priceLabel`: the webhook handler passes its event's `price` and `currency` as a hint for that one transaction (`Intl.NumberFormat`); reconcile from any other trigger stores null. `ScreenProfile` then falls back to the live catalogue price for `productId`; if neither exists the price segment is left out of the row.

## 7.3 Webhook

1. Compare `Authorization` with `REVENUECAT_WEBHOOK_AUTH` in constant time; else 401.
2. Read `event.type`, `event.app_user_id`, `event.original_app_user_id`, `event.aliases`, `event.transaction_id`, `event.price`, `event.currency`. The event only says "look": it is never itself the proof.
3. For relevant types, run `reconcileUser` for `app_user_id`. Ids in `aliases` that begin with `$RCAnonymousID` are ignored.
4. Always answer 200 once authenticated, except `provider_unavailable`, which answers 503 so RevenueCat retries.

The earlier deployment's webhook stays untouched; this is a second integration, created by the owner in RevenueCat, pointing at `/api/webhooks/revenuecat` of the v3 site. Both can fire for one purchase. Only ours writes to v3's ledger, and writing an id twice changes nothing.

## 7.4 Key mint and usage reconciliation

Credit value: `VITE_CREDIT_USD_VALUE` USD per credit. `milli(usd) = ceil(usd / VITE_CREDIT_USD_VALUE * 1000)`.

`settleUsage(uid)`, for the current key and every `retiring` key:
1. `GET https://openrouter.ai/api/v1/keys/{hash}` with `Authorization: Bearer OPENROUTER_MANAGEMENT_KEY`; `usage = data.usage`. 404 means the key is gone: delete its record, continue.
2. If `usage - settledUsd <= 0.000001` skip. Otherwise, in one transaction, re-read the key record, recompute `delta`; write ledger `usage:<hash>:<settleSeq+1>` with `amountMilli = -milli(delta)`, `usageUsd = delta`; `balanceMilli -= milli(delta)`; `lifetimeDebitedMilli += milli(delta)`; `settledUsd = usage`, `settleSeq += 1`. The balance may end slightly below zero; the client shows 0.
3. For a `retiring` key older than `OPENROUTER_RETIRE_GRACE_SECONDS`, after settling: `DELETE /api/v1/keys/{hash}`, delete its record. The grace exists because usage can post after a stream ends.

`mint(uid, reason)`:
1. `settleUsage(uid)`.
2. If a current key exists: `PATCH /api/v1/keys/{hash}` `{ disabled: true }`; move its record to `retiring`.
3. Read `balanceMilli`. If below `VITE_READING_MIN_MILLI`: answer 402 `no_credits`, no key.
4. `POST https://openrouter.ai/api/v1/keys` `{ name: "<VITE_APP_NAME> <first 8 of sha256(uid)>", limit: balanceMilli/1000*VITE_CREDIT_USD_VALUE, limit_reset: null, expires_at: now + OPENROUTER_KEY_TTL_SECONDS as ISO UTC with seconds, include_byok_in_limit: true }`.
5. Transaction on `serverKeys/{uid}`: if a different `currentHash` appeared meanwhile, move it to `retiring`. Store ours with `settledUsd 0`, `settleSeq 0`.
6. Return `MintedKey`. The plaintext key is stored nowhere on the server.

Client triggers: expiry passed; HTTP 401 or 402; `limitUsd - costSoFar < VITE_KEY_LOW_LIMIT_USD`; a resume after a cut. Each trigger calls `/api/keys/mint`. After every reading the client calls `/api/keys/settle`, so the balance drops within seconds on every signed-in device.

## 7.5 Souvenir handlers

See §14 for order. `element`: confirms the snapshot exists under `uid`; returns the stored element if present; otherwise calls `chat/completions` with `OPENROUTER_SOUVENIR_KEY`, `OPENROUTER_SOUVENIR_MODEL`, `response_format: { type: 'json_object' }`, `AbortSignal.timeout(25000)`, parses and checks all fields non-empty, and stores. These calls are paid for by the souvenir price and write no debit.

`upload`: `path` must match `^[a-z0-9][a-z0-9._/-]*$` with no `..`. Writes append to `<SFTP_BASE_PATH>/<token>/<path>.part`, where `token` is the first 32 hex of `sha256(uid + ':' + snapshotId + ':' + REVENUECAT_WEBHOOK_AUTH)`. It opens one SFTP connection per request.

`finalize`: checks every `.part` size equals `bytes`, renames each to the final name, sets `serverDelivery`, then in a transaction writes `souvenir.pdfUrl`, `atelierUrl`, `snapshotId` on the ledger entry (`<SFTP_PUBLIC_BASE_URL>/<token>/<path>`), then sends mail via SMTP if `customerEmail` exists and `emailedAt` is null. A mail failure leaves `emailSent: false`; a repeat `finalize` retries it. Every step is safe to repeat.

## 7.6 Rail contract

A new rail is a file in `server/billing/rails/` implementing `ServerRail`, one in `src/billing/rails/` implementing `BillingRail`, a `RAIL_<KEY>_ENABLED=true` variable, its product ids in `VITE_PRODUCT_CREDITS_JSON`, and its ledger id prefix. Core code does not change.

| Requirement | Chargebee must provide | WooCommerce plugin must provide |
|---|---|---|
| List every paid purchase for a Firebase uid, server-side | Invoices by customer, with `customer.id` = uid | Authenticated REST route: orders by uid metadata |
| Stable transaction id | `invoice.id` | Order id, fixed for life |
| Product identifier per line, and paid status | `item_price_id`, `status: paid` | SKU per line, status `completed` |
| Webhook with verifiable secret | Basic auth on webhook | HMAC signature header |
| Catalogue with price labels at run time | Item prices API | Public catalogue route with formatted price |
| Checkout that returns to the app | Hosted page with `redirect_url` | Checkout URL with return parameter |
| Prefill of uid | `customer[id]` | Signed query parameter |

Android builds never register these rails.

## 7.7 Adapters

| Adapter | File | Behaviour |
|---|---|---|
| Netlify | `server/adapters/netlify.ts`, `netlify/functions/api.mts` | `export default (req: Request, ctx: Context) => routeRequest(req, allRoutes)`, `export const config = { path: '/api/*' }` |
| Node | `server/adapters/node.ts` | `node:http` server on `SERVER_PORT`, converts to and from Web `Request`/`Response` |

A handler whose configuration is empty (for example `FIREBASE_ADMIN_PRIVATE_KEY` before Firebase admin access exists) answers 503 `provider_unavailable`; `/api/health` still answers. The app keeps working for everything that does not need that handler, and reconcile retries on the next trigger.
