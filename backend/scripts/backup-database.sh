#!/bin/bash

###############################################################################
# Database Backup Script (T137: Automated Database Backups)
# Per NFR-013: Weekly automated database backups with retention policy
###############################################################################

set -e  # Exit on any error

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/fllowup}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="fllowup_db_${TIMESTAMP}.sql.gz"
LOG_FILE="/var/log/fllowup/backups.log"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"
mkdir -p "$(dirname "${LOG_FILE}")"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

log "Starting database backup..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "${DATABASE_URL}" ]; then
    log "ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Parse DATABASE_URL to extract connection details
# Format: postgresql://user:password@host:port/database
DB_HOST=$(echo "${DATABASE_URL}" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "${DATABASE_URL}" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p' | head -1)
DB_USER=$(echo "${DATABASE_URL}" | sed -n 's/\/\/\([^:]*\):.*/\1/p')
DB_PASSWORD=$(echo "${DATABASE_URL}" | sed -n 's/.*:\([^@]*\)@.*/\1/p')
DB_NAME=$(echo "${DATABASE_URL}" | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Default values if parsing failed
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

log "Backing up database: ${DB_NAME} from ${DB_HOST}:${DB_PORT}"

# Perform backup using pg_dump
PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --no-owner \
    --no-acl \
    --format=plain \
    --verbose \
    2>&1 | tee -a "${LOG_FILE}" | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Check if backup was successful
if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    log "Backup completed successfully: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
    log "ERROR: Backup failed"
    exit 1
fi

# Calculate checksum for integrity verification
CHECKSUM=$(md5sum "${BACKUP_DIR}/${BACKUP_FILE}" | cut -d' ' -f1)
echo "MD5: ${CHECKSUM}" > "${BACKUP_DIR}/${BACKUP_FILE}.md5"
log "Backup checksum: ${CHECKSUM}"

# Clean up old backups (retention policy)
log "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "fllowup_db_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}" -name "fllowup_db_*.sql.gz.md5" -mtime +${RETENTION_DAYS} -delete

# Count remaining backups
REMAINING=$(find "${BACKUP_DIR}" -name "fllowup_db_*.sql.gz" | wc -l)
log "Retained backups: ${REMAINING}"

# Optional: Upload to remote storage (uncomment and configure as needed)
# if command -v aws &> /dev/null && [ -n "${AWS_S3_BUCKET}" ]; then
#     log "Uploading backup to S3..."
#     aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "s3://${AWS_S3_BUCKET}/backups/${BACKUP_FILE}"
#     log "S3 upload completed"
# fi

log "Backup process completed"

exit 0
