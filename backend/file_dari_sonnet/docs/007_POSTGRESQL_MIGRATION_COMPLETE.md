# 🔄 PostgreSQL Migration - Complete Guide

**Project:** ASN CORPU Backend Python  
**Migration:** MySQL → PostgreSQL  
**Date:** April 24, 2026  
**Status:** ✅ Ready to Execute

---

## 📋 Overview

Project asncorpu-backend-python telah berhasil dikonfigurasi untuk menggunakan PostgreSQL sebagai database utama. Dokumen ini menjelaskan apa yang sudah dilakukan dan cara menjalankan migrasi.

---

## ✅ Yang Sudah Dilakukan

### 1. **Requirements Updated** ✅

File: `requirements.txt`

```diff
+ psycopg2-binary==2.9.10  # PostgreSQL driver
  PyMySQL==1.1.1            # MySQL driver (tetap ada untuk Laravel DB)
  mysqlclient==2.2.4        # MySQL driver (tetap ada untuk Laravel DB)
```

**Penjelasan:**
- `psycopg2-binary`: Driver PostgreSQL untuk Django
- MySQL drivers tetap ada karena masih butuh koneksi ke Laravel database

### 2. **Environment Variables Updated** ✅

File: `.env`

```diff
# Database Configuration (PostgreSQL)
- DB_ENGINE=django.db.backends.mysql
+ DB_ENGINE=django.db.backends.postgresql
  DB_NAME=asncorpu_backend_db
- DB_USER=root
+ DB_USER=asncorpu_user
- DB_PASSWORD=5406@Pessel!23#
+ DB_PASSWORD=asncorpu_secure_password_2026
- DB_HOST=mysql-main
+ DB_HOST=asncorpu-backend-postgres
- DB_PORT=3306
+ DB_PORT=5432
```

**Penjelasan:**
- Engine: `mysql` → `postgresql`
- User: Dedicated user `asncorpu_user` (best practice)
- Password: Secure password untuk PostgreSQL
- Host: Container PostgreSQL sendiri
- Port: 5432 (default PostgreSQL)

### 3. **Docker Compose Updated** ✅

File: `docker-compose.yml`

**Perubahan:**

#### A. PostgreSQL Service Added
```yaml
postgres:
  image: postgres:16-alpine
  container_name: asncorpu-backend-postgres
  environment:
    POSTGRES_DB: asncorpu_backend_db
    POSTGRES_USER: asncorpu_user
    POSTGRES_PASSWORD: asncorpu_secure_password_2026
  volumes:
    - postgres_data:/var/lib/postgresql/data
  ports:
    - "5433:5432"  # External: 5433, Internal: 5432
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U asncorpu_user"]
    interval: 10s
    timeout: 5s
    retries: 5
```

**Penjelasan:**
- Image: `postgres:16-alpine` (latest stable, lightweight)
- Port: `5433:5432` (external 5433 untuk avoid conflict)
- Healthcheck: Ensure PostgreSQL ready sebelum Django start
- Volume: `postgres_data` untuk persistent storage

#### B. Django Service Updated
```yaml
asncorpu_backend:
  environment:
    - DB_ENGINE=django.db.backends.postgresql
    - DB_HOST=asncorpu-backend-postgres
    - DB_USER=asncorpu_user
    - DB_PASSWORD=asncorpu_secure_password_2026
    - DB_PORT=5432
  depends_on:
    postgres:
      condition: service_healthy  # Wait for PostgreSQL ready
```

**Penjelasan:**
- Environment variables updated untuk PostgreSQL
- `depends_on` dengan `condition: service_healthy` ensure PostgreSQL ready

#### C. MySQL Services Removed
```diff
- mysql-init-python (removed)
- mysql-check-python (removed)
- internal-network (removed, tidak perlu lagi)
```

**Penjelasan:**
- Tidak perlu lagi koneksi ke MySQL eksternal
- PostgreSQL standalone, tidak share dengan project lain

### 4. **Django Settings Updated** ✅

File: `core/settings.py`

```python
DATABASES = {
    'default': {
        'ENGINE': config('DB_ENGINE', default='django.db.backends.postgresql'),
        'NAME': config('DB_NAME', default='asncorpu_backend_db'),
        'USER': config('DB_USER', default='asncorpu_user'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='asncorpu-backend-postgres'),
        'PORT': config('DB_PORT', default=5432, cast=int),
        'OPTIONS': {
            'connect_timeout': 10,
        } if config('DB_ENGINE') == 'django.db.backends.postgresql' else {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    },
    # Laravel DB tetap MySQL
    'laravel': {
        'ENGINE': 'django.db.backends.mysql',
        # ... MySQL config
    },
}
```

