#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://localhost:4000}"
curl -fsS "$BASE_URL/health" >/dev/null
echo "Phase 291 smoke test passed."
