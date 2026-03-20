#!/bin/bash
# OverCMS — PostgreSQL backup script
# Dodaj do crona: 0 2 * * * /opt/overcms/scripts/backup-db.sh
set -euo pipefail

BACKUP_DIR="/opt/overcms/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=14

mkdir -p "$BACKUP_DIR"

# Dump z kontenera
docker exec overcms_postgres pg_dump \
  -U "${POSTGRES_USER:-overcms}" \
  "${POSTGRES_DB:-overcms}" \
  | gzip > "${BACKUP_DIR}/overcms_${TIMESTAMP}.sql.gz"

echo "Backup created: ${BACKUP_DIR}/overcms_${TIMESTAMP}.sql.gz"

# Usuwanie starych backupów
find "$BACKUP_DIR" -name "overcms_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "Old backups cleaned (>${RETENTION_DAYS} days)"
