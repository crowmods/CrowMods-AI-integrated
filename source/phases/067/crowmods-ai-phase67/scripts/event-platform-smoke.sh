#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:4000}"

curl -fsS "$BASE_URL/health" >/dev/null
curl -fsS "$BASE_URL/ready" >/dev/null
curl -fsS "$BASE_URL/api/events/dlq" >/dev/null
curl -fsS "$BASE_URL/api/events/operations" >/dev/null

echo "Event platform smoke test passed."
