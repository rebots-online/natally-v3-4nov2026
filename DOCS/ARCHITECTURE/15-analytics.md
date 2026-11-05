# 15 — Analytics

## 15.1 Rule

`src/types/analytics.ts` declares `AnalyticsCatalog` and `ANALYTICS_EVENT_NAMES` from the table below. `track` is the only sender. If `analyticsConsent` is false or `VITE_GA_MEASUREMENT_ID` is empty, nothing is sent or loaded. Parameters are scalar, and never carry a name, email, uid, birth datum, place, question or reading text. `product_id` is the provider's public identifier. Error messages are sent only as a 32-bit hash plus a short category.

## 15.2 Catalogue

| Event | Parameters | Fires at |
|---|---|---|
| `screen_view` | `screen` | Route change, `src/app/routes.tsx` |
| `landing_section_view` | `section` | `IntersectionObserver` at 50%, landing |
| `offer_view` | `offer` (`souvenir`\|`credits`), `surface` | Offer card visible |
| `landing_cta_click` | `button`, `product_role` | Landing buy buttons |
| `install_click` | `store` (`play`\|`windows`\|`linux`) | Landing |
| `modality_choose` | `modality` | `modality-natal-begin` |
| `sign_up` | `method` | First sign-in with `isNew` |
| `login` | `method` | Sign-in |
| `signin_failed` | `method`, `code` | Sign-in error |
| `birth_details_submit` | `time_known` | `birth-submit-button` valid |
| `chart_calculated` | `house_system`, `reason`, `ms` | `saveBirth` |
| `lesson_view` | `kind`, `key` (the general lesson key) | `ScreenLesson` |
| `reading_request` | `kind`, `has_focus` | `startReading` |
| `reading_refused` | `reason` | Refusal |
| `reading_result` | `kind`, `outcome`, `model`, `sentences`, `first_sentence_ms`, `resumes` | Reading end |
| `paywall_view` | `surface` | `/top-up`, Android paywall, offer screen |
| `checkout_start` | `role`, `product_id`, `rail` | `buyProduct` |
| `checkout_result` | `role`, `product_id`, `rail`, `outcome` | `buyProduct` end |
| `credits_granted` | `credited`, `trigger` | `reconcileNow` with credited > 0 |
| `purchase` | `transaction_id` (ledger entry hash), `items_count`, `role` | Same, per new entry; `value` and `currency` are sent only when the catalogue reports them |
| `souvenir_offer_view` | none | `/souvenir` |
| `souvenir_stage` | `stage`, `ms` | Each stage end |
| `souvenir_ready` | `had_audio`, `pages` | `ready` |
| `souvenir_failed` | `stage` | `failed` |
| `voice_setup_start` | `retune` | `beginVoiceSetup` |
| `voice_download_done` | `bytes`, `ms` | Download end |
| `voice_calibrated` | `real_time_factor`, `workers`, `threads`, `backend`, `steps`, `sentences_ahead`, `device_memory`, `cores` | Calibration end |
| `voice_skipped` | none | `voice-skip-link` |
| `voice_error` | `stage`, `category` | Voice failure |
| `share_action` | `action` | Share buttons |
| `setting_change` | `setting`, `value` (booleans and volume decile only) | Settings |
| `page_speed` | `metric` (`LCP`\|`CLS`\|`INP`\|`FCP`\|`TTFB`), `value` | `PerformanceObserver` |
| `app_error` | `kind`, `hash` | `error`, `unhandledrejection`, error boundary |
| `pwa_update_applied` | `from_version` | After reload |

## 15.3 Transports

| | Web | Shells |
|---|---|---|
| Sender | `src/analytics/gtag.ts`: loads `gtag/js?id=…` only after consent, `send_page_view: false`, `gtag('consent','update',…)` on toggle | `src/analytics/collect.ts`: `POST /api/collect`, batched at 25 or every 5 s, `keepalive` |
| Client id | gtag | UUID in `natally.analytics.client` |
| Session | gtag | `natally.analytics.session` epoch seconds, renewed after 30 minutes idle |
| Required extras | n/a | `session_id`, `engagement_time_msec` (time visible since last batch, at least 1) on every event; no reserved names |

`server/collect/route.ts` checks names against `ANALYTICS_EVENT_NAMES`, drops non-scalar params, and sends `POST https://www.google-analytics.com/mp/collect?measurement_id=…&api_secret=…`. `analyticsConsent` defaults to on, per the frozen toggle's state, and Terms state it.
