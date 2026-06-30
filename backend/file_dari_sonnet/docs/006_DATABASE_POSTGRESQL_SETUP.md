# 🗄️ PostgreSQL Setup Guide - ASN CORPU Backend

## 📋 Overview

Panduan lengkap untuk setup PostgreSQL di project ASN CORPU Backend, termasuk Docker configuration dan perbandingan dengan MySQL.

**Created:** April 24, 2026  
**Status:** Ready to implement  

---

## ❓ Pertanyaan Umum

### 1. Apakah project Python bisa pakai PostgreSQL?

**JAWABAN: YA, SANGAT BISA! ✅**

Django (Python) support multiple databases:
- ✅ PostgreSQL
- ✅ MySQL
- ✅ SQLite
- ✅ Oracle
- ✅ MariaDB

**Ganti database hanya perlu:**
1. Install driver (psycopg2)
2. Update settings.py
3. Run migrations

**Sangat mudah!** Django ORM abstrak semua perbedaan database.

### 2. Apakah perlu install PostgreSQL di Docker?

**JAWABAN: YA, RECOMMENDED! ✅**

**Keuntungan pakai Docker:**
- ✅ Isolated environment
- ✅ Easy setup (1 command)
- ✅ Consistent across team
- ✅ Easy to reset/rebuild
- ✅ Production-like environment

**Tanpa Docker:**
- ❌ Install manual di OS
- ❌ Conflict dengan apps lain
- ❌ Susah reset
- ❌ Beda environment dev vs prod

### 3. Apakah bentrok dengan phpMyAdmin/MySQL?

**JAWABAN: TIDAK BENTROK! ✅**

PostgreSQL dan MySQL bisa jalan bersamaan:

```
Docker Containers:
├── mysql-main (port 3306)          ← Untuk ESIMPEG-Python
├── postgres-asncorpu (port 5432)   ← Untuk ASN CORPU
├── redis-main (port 6379)          ← Shared
└── asncorpu_backend_app (port 8008)
```

**Mereka independent:**
- ✅ Beda port (MySQL: 3306, PostgreSQL: 5432)
- ✅ Beda container
- ✅ Beda database
- ✅ Tidak saling ganggu

**phpMyAdmin:**
- ✅ Tetap bisa pakai untuk MySQL (ESIMPEG-Python)
- ✅ Untuk PostgreSQL, pakai **pgAdmin** atau **Adminer**

---

## 🚀 Setup PostgreSQL dengan Docker

### Option 1: PostgreSQL (Recommended)

#### Step 1: Update docker-compose.yml

```yaml
services:
  # Django Application
  asncorpu_backend:
    build: .
    container_name: asncorpu_backend_app
    restart: unless-stopped
    command: gunicorn core.wsgi:application --config gunicorn.conf.py
    volumes:
      - .:/app
      - static_volume:/app/staticfiles
      - media_volume:/app/media
      - logs_volume:/app/logs
    ports:
      - "8008:8000"
    environment:
      - DB_ENGINE=django.db.backends.postgresql
      - DB_HOST=postgres-asncorpu
      - DB_NAME=asncorpu_db
      - DB_USER=asncorpu_user
      - DB_PASSWORD=secure_password_here
      - DB_PORT=5432
      - REDIS_HOST=asncorpu-backend-redis
      - REDIS_PORT=6379
      - REDIS_DB=4
    networks:
      - default
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health/"]
      interval: 30s
      timeout: 10s
      retries: 3

  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: postgres-asncorpu
    restart: unless-stopped
    environment:
      POSTGRES_DB: asncorpu_db
      POSTGRES_USER: asncorpu_user
      POSTGRES_PASSWORD: secure_password_here
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=C"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"  # 5433 di host, 5432 di container (avoid conflict)
    networks:
      - default
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U asncorpu_user -d asncorpu_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # pgAdmin (Optional - Web UI untuk PostgreSQL)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: pgadmin-asncorpu
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@asncorpu.local
      PGADMIN_DEFAULT_PASSWORD: admin123
      PGADMIN_CONFIG_SERVER_MODE: 'False'
    ports:
      - "5050:80"  # Access via http://localhost:5050
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    networks:
      - default
    depends_on:
      - postgres

  # Redis
  redis:
    image: redis:7.4-alpine
    container_name: asncorpu-backend-redis
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - redis_data:/data
    networks:
      - default

volumes:
  static_volume:
  media_volume:
  logs_volume:
  postgres_data:
  pgadmin_data:
  redis_data:

networks:
  default:
    driver: bridge
```

