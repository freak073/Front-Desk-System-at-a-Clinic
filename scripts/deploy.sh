#!/bin/bash

# Front Desk System Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="/opt/clinic-system/backups"
LOG_FILE="/var/log/clinic-deployment.log"

echo -e "${GREEN}🚀 Starting deployment for environment: $ENVIRONMENT${NC}"

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# Function to check if service is healthy
check_health() {
    local service=$1
    local max_attempts=30
    local attempt=1
    
    log "Checking health of $service..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f $COMPOSE_FILE exec -T $service curl -f http://localhost:3000/health > /dev/null 2>&1 || 
           docker-compose -f $COMPOSE_FILE exec -T $service curl -f http://localhost:3001/health > /dev/null 2>&1; then
            log "✅ $service is healthy"
            return 0
        fi
        
        log "⏳ Waiting for $service to be healthy (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    log "❌ $service failed health check"
    return 1
}

# Function to backup database
backup_database() {
    log "Creating database backup..."
    
    mkdir -p $BACKUP_DIR
    
    local backup_file="$BACKUP_DIR/clinic_db_$(date +%Y%m%d_%H%M%S).sql"
    
    docker-compose -f $COMPOSE_FILE exec -T db mysqldump \
        -u root -p$DB_ROOT_PASSWORD \
        --single-transaction \
        --routines \
        --triggers \
        $DB_NAME > $backup_file
    
    if [ $? -eq 0 ]; then
        log "✅ Database backup created: $backup_file"
        
        # Compress backup
        gzip $backup_file
        log "✅ Backup compressed: $backup_file.gz"
        
        # Keep only last 7 days of backups
        find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
        log "🧹 Old backups cleaned up"
    else
        log "❌ Database backup failed"
        exit 1
    fi
}

# Function to run database migrations
run_migrations() {
    log "Running database migrations..."
    
    docker-compose -f $COMPOSE_FILE exec -T backend npm run migration:run
    
    if [ $? -eq 0 ]; then
        log "✅ Database migrations completed"
    else
        log "❌ Database migrations failed"
        exit 1
    fi
}

# Function to deploy services
deploy_services() {
    log "Deploying services..."
    
    # Pull latest images
    docker-compose -f $COMPOSE_FILE pull
    
    # Start database first
    docker-compose -f $COMPOSE_FILE up -d db redis
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    sleep 30
    
    # Run migrations
    run_migrations
    
    # Deploy backend and frontend with zero downtime
    docker-compose -f $COMPOSE_FILE up -d --no-deps backend frontend
    
    # Start nginx load balancer
    docker-compose -f $COMPOSE_FILE up -d nginx
    
    # Start monitoring services
    docker-compose -f $COMPOSE_FILE up -d prometheus grafana
    
    log "✅ All services deployed"
}

# Function to verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check if all services are running
    local services=("db" "backend" "frontend" "nginx" "redis")
    
    for service in "${services[@]}"; do
        if docker-compose -f $COMPOSE_FILE ps $service | grep -q "Up"; then
            log "✅ $service is running"
        else
            log "❌ $service is not running"
            docker-compose -f $COMPOSE_FILE logs $service
            exit 1
        fi
    done
    
    # Health checks
    check_health backend
    check_health frontend
    
    # Test API endpoints
    log "Testing API endpoints..."
    
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        log "✅ Backend API is responding"
    else
        log "❌ Backend API is not responding"
        exit 1
    fi
    
    if curl -f http://localhost > /dev/null 2>&1; then
        log "✅ Frontend is responding"
    else
        log "❌ Frontend is not responding"
        exit 1
    fi
    
    log "✅ Deployment verification completed successfully"
}

# Function to rollback deployment
rollback() {
    log "🔄 Rolling back deployment..."
    
    # Stop current services
    docker-compose -f $COMPOSE_FILE down
    
    # Restore from backup (if needed)
    local latest_backup=$(ls -t $BACKUP_DIR/*.sql.gz | head -n1)
    if [ -n "$latest_backup" ]; then
        log "Restoring from backup: $latest_backup"
        gunzip -c $latest_backup | docker-compose -f $COMPOSE_FILE exec -T db mysql -u root -p$DB_ROOT_PASSWORD $DB_NAME
    fi
    
    # Start previous version
    docker-compose -f $COMPOSE_FILE up -d
    
    log "✅ Rollback completed"
}

# Main deployment process
main() {
    log "Starting deployment process..."
    
    # Check if .env file exists
    if [ ! -f .env.prod ]; then
        log "❌ .env.prod file not found"
        exit 1
    fi
    
    # Load environment variables
    source .env.prod
    
    # Create backup
    backup_database
    
    # Deploy services
    deploy_services
    
    # Verify deployment
    verify_deployment
    
    log "🎉 Deployment completed successfully!"
    
    # Show service status
    echo -e "${GREEN}Service Status:${NC}"
    docker-compose -f $COMPOSE_FILE ps
    
    echo -e "${GREEN}Access URLs:${NC}"
    echo "Frontend: http://localhost"
    echo "Backend API: http://localhost/api"
    echo "Grafana: http://localhost:3001"
    echo "Prometheus: http://localhost:9090"
}

# Handle script arguments
case "$1" in
    "rollback")
        rollback
        ;;
    "verify")
        verify_deployment
        ;;
    *)
        main
        ;;
esac