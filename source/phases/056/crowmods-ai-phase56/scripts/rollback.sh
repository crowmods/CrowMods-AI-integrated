#!/usr/bin/env sh
set -eu

IMAGE="${ROLLBACK_IMAGE:?ROLLBACK_IMAGE is required}"
SERVICE="${SERVICE:-api}"

echo "Rollback requested for $SERVICE to $IMAGE"
echo "This helper intentionally does not execute a provider-specific deploy."
echo "Connect it to your container platform after validating the target image."

exit 0
