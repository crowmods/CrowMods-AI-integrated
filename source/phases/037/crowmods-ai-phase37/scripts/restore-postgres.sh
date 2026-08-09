#!/usr/bin/env sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_FILE:?BACKUP_FILE is required}"

gzip -dc "$BACKUP_FILE" | psql "$DATABASE_URL"

echo "Restore completed."