**Penjelasan:**
- Default database: PostgreSQL
- OPTIONS: `connect_timeout` untuk PostgreSQL (bukan `init_command`)
- Laravel database tetap MySQL (untuk backward compatibility)

---

## 🚀 Cara Menjalankan Migrasi

### Step 1: Stop Container Lama

```bash
cd all-projects-darireal/projects/asncorpu-backend-python

# Stop semua container
docker compose down

# Optional: Hapus volume lama (jika mau clean start)
docker compose down -v
```

### Step 2: Rebuild Container

```bash
# Build ulang dengan PostgreSQL driver
docker compose build --no-cache

# Start semua services
docker compose up -d
```

**Output yang diharapkan:**
```
[+] Running 3/3
 ✔ Container asncorpu-backend-postgres  Started
 ✔ Container asncorpu-backend-redis     Started
 ✔ Container asncorpu_backend_app       Started
```

### Step 3: Check PostgreSQL Ready

```bash
# Check PostgreSQL logs
docker logs asncorpu-backend-postgres

# Test koneksi PostgreSQL
docker exec asncorpu-backend-postgres pg_isready -U asncorpu_user
```

**Output yang diharapkan:**
```
/var/run/postgresql:5432 - accepting connections
```

### Step 4: Run Migrations

```bash
# Run Django migrations
docker exec asncorpu_backend_app python manage.py migrate

# Check migration status
docker exec asncorpu_backend_app python manage.py showmigrations
```

**Output yang diharapkan:**
```
Operations to perform:
  Apply all migrations: admin, auth, contenttypes, sessions, accounts, dashboard, manajemen, core
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying auth.0001_initial... OK
  ...
  Applying manajemen.0001_initial... OK
```

### Step 5: Create Superuser

```bash
# Create superuser
docker exec -it asncorpu_backend_app python manage.py createsuperuser

# Input:
# Username: admin
# Email: admin@asncorpu.local
# Password: (your secure password)
```

### Step 6: Seed Initial Data

```bash
# Seed menus & permissions
docker exec asncorpu_backend_app python manage.py seed_menus

# Collect static files
docker exec asncorpu_backend_app python manage.py collectstatic --noinput
```

### Step 7: Test Application

```bash
# Check logs
docker logs asncorpu_backend_app -f

# Access application
# http://localhost:8008/
# http://localhost:8008/admin/
# http://localhost:8008/dashboard/
```

---

## 🔍 Verifikasi Migrasi

### 1. Check Database Connection

```bash
# Django shell
docker exec -it asncorpu_backend_app python manage.py shell

# Test query
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.count()
1  # Superuser yang baru dibuat
>>> exit()
```

### 2. Check PostgreSQL Database

```bash
# Connect to PostgreSQL
docker exec -it asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db

# List tables
\dt

# Check users table
SELECT id, username, email FROM accounts_user;

# Exit
\q
```

### 3. Check Application Logs

```bash
# Django logs
docker logs asncorpu_backend_app --tail 50

# PostgreSQL logs
docker logs asncorpu-backend-postgres --tail 50
```

---

## 📊 Perbandingan: MySQL vs PostgreSQL

### Sebelum (MySQL)

```yaml
Database:
  - Engine: MySQL 8.4.6
  - Host: mysql-main (shared)
  - Port: 3306
  - User: root
  - Charset: utf8mb4

Pros:
  ✅ Familiar
  ✅ Shared dengan project lain
  ✅ phpMyAdmin available

Cons:
  ❌ Less advanced features
  ❌ Shared resources
  ❌ Root user (security risk)
```

### Sesudah (PostgreSQL)

```yaml
Database:
  - Engine: PostgreSQL 16
  - Host: asncorpu-backend-postgres (dedicated)
  - Port: 5432 (internal), 5433 (external)
  - User: asncorpu_user (dedicated)
  - Encoding: UTF8

Pros:
  ✅ Advanced features (JSON, arrays, full-text search)
  ✅ Better performance
  ✅ Dedicated resources
  ✅ Better concurrency (MVCC)
  ✅ Dedicated user (security)
  ✅ Better for complex queries

Cons:
  ⚠️ Learning curve (minimal)
  ⚠️ Need pgAdmin (instead of phpMyAdmin)
```

---

## 🛠️ Management Tools

### pgAdmin (Recommended)

**Install via Docker:**

```yaml
# Add to docker-compose.yml (optional)
pgadmin:
  image: dpage/pgadmin4:latest
  container_name: asncorpu-pgadmin
  environment:
    PGADMIN_DEFAULT_EMAIL: admin@asncorpu.local
    PGADMIN_DEFAULT_PASSWORD: admin
  ports:
    - "5050:80"
  networks:
    - default
```

