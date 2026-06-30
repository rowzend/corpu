# 💾 02. Backup Guide - Panduan Backup Lengkap

> **Panduan lengkap untuk backup sebelum upgrade**

## 🎯 Tujuan

Dokumen ini menjelaskan prosedur backup lengkap untuk memastikan data aman sebelum upgrade.

---

## 📋 Backup Checklist

- [ ] Database backup
- [ ] Media files backup
- [ ] Configuration files backup
- [ ] Application code backup
- [ ] Verify all backups
- [ ] Test restore procedure
- [ ] Document backup location

---

## 🗄️ Database Backup

### PostgreSQL Backup

#### Full Database Backup
```bash
# Backup dengan timestamp
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dump -U postgres asncorpu_db > backup_${BACKUP_DATE}.sql

# Verify backup file
ls -lh backup_${BACKUP_DATE}.sql
head -n 20 backup_${BACKUP_DATE}.sql
```

#### Compressed Backup
```bash
# Backup dengan kompresi
docker-compose exec postgres pg_dump -U postgres asncorpu_db | gzip > backup_${BACKUP_DATE}.sql.gz

# Verify
gunzip -t backup_${BACKUP_DATE}.sql.gz
```

#### Custom Format Backup (Recommended)
```bash
# Backup dalam format custom (lebih cepat untuk restore)
docker-compose exec postgres pg_dump -U postgres -Fc asncorpu_db > backup_${BACKUP_DATE}.dump

# Verify
file backup_${BACKUP_DATE}.dump
```

### MySQL Backup (Jika menggunakan MySQL)

```bash
# Full backup
docker-compose exec mysql mysqldump -u root -p asncorpu_db > backup_${BACKUP_DATE}.sql

# Compressed backup
docker-compose exec mysql mysqldump -u root -p asncorpu_db | gzip > backup_${BACKUP_DATE}.sql.gz
```

---

## 📁 Media Files Backup

### Full Media Backup
```bash
# Backup semua media files
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
tar -czf media_backup_${BACKUP_DATE}.tar.gz media/

# Verify
tar -tzf media_backup_${BACKUP_DATE}.tar.gz | head -n 20
```

### Incremental Backup (Hanya file baru)
```bash
# Backup hanya file yang berubah dalam 7 hari terakhir
find media/ -type f -mtime -7 -print0 | \
    tar -czf media_incremental_${BACKUP_DATE}.tar.gz --null -T -
```

### Rsync Backup (Ke server lain)
```bash
# Sync ke backup server
rsync -avz --progress media/ backup-server:/backups/asncorpu/media/
```

---

## ⚙️ Configuration Backup

### Environment Files
```bash
# Backup .env
cp .env .env.backup_${BACKUP_DATE}

# Backup docker-compose files
cp docker-compose.yml docker-compose.yml.backup_${BACKUP_DATE}
cp docker-compose.prod.yml docker-compose.prod.yml.backup_${BACKUP_DATE}
```

### Nginx Configuration
```bash
# Backup nginx config
sudo cp /etc/nginx/sites-available/asncorpu /etc/nginx/sites-available/asncorpu.backup_${BACKUP_DATE}
```

### SSL Certificates
```bash
# Backup SSL certificates
sudo tar -czf ssl_backup_${BACKUP_DATE}.tar.gz /etc/letsencrypt/
```

---

## 💻 Application Code Backup

### Git Tag Method (Recommended)
```bash
# Create git tag
git tag -a v1.0.0-pre-upgrade -m "Backup before upgrade on $(date)"
git push origin v1.0.0-pre-upgrade

# Verify tag
git tag -l
git show v1.0.0-pre-upgrade
```

### Archive Method
```bash
# Create full archive
tar -czf code_backup_${BACKUP_DATE}.tar.gz \
    --exclude='media' \
    --exclude='staticfiles' \
    --exclude='*.pyc' \
    --exclude='__pycache__' \
    --exclude='.git' \
    --exclude='*.log' \
    .

# Verify
tar -tzf code_backup_${BACKUP_DATE}.tar.gz | head -n 20
```

