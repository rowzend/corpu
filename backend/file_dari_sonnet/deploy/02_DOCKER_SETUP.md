# 🐳 Docker Setup Guide

**Project:** ASN Corpu Backend  
**Date:** May 7, 2026

---

## 📋 Services

### 1. PostgreSQL Database
```yaml
Container: asncorpu-backend-postgres
Image: postgres:16-alpine
Port: 5433:5432
Database: asncorpu_backend_db
Username: asncorpu_user
Password: asncorpu_secure_password_2026
```

### 2. Django Application
```yaml
Container: asncorpu_backend_app
Port: 8008:8000
Workers: 4
Timeout: 300s
Memory: 1GB
```

### 3. Redis Cache
```yaml
Container: asncorpu-backend-redis
Image: redis:7.4-alpine
Port: 6379 (internal)
```

### 4. pgAdmin
```yaml
Container: asncorpu-backend-pgadmin
Image: dpage/pgadmin4:latest
Port: 5050:80
Email: admin@example.com
Password: admin
```

---

## 🚀 Quick Start

### 1. Start All Services:
```bash
cd projects/asncorpu-backend-python
docker-compose up -d
```

### 2. Check Status:
```bash
docker-compose ps
```

### 3. View Logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f asncorpu_backend_app
```

---

## 🔧 Common Commands

### Restart Services:
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart asncorpu_backend_app
```

### Stop Services:
```bash
docker-compose down
```

### Rebuild:
```bash
docker-compose build --no-cache
docker-compose up -d
```

---

## 🗄️ Database Commands

### Connect to PostgreSQL:
```bash
docker exec -it asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db
```

### Run Migrations:
```bash
docker exec asncorpu_backend_app python manage.py migrate
```

### Create Superuser:
```bash
docker exec -it asncorpu_backend_app python manage.py createsuperuser
```

### Run Seeders:
```bash
# Knowledge Base permissions
docker exec asncorpu_backend_app python manage.py seed_knowledge_permissions

# Knowledge Base menus
docker exec asncorpu_backend_app python manage.py seed_knowledge_menus

# Knowledge Base categories
docker exec asncorpu_backend_app python manage.py seed_knowledge_categories
```

---

## 📊 Monitoring

### Check Container Health:
```bash
docker ps
```

### Check Resource Usage:
```bash
docker stats
```

### Check Logs:
```bash
# Last 100 lines
docker logs asncorpu_backend_app --tail 100

# Follow logs
docker logs -f asncorpu_backend_app
```

---

## 🔐 Security

### Production Checklist:

1. **Change Credentials:**
   ```yaml
   # PostgreSQL
   POSTGRES_PASSWORD: your-secure-password
   
   # pgAdmin
   PGADMIN_DEFAULT_EMAIL: your-email@company.com
   PGADMIN_DEFAULT_PASSWORD: your-secure-password
   ```

2. **Update .env:**
   ```env
   DEBUG=False
   ALLOWED_HOSTS=your-domain.com
   SECRET_KEY=your-secret-key
   ```

3. **Disable pgAdmin (Production):**
   ```bash
   docker-compose stop pgadmin
   ```

---

## 📦 Backup & Restore

### Backup Database:
```bash
docker exec asncorpu-backend-postgres pg_dump -U asncorpu_user asncorpu_backend_db > backup.sql
```

### Restore Database:
```bash
docker exec -i asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db < backup.sql
```

---

## 🐛 Troubleshooting

### Container Won't Start:
```bash
# Check logs
docker logs asncorpu_backend_app

# Check if port is in use
netstat -tulpn | grep 8008
```

### Database Connection Failed:
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection
docker exec asncorpu-backend-postgres pg_isready -U asncorpu_user
```

### Permission Denied:
```bash
# Fix file permissions
chmod -R 755 .
```

---

**Created by:** Kiro AI Assistant  
**Date:** May 7, 2026