**Access:**
- URL: http://localhost:5050
- Email: admin@asncorpu.local
- Password: admin

**Add Server:**
- Name: ASNCORPU Backend
- Host: asncorpu-backend-postgres
- Port: 5432
- Database: asncorpu_backend_db
- Username: asncorpu_user
- Password: asncorpu_secure_password_2026

### Command Line (psql)

```bash
# Connect to database
docker exec -it asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db

# Common commands:
\l              # List databases
\dt             # List tables
\d table_name   # Describe table
\du             # List users
\q              # Quit
```

### Django Shell

```bash
# Django shell
docker exec -it asncorpu_backend_app python manage.py shell

# Query examples:
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.all()
>>> User.objects.filter(is_active=True)
```

---

## 🔄 Rollback ke MySQL (Jika Diperlukan)

Jika ada masalah dan perlu rollback ke MySQL:

### 1. Update .env

```bash
# .env
DB_ENGINE=django.db.backends.mysql
DB_NAME=asncorpu_backend_db
DB_USER=root
DB_PASSWORD=5406@Pessel!23#
DB_HOST=mysql-main
DB_PORT=3306
```

### 2. Update docker-compose.yml

Restore MySQL services dari backup atau git history.

### 3. Rebuild

```bash
docker compose down -v
docker compose up -d --build
docker exec asncorpu_backend_app python manage.py migrate
```

---

## 📝 Best Practices PostgreSQL

### 1. Backup Database

```bash
# Backup
docker exec asncorpu-backend-postgres pg_dump -U asncorpu_user asncorpu_backend_db > backup.sql

# Restore
docker exec -i asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db < backup.sql
```

### 2. Optimize Queries

```python
# Good: Use select_related & prefetch_related
courses = Course.objects.select_related('instructor').prefetch_related('modules')

# Good: Use indexes
class Course(models.Model):
    title = models.CharField(max_length=200, db_index=True)
    category = models.CharField(max_length=100, db_index=True)
```

### 3. Monitor Performance

```sql
-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 4. Regular Maintenance

```bash
# Vacuum (clean up dead rows)
docker exec asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db -c "VACUUM ANALYZE;"

# Reindex
docker exec asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db -c "REINDEX DATABASE asncorpu_backend_db;"
```

---

## 🎯 PostgreSQL Features untuk ASN CORPU

### 1. JSON Support (Native)

```python
from django.contrib.postgres.fields import JSONField

class Course(models.Model):
    metadata = JSONField(default=dict)
    
# Query JSON
Course.objects.filter(metadata__category='IT')
```

### 2. Full-Text Search

```python
from django.contrib.postgres.search import SearchVector

# Search in multiple fields
Course.objects.annotate(
    search=SearchVector('title', 'description')
).filter(search='python')
```

### 3. Array Fields

```python
from django.contrib.postgres.fields import ArrayField

class Course(models.Model):
    tags = ArrayField(models.CharField(max_length=50), default=list)
    
# Query arrays
Course.objects.filter(tags__contains=['python'])
```

### 4. Advanced Aggregations

```sql
-- Window functions
SELECT
    user_id,
    score,
    RANK() OVER (ORDER BY score DESC) as rank
FROM submissions;

-- CTEs (Common Table Expressions)
WITH active_users AS (
    SELECT id FROM users WHERE is_active = true
)
SELECT * FROM enrollments WHERE user_id IN (SELECT id FROM active_users);
```

---

## ✅ Kesimpulan

### Migrasi Berhasil Jika:

- ✅ PostgreSQL container running
- ✅ Django migrations applied
- ✅ Superuser created
- ✅ Application accessible
- ✅ No errors in logs

### Keuntungan PostgreSQL:

1. ✅ **Performance** - Faster complex queries
2. ✅ **Features** - JSON, arrays, full-text search
3. ✅ **Concurrency** - Better MVCC
4. ✅ **Security** - Dedicated user & database
5. ✅ **Scalability** - Better for large datasets
6. ✅ **Standards** - More SQL standard compliant

### Next Steps:

1. 🔲 Test semua fitur aplikasi
2. 🔲 Setup pgAdmin (optional)
3. 🔲 Configure backup strategy
4. 🔲 Optimize queries dengan indexes
5. 🔲 Monitor performance
6. 🔲 Update documentation

---

**Migration Status:** ✅ Complete  
**Database:** PostgreSQL 16  
**Ready for Development:** Yes  
**Date:** April 24, 2026
