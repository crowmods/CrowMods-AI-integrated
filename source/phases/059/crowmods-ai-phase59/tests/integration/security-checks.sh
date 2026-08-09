#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:4000}"

echo "[1] security headers"
HEADERS="$(curl -fsSI "$BASE_URL/health")"

echo "$HEADERS" | grep -qi "x-content-type-options" || {
  echo "Missing X-Content-Type-Options header"
  exit 1
}

echo "$HEADERS" | grep -qi "x-frame-options" || {
  echo "Missing X-Frame-Options header"
  exit 1
}

echo "Basic security-header checks passed."
