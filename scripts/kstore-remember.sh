#!/usr/bin/env bash
# Sends generated documents to KStore for verbatim archival (operator workstations only).
# Usage: scripts/kstore-remember.sh <file> [<file> ...]
# A clone without the KStore client skips this silently; nothing in the build depends on it.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="${KSTORE_CLI:-$HOME/.local/bin/kstore}"
if [ ! -x "$CLI" ]; then echo "kstore client not installed; skipped"; exit 0; fi
for f in "$@"; do
  rel="$(realpath --relative-to="$ROOT" "$f")"
  printf '%s -> ' "$rel"
  "$CLI" remember "$(basename "$ROOT")/$rel" < "$f" 2>&1 | head -c 300 || true
  echo
done
