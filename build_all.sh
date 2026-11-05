#!/usr/bin/env bash
# §16.1: the only build entry. Each step prints "[n/15] name: ok | skipped | ACTION NEEDED: <what to do>".
# A hard failure stops the build; a soft failure is recorded and the build goes on. No step prints a resolved value.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

WEB_ONLY=0 SKIP_DEPLOY=0 NO_WINDOWS=0 NO_ANDROID=0
for arg in "$@"; do
  case "$arg" in
    --web-only) WEB_ONLY=1 ;;
    --skip-deploy) SKIP_DEPLOY=1 ;;
    --no-windows) NO_WINDOWS=1 ;;
    --no-android) NO_ANDROID=1 ;;
    *) echo "unknown flag: $arg (use --web-only, --skip-deploy, --no-windows, --no-android)" >&2; exit 2 ;;
  esac
done

mkdir -p .tmp
exec 9>.tmp/release.lock
flock -n 9 || { echo "another build holds .tmp/release.lock" >&2; exit 1; }

LOG=.tmp/build.log
OUT=.tmp/step.out
: >"$LOG"
rm -f .tmp/deploy-status.json .tmp/deploy-*.log
ACTIONS=()

[ -d node_modules ] || pnpm install --frozen-lockfile --reporter=silent

summary() {
  echo
  echo "committed: $(git rev-parse --short HEAD 2>/dev/null || echo none), $(git status --porcelain 2>/dev/null | wc -l | tr -d ' ') uncommitted paths"
  node -e '
    const fs = require("fs");
    const file = ".tmp/deploy-status.json";
    const s = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
    const rows = (pick) => (s ? s.targets.map((t) => `${t.domain}=${pick(t) ? "yes" : "no"}`).join(" ") : "not run");
    console.log(`deployed: ${rows((t) => t.deployed)}`);
    console.log(`verified-live: ${rows((t) => t.live)}${s ? ` (v${s.version})` : ""}`);
  '
  if [ "${#ACTIONS[@]}" -gt 0 ]; then
    echo "actions needed:"
    printf '  - %s\n' "${ACTIONS[@]}"
  fi
}

skip() { echo "[$1/15] $2: skipped"; }

# run <n> <name> <hard|soft> <command...>
run() {
  local n=$1 name=$2 kind=$3 rc=0
  shift 3
  "$@" >"$OUT" 2>&1 || rc=$?
  { echo "== [$n/15] $name (exit $rc)"; cat "$OUT"; } >>"$LOG"
  sed 's/^/    /' "$OUT"
  local action
  action=$(grep -m1 '^ACTION NEEDED: ' "$OUT" | sed 's/^ACTION NEEDED: //' || true)
  if [ "$rc" -ne 0 ] && [ "$kind" = hard ]; then
    echo "[$n/15] $name: FAILED (exit $rc)"
    summary
    exit 1
  fi
  [ "$rc" -eq 0 ] || action=${action:-"step failed; see $LOG"}
  if [ -n "$action" ]; then
    while IFS= read -r line; do ACTIONS+=("$name: ${line#ACTION NEEDED: }"); done < <(grep '^ACTION NEEDED: ' "$OUT" || echo "$action")
    echo "[$n/15] $name: ACTION NEEDED: $action"
  else
    echo "[$n/15] $name: ok"
  fi
}

# A step whose script has not landed yet counts as skipped.
script_step() {
  local n=$1 name=$2 kind=$3 script=$4
  if [ -f "$script" ]; then run "$n" "$name" "$kind" node "$script"; else skip "$n" "$name"; fi
}

web_build() {
  VITE_BUILD_TARGET=web pnpm exec vite build
  if [ -f souvenir.html ]; then
    VITE_BUILD_TARGET=web pnpm exec vite build --config vite.souvenir.config.ts
  else
    echo "souvenir.html has not landed; the frozen atelier page is not built"
  fi
}
postbuild() {
  node scripts/postbuild-web.mjs
  node scripts/check-no-secrets.mjs
}
tauri_desktop() { VITE_BUILD_TARGET=desktop pnpm exec tauri build --config .generated/tauri.override.json --bundles appimage,deb,rpm; }
tauri_windows() { VITE_BUILD_TARGET=desktop pnpm exec tauri build --config .generated/tauri.override.json --runner cargo-xwin --target x86_64-pc-windows-msvc --bundles nsis; }

script_step 1 stamp-version hard scripts/stamp-version.mjs
script_step 2 resolve-env hard scripts/resolve-env.mjs
script_step 3 build-tokens hard scripts/build-tokens.mjs
script_step 4 copy-ort-assets hard scripts/copy-ort-assets.mjs
script_step 5 third-party hard scripts/third-party.mjs
run 6 vite-build hard web_build
run 7 postbuild-web hard postbuild

if [ "$SKIP_DEPLOY" -eq 1 ]; then skip 8 deploy-web; else script_step 8 deploy-web soft scripts/deploy-web.mjs; fi

if [ "$WEB_ONLY" -eq 1 ] || [ "$SKIP_DEPLOY" -eq 1 ]; then
  skip 9 deploy-server
  skip 10 firebase-setup
else
  script_step 9 deploy-server soft scripts/deploy-server.mjs
  script_step 10 firebase-setup soft scripts/firebase-setup.mjs
fi

if [ "$WEB_ONLY" -eq 1 ] || [ ! -d src-tauri ]; then skip 11 tauri-linux; else run 11 tauri-linux soft tauri_desktop; fi

if [ "$WEB_ONLY" -eq 1 ] || [ "$NO_ANDROID" -eq 1 ]; then skip 12 tauri-android; else script_step 12 tauri-android soft scripts/build-android.mjs; fi

if [ "$WEB_ONLY" -eq 1 ] || [ "$NO_WINDOWS" -eq 1 ] || [ ! -d src-tauri ]; then skip 13 tauri-windows; else run 13 tauri-windows soft tauri_windows; fi

if [ "$WEB_ONLY" -eq 1 ]; then skip 14 release-manifest; else script_step 14 release-manifest hard scripts/release-manifest.mjs; fi

if [ "$WEB_ONLY" -eq 1 ] || [ "$SKIP_DEPLOY" -eq 1 ]; then skip 15 publish-packages; else script_step 15 publish-packages soft scripts/publish-packages.mjs; fi

# The deploy steps wrote to the log after step 7 scanned it.
rc=0
node scripts/check-no-secrets.mjs || rc=$?
summary
exit "$rc"