---

## ✅ Backup Verification

### Verify Database Backup
```bash
# Check file size (should not be 0)
ls -lh backup_${BACKUP_DATE}.sql

# Check file content
head -n 50 backup_${BACKUP_DATE}.sql

# Count tables in backup
grep "CREATE TABLE" backup_${BACKUP_DATE}.sql | wc -l

# Test restore to temporary database
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE test_restore;"
docker-compose exec -T postgres psql -U postgres test_restore < backup_${BACKUP_DATE}.sql
docker-compose exec postgres psql -U postgres -c "DROP DATABASE test_restore;"
```

### Verify Media Backup
```bash
# Check archive integrity
tar -tzf media_backup_${BACKUP_DATE}.tar.gz > /dev/null && echo "OK" || echo "CORRUPTED"

# Count files
tar -tzf media_backup_${BACKUP_DATE}.tar.gz | wc -l

# Check file size
ls -lh media_backup_${BACKUP_DATE}.tar.gz
```

### Verify Configuration Backup
```bash
# Check .env backup
diff .env .env.backup_${BACKUP_DATE}

# Verify docker-compose backup
diff docker-compose.prod.yml docker-compose.prod.yml.backup_${BACKUP_DATE}
```

---

## 🧪 Test Restore Procedure

### Test Database Restore
```bash
# Create test database
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE test_restore;"

# Restore backup
docker-compose exec -T postgres psql -U postgres test_restore < backup_${BACKUP_DATE}.sql

# Verify data
docker-compose exec postgres psql -U postgres test_restore -c "
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;"

# Cleanup
docker-compose exec postgres psql -U postgres -c "DROP DATABASE test_restore;"
```

### Test Media Restore
```bash
# Create test directory
mkdir -p /tmp/test_restore

# Extract backup
tar -xzf media_backup_${BACKUP_DATE}.tar.gz -C /tmp/test_restore

# Verify files
ls -la /tmp/test_restore/media/

# Cleanup
rm -rf /tmp/test_restore
```

---

## 📦 Backup Storage

### Local Storage
```bash
# Create backup directory
sudo mkdir -p /opt/backups/asncorpu
sudo chown $USER:$USER /opt/backups/asncorpu

# Move backups
mv backup_*.sql /opt/backups/asncorpu/
mv media_backup_*.tar.gz /opt/backups/asncorpu/
```

### Remote Storage (Recommended)

#### Using SCP
```bash
# Copy to remote server
scp backup_${BACKUP_DATE}.sql user@backup-server:/backups/asncorpu/
scp media_backup_${BACKUP_DATE}.tar.gz user@backup-server:/backups/asncorpu/
```

#### Using Rsync
```bash
# Sync to remote server
rsync -avz --progress /opt/backups/asncorpu/ user@backup-server:/backups/asncorpu/
```

#### Using Cloud Storage (AWS S3)
```bash
# Install AWS CLI
pip install awscli

# Configure AWS
aws configure

# Upload to S3
aws s3 cp backup_${BACKUP_DATE}.sql s3://asncorpu-backups/$(date +%Y/%m/%d)/
aws s3 cp media_backup_${BACKUP_DATE}.tar.gz s3://asncorpu-backups/$(date +%Y/%m/%d)/
```

---

## 🔐 Backup Encryption

### Encrypt Database Backup
```bash
# Encrypt with GPG
gpg --symmetric --cipher-algo AES256 backup_${BACKUP_DATE}.sql

# Verify encrypted file
ls -lh backup_${BACKUP_DATE}.sql.gpg

# Test decryption
gpg --decrypt backup_${BACKUP_DATE}.sql.gpg > test_decrypt.sql
diff backup_${BACKUP_DATE}.sql test_decrypt.sql
rm test_decrypt.sql
```

