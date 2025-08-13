#!/bin/bash

# Database Backup Script for Front Desk System
set -e

# Configuration
BACKUP_DIR="/opt/clinic-system/backups"
RETENTION_DAYS=30
COMPOSE_FILE="docker-compose.prod.yml"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Load environment variables
if [ -f .env.prod ]; then
    source .env.prod
else
    echo -e "${RED}❌ .env.prod file not found${NC}"
    exit 1
fi

# Create backup directory
mkdir -p $BACKUP_DIR

# Function to create database backup
create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/clinic_db_$timestamp.sql"
    
    echo -e "${GREEN}📦 Creating database backup...${NC}"
    
    # Create backup
    docker-compose -f $COMPOSE_FILE exec -T db mysqldump \
        -u root -p$DB_ROOT_PASSWORD \
        --single-transaction \
        --routines \
        --triggers \
        --add-drop-table \
        --add-locks \
        --create-options \
        --disable-keys \
        --extended-insert \
        --quick \
        --set-charset \
        $DB_NAME > $backup_file
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database backup created: $backup_file${NC}"
        
        # Compress backup
        gzip $backup_file
        echo -e "${GREEN}✅ Backup compressed: $backup_file.gz${NC}"
        
        # Calculate backup size
        local size=$(du -h "$backup_file.gz" | cut -f1)
        echo -e "${GREEN}📊 Backup size: $size${NC}"
        
        return 0
    else
        echo -e "${RED}❌ Database backup failed${NC}"
        return 1
    fi
}

# Function to clean old backups
cleanup_old_backups() {
    echo -e "${GREEN}🧹 Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"
    
    local deleted_count=$(find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
    
    if [ $deleted_count -gt 0 ]; then
        echo -e "${GREEN}✅ Deleted $deleted_count old backup(s)${NC}"
    else
        echo -e "${GREEN}ℹ️  No old backups to delete${NC}"
    fi
}

# Function to list backups
list_backups() {
    echo -e "${GREEN}📋 Available backups:${NC}"
    ls -lh $BACKUP_DIR/*.sql.gz 2>/dev/null | awk '{print $9, $5, $6, $7, $8}' || echo "No backups found"
}

# Function to restore from backup
restore_backup() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        echo -e "${RED}❌ Please specify backup file${NC}"
        list_backups
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}❌ Backup file not found: $backup_file${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}🔄 Restoring from backup: $backup_file${NC}"
    
    # Confirm restoration
    read -p "Are you sure you want to restore the database? This will overwrite current data. (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Restoration cancelled"
        exit 0
    fi
    
    # Stop services that depend on database
    docker-compose -f $COMPOSE_FILE stop backend frontend
    
    # Restore database
    if [[ $backup_file == *.gz ]]; then
        gunzip -c $backup_file | docker-compose -f $COMPOSE_FILE exec -T db mysql -u root -p$DB_ROOT_PASSWORD $DB_NAME
    else
        docker-compose -f $COMPOSE_FILE exec -T db mysql -u root -p$DB_ROOT_PASSWORD $DB_NAME < $backup_file
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database restored successfully${NC}"
        
        # Restart services
        docker-compose -f $COMPOSE_FILE up -d backend frontend
        echo -e "${GREEN}✅ Services restarted${NC}"
    else
        echo -e "${RED}❌ Database restoration failed${NC}"
        exit 1
    fi
}

# Function to verify backup integrity
verify_backup() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        echo -e "${RED}❌ Please specify backup file${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}🔍 Verifying backup integrity: $backup_file${NC}"
    
    if [[ $backup_file == *.gz ]]; then
        if gunzip -t $backup_file; then
            echo -e "${GREEN}✅ Backup file is valid${NC}"
        else
            echo -e "${RED}❌ Backup file is corrupted${NC}"
            exit 1
        fi
    else
        if file $backup_file | grep -q "ASCII text"; then
            echo -e "${GREEN}✅ Backup file appears to be valid${NC}"
        else
            echo -e "${RED}❌ Backup file format is invalid${NC}"
            exit 1
        fi
    fi
}

# Main function
main() {
    case "$1" in
        "create"|"")
            create_backup
            cleanup_old_backups
            list_backups
            ;;
        "list")
            list_backups
            ;;
        "restore")
            restore_backup "$2"
            ;;
        "verify")
            verify_backup "$2"
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        *)
            echo "Usage: $0 {create|list|restore <file>|verify <file>|cleanup}"
            echo ""
            echo "Commands:"
            echo "  create   - Create a new database backup (default)"
            echo "  list     - List all available backups"
            echo "  restore  - Restore database from backup file"
            echo "  verify   - Verify backup file integrity"
            echo "  cleanup  - Remove old backups"
            exit 1
            ;;
    esac
}

main "$@"