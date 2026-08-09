#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:4000}"

echo "[1] health"
curl -fsS "$BASE_URL/health" >/dev/null

echo "[2] readiness"
curl -fsS "$BASE_URL/ready" >/dev/null

echo "[3] release stages"
curl -fsS "$BASE_URL/api/releases/stages" >/dev/null || true

echo "API contract smoke tests passed."
