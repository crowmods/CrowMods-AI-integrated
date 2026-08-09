#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:4000}"

curl -fsS "$BASE_URL/health" >/dev/null
curl -fsS "$BASE_URL/ready" >/dev/null
curl -fsS "$BASE_URL/api/broker/topics" >/dev/null
curl -fsS "$BASE_URL/api/broker/assignments" >/dev/null
curl -fsS "$BASE_URL/api/broker/workers" >/dev/null

echo "Broker coordination smoke test passed."
