# 🗄️ Database Location - ASN Corpu Backend

**Date:** May 6, 2026  
**Database:** PostgreSQL 16  
**Status:** ✅ Running in Docker Container

---

## 📍 Lokasi Database

### Database TIDAK ada di folder project!

Database PostgreSQL berjalan di **Docker Container** dan datanya disimpan di **Docker Volume**, bukan di folder project.

---

## 🐳 Database di Docker

### Container Info:

**Container Name:** `asncorpu-backend-postgres`  
**Image:** `postgres:16`  
**Port:** `5432` (internal), `5433` (external/host)  
**Volume:** `asncorpu_postgres_data`

### Konfigurasi dari `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16
    container_name: asncorpu-backend-postgres
    environment:
      POSTGRES_DB: asncorpu_backend_db
      POSTGRES_USER: asncorpu_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - asncorpu_postgres_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"

volumes:
  asncorpu_postgres_data:
    driver: local
```

---

## 📊 Cara Akses Database

### 1. Via Docker Exec (psql)

```bash
# Masuk ke PostgreSQL shell
docker exec -it asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db

# Atau langsung query
docker exec asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db -c "SELECT * FROM knowledge_categories;"
```

### 2. Via pgAdmin (GUI)

**Akses:** http://localhost:5050

**Login:**
- Email: admin@asncorpu.local
- Password: (lihat di .env)

**Connection Settings:**
- Host: asncorpu-backend-postgres
- Port: 5432
- Database: asncorpu_backend_db
- Username: asncorpu_user
- Password: (lihat di .env)

### 3. Via DBeaver / DataGrip / TablePlus

**Connection Settings:**
- Host: localhost
- Port: 5433 (external port)
- Database: asncorpu_backend_db
- Username: asncorpu_user
- Password: (lihat di .env)

### 4. Via Django Shell

```bash
docker exec -it asncorpu_backend_app python manage.py dbshell
```

---

## 🗂️ Lokasi Data Fisik

### Docker Volume Location:

**Linux:**
```
/var/lib/docker/volumes/asncorpu_postgres_data/_data/
```

**Mac:**
```
~/Library/Containers/com.docker.docker/Data/vms/0/data/docker/volumes/asncorpu_postgres_data/_data/
```

**Windows:**
```
\\wsl$\docker-desktop-data\data\docker\volumes\asncorpu_postgres_data\_data\
```

**⚠️ Catatan:** Jangan edit file di lokasi ini secara manual! Gunakan tools database atau Django ORM.

---

## 📋 Database Tables

### Knowledge Base Tables:

```sql
-- List tables
\dt knowledge_*

-- Tables created:
knowledge_categories       -- Kategori artikel (18 records)
knowledge_articles         -- Artikel (empty)
knowledge_tags             -- Tags (empty)
knowledge_article_tags     -- Many-to-many (empty)
knowledge_ratings          -- Ratings (empty)
```

### Check Tables via Command:

```bash
# List all tables
docker exec asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db -c "\dt"

# List knowledge tables
docker exec asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db -c "\dt knowledge_*"

# Count categories
docker exec asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db -c "SELECT COUNT(*) FROM knowledge_categories;"

# View categories
docker exec asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db -c "SELECT id, name, parent_id, is_active FROM knowledge_categories ORDER BY order_index;"
```

---

## 🔍 Query Examples

### Via psql:

```bash
# Connect to database
docker exec -it asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db

# Inside psql:
\dt                                    -- List all tables
\d knowledge_categories                -- Describe table structure
SELECT * FROM knowledge_categories;    -- View all categories
\q                                     -- Quit
```

### Via Django Shell:

```bash
docker exec -it asncorpu_backend_app python manage.py shell

# Inside shell:
from apps.knowledge.models import Category
Category.objects.all()                 # All categories
Category.objects.filter(is_active=True)  # Active only
Category.objects.filter(parent__isnull=True)  # Parent categories
```

---

## 💾 Backup & Restore

### Backup Database:

```bash
# Backup to SQL file
docker exec asncorpu-backend-postgres pg_dump -U asncorpu_user asncorpu_backend_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup with compression
docker exec asncorpu-backend-postgres pg_dump -U asncorpu_user asncorpu_backend_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore Database:

