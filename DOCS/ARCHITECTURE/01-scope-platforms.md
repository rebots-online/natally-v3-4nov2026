# 01 — Scope and platforms

## 1.1 What ships

| Item | Definition |
|---|---|
| Web | Static site and installable PWA, hosted on Surge (deploy target type per domain; §16). No HTTP headers can be set |
| Android | Tauri 2 APK and AAB. Play Billing only; no other payment method and no link to one |
| Linux | Tauri 2 AppImage, deb, rpm |
| Windows | Tauri 2 NSIS installer, cross-compiled on Linux |
| Server | Stateless Web `Request`/`Response` handlers in `server/`, Netlify Functions adapter and Node HTTP adapter |
| Product | Modality splash, landing, sign-in, birth details, voice setup, atelier (3D wheel, room, conversation, voice), free lessons, paid spoken readings, horoscope, synastry, share, top up, profile with ledger, settings, about, souvenir (PDF and frozen atelier) |

## 1.2 Not in this version

| Excluded | Consequence |
|---|---|
| Tarot and I Ching content | Listed locked; manifest folders exist with `status: 'locked'` and no module |
| Chargebee and WooCommerce internals | Rail contract only (§7.6) |
| iOS and macOS | No target |
| Light theme, languages other than en-US | None |
| Refund reversal, subscriptions | Provider refunds change no ledger entry; all products are one-time |
| Tauri in-app updater | Desktop shows an update notice with the download link (§1.3) |
| Server-side PDF or model streaming | PDF and atelier are built on the device; only keepsake element text is generated on the server |

## 1.3 Platform matrix

`P` = implemented in `src/platform/`. Android has no landing page: `/` opens Pick a modality (journey 2).

| Capability | Web | Android | Linux | Windows |
|---|---|---|---|---|
| Origin | `https://natally-v3.surge.sh` (canonical); insecure aliases redirect to it (§1.5) | `https://tauri.localhost` (`useHttpsScheme: true`) | `tauri://localhost` | `https://tauri.localhost` (`useHttpsScheme: true`) |
| Google sign-in | `signInWithPopup` | Credential Manager via plugin `natally-android`, ID token → `signInWithCredential` | System browser → canonical `/auth/desktop` bridge → loopback → `signInWithCredential` | Same as Linux |
| Email, phone sign-in | Firebase JS in page | Firebase JS in webview | Firebase JS in webview | Firebase JS in webview |
| Purchase | RevenueCat Web Billing in page (`purchases-js`) | RevenueCat Paywalls on Play Billing via `natally-android` | Web Billing in webview | Web Billing in webview |
| Voice execution | Worker pool, onnxruntime-web WASM single-thread; WebGPU if probe passes | Same; pool cap 2 | Same; `SharedArrayBuffer` absent | Same; WebGPU probed |
| Model weights | OPFS `natally-voice/` | OPFS `natally-voice/` | OPFS if probe passes, else `tauri-plugin-fs` under `$APPDATA/voice/` | OPFS `natally-voice/` |
| File save | `<a download>`; Web Share with files when `navigator.canShare` | `natally-android.saveToDownloads` (MediaStore) | `plugin-dialog.save` + `plugin-fs.writeFile` | Same as Linux |
| Copy link | `navigator.clipboard` | Same | Same | Same |
| External links | `window.open` | `plugin-opener` | `plugin-opener` | `plugin-opener` |
| Deep links | None | None | None | None |
| Analytics | gtag | `POST /api/collect` | `POST /api/collect` | `POST /api/collect` |
| Update | Service worker self-update (§16.5) | Google Play | Launch check of `release.json`, toast with download link | Same as Linux |
| Install buttons | Shown on landing | Not reachable | Not reachable | Not reachable |

Deep links are not needed because checkout stays in the webview, Android billing returns through the activity result, and desktop sign-in returns over loopback. `tauri-plugin-deep-link` is therefore not a dependency.

## 1.4 Platform adapter

Contract `PlatformAdapter` is in §4.11. `getPlatform()` picks the implementation once at boot.

| Implementation | File | Selected when |
|---|---|---|
| `webPlatform` | `src/platform/web.ts` | No `window.__TAURI_INTERNALS__` |
| `desktopPlatform` | `src/platform/desktop.ts` | Tauri, `kind` from Rust command `app_platform` is `linux` or `windows` |
| `androidPlatform` | `src/platform/android.ts` | Tauri, `app_platform` is `android` |

Android-only code is in `src/platform/android.ts` and the plugin. `VITE_BUILD_TARGET=android` removes the web billing rail and all install links at build time through `import.meta.env` branch elimination, so the APK contains no other payment method.

Desktop Google sign-in: the shell calls `start_loopback`, opens `<canonical>/auth/desktop?port=<port>&state=<state>` with `openExternal`, and waits on `await_loopback`. The bridge page runs `signInWithPopup`, reads `GoogleAuthProvider.credentialFromResult`, and navigates to `http://127.0.0.1:<port>/cb?state=…&id_token=…&access_token=…`. The shell passes the tokens to `signInWithCredential`.

RevenueCat on the web: `identify(null)` configures with `Purchases.generateRevenueCatAnonymousAppUserId()`, only to read prices for signed-out visitors, and no purchase runs without sign-in; `identify(uid)` calls `changeUser(uid)`. The offering is always `offerings.all[<configured id>]`.

## 1.5 Secure-context behaviour

Service workers, OPFS, `crypto.subtle` and clipboard need a secure context. `src/app/boot.ts` runs this before React mounts:

| Condition | Behaviour |
|---|---|
| `window.isSecureContext` true | Normal |
| false, and `VITE_WEB_CANONICAL_ORIGIN` is an https origin different from `location.origin`, and `sessionStorage['natally.secureRedirect']` is unset | Set the guard, then `location.replace(canonical + path + search + hash)` |
| false, no canonical origin or guard already set | App runs: no service worker; `voice.isSupported()` false, voice setup goes straight to "Continue without sound"; Google popup still attempted, its failure shows `auth.popupInsecure`; `copyText` falls back to a selected text field |

`VITE_WEB_CANONICAL_ORIGIN` is derived by `scripts/resolve-env.mjs`: the first entry of `WEB_DEPLOY_TARGETS` with `https: true`. `natally-v3.robin.mba` is listed with `https: false`, and no DNS change is planned.
