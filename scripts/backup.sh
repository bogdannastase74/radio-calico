#!/bin/bash

# RadioCalico Database Backup Script
# This script creates a backup of the RadioCalico database

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"

# Container name
CONTAINER_NAME="radiocalico-production"

echo -e "${GREEN}RadioCalico Database Backup${NC}"
echo "======================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}Warning: Container ${CONTAINER_NAME} is not running${NC}"
    echo "Attempting to backup from volume anyway..."

    # Backup from volume even if container is not running
    echo "Creating volume backup..."
    BACKUP_FILE="$BACKUP_DIR/radiocalico-volume-backup-${TIMESTAMP}.tar.gz"

    docker run --rm \
        -v radiocalico-data:/source:ro \
        -v "$BACKUP_DIR":/backup \
        alpine \
        tar czf "/backup/radiocalico-volume-backup-${TIMESTAMP}.tar.gz" -C /source .

    if [ -f "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo -e "${GREEN}Backup completed successfully!${NC}"
        echo "File: $BACKUP_FILE"
        echo "Size: $BACKUP_SIZE"
    else
        echo -e "${RED}Backup failed!${NC}"
        exit 1
    fi
else
    # Container is running, use SQLite backup command for consistency
    echo "Container is running. Using SQLite backup command..."

    BACKUP_FILE="$BACKUP_DIR/database-${TIMESTAMP}.sqlite"

    # Use sqlite3 .backup command to ensure consistency
    # This properly handles WAL mode and active connections
    docker exec "${CONTAINER_NAME}" sh -c "sqlite3 /app/data/database.sqlite '.backup /tmp/backup.sqlite'" 2>/dev/null && \
    docker cp "${CONTAINER_NAME}:/tmp/backup.sqlite" "$BACKUP_FILE" && \
    docker exec "${CONTAINER_NAME}" rm -f /tmp/backup.sqlite || {
        echo -e "${YELLOW}SQLite backup failed, trying alternative backup method...${NC}"

        # Alternative: backup entire volume
        docker run --rm \
            -v radiocalico-data:/source:ro \
            -v "$BACKUP_DIR":/backup \
            alpine \
            tar czf "/backup/radiocalico-volume-backup-${TIMESTAMP}.tar.gz" -C /source .

        BACKUP_FILE="$BACKUP_DIR/radiocalico-volume-backup-${TIMESTAMP}.tar.gz"
    }

    if [ -f "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo -e "${GREEN}Backup completed successfully!${NC}"
        echo "File: $BACKUP_FILE"
        echo "Size: $BACKUP_SIZE"
    else
        echo -e "${RED}Backup failed!${NC}"
        exit 1
    fi
fi

# Clean up old backups (keep last 7 days)
echo ""
echo "Cleaning up old backups (keeping last 7 days)..."
find "$BACKUP_DIR" -name "database-*.sqlite" -mtime +7 -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "radiocalico-*.tar.gz" -mtime +7 -delete 2>/dev/null || true

# List recent backups
echo ""
echo "Recent backups:"
ls -lht "$BACKUP_DIR" | head -n 6

echo ""
echo -e "${GREEN}Backup process complete!${NC}"
