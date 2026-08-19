#!/usr/bin/env bash
# Smoke-test a running CrowMods deployment: API health, public site, auth.
#
# Env:
#   BASE_URL     API base          (default https://crowmods-ai-integrated.onrender.com)
#   ADMIN_EMAIL  admin email       (default admin@crowmods.test)
#   ADMIN_PASS   admin password    (default admin123)
#
# Exits non-zero if any check fails. Passing ADMIN_PASS in env overrides the
# default. Use scripts/reset-admin.js first if the password was rotated.
set -u

BASE_URL="${BASE_URL:-https://crowmods-ai-integrated.onrender.com}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@crowmods.test}"
ADMIN_PASS="${ADMIN_PASS:-admin123}"

fail=0
check() { # check <name> <desc> <cmd...>
  local name="$1" desc="$2"; shift 2
  if "$@" >/dev/null 2>&1; then
    echo "  ok  $name — $desc"
  else
    echo "FAIL  $name — $desc"
    fail=1
  fi
}

echo "Verifying $BASE_URL"
echo "  admin: $ADMIN_EMAIL"

check health "GET /health returns 200" curl -sf -o /dev/null "$BASE_URL/health"
check root "GET / serves public index (HTML)" bash -c "curl -sf '$BASE_URL/' | grep -q 'CrowMods Releases'"
check index "GET /releases returns 200" curl -sf -o /dev/null "$BASE_URL/releases"
check robots "robots.txt allows crawl" bash -c "curl -sf '$BASE_URL/robots.txt' | grep -q 'Allow: /'"
check sitemap "sitemap.xml is valid XML" bash -c "curl -sf '$BASE_URL/sitemap.xml' | grep -q '<urlset'"
check ogimage "og-logo.png serves PNG" bash -c "curl -sf '$BASE_URL/og-logo.png' | file - | grep -q PNG"
check favicon "favicon.ico serves image" bash -c "curl -sf '$BASE_URL/favicon.ico' | file - | grep -qi 'png\|image'"
check adminlogin "admin login returns a token" bash -c "curl -sf -X POST '$BASE_URL/api/admin/auth/login' -H 'Content-Type: application/json' -d '{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}' | grep -q '\"token\"'"
check integrations "GET /integrations authorized" bash -c "TOKEN=\$(curl -sf -X POST '$BASE_URL/api/admin/auth/login' -H 'Content-Type: application/json' -d '{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}' | sed -E 's/.*\"token\":\"([^\"]+)\".*/\1/'); curl -sf -H \"Authorization: Bearer \$TOKEN\" '$BASE_URL/api/admin/integrations' | grep -q 'integrations'"
check gateway "phase gateway /api/phases returns 200" curl -sf -o /dev/null "$BASE_URL/api/phases"

echo
if [ "$fail" -eq 0 ]; then
  echo "ALL CHECKS PASSED"
  exit 0
else
  echo "SOME CHECKS FAILED"
  exit 1
fi