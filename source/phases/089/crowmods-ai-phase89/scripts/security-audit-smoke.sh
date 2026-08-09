#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:4000}"

curl -fsS "$BASE_URL/health" >/dev/null
curl -fsS "$BASE_URL/ready" >/dev/null

curl -fsS "$BASE_URL/api/security/me"   -H "x-auth-subject: smoke-operator"   -H "x-auth-provider: development-idp"   -H "x-auth-roles: ops.viewer" >/dev/null

curl -fsS "$BASE_URL/api/security/operations"   -H "x-auth-subject: smoke-operator"   -H "x-auth-provider: development-idp"   -H "x-auth-roles: ops.viewer" >/dev/null

echo "Security and audit smoke test passed."
