#!/bin/bash

# Production Startup Script for Front Desk System
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"

echo -e "${GREEN}🚀 Starting Front Desk System in Production Mode${NC}"

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Environment file $ENV_FILE not found${NC}"
    echo -e "${YELLOW}Please copy .env.prod.example to .env.prod and configure it${NC}"
    exit 1
fi

# Load environment variables
source $ENV_FILE

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${GREEN}📁 Creating necessary directories...${NC}"
mkdir -p nginx/logs
mkdir -p /opt/clinic-system/backups
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources

# Pull latest images
echo -e "${GREEN}📥 Pulling latest Docker images...${NC}"
docker-compose -f $COMPOSE_FILE pull

# Start infrastructure services first
echo -e "${GREEN}🗄️  Starting infrastructure services...${NC}"
docker-compose -f $COMPOSE_FILE up -d db redis

# Wait for database to be ready
echo -e "${GREEN}⏳ Waiting for database to be ready...${NC}"
timeout=60
counter=0
while ! docker-compose -f $COMPOSE_FILE exec -T db mysqladmin ping -h localhost -u root -p$DB_ROOT_PASSWORD --silent; do
    if [ $counter -eq $timeout ]; then
        echo -e "${RED}❌ Database failed to start within $timeout seconds${NC}"
        exit 1
    fi
    echo -e "${YELLOW}⏳ Waiting for database... ($counter/$timeout)${NC}"
    sleep 1
    ((counter++))
done

echo -e "${GREEN}✅ Database is ready${NC}"

# Run database migrations
echo -e "${GREEN}🔄 Running database migrations...${NC}"
docker-compose -f $COMPOSE_FILE run --rm backend npm run migration:run

# Start application services
echo -e "${GREEN}🚀 Starting application services...${NC}"
docker-compose -f $COMPOSE_FILE up -d backend frontend

# Wait for application services to be ready
echo -e "${GREEN}⏳ Waiting for application services...${NC}"
sleep 30

# Start load balancer
echo -e "${GREEN}⚖️  Starting load balancer...${NC}"
docker-compose -f $COMPOSE_FILE up -d nginx

# Start monitoring services
echo -e "${GREEN}📊 Starting monitoring services...${NC}"
docker-compose -f $COMPOSE_FILE up -d prometheus grafana

# Health checks
echo -e "${GREEN}🏥 Performing health checks...${NC}"

# Check backend health
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    docker-compose -f $COMPOSE_FILE logs backend
fi

# Check frontend health
if curl -f http://localhost > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
    docker-compose -f $COMPOSE_FILE logs frontend
fi

# Display service status
echo -e "${GREEN}📋 Service Status:${NC}"
docker-compose -f $COMPOSE_FILE ps

# Display access information
echo -e "${GREEN}🌐 Access Information:${NC}"
echo "Frontend: http://localhost"
echo "Backend API: http://localhost/api"
echo "Grafana: http://localhost:3001 (admin / $GRAFANA_PASSWORD)"
echo "Prometheus: http://localhost:9090"

# Display resource usage
echo -e "${GREEN}💻 Resource Usage:${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo -e "${GREEN}🎉 Front Desk System started successfully!${NC}"
echo -e "${YELLOW}💡 Use 'docker-compose -f $COMPOSE_FILE logs -f' to view logs${NC}"
echo -e "${YELLOW}💡 Use './scripts/backup.sh' to create database backups${NC}"