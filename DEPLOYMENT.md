# Front Desk System - Deployment Guide

## Overview

This guide covers the complete deployment process for the Front Desk System, including production setup, monitoring, and maintenance procedures.

## Architecture

The production deployment uses a containerized architecture with the following components:

- **Frontend**: Next.js application served via Nginx
- **Backend**: NestJS API server with JWT authentication
- **Database**: MySQL 8.0 with automated backups
- **Cache**: Redis for session storage and caching
- **Load Balancer**: Nginx with SSL termination
- **Monitoring**: Prometheus + Grafana stack
- **CI/CD**: GitHub Actions for automated deployment

## Prerequisites

### Server Requirements

- **Minimum**: 4 CPU cores, 8GB RAM, 50GB storage
- **Recommended**: 8 CPU cores, 16GB RAM, 100GB SSD storage
- **Operating System**: Ubuntu 20.04 LTS or later
- **Docker**: Version 20.10 or later
- **Docker Compose**: Version 2.0 or later

### Domain and SSL

- Domain name pointing to your server
- SSL certificate (Let's Encrypt recommended)
- DNS configuration for subdomains (optional)

## Initial Server Setup

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install additional tools
sudo apt install -y git curl wget htop
```

### 2. Create Application Directory

```bash
sudo mkdir -p /opt/clinic-system
sudo chown $USER:$USER /opt/clinic-system
cd /opt/clinic-system
```

### 3. Clone Repository

```bash
git clone https://github.com/your-username/clinic-system.git .
```

## Configuration

### 1. Environment Variables

```bash
# Copy and edit production environment file
cp .env.prod.example .env.prod
nano .env.prod
```

**Important**: Update all placeholder values with secure passwords and proper URLs.

### 2. SSL Certificates

#### Option A: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot

# Generate certificates
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to nginx directory
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
sudo chown -R $USER:$USER nginx/ssl
```

#### Option B: Self-Signed (Development Only)

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### 3. Update Nginx Configuration

Edit `nginx/nginx.conf` to enable HTTPS:

```nginx
# Uncomment and configure the HTTPS server block
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    # ... rest of configuration
}
```

## Deployment

### 1. Automated Deployment (Recommended)

The system includes automated deployment via GitHub Actions:

1. **Set up GitHub Secrets**:
   - `PROD_HOST`: Your server IP address
   - `PROD_USER`: SSH username
   - `PROD_SSH_KEY`: Private SSH key
   - `PROD_URL`: Your domain URL
   - `SLACK_WEBHOOK`: Slack webhook for notifications (optional)

2. **Deploy**: Push to main branch or trigger manual deployment

### 2. Manual Deployment

```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

### 3. First-Time Setup

```bash
# Load environment variables
source .env.prod

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
sleep 60

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migration:run

# Create initial admin user (optional)
docker-compose -f docker-compose.prod.yml exec backend npm run seed:admin
```

## Monitoring and Maintenance

### 1. Service Monitoring

Access monitoring dashboards:

- **Grafana**: `https://your-domain.com:3001`
- **Prometheus**: `https://your-domain.com:9090`

Default Grafana credentials:
- Username: `admin`
- Password: Set in `GRAFANA_PASSWORD` environment variable

### 2. Health Checks

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check service logs
docker-compose -f docker-compose.prod.yml logs -f [service-name]

# Manual health check
curl -f https://your-domain.com/api/health
```

### 3. Database Backups

```bash
# Create manual backup
./scripts/backup.sh create

# List available backups
./scripts/backup.sh list

# Restore from backup
./scripts/backup.sh restore /path/to/backup.sql.gz
```

### 4. Automated Backups

Set up cron job for automated backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /opt/clinic-system && ./scripts/backup.sh create >> /var/log/clinic-backup.log 2>&1
```

## Security Considerations

### 1. Firewall Configuration

```bash
# Install UFW
sudo apt install -y ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. SSL/TLS Configuration

- Use strong SSL ciphers (configured in nginx.conf)
- Enable HTTP/2 for better performance
- Set up automatic certificate renewal

```bash
# Add certificate renewal to crontab
0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f /opt/clinic-system/docker-compose.prod.yml restart nginx
```

### 3. Security Headers

The Nginx configuration includes security headers:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Content-Security-Policy
- Referrer-Policy

## Performance Optimization

### 1. Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX idx_queue_status ON queue_entries(status);
CREATE INDEX idx_appointment_date ON appointments(appointment_datetime);
CREATE INDEX idx_patient_name ON patients(name);
```

### 2. Caching Strategy

- Redis for session storage
- Nginx caching for static assets
- Application-level caching for API responses

### 3. Resource Limits

Configure resource limits in docker-compose.prod.yml:

```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
    reservations:
      memory: 256M
      cpus: '0.25'
```

## Troubleshooting

### Common Issues

1. **Services not starting**:
   ```bash
   # Check logs
   docker-compose -f docker-compose.prod.yml logs [service-name]
   
   # Check resource usage
   docker stats
   ```

2. **Database connection issues**:
   ```bash
   # Check database status
   docker-compose -f docker-compose.prod.yml exec db mysql -u root -p -e "SHOW PROCESSLIST;"
   ```

3. **SSL certificate issues**:
   ```bash
   # Check certificate validity
   openssl x509 -in nginx/ssl/cert.pem -text -noout
   ```

### Log Locations

- Application logs: `docker-compose logs`
- Nginx logs: `nginx/logs/`
- System logs: `/var/log/`

## Scaling

### Horizontal Scaling

1. **Load Balancer**: Add multiple backend/frontend instances
2. **Database**: Set up MySQL replication
3. **Cache**: Redis cluster configuration

### Vertical Scaling

1. Increase server resources
2. Adjust Docker resource limits
3. Optimize database configuration

## Backup and Recovery

### Backup Strategy

1. **Database**: Daily automated backups with 30-day retention
2. **Application**: Git repository with tagged releases
3. **Configuration**: Environment files and certificates

### Recovery Procedures

1. **Database Recovery**:
   ```bash
   ./scripts/backup.sh restore /path/to/backup.sql.gz
   ```

2. **Full System Recovery**:
   ```bash
   # Restore from backup
   git checkout [tag/commit]
   ./scripts/deploy.sh
   ./scripts/backup.sh restore [backup-file]
   ```

## Maintenance Schedule

### Daily
- Monitor service health
- Check error logs
- Verify backup completion

### Weekly
- Review performance metrics
- Update security patches
- Clean up old logs

### Monthly
- Update dependencies
- Review and rotate secrets
- Performance optimization review

## Support and Documentation

### Useful Commands

```bash
# View all services
docker-compose -f docker-compose.prod.yml ps

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Update single service
docker-compose -f docker-compose.prod.yml up -d --no-deps backend

# View resource usage
docker stats

# Clean up unused resources
docker system prune -f
```

### Emergency Contacts

- System Administrator: [contact-info]
- Database Administrator: [contact-info]
- Development Team: [contact-info]

## Changelog

### Version 1.0.0
- Initial production deployment
- Basic monitoring setup
- Automated backup system

---

For additional support or questions, please refer to the project documentation or contact the development team.