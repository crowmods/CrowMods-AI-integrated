#!/usr/bin/env sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_DIR:=./backups}"

mkdir -p "$BACKUP_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$BACKUP_DIR/crowmods-$STAMP.sql.gz"

pg_dump "$DATABASE_URL" | gzip > "$FILE"

echo "Backup created: $FILE"
