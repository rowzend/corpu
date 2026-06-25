# 📈 Upgrade Guide - Knowledge Base System

> **Panduan upgrade dari versi sebelumnya atau fresh installation**

## 📋 Daftar Isi

1. [Pre-requisites](#pre-requisites)
2. [Fresh Installation](#fresh-installation)
3. [Upgrade dari Versi Sebelumnya](#upgrade-dari-versi-sebelumnya)
4. [Database Migration](#database-migration)
5. [Post-Upgrade Tasks](#post-upgrade-tasks)
6. [Rollback Guide](#rollback-guide)

---

## ✅ Pre-requisites

### System Requirements
- Python 3.10+
- PostgreSQL 14+ atau MySQL 8+
- Redis 7+ (untuk caching)
- Docker & Docker Compose (recommended)
- Nginx (untuk production)

### Python Packages
```bash
Django>=4.2
Pillow>=10.0  # Untuk image processing
django-ckeditor>=6.7  # Rich text editor
```

---

## 🆕 Fresh Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd asncorpu-backend-python
```

### 2. Setup Environment
```bash
# Copy environment file
cp .env.example .env

# Edit .env dengan konfigurasi Anda
nano .env
```

### 3. Build Docker Containers
```bash
docker-compose -f docker-compose.prod.yml build
```

### 4. Run Migrations
```bash
docker-compose -f docker-compose.prod.yml run --rm asncorpu_backend python manage.py migrate
```

### 5. Create Superuser
```bash
docker-compose -f docker-compose.prod.yml run --rm asncorpu_backend python manage.py createsuperuser
```

### 6. Collect Static Files
```bash
docker-compose -f docker-compose.prod.yml run --rm asncorpu_backend python manage.py collectstatic --noinput
```

### 7. Start Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 8. Seed Initial Data (Optional)
```bash
# Seed menu categories
docker-compose -f docker-compose.prod.yml run --rm asncorpu_backend python manage.py seed_menu_categories

# Seed sample knowledge base data
docker-compose -f docker-compose.prod.yml run --rm asncorpu_backend python manage.py seed_knowledge_data
```

---

## 🔄 Upgrade dari Versi Sebelumnya

### Step 1: Backup Database
```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U postgres asncorpu_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Atau backup MySQL
docker-compose exec mysql mysqldump -u root -p asncorpu_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Backup Media Files
```bash
# Backup uploaded files
tar -czf media_backup_$(date +%Y%m%d_%H%M%S).tar.gz media/
```

### Step 3: Stop Services
```bash
docker-compose down
```

### Step 4: Pull Latest Code
```bash
git pull origin main
```

### Step 5: Update Dependencies
```bash
docker-compose -f docker-compose.prod.yml build --no-cache
```

### Step 6: Run Migrations
```bash
docker-compose -f docker-compose.prod.yml run --rm asncorpu_backend python manage.py migrate
```

### Step 7: Collect Static Files
```bash
docker-compose -f docker-compose.prod.yml run --rm asncorpu_backend python manage.py collectstatic --noinput
```

### Step 8: Start Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Step 9: Verify Upgrade
```bash
# Check logs
docker-compose logs -f asncorpu_backend

# Test application
curl http://localhost:8008/health/
```

---

## 🗄️ Database Migration

### Membuat Migration Baru

Jika Anda menambahkan field baru atau mengubah model:

```bash
# Generate migration files
docker-compose run --rm asncorpu_backend python manage.py makemigrations knowledge

# Review migration file
cat apps/knowledge/migrations/0XXX_*.py

# Apply migration
docker-compose run --rm asncorpu_backend python manage.py migrate knowledge
```

### Migration untuk Knowledge Base (Version 1.0.0)

File migration yang diperlukan:

#### 1. `0001_initial.py` - Core Models
```python
# Creates:
# - Category (with hierarchical support)
# - Tag
# - Article (with all fields)
# - ArticleTag (many-to-many)
```

#### 2. `0002_engagement.py` - Engagement Features
```python
# Creates:
# - ArticleLike
# - ArticleView (unique view tracking)
# - Rating
# - Comment (with parent FK for nesting)
# - CommentLike
```

#### 3. `0003_approval.py` - Approval Workflow
```python
# Creates:
# - ApprovalHistory
# Adds fields to Article:
# - submitted_at
# - approved_by
# - approved_at
# - rejection_reason
# - rejection_count
```

### Menjalankan Specific Migration
```bash
# Run specific migration
docker-compose run --rm asncorpu_backend python manage.py migrate knowledge 0002

# Rollback to specific migration
docker-compose run --rm asncorpu_backend python manage.py migrate knowledge 0001

# Show migration status
docker-compose run --rm asncorpu_backend python manage.py showmigrations knowledge
```

---

## ✅ Post-Upgrade Tasks

### 1. Update Permissions
```bash
docker-compose run --rm asncorpu_backend python manage.py update_permissions
```

### 2. Rebuild Search Index (jika ada)
```bash
docker-compose run --rm asncorpu_backend python manage.py rebuild_index
```

### 3. Clear Cache
```bash
docker-compose run --rm asncorpu_backend python manage.py clear_cache
```

### 4. Test Critical Features
- [ ] Login/Logout
- [ ] Create artikel
- [ ] Upload file/image
- [ ] Add comment
- [ ] Like/dislike artikel dan comment
- [ ] Rating artikel
- [ ] Approval workflow

### 5. Monitor Logs
```bash
# Application logs
docker-compose logs -f asncorpu_backend

# Database logs
docker-compose logs -f postgres

# Nginx logs
docker-compose logs -f nginx
```

---

## 🔙 Rollback Guide

### Jika Upgrade Gagal

#### 1. Stop Services
```bash
docker-compose down
```

#### 2. Restore Database
```bash
# PostgreSQL
docker-compose up -d postgres
docker-compose exec -T postgres psql -U postgres -d asncorpu_db < backup_YYYYMMDD_HHMMSS.sql

# MySQL
docker-compose up -d mysql
docker-compose exec -T mysql mysql -u root -p asncorpu_db < backup_YYYYMMDD_HHMMSS.sql
```

#### 3. Restore Media Files
```bash
tar -xzf media_backup_YYYYMMDD_HHMMSS.tar.gz
```

#### 4. Checkout Previous Version
```bash
git checkout <previous-commit-hash>
```

#### 5. Rebuild Containers
```bash
docker-compose -f docker-compose.prod.yml build
```

#### 6. Start Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🐛 Common Issues

### Issue 1: Migration Conflict
```bash
# Error: Conflicting migrations detected
# Solution: Merge migrations
docker-compose run --rm asncorpu_backend python manage.py makemigrations --merge
```

### Issue 2: Static Files Not Loading
```bash
# Solution: Recollect static files
docker-compose run --rm asncorpu_backend python manage.py collectstatic --clear --noinput
```

### Issue 3: Permission Denied
```bash
# Solution: Fix file permissions
sudo chown -R $USER:$USER media/
sudo chmod -R 755 media/
```

### Issue 4: Database Connection Error
```bash
# Check database status
docker-compose ps postgres

# Restart database
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

---

## 📊 Monitoring Post-Upgrade

### Health Check Endpoints
```bash
# Application health
curl http://localhost:8008/health/

# Database health
curl http://localhost:8008/health/db/

# Redis health
curl http://localhost:8008/health/redis/
```

### Performance Monitoring
```bash
# Check response time
time curl http://localhost:8008/knowledge/

# Check database queries
docker-compose run --rm asncorpu_backend python manage.py debugsqlshell
```

---

## 📞 Support

Jika mengalami masalah saat upgrade:
1. Check logs: `docker-compose logs -f`
2. Review migration files
3. Consult [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
4. Contact development team

---

## 📝 Upgrade Checklist

- [ ] Backup database
- [ ] Backup media files
- [ ] Stop services
- [ ] Pull latest code
- [ ] Update dependencies
- [ ] Run migrations
- [ ] Collect static files
- [ ] Start services
- [ ] Update permissions
- [ ] Clear cache
- [ ] Test critical features
- [ ] Monitor logs
- [ ] Update documentation

---

**Last Updated**: 11 Mei 2026  
**Version**: 1.0.0
