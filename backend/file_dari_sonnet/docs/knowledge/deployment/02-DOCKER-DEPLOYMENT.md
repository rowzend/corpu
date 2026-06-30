# 🚀 Deployment Guide - Knowledge Base System

> **Panduan deployment untuk Production Environment**

## 📋 Daftar Isi

1. [Server Requirements](#server-requirements)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Docker Deployment](#docker-deployment)
4. [Manual Deployment](#manual-deployment)
5. [Nginx Configuration](#nginx-configuration)
6. [SSL/HTTPS Setup](#sslhttps-setup)
7. [Environment Variables](#environment-variables)
8. [Post-Deployment](#post-deployment)

---

## 💻 Server Requirements

### Minimum Specifications
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 50 GB SSD
- **OS**: Ubuntu 20.04 LTS atau lebih baru
- **Network**: 100 Mbps

### Recommended Specifications
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 100 GB SSD
- **OS**: Ubuntu 22.04 LTS
- **Network**: 1 Gbps

### Software Requirements
```bash
- Docker 24.0+
- Docker Compose 2.20+
- Nginx 1.24+
- PostgreSQL 14+ (via Docker)
- Redis 7+ (via Docker)
```

---

## ✅ Pre-Deployment Checklist

### 1. Server Setup
- [ ] Server provisioned dan accessible via SSH
- [ ] Domain name configured (e.g., knowledge.asncorpu.com)
- [ ] DNS A record pointing to server IP
- [ ] Firewall configured (ports 80, 443, 22)
- [ ] SSH key-based authentication enabled

### 2. Software Installation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

### 3. Security Setup
```bash
# Install fail2ban
sudo apt install fail2ban -y

# Configure UFW firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Install certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

---

## 🐳 Docker Deployment

### 1. Clone Repository
```bash
# Create application directory
sudo mkdir -p /opt/asncorpu
sudo chown $USER:$USER /opt/asncorpu
cd /opt/asncorpu

# Clone repository
git clone <repository-url> .
```

### 2. Configure Environment
```bash
# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

**Important Environment Variables:**
```bash
# Django Settings
DEBUG=False
SECRET_KEY=<generate-strong-secret-key>
ALLOWED_HOSTS=knowledge.asncorpu.com,www.knowledge.asncorpu.com

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=asncorpu_db
DB_USER=asncorpu_user
DB_PASSWORD=<strong-password>
DB_HOST=postgres
DB_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Email (for notifications)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=<your-email>
EMAIL_HOST_PASSWORD=<app-password>

# Media & Static
MEDIA_URL=/media/
STATIC_URL=/static/
```

### 3. Build and Start Containers
```bash
# Build images
docker compose -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose ps
```

### 4. Initialize Database
```bash
# Run migrations
docker compose -f docker-compose.prod.yml exec asncorpu_backend python manage.py migrate

# Create superuser
docker compose -f docker-compose.prod.yml exec asncorpu_backend python manage.py createsuperuser

# Collect static files
docker compose -f docker-compose.prod.yml exec asncorpu_backend python manage.py collectstatic --noinput

# Seed initial data
docker compose -f docker-compose.prod.yml exec asncorpu_backend python manage.py seed_menu_categories
```

---

## 🔧 Manual Deployment (Without Docker)

### 1. Install System Dependencies
```bash
sudo apt install python3.10 python3.10-venv python3-pip postgresql postgresql-contrib redis-server nginx -y
```

### 2. Setup PostgreSQL
```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE asncorpu_db;
CREATE USER asncorpu_user WITH PASSWORD 'strong_password';
ALTER ROLE asncorpu_user SET client_encoding TO 'utf8';
ALTER ROLE asncorpu_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE asncorpu_user SET timezone TO 'Asia/Jakarta';
GRANT ALL PRIVILEGES ON DATABASE asncorpu_db TO asncorpu_user;
\q
```

### 3. Setup Application
```bash
# Create app directory
sudo mkdir -p /opt/asncorpu
sudo chown $USER:$USER /opt/asncorpu
cd /opt/asncorpu

# Clone repository
git clone <repository-url> .

# Create virtual environment
python3.10 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env
```

### 4. Run Migrations
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

### 5. Setup Gunicorn
```bash
# Install gunicorn
pip install gunicorn

# Create systemd service
sudo nano /etc/systemd/system/asncorpu.service
```

**Service File Content:**
```ini
[Unit]
Description=ASN CORPU Django Application
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/opt/asncorpu
Environment="PATH=/opt/asncorpu/venv/bin"
ExecStart=/opt/asncorpu/venv/bin/gunicorn \
    --workers 4 \
    --bind unix:/opt/asncorpu/asncorpu.sock \
    --timeout 120 \
    --access-logfile /var/log/asncorpu/access.log \
    --error-logfile /var/log/asncorpu/error.log \
    config.wsgi:application

[Install]
WantedBy=multi-user.target
```

```bash
# Create log directory
sudo mkdir -p /var/log/asncorpu
sudo chown www-data:www-data /var/log/asncorpu

# Enable and start service
sudo systemctl enable asncorpu
sudo systemctl start asncorpu
sudo systemctl status asncorpu
```

---

## 🌐 Nginx Configuration

### 1. Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/asncorpu
```

**Configuration:**
```nginx
upstream asncorpu_backend {
    server unix:/opt/asncorpu/asncorpu.sock fail_timeout=0;
}

server {
    listen 80;
    server_name knowledge.asncorpu.com www.knowledge.asncorpu.com;
    
    client_max_body_size 100M;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name knowledge.asncorpu.com www.knowledge.asncorpu.com;
    
    # SSL Configuration (will be added by certbot)
    ssl_certificate /etc/letsencrypt/live/knowledge.asncorpu.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/knowledge.asncorpu.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    client_max_body_size 100M;
    
    # Static files
    location /static/ {
        alias /opt/asncorpu/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        alias /opt/asncorpu/media/;
        expires 7d;
        add_header Cache-Control "public";
    }
    
    # Application
    location / {
        proxy_pass http://asncorpu_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
    
    # Health check
    location /health/ {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 2. Enable Site
```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/asncorpu /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## 🔒 SSL/HTTPS Setup

### Using Let's Encrypt (Recommended)
```bash
# Obtain SSL certificate
sudo certbot --nginx -d knowledge.asncorpu.com -d www.knowledge.asncorpu.com

# Test auto-renewal
sudo certbot renew --dry-run

# Setup auto-renewal cron
sudo crontab -e
# Add: 0 0 * * * certbot renew --quiet
```

### Using Custom SSL Certificate
```bash
# Copy certificates
sudo mkdir -p /etc/nginx/ssl
sudo cp your-cert.crt /etc/nginx/ssl/
sudo cp your-key.key /etc/nginx/ssl/

# Update nginx config
ssl_certificate /etc/nginx/ssl/your-cert.crt;
ssl_certificate_key /etc/nginx/ssl/your-key.key;
```

---

## 🔐 Environment Variables

### Production `.env` Template
```bash
# Django Core
DEBUG=False
SECRET_KEY=<generate-with-python-secrets>
ALLOWED_HOSTS=knowledge.asncorpu.com,www.knowledge.asncorpu.com
CSRF_TRUSTED_ORIGINS=https://knowledge.asncorpu.com,https://www.knowledge.asncorpu.com

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=asncorpu_db
DB_USER=asncorpu_user
DB_PASSWORD=<strong-password>
DB_HOST=localhost  # or postgres for Docker
DB_PORT=5432

# Redis
REDIS_HOST=localhost  # or redis for Docker
REDIS_PORT=6379
REDIS_DB=0

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@asncorpu.com
EMAIL_HOST_PASSWORD=<app-password>
DEFAULT_FROM_EMAIL=ASN CORPU <noreply@asncorpu.com>

# Media & Static
MEDIA_ROOT=/opt/asncorpu/media
MEDIA_URL=/media/
STATIC_ROOT=/opt/asncorpu/staticfiles
STATIC_URL=/static/

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/asncorpu/django.log
```

### Generate Secret Key
```python
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## ✅ Post-Deployment

### 1. Verify Deployment
```bash
# Check application status
curl https://knowledge.asncorpu.com/health/

# Check SSL
curl -I https://knowledge.asncorpu.com

# Test login
# Visit: https://knowledge.asncorpu.com/admin/
```

### 2. Setup Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Setup log rotation
sudo nano /etc/logrotate.d/asncorpu
```

**Logrotate Config:**
```
/var/log/asncorpu/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload asncorpu
    endscript
}
```

### 3. Setup Backup
```bash
# Create backup script
sudo nano /opt/asncorpu/backup.sh
```

**Backup Script:**
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/asncorpu"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U asncorpu_user asncorpu_db > $BACKUP_DIR/db_$DATE.sql

# Backup media files
tar -czf $BACKUP_DIR/media_$DATE.tar.gz /opt/asncorpu/media/

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
sudo chmod +x /opt/asncorpu/backup.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /opt/asncorpu/backup.sh >> /var/log/asncorpu/backup.log 2>&1
```

### 4. Performance Tuning
```bash
# Optimize PostgreSQL
sudo nano /etc/postgresql/14/main/postgresql.conf

# Recommended settings:
# shared_buffers = 2GB
# effective_cache_size = 6GB
# maintenance_work_mem = 512MB
# checkpoint_completion_target = 0.9
# wal_buffers = 16MB
# default_statistics_target = 100
# random_page_cost = 1.1
# effective_io_concurrency = 200
# work_mem = 10MB
# min_wal_size = 1GB
# max_wal_size = 4GB

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## 📊 Monitoring & Maintenance

### Daily Tasks
- [ ] Check application logs
- [ ] Monitor disk space
- [ ] Review error logs
- [ ] Check backup status

### Weekly Tasks
- [ ] Review performance metrics
- [ ] Update dependencies (if needed)
- [ ] Test backup restoration
- [ ] Review security logs

### Monthly Tasks
- [ ] System updates
- [ ] SSL certificate renewal check
- [ ] Database optimization
- [ ] Clean old logs and backups

---

## 🐛 Troubleshooting

### Application Not Starting
```bash
# Check logs
sudo journalctl -u asncorpu -f

# Check gunicorn socket
ls -la /opt/asncorpu/asncorpu.sock

# Restart service
sudo systemctl restart asncorpu
```

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U asncorpu_user -d asncorpu_db -h localhost
```

### Static Files Not Loading
```bash
# Recollect static files
python manage.py collectstatic --clear --noinput

# Check permissions
sudo chown -R www-data:www-data /opt/asncorpu/staticfiles/
```

---

## 📞 Support

For deployment issues:
1. Check logs: `/var/log/asncorpu/`
2. Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
3. Contact DevOps team

---

**Last Updated**: 11 Mei 2026  
**Version**: 1.0.0
