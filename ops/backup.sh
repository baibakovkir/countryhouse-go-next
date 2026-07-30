#!/bin/sh
set -eu

DEPLOY_DIR=${COUNTRYHOUSE_DEPLOY_DIR:-/opt/countryhouse}
BACKUP_DIR=${COUNTRYHOUSE_BACKUP_DIR:-/var/backups/countryhouse}
RETENTION_DAYS=${COUNTRYHOUSE_BACKUP_RETENTION_DAYS:-14}

cd "$DEPLOY_DIR"
set -a
# shellcheck disable=SC1091
. ./.env
set +a

mkdir -p "$BACKUP_DIR"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
target="$BACKUP_DIR/countryhouse-$timestamp.dump"

docker compose --env-file .env --env-file .release.env -f compose.prod.yml \
  exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$target"

find "$BACKUP_DIR" -type f -name 'countryhouse-*.dump' -mtime "+$RETENTION_DAYS" -delete

if [ -n "${RESTIC_REPOSITORY:-}" ]; then
  if ! command -v restic >/dev/null 2>&1; then
    echo "RESTIC_REPOSITORY is set but restic is not installed" >&2
    exit 1
  fi
  restic backup "$target"
  restic forget --keep-daily "$RETENTION_DAYS" --prune
fi

echo "Backup created: $target"

