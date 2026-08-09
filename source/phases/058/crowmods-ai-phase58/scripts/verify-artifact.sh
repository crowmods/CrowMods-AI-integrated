#!/usr/bin/env sh
set -eu

: "${IMAGE_DIGEST:?IMAGE_DIGEST is required}"
: "${EXPECTED_DIGEST:?EXPECTED_DIGEST is required}"

if [ "$IMAGE_DIGEST" != "$EXPECTED_DIGEST" ]; then
  echo "Artifact digest mismatch."
  exit 1
fi

echo "Artifact digest verified."
