#!/usr/bin/env sh
set -eu

required_vars="
CI_OK
UNIT_TESTS_OK
INTEGRATION_TESTS_OK
SECURITY_OK
ARTIFACT_OK
STAGING_OK
BACKUP_OK
CANARY_OK
"

for key in $required_vars; do
  eval "value=\${$key:-false}"
  if [ "$value" != "true" ]; then
    echo "NOT READY: $key"
    exit 1
  fi
done

echo "PRODUCTION READY: all required evidence flags are true."