#### Step 2: Update .env

```bash
# Database Configuration (PostgreSQL)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=asncorpu_db
DB_USER=asncorpu_user
DB_PASSWORD=secure_password_here
DB_HOST=postgres-asncorpu
DB_PORT=5432

# Redis Configuration
REDIS_HOST=asncorpu-backend-redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=4
```

#### Step 3: Update requirements.txt

```txt
# Add PostgreSQL driver
psycopg2-binary==2.9.9

# Existing packages
Django==5.2.7
djangorestframework==3.16.1
# ... rest of packages
```

#### Step 4: Update settings.py

```python
# core/settings.py

# Database
DATABASES = {
    'default': {
        'ENGINE': config('DB_ENGINE', default='django.db.backends.postgresql'),
        'NAME': config('DB_NAME', default='asncorpu_db'),
        'USER': config('DB_USER', default='asncorpu_user'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='postgres-asncorpu'),
        'PORT': config('DB_PORT', default=5432, cast=int),
        'OPTIONS': {
            'connect_timeout': 10,
        },
    }
}
```

#### Step 5: Build & Run

```bash
# Build containers
docker compose up -d --build

# Wait for PostgreSQL to be ready (check logs)
docker logs postgres-asncorpu -f

# Run migrations
docker exec asncorpu_backend_app python manage.py migrate

# Create superuser
docker exec -it asncorpu_backend_app python manage.py createsuperuser

# Access pgAdmin
# http://localhost:5050
# Email: admin@asncorpu.local
# Password: admin123
```

---

### Option 2: Tetap Pakai MySQL (Easier)

Jika mau tetap pakai MySQL (seperti ESIMPEG-Python):

#### docker-compose.yml (MySQL)

```yaml
services:
  asncorpu_backend:
    # ... same as before
    environment:
      - DB_ENGINE=django.db.backends.mysql
      - DB_HOST=mysql-main  # Shared dengan ESIMPEG
      - DB_NAME=asncorpu_backend_db
      - DB_USER=root
      - DB_PASSWORD=5406@Pessel!23#
      - DB_PORT=3306
    depends_on:
      - mysql-init
      - redis

  # Database initialization
  mysql-init:
    image: mysql:8.4.6
    container_name: asncorpu_backend_mysql_init
    environment:
      MYSQL_ROOT_PASSWORD: "5406@Pessel!23#"
    networks:
      - internal-network
    command: >
      sh -c "
        mysql -h mysql-main -u root -p5406@Pessel!23# --skip-ssl -e 'CREATE DATABASE IF NOT EXISTS asncorpu_backend_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;' &&
        echo 'Database asncorpu_backend_db created'
      "

  redis:
    # ... same as before

networks:
  default:
    driver: bridge
  internal-network:
    external: true
```

**Keuntungan MySQL:**
- ✅ Sudah familiar (ESIMPEG-Python)
- ✅ Shared container (hemat resource)
- ✅ phpMyAdmin sudah ada
- ✅ No learning curve

**Kekurangan:**
- ⚠️ Kurang advanced features
- ⚠️ Shared container (jika mysql-main down, semua down)

---

## 🔧 Management Tools

### PostgreSQL: pgAdmin

**Access:** http://localhost:5050

**Features:**
- ✅ Web-based GUI
- ✅ Query editor
- ✅ Database browser
- ✅ Visual query builder
- ✅ Backup/restore
- ✅ User management

**Setup Connection:**
1. Login ke pgAdmin (admin@asncorpu.local / admin123)
2. Add New Server
   - Name: ASN CORPU
   - Host: postgres-asncorpu
   - Port: 5432
   - Database: asncorpu_db
   - Username: asncorpu_user
   - Password: secure_password_here

### MySQL: phpMyAdmin

**Access:** http://localhost:8080 (jika sudah setup)

**Features:**
- ✅ Web-based GUI
- ✅ Query editor
- ✅ Database browser
- ✅ Import/export
- ✅ User management

### Alternative: Adminer (Universal)

Adminer support PostgreSQL DAN MySQL!

```yaml
# Add to docker-compose.yml
adminer:
  image: adminer:latest
  container_name: adminer-universal
  restart: unless-stopped
  ports:
    - "8081:8080"
  networks:
    - default
    - internal-network
```

**Access:** http://localhost:8081

**Connect to:**
- PostgreSQL: postgres-asncorpu:5432
- MySQL: mysql-main:3306

---

## 📊 Perbandingan Setup

