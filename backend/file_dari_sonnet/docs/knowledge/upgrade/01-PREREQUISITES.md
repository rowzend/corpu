# 📋 01. Prerequisites - Persiapan Upgrade

> **Panduan persiapan sebelum melakukan upgrade sistem**

## 🎯 Tujuan

Dokumen ini menjelaskan persiapan yang harus dilakukan sebelum upgrade Knowledge Base System.

---

## ✅ System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 50 GB SSD
- **OS**: Ubuntu 20.04 LTS atau lebih baru

### Recommended Requirements
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 100 GB SSD
- **OS**: Ubuntu 22.04 LTS

---

## 📦 Software Requirements

### Required Software
```bash
# Docker
Docker version 24.0+
Docker Compose version 2.20+

# Database
PostgreSQL 14+ (via Docker)
atau
MySQL 8+ (via Docker)

# Cache
Redis 7+ (via Docker)

# Web Server
Nginx 1.24+
```

### Python Packages
```bash
Django>=4.2
Pillow>=10.0
django-ckeditor>=6.7
psycopg2-binary>=2.9
redis>=5.0
```

---

## 🔍 Pre-Upgrade Checklist

### 1. Backup Verification
- [ ] Database backup tersedia
- [ ] Media files backup tersedia
- [ ] Backup dapat di-restore
- [ ] Backup location accessible

### 2. System Health Check
- [ ] Application running normal
- [ ] Database connection OK
- [ ] Redis connection OK
- [ ] Disk space sufficient (min 20% free)
- [ ] Memory usage normal (<80%)

### 3. Documentation Review
- [ ] Read UPGRADE.md
- [ ] Read DEPLOYMENT.md
- [ ] Understand rollback procedure
- [ ] Emergency contact list ready

### 4. Access Verification
- [ ] SSH access to server
- [ ] Database admin access
- [ ] Docker access
- [ ] Sudo privileges

### 5. Maintenance Window
- [ ] Maintenance window scheduled
- [ ] Users notified
- [ ] Backup team on standby
- [ ] Rollback plan ready

---

## 🛠️ Pre-Upgrade Commands

### Check Current Version
```bash
# Check Django version
docker-compose exec asncorpu_backend python manage.py version

# Check database version
docker-compose exec postgres psql --version

# Check Redis version
docker-compose exec redis redis-server --version
```

### Check System Resources
```bash
# Disk space
df -h

# Memory
free -h

# CPU
top

# Docker stats
docker stats --no-stream
```

### Check Application Health
```bash
# Application status
docker-compose ps

# Check logs for errors
docker-compose logs --tail=100 asncorpu_backend | grep -i error

# Database connections
docker-compose exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 💾 Backup Procedures

### 1. Database Backup
```bash
# PostgreSQL
docker-compose exec postgres pg_dump -U postgres asncorpu_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_*.sql
```

### 2. Media Files Backup
```bash
# Backup media directory
tar -czf media_backup_$(date +%Y%m%d_%H%M%S).tar.gz media/

# Verify backup
ls -lh media_backup_*.tar.gz
```

### 3. Configuration Backup
```bash
# Backup .env file
cp .env .env.backup_$(date +%Y%m%d_%H%M%S)

# Backup docker-compose files
cp docker-compose.prod.yml docker-compose.prod.yml.backup
```

### 4. Code Backup
```bash
# Create git tag for current version
git tag -a v1.0.0 -m "Version before upgrade"
git push origin v1.0.0

# Or create archive
tar -czf code_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
    --exclude='media' \
    --exclude='staticfiles' \
    --exclude='*.pyc' \
    --exclude='__pycache__' \
    .
```

---

## 🔐 Security Checklist

### Before Upgrade
- [ ] Change default passwords
- [ ] Review user permissions
- [ ] Check firewall rules
- [ ] Update SSL certificates (if needed)
- [ ] Review security logs

### Backup Security
- [ ] Encrypt sensitive backups
- [ ] Store backups in secure location
- [ ] Test backup restoration
- [ ] Document backup location

---

## 📊 Performance Baseline

### Collect Metrics Before Upgrade
```bash
# Response time
time curl http://localhost:8008/knowledge/

# Database query time
docker-compose exec postgres psql -U postgres asncorpu_db -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;"

# Memory usage
docker stats --no-stream asncorpu_backend_app

# Disk I/O
iostat -x 1 5
```

### Document Current State
```bash
# Number of articles
docker-compose exec asncorpu_backend python manage.py shell -c "
from apps.knowledge.models import Article
print(f'Total articles: {Article.objects.count()}')
"

# Number of comments
docker-compose exec asncorpu_backend python manage.py shell -c "
from apps.knowledge.models import Comment
print(f'Total comments: {Comment.objects.count()}')
"

# Database size
docker-compose exec postgres psql -U postgres asncorpu_db -c "
SELECT pg_size_pretty(pg_database_size('asncorpu_db'));"
```

---

## 🚨 Risk Assessment

### High Risk Items
- Database migration with large tables
- Breaking changes in dependencies
- Configuration changes
- Permission changes

### Mitigation Strategies
- Test upgrade in staging environment first
- Have rollback plan ready
- Schedule during low-traffic period
- Have backup team on standby

---

## 📞 Emergency Contacts

### Development Team
- **Email**: dev@asncorpu.com
- **Slack**: #knowledge-base-dev
- **Phone**: +62 xxx xxxx xxxx

### System Administrator
- **Email**: admin@asncorpu.com
- **Phone**: +62 xxx xxxx xxxx

### Database Administrator
- **Email**: dba@asncorpu.com
- **Phone**: +62 xxx xxxx xxxx

### On-Call Engineer
- **Phone**: +62 xxx xxxx xxxx
- **Email**: oncall@asncorpu.com

---

## ✅ Ready to Upgrade?

Setelah semua checklist di atas selesai, Anda siap untuk melanjutkan ke:

📄 **Next**: [02-BACKUP-GUIDE.md](./02-BACKUP-GUIDE.md)

---

**Last Updated**: 11 Mei 2026  
**Version**: 1.0.0
