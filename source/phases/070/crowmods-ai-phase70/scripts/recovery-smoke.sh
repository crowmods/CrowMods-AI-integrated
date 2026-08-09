#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:4000}"

curl -fsS "$BASE_URL/health" >/dev/null
curl -fsS "$BASE_URL/ready" >/dev/null
curl -fsS "$BASE_URL/api/recovery/dlq/jobs" >/dev/null
curl -fsS "$BASE_URL/api/recovery/observability" >/dev/null

echo "Recovery API smoke test passed."