### PostgreSQL vs MySQL Setup

| Aspect | PostgreSQL | MySQL |
|--------|-----------|-------|
| **Setup Complexity** | ⭐⭐⭐ Medium | ⭐⭐⭐⭐⭐ Easy |
| **Learning Curve** | ⭐⭐⭐ Medium | ⭐⭐⭐⭐⭐ Easy |
| **Management Tool** | pgAdmin | phpMyAdmin |
| **Resource Usage** | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐ Good |
| **Features** | ⭐⭐⭐⭐⭐ Advanced | ⭐⭐⭐⭐ Good |
| **Performance** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good |

---

## 🎯 Rekomendasi

### Untuk Development (Sekarang)

**Option A: Tetap MySQL** ✅ RECOMMENDED
- ✅ Familiar dengan team
- ✅ Setup sudah ada
- ✅ phpMyAdmin ready
- ✅ Shared dengan ESIMPEG
- ✅ No learning curve

**Alasan:**
- Fokus ke business logic dulu
- Database bisa migrate nanti
- Django ORM abstrak perbedaan

### Untuk Production (Nanti)

**Option B: Migrate ke PostgreSQL** ✅ RECOMMENDED
- ✅ Better performance
- ✅ More features
- ✅ Better for long-term
- ✅ Industry standard

**Migration mudah:**
```bash
# 1. Dump data dari MySQL
python manage.py dumpdata > data.json

# 2. Update settings ke PostgreSQL
# 3. Run migrations
python manage.py migrate

# 4. Load data
python manage.py loaddata data.json
```

---

## 🚀 Quick Start Commands

### PostgreSQL

```bash
# Start containers
docker compose up -d --build

# Check PostgreSQL status
docker logs postgres-asncorpu

# Access PostgreSQL shell
docker exec -it postgres-asncorpu psql -U asncorpu_user -d asncorpu_db

# Run migrations
docker exec asncorpu_backend_app python manage.py migrate

# Create superuser
docker exec -it asncorpu_backend_app python manage.py createsuperuser

# Access pgAdmin
open http://localhost:5050
```

### MySQL (Current)

```bash
# Start containers
docker compose up -d --build

# Check MySQL status
docker logs mysql-main

# Access MySQL shell
docker exec -it mysql-main mysql -u root -p

# Run migrations
docker exec asncorpu_backend_app python manage.py migrate

# Access phpMyAdmin
open http://localhost:8080
```

---

## 🔍 Troubleshooting

### PostgreSQL Connection Error

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs postgres-asncorpu

# Test connection
docker exec -it postgres-asncorpu psql -U asncorpu_user -d asncorpu_db

# Restart PostgreSQL
docker restart postgres-asncorpu
```

### Port Conflict

Jika port 5432 sudah dipakai:

```yaml
# Change in docker-compose.yml
ports:
  - "5433:5432"  # Use 5433 on host

# Update .env
DB_PORT=5433
```

### Migration Issues

```bash
# Reset migrations (CAREFUL!)
docker exec asncorpu_backend_app python manage.py migrate --fake-initial

# Or drop database and recreate
docker exec -it postgres-asncorpu psql -U asncorpu_user -c "DROP DATABASE asncorpu_db;"
docker exec -it postgres-asncorpu psql -U asncorpu_user -c "CREATE DATABASE asncorpu_db;"
docker exec asncorpu_backend_app python manage.py migrate
```

---

## ✅ Kesimpulan

### Jawaban Pertanyaan:

1. **Apakah project Python bisa pakai PostgreSQL?**
   - ✅ YA, sangat mudah! Django support native

2. **Apakah perlu install PostgreSQL di Docker?**
   - ✅ YA, recommended! Isolated & consistent

3. **Apakah bentrok dengan phpMyAdmin/MySQL?**
   - ✅ TIDAK! Beda port, beda container, bisa jalan bersamaan

### Rekomendasi Final:

**Untuk Sekarang (Development):**
- ✅ **Tetap pakai MySQL** (familiar, setup ready)
- ✅ Fokus ke business logic
- ✅ Database bisa migrate nanti

**Untuk Nanti (Production):**
- ✅ **Migrate ke PostgreSQL** (better features, performance)
- ✅ Migration mudah dengan Django
- ✅ 1-2 hari effort

**Both options are valid!** Pilih yang paling nyaman untuk team. 🚀

---

**Last Updated:** April 24, 2026  
**Status:** ✅ Ready to implement  
**Recommendation:** Start with MySQL, migrate to PostgreSQL later
