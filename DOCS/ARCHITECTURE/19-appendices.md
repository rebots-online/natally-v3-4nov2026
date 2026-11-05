# 19 — Appendices

## Appendix A — Facts verified (5 November 2026)

| Fact | Source |
|---|---|
| All npm versions in §2 | `npm view <pkg> version` |
| Tauri crate versions, latest 2.x; 3.0 alpha exists | `https://crates.io/api/v1/crates/tauri/versions` |
| RevenueCat `purchases`, `purchases-ui` 11.1.0 | `https://repo1.maven.org/maven2/com/revenuecat/purchases/` metadata |
| `googleid` 1.2.1; `credentials` newest is 1.7.0-alpha03 | `https://dl.google.com/android/maven2/` metadata |
| `Purchases.configure`, `getOfferings`, `offerings.all`, `changeUser`, `purchase({ rcPackage, htmlTarget, customerEmail })`, `webBillingProduct.currentPrice.formattedPrice`, `generateRevenueCatAnonymousAppUserId` | `@revenuecat/purchases-js@1.74.0` type declarations |
| Webhook fields of `NON_RENEWING_PURCHASE` | `https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields` |
| API v1 auth; `non_subscriptions` keyed by product id with `id`, `is_sandbox`, `purchase_date`, `store` | `https://www.revenuecat.com/docs/api-v1/customer-info-model` |
| OpenRouter key response `key`, `data.hash`, `data.usage`; create fields | `https://openrouter.ai/docs/api/api-reference/api-keys/create-keys.md` |
| Supertonic repo files, sizes (262 MB), voices, the exact ONNX inference algorithm | `hf://models/onnx-community/Supertonic-TTS-ONNX`, README |
| `@swisseph/browser` API, Moshier built in, AGPL-3.0 | Package README and tarball |
| Netlify function shape `export default async (req, context)`, `config.path` | `https://docs.netlify.com/build/functions/get-started/` |
| Owner-supplied facts, not re-checked: ORT threading flag, Tauri headers, paywall launcher in `onCreate`, Play policy, OpenRouter 401/402, GA4 Measurement Protocol, OpenRAIL-M duties | URLs in the owner's brief |

## Appendix B — Not verified

Each is designed so a mistake is found on first run and is local to one file.

| Item | Assumption | Check at |
|---|---|---|
| RevenueCat v1 `store_transaction_id` on `non_subscriptions` entries | Present in responses though the doc example omits it; code falls back to `id`, stable either way | `server/billing/rails/revenuecat.ts`, J5 |
| RevenueCat app user id of purchases made before v3 | Earlier versions used the Firebase uid. If not, those purchases need an alias, which reconcile cannot guess | J5 with owner's account |
| OpenRouter `GET`, `PATCH`, `DELETE /api/v1/keys/{hash}`; `disabled` field in PATCH | Standard in their API; the update doc URL tried answered 404 | J4b |
| OpenRouter usage posts with delay | Handled by retire grace; length of delay unmeasured | J4b |
| `usage: { include: true }` returns `usage.cost` in the last stream chunk | If absent, `costSoFar` stays 0 and only 402 triggers refresh | J4 |
| Netlify request size (assumed 6 MB) and sync run time (assumed ≥ 26 s) and 4 KB env limit | Chunk 4 MiB, element timeout 25 s, env size warning | J7, step 9 |
| Outbound SFTP from Netlify Functions | Allowed. If blocked, the adapter needs a host-side receiver | J7 |
| Surge `200.html` fallback | From long-standing Surge behaviour; help page has moved | Foundation deploy |
| `https://natally-v3.robin.mba` behaviour | Coordinator confirms after first deploy; treated as `https: false` | Insecure check |
| fontkit variable WOFF2 outlines in browsers | `getVariation` on WOFF2 works in browser bundle | First PDF |
| OPFS in WebKitGTK and in Android WebView | Probed at run time; Linux has the fs fallback; Android has none, and would report `unsupported` | Voice on each shell |
| Firebase phone reCAPTCHA on `tauri://localhost` | May refuse a non-http scheme; email and Google still work there | Sign-in on Linux |
| Firebase `signInWithCredential` from `tauri://localhost` | Allowed; authorized domain not checked for credential sign-in | J2 Linux |
| `credentials-play-services-auth` 1.6.0 exists | Stable line assumed; use the newest stable found in Maven at build | `shells` task |
| RevenueCat Paywall launcher behaviour inside the Tauri `AppCompatActivity` | Fact from owner; never run on hardware (no device, no Play credentials) | Recorded in brief |
| Tailwind v4 reproduces the CDN build's frozen classes exactly | Compare with screenshots | Look check |
| Google Play account-deletion requirement | No frozen control exists; support contact route is the only path. Owner must decide before Play submission | Open item |
