#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:?BASE_URL is required}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-30}"
SLEEP_SECONDS="${SLEEP_SECONDS:-5}"

i=1

while [ "$i" -le "$MAX_ATTEMPTS" ]; do
  if curl -fsS "$BASE_URL/ready" >/dev/null; then
    echo "Deployment is ready."
    exit 0
  fi

  echo "Waiting for deployment readiness: $i/$MAX_ATTEMPTS"
  sleep "$SLEEP_SECONDS"
  i=$((i+1))
done

echo "Deployment failed readiness verification."
exit 1
