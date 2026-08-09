#!/usr/bin/env sh
set -eu

: "${KNOWN_GOOD_IMAGE:?KNOWN_GOOD_IMAGE is required}"

echo "Rollback target: $KNOWN_GOOD_IMAGE"
echo "Provider-specific adapter must execute the rollback."
echo "Verify health, traffic and incident state after rollback."
