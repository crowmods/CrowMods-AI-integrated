#!/usr/bin/env sh
set -eu

: "${BASE_URL:?BASE_URL is required}"

echo "[1] health"
curl -fsS "$BASE_URL/health" >/dev/null

echo "[2] readiness"
curl -fsS "$BASE_URL/ready" >/dev/null

echo "[3] security headers"
curl -fsSI "$BASE_URL/health" | grep -qi "x-content-type-options"

echo "Post-launch checks passed."