```bash
# Restore from SQL file
docker exec -i asncorpu-backend-postgres psql -U asncorpu_user asncorpu_backend_db < backup.sql

# Restore from compressed file
gunzip -c backup.sql.gz | docker exec -i asncorpu-backend-postgres psql -U asncorpu_user asncorpu_backend_db
```

---

## 🔧 Database Management

### Reset Database (⚠️ DANGER):

```bash
# Stop containers
docker compose down

# Remove volume (deletes all data!)
docker volume rm asncorpu_postgres_data

# Start fresh
docker compose up -d

# Run migrations
docker exec asncorpu_backend_app python manage.py migrate

# Reseed data
docker exec asncorpu_backend_app python manage.py seed_knowledge_permissions
docker exec asncorpu_backend_app python manage.py seed_knowledge_menus
docker exec asncorpu_backend_app python manage.py seed_knowledge_categories
```

### View Volume Info:

```bash
# List volumes
docker volume ls | grep asncorpu

# Inspect volume
docker volume inspect asncorpu_postgres_data

# Check volume size
docker system df -v | grep asncorpu_postgres_data
```

---

## 📊 Database Statistics

### Via Django Shell:

```bash
docker exec asncorpu_backend_app python manage.py shell -c "
from apps.knowledge.models import Category, Article, Tag
from apps.manajemen.models import MenuItem, PermissionRule

print('=== Database Statistics ===')
print(f'Categories: {Category.objects.count()}')
print(f'  - Active: {Category.objects.filter(is_active=True).count()}')
print(f'  - Inactive: {Category.objects.filter(is_active=False).count()}')
print(f'Articles: {Article.objects.count()}')
print(f'Tags: {Tag.objects.count()}')
print(f'Menu Items: {MenuItem.objects.count()}')
print(f'Permission Rules: {PermissionRule.objects.count()}')
"
```

### Via SQL:

```bash
docker exec asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db -c "
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
"
```

---

## 🔐 Security Notes

### Database Credentials:

**⚠️ JANGAN commit .env ke git!**

Credentials ada di file `.env`:
```env
DB_NAME=asncorpu_backend_db
DB_USER=asncorpu_user
DB_PASSWORD=your_secure_password_here
DB_HOST=asncorpu-backend-postgres
DB_PORT=5432
```

### Production:

- ✅ Gunakan password yang kuat
- ✅ Jangan expose port 5432 ke public
- ✅ Gunakan SSL/TLS untuk koneksi
- ✅ Regular backup
- ✅ Monitor access logs

---

## 📚 Related Documentation

- [009_POSTGRESQL_QUICK_REFERENCE.md](009_POSTGRESQL_QUICK_REFERENCE.md) - PostgreSQL commands
- [006_DATABASE_POSTGRESQL_SETUP.md](006_DATABASE_POSTGRESQL_SETUP.md) - Setup guide
- [016_KNOWLEDGE_BASE_README.md](016_KNOWLEDGE_BASE_README.md) - Knowledge Base docs

---

## 🆘 Troubleshooting

### Database tidak bisa diakses:

```bash
# Check container status
docker ps | grep postgres

# Check logs
docker logs asncorpu-backend-postgres

# Restart container
docker restart asncorpu-backend-postgres

# Test connection
docker exec asncorpu-backend-postgres pg_isready -U asncorpu_user
```

### Connection refused:

```bash
# Check if port is listening
docker exec asncorpu-backend-postgres netstat -tuln | grep 5432

# Check from app container
docker exec asncorpu_backend_app nc -zv asncorpu-backend-postgres 5432
```

---

## 📞 Quick Commands

```bash
# Connect to database
docker exec -it asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db

# List tables
docker exec asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db -c "\dt"

# Count categories
docker exec asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db -c "SELECT COUNT(*) FROM knowledge_categories;"

# Backup database
docker exec asncorpu-backend-postgres pg_dump -U asncorpu_user asncorpu_backend_db > backup.sql

# Django shell
docker exec -it asncorpu_backend_app python manage.py shell
```

---

**Last Updated:** May 6, 2026  
**Database:** PostgreSQL 16 in Docker  
**Location:** Docker Volume `asncorpu_postgres_data`
