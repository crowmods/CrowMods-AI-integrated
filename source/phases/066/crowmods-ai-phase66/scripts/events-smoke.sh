#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:4000}"

curl -fsS "$BASE_URL/health" >/dev/null
curl -fsS "$BASE_URL/ready" >/dev/null
curl -fsS "$BASE_URL/api/events" >/dev/null
curl -fsS "$BASE_URL/api/dependencies/graph" >/dev/null

echo "Event/dependency API smoke test passed."
