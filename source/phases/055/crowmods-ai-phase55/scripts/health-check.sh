#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost}"

curl -fsS "$BASE_URL/health" >/dev/null
curl -fsS "$BASE_URL/ready" >/dev/null

echo "Health and readiness checks passed."
