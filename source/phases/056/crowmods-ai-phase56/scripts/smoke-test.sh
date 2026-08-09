#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:4000}"

echo "Checking health..."
curl -fsS "$BASE_URL/health"

echo
echo "Checking readiness..."
curl -fsS "$BASE_URL/ready"

echo
echo "Smoke tests passed."
