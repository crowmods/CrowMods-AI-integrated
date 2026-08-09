#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:4000}"

curl -fsS "$BASE_URL/health" >/dev/null
curl -fsS "$BASE_URL/ready" >/dev/null
curl -fsS "$BASE_URL/api/capacity/policies" >/dev/null
curl -fsS "$BASE_URL/api/capacity/operations" >/dev/null

echo "Capacity/recovery API smoke test passed."
