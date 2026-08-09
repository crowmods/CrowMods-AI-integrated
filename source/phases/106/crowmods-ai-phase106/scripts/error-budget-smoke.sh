#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:4000}"

curl -fsS "$BASE_URL/health" >/dev/null
curl -fsS "$BASE_URL/ready" >/dev/null
curl -fsS "$BASE_URL/api/security/provider-status" >/dev/null
curl -fsS "$BASE_URL/api/security/error-budget-dashboard" >/dev/null

echo "Phase 106 error-budget smoke test passed."
