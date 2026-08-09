#!/usr/bin/env sh
set -eu

required="
CI_OK
TESTS_OK
SECURITY_OK
ARTIFACT_OK
STAGING_OK
BACKUP_OK
CANARY_OK
APPROVAL_OK
"

for key in $required; do
  eval "value=\${$key:-false}"
  if [ "$value" != "true" ]; then
    echo "LAUNCH BLOCKED: $key"
    exit 1
  fi
done

echo "LAUNCH GATE PASSED"
