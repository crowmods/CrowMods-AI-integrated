#!/usr/bin/env sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"

pg_dump "$DATABASE_URL"   --format=custom   --file="$BACKUP_DIR/crowmods-$STAMP.dump"

echo "Backup created: $BACKUP_DIR/crowmods-$STAMP.dump"
