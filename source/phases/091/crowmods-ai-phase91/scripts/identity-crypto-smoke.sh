#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:4000}"

curl -fsS "$BASE_URL/health" >/dev/null
curl -fsS "$BASE_URL/ready" >/dev/null
curl -fsS "$BASE_URL/api/security/crypto-health" >/dev/null
curl -fsS "$BASE_URL/api/security/crypto-operations" >/dev/null

echo "Identity and cryptographic smoke test passed."
