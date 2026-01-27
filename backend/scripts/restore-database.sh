#!/bin/bash

###############################################################################
# Database Restore Script
# For restoring from automated backups
###############################################################################

set -e  # Exit on any error

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/fllowup}"
LOG_FILE="/var/log/fllowup/restore.log"

# Ensure log directory exists
mkdir -p "$(dirname "${LOG_FILE}")"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh "${BACKUP_DIR}"/fllowup_db_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    # Try to find it in the backup directory
    if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
        BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
    else
        log "ERROR: Backup file not found: ${BACKUP_FILE}"
        exit 1
    fi
fi

log "Starting database restore from: ${BACKUP_FILE}"

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
DB_HOST=$(echo "${DATABASE_URL}" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "${DATABASE_URL}" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p' | head -1)
DB_USER=$(echo "${DATABASE_URL}" | sed -n 's/\/\/\([^:]*\):.*/\1/p')
DB_PASSWORD=$(echo "${DATABASE_URL}" | sed -n 's/.*:\([^@]*\)@.*/\1/p')
DB_NAME=$(echo "${DATABASE_URL}" | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Default values if parsing failed
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

log "Restoring to database: ${DB_NAME} at ${DB_HOST}:${DB_PORT}"

# Verify backup integrity if checksum file exists
if [ -f "${BACKUP_FILE}.md5" ]; then
    log "Verifying backup integrity..."
    CHECKSUM_FILE=$(cat "${BACKUP_FILE}.md5" | cut -d' ' -f1)
    CHECKSUM_CALC=$(md5sum "${BACKUP_FILE}" | cut -d' ' -f1)

    if [ "${CHECKSUM_FILE}" != "${CHECKSUM_CALC}" ]; then
        log "ERROR: Checksum verification failed"
        log "Expected: ${CHECKSUM_FILE}"
        log "Calculated: ${CHECKSUM_CALC}"
        exit 1
    fi
    log "Backup integrity verified"
fi

# Confirm restore operation
read -p "This will REPLACE the entire database. Are you sure? (yes/no): " CONFIRM
if [ "${CONFIRM}" != "yes" ]; then
    log "Restore cancelled by user"
    exit 0
fi

# Perform restore
log "Extracting and restoring database..."
gunzip -c "${BACKUP_FILE}" | PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --verbose \
    2>&1 | tee -a "${LOG_FILE}"

if [ $? -eq 0 ]; then
    log "Restore completed successfully"
    log "Please verify data integrity"
else
    log "ERROR: Restore failed"
    exit 1
fi

exit 0
