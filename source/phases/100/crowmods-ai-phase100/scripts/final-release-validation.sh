#!/usr/bin/env sh
set -eu

node backend/src/release-validation.js
curl -fsS "${BASE_URL:-http://localhost:4000}/health" >/dev/null
curl -fsS "${BASE_URL:-http://localhost:4000}/ready" >/dev/null

echo "CrowMods AI Phase 100 validation completed."
