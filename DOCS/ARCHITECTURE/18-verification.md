# 18 — Verification

No unit tests. Each procedure is run on the real thing, and states what is observed.

| # | Procedure | Observed |
|---|---|---|
| J1 | Open canonical origin in a clean profile. Press `landing-create-chart-button`, sign up with email, enter details, wait for voice setup, Continue | Each frozen screen in order; measured MB, load and tune rows; `WHAT SHE FOUND` values; Atelier with name, chart, version badge |
| J2 | Install PWA, or open a shell. Tap Begin | Pick a modality first; gates skip completed steps; reconcile call in network log |
| J3 | Choose Venus via select, then a chip, then a wheel tap | Lesson text, You and Venus with real sign and house, no OpenRouter call in network log; wheel highlight |
| J4 | With credits: Hear my personal reading. With 0 credits: same button | Spoken sentences in order, none cut; highlight follows; balance falls after; 0 credits shows Add credits and Top Up |
| J4b | During a reading, block network 3 s, then restore | Resume from last sentence without repetition; new key in network log; old key `usage` in ledger |
| J5 | Top Up, choose pack, pay in sandbox with `REVENUECAT_ALLOW_SANDBOX=true` | Provider's price; Firestore ledger `rc:<id>` once; balance in the same write; return to Atelier with balance and reading continuing |
| J5b | Repeat `POST /api/purchases/reconcile`, and replay the webhook twice | No new entries; balance unchanged |
| J5c | With webhook disabled, purchase, reload | Credits arrive from app-open reconcile |
| J6 | Signed out, press `landing-buy-credits` | Sign in, checkout directly for that product with no second choice, credits, Atelier |
| J7 | Souvenir: buy, wait | Progress with real numbers; reload mid-way resumes; "Your souvenir is ready"; links open PDF (Letter, frames match) and page (replay, wheel, Ask gives the frozen reply, no model call); Profile row and email links match |
| J8 | My Horoscope; Synastry sheet → Compare | Reading in conversation with today's transits; partner details absent from Firestore |
| J9 | Share: copy link in a private window; save image; save PDF | Chart preview without birth data; files saved on each platform |
| J10 | Profile: Settings, About, Restore, Sign out; erase history | Licence rows; toggles persist; turns removed; ledger intact |
| Rules | Try writing `users/{uid}` and `ledger` from console as the customer | Permission denied |
| Offering | Network log of offerings; check code path | Requested id is the configured id, never `current` |
| Insecure | Open `http://natally-v3.robin.mba` | Redirect once to the canonical https origin, no loop |
| Update | Deploy a new version with a tab open | Tab reloads itself once, deferred while typing or speaking; badge shows the new version |
| Chunk | Delete a chunk file on the host during a session; navigate | One reload, no loop |
| Clone | Fresh clone, `cp .env.example .env`, `./build_all.sh --web-only --skip-deploy` | Build succeeds without Admin-Manual; neutral name visible |
| No secret | `./build_all.sh` output, `dist-web/` | `check-no-secrets` passes; no value in the log |
| No Firebase admin | Build with no `FIREBASE_DEPLOY_SA_FILE` | `ACTION NEEDED` printed; later steps run |
| Voice | Read stored profile; listen to a long reading with numbers and abbreviations | Result stored; no sentence cut; generate-ahead as calibrated |
| Look | Each screen beside `frozen-screenshot.png` and the reference picture | Same layout and colours; wheel is 3D where the prototype drew flat |
| Analytics | GA4 DebugView, then toggle off | Catalogue events arrive with no personal data; none after toggle |
| Packages | `dist/RELEASE-MANIFEST.json` | AppImage, deb, rpm, APK, AAB, NSIS named and hashed; each runs where a machine exists |
