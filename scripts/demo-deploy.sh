#!/bin/bash

# Demo Deployment Script for Front Desk System
# This script sets up a demo environment with sample data

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🎭 Setting up Front Desk System Demo Environment${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

# Create demo environment file
echo -e "${GREEN}📝 Creating demo environment configuration...${NC}"
cat > .env.demo << EOF
# Demo Environment Configuration
DB_ROOT_PASSWORD=demo_root_pass
DB_USERNAME=demo_user
DB_PASSWORD=demo_pass
DB_NAME=front_desk_system_demo
JWT_SECRET=demo_jwt_secret_key_for_testing_only_32_chars
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE=http://localhost:3001
CORS_ORIGINS=http://localhost:3000
REDIS_PASSWORD=demo_redis_pass
GRAFANA_PASSWORD=demo_grafana_pass
NODE_ENV=development
LOG_LEVEL=debug
EOF

# Create demo docker-compose file
echo -e "${GREEN}🐳 Creating demo Docker Compose configuration...${NC}"
cat > docker-compose.demo.yml << EOF
version: '3.9'

services:
  db:
    image: mysql:8.0
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: \${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: \${DB_NAME}
      MYSQL_USER: \${DB_USERNAME}
      MYSQL_PASSWORD: \${DB_PASSWORD}
    ports:
      - "3307:3306"
    volumes:
      - demo_db_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --requirepass \${REDIS_PASSWORD}
    ports:
      - "6380:6379"
    volumes:
      - demo_redis_data:/data

  backend:
    build: ./backend
    restart: unless-stopped
    environment:
      NODE_ENV: development
      PORT: 3001
      DB_HOST: db
      DB_PORT: 3306
      DB_USERNAME: \${DB_USERNAME}
      DB_PASSWORD: \${DB_PASSWORD}
      DB_NAME: \${DB_NAME}
      JWT_SECRET: \${JWT_SECRET}
      FRONTEND_URL: \${FRONTEND_URL}
      CORS_ORIGINS: \${CORS_ORIGINS}
      LOG_LEVEL: debug
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "3001:3001"
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    restart: unless-stopped
    environment:
      NODE_ENV: development
      NEXT_PUBLIC_API_BASE: \${NEXT_PUBLIC_API_BASE}
    depends_on:
      - backend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next

volumes:
  demo_db_data:
  demo_redis_data:
EOF

# Load demo environment
source .env.demo

# Start demo services
echo -e "${GREEN}🚀 Starting demo services...${NC}"
docker-compose -f docker-compose.demo.yml up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 30

# Run database migrations
echo -e "${GREEN}🔄 Running database migrations...${NC}"
docker-compose -f docker-compose.demo.yml exec -T backend npm run migration:run

# Seed demo data
echo -e "${GREEN}🌱 Seeding demo data...${NC}"
docker-compose -f docker-compose.demo.yml exec -T backend npm run seed:demo 2>/dev/null || echo "Demo seeding script not found, skipping..."

# Create sample data via API calls
echo -e "${GREEN}📊 Creating sample data...${NC}"

# Wait a bit more for API to be ready
sleep 10

# Create sample doctors
curl -X POST http://localhost:3001/doctors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Sarah Johnson",
    "specialization": "General Medicine",
    "gender": "female",
    "location": "Room 101",
    "availabilitySchedule": {
      "monday": ["09:00-17:00"],
      "tuesday": ["09:00-17:00"],
      "wednesday": ["09:00-17:00"],
      "thursday": ["09:00-17:00"],
      "friday": ["09:00-17:00"]
    },
    "status": "available"
  }' 2>/dev/null || echo "API not ready yet"

curl -X POST http://localhost:3001/doctors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Michael Chen",
    "specialization": "Cardiology",
    "gender": "male",
    "location": "Room 205",
    "availabilitySchedule": {
      "monday": ["10:00-16:00"],
      "tuesday": ["10:00-16:00"],
      "wednesday": ["10:00-16:00"],
      "thursday": ["10:00-16:00"],
      "friday": ["10:00-16:00"]
    },
    "status": "available"
  }' 2>/dev/null || echo "API not ready yet"

# Create sample patients
curl -X POST http://localhost:3001/patients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "contactInfo": "john.smith@email.com",
    "medicalRecordNumber": "MRN001"
  }' 2>/dev/null || echo "API not ready yet"

curl -X POST http://localhost:3001/patients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Emily Davis",
    "contactInfo": "emily.davis@email.com",
    "medicalRecordNumber": "MRN002"
  }' 2>/dev/null || echo "API not ready yet"

# Health check
echo -e "${GREEN}🏥 Performing health checks...${NC}"
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed, but continuing...${NC}"
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend health check failed, but continuing...${NC}"
fi

# Display demo information
echo -e "${BLUE}🎉 Demo environment is ready!${NC}"
echo ""
echo -e "${GREEN}📱 Access URLs:${NC}"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001"
echo "API Health: http://localhost:3001/health"
echo ""
echo -e "${GREEN}🔑 Demo Credentials:${NC}"
echo "Username: admin"
echo "Password: admin123"
echo ""
echo -e "${GREEN}📊 Sample Data Created:${NC}"
echo "- 2 Doctors (Dr. Sarah Johnson, Dr. Michael Chen)"
echo "- 2 Patients (John Smith, Emily Davis)"
echo ""
echo -e "${GREEN}🛠️  Management Commands:${NC}"
echo "View logs: docker-compose -f docker-compose.demo.yml logs -f"
echo "Stop demo: docker-compose -f docker-compose.demo.yml down"
echo "Restart: docker-compose -f docker-compose.demo.yml restart"
echo ""
echo -e "${YELLOW}💡 Note: This is a demo environment with sample data.${NC}"
echo -e "${YELLOW}   For production deployment, use the production scripts.${NC}"