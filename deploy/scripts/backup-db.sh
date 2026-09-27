#!/usr/bin/env bash
# ==============================================================================
# GARSAME v3 — Automated MongoDB Daily Backup Script
# Performs compressed mongodump, validates output, and rotates old archives.
# ==============================================================================

set -euo pipefail

# Configuration
APP_DIR="/var/www/garsame-v3"
BACKUP_ROOT="/var/backups/mongodb/garsame"
RETENTION_DAYS=14
LOG_FILE="/var/log/garsame/backup.log"
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_FILE="${BACKUP_ROOT}/garsame_backup_${TIMESTAMP}.archive.gz"

# Ensure directories exist
mkdir -p "${BACKUP_ROOT}"
mkdir -p "$(dirname "${LOG_FILE}")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] $*" | tee -a "${LOG_FILE}"
}

log "Starting database backup..."

# Load environment variables if available
if [[ -f "${APP_DIR}/.env.production" ]]; then
    # shellcheck disable=SC1091
    source "${APP_DIR}/.env.production"
elif [[ -f "${APP_DIR}/.env.local" ]]; then
    # shellcheck disable=SC1091
    source "${APP_DIR}/.env.local"
fi

MONGODB_URI="${MONGODB_URI:-mongodb://127.0.0.1:27017/garsame}"

# Execute mongodump with compression directly into archive
if mongodump --uri="${MONGODB_URI}" --archive="${BACKUP_FILE}" --gzip; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    log "Backup successfully created: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
    log "ERROR: mongodump failed!" >&2
    exit 1
fi

# Rotate old backups
log "Rotating backups older than ${RETENTION_DAYS} days..."
DELETED_COUNT=$(find "${BACKUP_ROOT}" -name "garsame_backup_*.archive.gz" -type f -mtime +"${RETENTION_DAYS}" -print -delete | wc -l)
log "Rotation complete: ${DELETED_COUNT} old backup(s) pruned."

log "Backup job finished successfully."
