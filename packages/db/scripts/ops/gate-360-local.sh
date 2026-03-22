#!/usr/bin/env bash
# macOS/Linux entry: same behavior as pnpm gate:360:local (see gate-360-local.mjs).
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$DIR/gate-360-local.mjs" "$@"
