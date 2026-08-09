#!/usr/bin/env sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_FILE:?BACKUP_FILE is required}"

echo "WARNING: restore replaces database contents."
echo "Use a disposable/staging database for restore verification."

pg_restore   --clean   --if-exists   --no-owner   --dbname="$DATABASE_URL"   "$BACKUP_FILE"

echo "Restore completed."
