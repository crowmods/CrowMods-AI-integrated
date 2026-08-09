#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://localhost:4000}"
curl -fsS "$BASE_URL/health" >/dev/null
echo "Phase 213 smoke test passed."
