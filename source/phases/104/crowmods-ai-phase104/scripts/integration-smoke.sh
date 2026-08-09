#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:4000}"

curl -fsS "$BASE_URL/health" >/dev/null
curl -fsS "$BASE_URL/ready" >/dev/null
curl -fsS "$BASE_URL/api/security/integrations" >/dev/null
curl -fsS "$BASE_URL/api/security/integration-dashboard" >/dev/null

echo "Phase 104 integration smoke test passed."
