#!/usr/bin/env sh
set -eu

: "${RELEASE_VERSION:?RELEASE_VERSION is required}"
: "${COMMIT_SHA:?COMMIT_SHA is required}"
: "${API_IMAGE_DIGEST:?API_IMAGE_DIGEST is required}"
: "${WORKER_IMAGE_DIGEST:?WORKER_IMAGE_DIGEST is required}"

cat <<EOF
{
  "releaseVersion": "$RELEASE_VERSION",
  "commitSha": "$COMMIT_SHA",
  "apiImageDigest": "$API_IMAGE_DIGEST",
  "workerImageDigest": "$WORKER_IMAGE_DIGEST"
}
EOF
