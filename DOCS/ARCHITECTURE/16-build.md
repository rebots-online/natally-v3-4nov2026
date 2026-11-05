# 16 — Build, version, deploy, update

## 16.1 `build_all.sh`

Bash, `set -euo pipefail`, one `.tmp/release.lock`. Flags: `--web-only` (steps 1 to 8), `--skip-deploy`, `--no-windows`, `--no-android`. Each step prints `[n/15] name: ok | skipped | ACTION NEEDED: <what to do>`. **Hard** failure stops the build. **Soft** failure prints the action, records it, and continues; the final summary lists all, and the exit code is 0 unless a hard step failed. No step prints a resolved value.

| # | Script | Writes | Failure |
|---|---|---|---|
| 1 | `scripts/stamp-version.mjs` | `scripts/version-state.json` (tracked: `{ major: 3, minor }`, minor +1), `.generated/version.json` `{ version, versionCode }`; `VITE_APP_VERSION` | Hard |
| 2 | `scripts/resolve-env.mjs` | `.generated/*` (§8.3) | Hard |
| 3 | `scripts/build-tokens.mjs` | `design-system/tokens.css` from `tokens.json`, `tokens.extra.json` | Hard |
| 4 | `scripts/copy-ort-assets.mjs` | `public/ort/*.wasm`, `*.mjs` from `onnxruntime-web/dist` | Hard |
| 5 | `scripts/third-party.mjs` | `public/third-party.json` from production dependency licences | Hard |
| 6 | `vite build`, `vite build --config vite.souvenir.config.ts` (`VITE_BUILD_TARGET=web`) | `dist-web/`, `dist-web/souvenir-runtime/` | Hard |
| 7 | `scripts/postbuild-web.mjs` | `200.html`, `release.json` `{ version, urls }`, `souvenir-manifest.json`; then `scripts/check-no-secrets.mjs` | Hard |
| 8 | `scripts/deploy-web.mjs` | One deploy per `WEB_DEPLOY_TARGETS` entry: `surge dist-web <domain>` with `SURGE_LOGIN`, `SURGE_TOKEN`; `netlify deploy --prod --dir dist-web --site NETLIFY_SITE_ID`. Prints each URL and its HTTP status | Soft per domain |
| 9 | `scripts/deploy-server.mjs` | `esbuild` bundle check; `netlify env:import .generated/server.env`; `netlify deploy --prod --functions netlify/functions`. Warns over 3,800 bytes of env | Soft: no token → `ACTION NEEDED: deploy functions through the Netlify connector; input is netlify/ and .generated/server.env` |
| 10 | `scripts/firebase-setup.mjs` | Adds each `VITE_WEB_DOMAINS` entry plus `tauri.localhost` to authorized domains: `PATCH https://identitytoolkit.googleapis.com/admin/v2/projects/<id>/config?updateMask=authorizedDomains`; `firebase deploy --only firestore` | Soft: no `FIREBASE_DEPLOY_SA_FILE` → `ACTION NEEDED: add these domains and deploy firestore.rules` with the list |
| 11 | `pnpm tauri build --config .generated/tauri.override.json --bundles appimage,deb,rpm` (target `desktop`) | `src-tauri/target/release/bundle/` | Soft |
| 12 | `scripts/build-android.mjs` (`VITE_BUILD_TARGET=android`, re-run Vite) `pnpm tauri android build --apk --aab` | APK, AAB with `debugSymbolLevel = 'FULL'`, `src-tauri/gen/android/keystore.properties` from build config | Soft |
| 13 | `pnpm tauri build --runner cargo-xwin --target x86_64-pc-windows-msvc --bundles nsis` (`desktop`) | NSIS | Soft |
| 14 | `scripts/release-manifest.mjs` | Copies packages to `dist/`, writes `dist/RELEASE-MANIFEST.json` | Hard |
| 15 | `scripts/publish-packages.mjs` | SFTP upload of `dist/` to `RELEASE_SFTP_PATH` and `release.json`; skipped when empty | Soft |

Web and desktop builds both produce `dist-web`; steps 11 to 13 use Tauri's `frontendDist: ../dist-web` with `beforeBuildCommand: pnpm vite build`, under the right `VITE_BUILD_TARGET`. Step 13 needs no Windows machine. After the shell steps, `dist-web` is not re-deployed. Deployment state, commit state and verified-live state are three separate lines of the summary.

## 16.2 Version

`MAJOR.MINOR.BUILD`: MAJOR 3; MINOR from `version-state.json`, +1 each run; BUILD = `floor(Date.now()/60000) % 100000`, zero-padded to five. `versionCode = 3*100000 + MINOR`. Shown as `v<version>` by `VersionBadge`. Only this script sets it. A cloner's first `MINOR` is 1.

## 16.3 Release manifest (`dist/RELEASE-MANIFEST.json`)

```json
{ "schema": "natally.release/v1", "version": "3.N.BBBBB", "versionCode": 300000, "builtAt": "ISO", "web": [{ "domain": "", "type": "surge", "https": true, "deployed": true }],
  "server": { "deployed": false }, "firebase": { "domains": false, "rules": false },
  "files": [{ "platform": "linux|android|windows", "kind": "appimage|deb|rpm|apk|aab|nsis", "name": "", "bytes": 0, "sha256": "" }],
  "actionsNeeded": ["printed text"] }
```

## 16.4 Android

`src-tauri/gen/android` is tracked after `pnpm tauri android init` (Foundation for the `shells` task). `MainActivity.kt` extends Tauri's generated activity and creates `PaywallActivityLauncher(this, this)` in `onCreate`, before `super.onCreate` completes any UI; `launchPaywall(offeringId)` fetches `Purchases.sharedInstance.getOfferings`, calls `getOffering(id)`, and launches with that offering. Result → plugin. Plugin source is `src-tauri/plugins/natally-android/`. `minSdk` 26, `compileSdk` and `targetSdk` 36. Signing inputs: `ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. Missing → unsigned output plus printed action. No web billing code is in this build: `src/billing/rails/index.ts` selects by `config.buildTarget`, and `web` rail files are imported with `import()` inside the branch that Vite removes.

## 16.5 PWA

`vite-plugin-pwa`: `strategies: 'generateSW'`, `registerType: 'autoUpdate'`, `injectRegister: false`, workbox `skipWaiting`, `clientsClaim`. Precache: app shell, JS, CSS, fonts, icons. Excluded, with runtime `CacheFirst`: `/ort/`, `/atelier/**`, `/geo/`. Excluded entirely: `/souvenir-runtime/`. Manifest name, short name, icons from config and `public/brand/`; theme and background `#120c1c`; `display: standalone`.

`src/app/pwa.ts`, only if `buildTarget === 'web'` and `isSecureContext`:

1. `new Workbox('/sw.js').register()`. Then `wb.update()` hourly, and on `visibilitychange` to visible.
2. On `controlling` with `isUpdate`: `const v = <new worker version>`. If `natally.pwa.reloadedFor === v`, stop. Otherwise wait until no `natally:typing` is active (or 30 s since the last key) and `natally:speaking` is false, then set the guard and `location.reload()` exactly once.
3. `pwa_update_applied` after the reload.

Lazy chunk failure: `vite:preloadError` or a rejected lazy import: if `natally.chunkReloaded` is unset, set it and reload; otherwise the error boundary shows `app.chunkFailed` and keeps retrying on `online`. Successful route load clears it.

## 16.6 Desktop update notice

`checkForShellUpdate` fetches `VITE_RELEASE_INFO_URL` at start. A newer version shows toast `shell.updateAvailable` with action `shell.updateAction` → `openExternal` of the file for that platform.