### Encrypt Media Backup
```bash
# Encrypt with OpenSSL
openssl enc -aes-256-cbc -salt -in media_backup_${BACKUP_DATE}.tar.gz -out media_backup_${BACKUP_DATE}.tar.gz.enc

# Test decryption
openssl enc -d -aes-256-cbc -in media_backup_${BACKUP_DATE}.tar.gz.enc -out test_decrypt.tar.gz
diff media_backup_${BACKUP_DATE}.tar.gz test_decrypt.tar.gz
rm test_decrypt.tar.gz
```

---

## 🗑️ Backup Retention Policy

### Recommended Retention
- **Daily backups**: Keep 7 days
- **Weekly backups**: Keep 4 weeks
- **Monthly backups**: Keep 12 months
- **Yearly backups**: Keep indefinitely

### Cleanup Old Backups
```bash
# Delete backups older than 7 days
find /opt/backups/asncorpu/ -name "backup_*.sql" -mtime +7 -delete
find /opt/backups/asncorpu/ -name "media_backup_*.tar.gz" -mtime +7 -delete

# Keep only last 10 backups
ls -t /opt/backups/asncorpu/backup_*.sql | tail -n +11 | xargs rm -f
```

---

## 📝 Backup Documentation

### Create Backup Manifest
```bash
# Create manifest file
cat > backup_manifest_${BACKUP_DATE}.txt <<EOF
Backup Date: $(date)
Backup Location: /opt/backups/asncorpu/

Database Backup:
- File: backup_${BACKUP_DATE}.sql
- Size: $(ls -lh backup_${BACKUP_DATE}.sql | awk '{print $5}')
- MD5: $(md5sum backup_${BACKUP_DATE}.sql | awk '{print $1}')

Media Backup:
- File: media_backup_${BACKUP_DATE}.tar.gz
- Size: $(ls -lh media_backup_${BACKUP_DATE}.tar.gz | awk '{print $5}')
- MD5: $(md5sum media_backup_${BACKUP_DATE}.tar.gz | awk '{print $1}')

Configuration Backup:
- .env: .env.backup_${BACKUP_DATE}
- docker-compose: docker-compose.prod.yml.backup_${BACKUP_DATE}

Application Version:
- Git Commit: $(git rev-parse HEAD)
- Git Tag: $(git describe --tags)

Backup Verified: Yes
Test Restore: Success
EOF
```

---

## 🚨 Emergency Backup Script

### Automated Backup Script
```bash
#!/bin/bash
# Save as: /opt/asncorpu/backup.sh

set -e

BACKUP_DIR="/opt/backups/asncorpu"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/asncorpu/backup.log"

echo "=== Backup started at $(date) ===" >> $LOG_FILE

# Database backup
echo "Backing up database..." >> $LOG_FILE
docker-compose exec -T postgres pg_dump -U postgres asncorpu_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Media backup
echo "Backing up media files..." >> $LOG_FILE
tar -czf $BACKUP_DIR/media_$DATE.tar.gz media/

# Configuration backup
echo "Backing up configuration..." >> $LOG_FILE
cp .env $BACKUP_DIR/env_$DATE
cp docker-compose.prod.yml $BACKUP_DIR/docker-compose_$DATE.yml

# Verify backups
echo "Verifying backups..." >> $LOG_FILE
gunzip -t $BACKUP_DIR/db_$DATE.sql.gz && echo "Database backup OK" >> $LOG_FILE
tar -tzf $BACKUP_DIR/media_$DATE.tar.gz > /dev/null && echo "Media backup OK" >> $LOG_FILE

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "media_*.tar.gz" -mtime +7 -delete

echo "=== Backup completed at $(date) ===" >> $LOG_FILE
echo "" >> $LOG_FILE
```

### Make Script Executable
```bash
chmod +x /opt/asncorpu/backup.sh
```

### Schedule with Cron
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/asncorpu/backup.sh
```

---

## ✅ Backup Complete!

Setelah semua backup selesai dan terverifikasi, Anda siap untuk melanjutkan ke tahap upgrade.

📄 **Next**: [03-UPGRADE-STEPS.md](./03-UPGRADE-STEPS.md)

---

**Last Updated**: 11 Mei 2026  
**Version**: 1.0.0
