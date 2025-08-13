# Front Desk System - Production Setup Guide

## Quick Start

### 1. Prerequisites
- Ubuntu 20.04+ server with Docker and Docker Compose
- Domain name with DNS pointing to your server
- SSL certificate (Let's Encrypt recommended)
- Minimum 4GB RAM, 2 CPU cores, 20GB storage

### 2. One-Command Setup

```bash
# Clone repository
git clone <repository-url> /opt/clinic-system
cd /opt/clinic-system

# Configure environment
cp .env.prod.example .env.prod
nano .env.prod  # Update with your values

# Start production system
chmod +x scripts/start-production.sh
./scripts/start-production.sh
```

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Application   │    │    Database     │
│     (Nginx)     │────│   (Frontend/    │────│    (MySQL)      │
│                 │    │    Backend)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │     Cache       │              │
         └──────────────│    (Redis)      │──────────────┘
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │   Monitoring    │
                        │ (Prometheus/    │
                        │   Grafana)      │
                        └─────────────────┘
```

## Services

| Service    | Port | Description                    | Health Check |
|------------|------|--------------------------------|--------------|
| Frontend   | 3000 | Next.js application            | `GET /`      |
| Backend    | 3001 | NestJS API server              | `GET /health`|
| Database   | 3306 | MySQL 8.0                     | Internal     |
| Redis      | 6379 | Cache and session storage      | Internal     |
| Nginx      | 80   | Load balancer and SSL          | `GET /health`|
| Prometheus | 9090 | Metrics collection             | `GET /`      |
| Grafana    | 3001 | Monitoring dashboard           | `GET /`      |

## Environment Configuration

### Required Variables

```bash
# Database
DB_ROOT_PASSWORD=secure_password_here
DB_USERNAME=clinic_user
DB_PASSWORD=secure_db_password
DB_NAME=front_desk_system

# Application
JWT_SECRET=your_jwt_secret_minimum_32_chars
FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_API_BASE=https://your-domain.com/api
CORS_ORIGINS=https://your-domain.com

# Security
REDIS_PASSWORD=secure_redis_password
GRAFANA_PASSWORD=secure_grafana_password
```

## SSL/HTTPS Setup

### Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy to nginx directory
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# Set up auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### Update Nginx Configuration

Uncomment the HTTPS server block in `nginx/nginx.conf` and update with your domain.

## Deployment Methods

### 1. Automated CI/CD (Recommended)

Set up GitHub Actions with these secrets:
- `PROD_HOST`: Server IP address
- `PROD_USER`: SSH username  
- `PROD_SSH_KEY`: Private SSH key
- `PROD_URL`: Your domain URL

Push to main branch triggers automatic deployment.

### 2. Manual Deployment

```bash
# Deploy with script
./scripts/deploy.sh

# Or step by step
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring

### Grafana Dashboard
- URL: `https://your-domain.com:3001`
- Username: `admin`
- Password: Set in `GRAFANA_PASSWORD`

### Key Metrics
- API response times
- Database connections
- Memory usage
- Error rates
- Request volume

### Alerts
Configure alerts for:
- Service downtime
- High response times (>2s)
- Database connection issues
- Memory usage >80%

## Backup Strategy

### Automated Backups

```bash
# Set up daily backups
crontab -e

# Add this line for daily backup at 2 AM
0 2 * * * cd /opt/clinic-system && ./scripts/backup.sh create
```

### Manual Backup

```bash
# Create backup
./scripts/backup.sh create

# List backups
./scripts/backup.sh list

# Restore backup
./scripts/backup.sh restore /path/to/backup.sql.gz
```

### Backup Retention
- Daily backups kept for 30 days
- Weekly backups kept for 3 months
- Monthly backups kept for 1 year

## Security Checklist

- [ ] Strong passwords for all services
- [ ] SSL/TLS certificates configured
- [ ] Firewall configured (ports 80, 443, 22 only)
- [ ] Regular security updates
- [ ] Database access restricted
- [ ] API rate limiting enabled
- [ ] Security headers configured
- [ ] Regular backup testing

## Performance Optimization

### Database
- Connection pooling enabled
- Query optimization with indexes
- Regular maintenance and cleanup

### Application
- Redis caching for sessions
- Static asset caching
- Gzip compression
- Code splitting and lazy loading

### Infrastructure
- Load balancing with Nginx
- Resource limits configured
- Health checks enabled
- Auto-restart policies

## Troubleshooting

### Common Issues

1. **Services won't start**
   ```bash
   # Check logs
   docker-compose -f docker-compose.prod.yml logs [service]
   
   # Check resources
   docker stats
   free -h
   df -h
   ```

2. **Database connection errors**
   ```bash
   # Check database status
   docker-compose -f docker-compose.prod.yml exec db mysql -u root -p -e "SHOW PROCESSLIST;"
   ```

3. **SSL certificate issues**
   ```bash
   # Check certificate
   openssl x509 -in nginx/ssl/cert.pem -text -noout
   
   # Test SSL
   curl -I https://your-domain.com
   ```

### Log Locations
- Application: `docker-compose logs`
- Nginx: `nginx/logs/`
- System: `/var/log/`

## Maintenance

### Daily
- [ ] Check service health
- [ ] Review error logs
- [ ] Verify backup completion

### Weekly  
- [ ] Update system packages
- [ ] Review performance metrics
- [ ] Clean up old logs

### Monthly
- [ ] Security updates
- [ ] Certificate renewal check
- [ ] Performance optimization review
- [ ] Backup restoration test

## Scaling

### Horizontal Scaling
```bash
# Scale backend instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale frontend instances  
docker-compose -f docker-compose.prod.yml up -d --scale frontend=2
```

### Load Testing
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test API endpoints
ab -n 1000 -c 10 https://your-domain.com/api/health

# Test frontend
ab -n 1000 -c 10 https://your-domain.com/
```

## Support

### Health Check Commands
```bash
# Overall system status
./scripts/deploy.sh verify

# Individual service health
curl -f https://your-domain.com/api/health
curl -f https://your-domain.com/

# Database health
docker-compose -f docker-compose.prod.yml exec db mysqladmin ping
```

### Emergency Procedures

1. **Service Recovery**
   ```bash
   # Restart all services
   docker-compose -f docker-compose.prod.yml restart
   
   # Rollback deployment
   ./scripts/deploy.sh rollback
   ```

2. **Database Recovery**
   ```bash
   # Restore from latest backup
   ./scripts/backup.sh restore $(ls -t /opt/clinic-system/backups/*.sql.gz | head -1)
   ```

## Contact Information

- **System Administrator**: [admin@your-domain.com]
- **Development Team**: [dev@your-domain.com]
- **Emergency Contact**: [emergency@your-domain.com]

---

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)