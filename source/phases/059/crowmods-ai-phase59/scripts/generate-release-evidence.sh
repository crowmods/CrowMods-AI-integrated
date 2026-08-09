#!/usr/bin/env sh
set -eu

: "${RELEASE_VERSION:?RELEASE_VERSION is required}"
: "${COMMIT_SHA:?COMMIT_SHA is required}"

OUT="${OUT:-release-evidence.json}"

cat > "$OUT" <<EOF
{
  "releaseVersion": "$RELEASE_VERSION",
  "commitSha": "$COMMIT_SHA",
  "generatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "evidence": {
    "ci": false,
    "unitTests": false,
    "integrationTests": false,
    "securityChecks": false,
    "artifactVerified": false,
    "stagingSmoke": false,
    "databaseBackupVerified": false,
    "canaryVerified": false
  },
  "note": "Populate only from verified CI/deployment evidence."
}
EOF

echo "Created $OUT"
