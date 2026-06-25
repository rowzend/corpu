# 🚀 PostgreSQL Quick Reference - ASN CORPU Backend

**Quick commands untuk daily development dengan PostgreSQL**

---

## 🎯 Migration Commands (Run Once)

```bash
# 1. Stop old containers
docker compose down

# 2. Rebuild with PostgreSQL
docker compose build --no-cache
docker compose up -d

# 3. Run migrations
docker exec asncorpu_backend_app python manage.py migrate

# 4. Create superuser
docker exec -it asncorpu_backend_app python manage.py createsuperuser

# 5. Seed data
docker exec asncorpu_backend_app python manage.py seed_menus
docker exec asncorpu_backend_app python manage.py collectstatic --noinput
```

---

## 📦 Daily Development Commands

### Start/Stop Application

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Restart
docker compose restart

# Rebuild (after code changes)
docker compose up -d --build
```

### Check Status

```bash
# Check all containers
docker compose ps

# Check logs
docker logs asncorpu_backend_app -f
docker logs asncorpu-backend-postgres -f
docker logs asncorpu-backend-redis -f
```

---

## 🗄️ PostgreSQL Commands

### Connect to Database

```bash
# psql shell
docker exec -it asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db

# Common psql commands:
\l              # List databases
\dt             # List tables
\d table_name   # Describe table
\du             # List users
\q              # Quit
```

### Quick Queries

```bash
# Count users
docker exec asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db -c "SELECT COUNT(*) FROM accounts_user;"

# List tables
docker exec asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db -c "\dt"

# Check database size
docker exec asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db -c "SELECT pg_size_pretty(pg_database_size('asncorpu_backend_db'));"
```

### Backup & Restore

```bash
# Backup
docker exec asncorpu-backend-postgres pg_dump -U asncorpu_user asncorpu_backend_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker exec -i asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db < backup.sql

# Backup with compression
docker exec asncorpu-backend-postgres pg_dump -U asncorpu_user -Fc asncorpu_backend_db > backup.dump

# Restore from compressed
docker exec -i asncorpu-backend-postgres pg_restore -U asncorpu_user -d asncorpu_backend_db < backup.dump
```

---

## 🐍 Django Commands

### Database Operations

```bash
# Make migrations
docker exec asncorpu_backend_app python manage.py makemigrations

# Apply migrations
docker exec asncorpu_backend_app python manage.py migrate

# Show migrations
docker exec asncorpu_backend_app python manage.py showmigrations

# SQL for migration
docker exec asncorpu_backend_app python manage.py sqlmigrate app_name 0001
```

### Django Shell

```bash
# Open shell
docker exec -it asncorpu_backend_app python manage.py shell

# Quick queries in shell:
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.count()
>>> User.objects.all()
>>> exit()
```

### User Management

```bash
# Create superuser
docker exec -it asncorpu_backend_app python manage.py createsuperuser

# Change password
docker exec -it asncorpu_backend_app python manage.py changepassword username
```

---

## 🔧 Troubleshooting

### PostgreSQL Not Starting

```bash
# Check logs
docker logs asncorpu-backend-postgres

# Check if port is used
sudo lsof -i :5433

# Remove volume and restart
docker compose down -v
docker compose up -d
```

### Connection Refused

```bash
# Check PostgreSQL is ready
docker exec asncorpu-backend-postgres pg_isready -U asncorpu_user

# Check network
docker network ls
docker network inspect asncorpu-backend-python_default
```

### Migration Errors

```bash
# Fake migration (if needed)
docker exec asncorpu_backend_app python manage.py migrate --fake app_name 0001

# Reset migrations (DANGER!)
docker exec asncorpu_backend_app python manage.py migrate app_name zero
docker exec asncorpu_backend_app python manage.py migrate app_name
```

### Performance Issues

```bash
# Check slow queries
docker exec asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Vacuum database
docker exec asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db -c "VACUUM ANALYZE;"
```

---

## 📊 Monitoring

### Database Size

```bash
# Total database size
docker exec asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db -c "SELECT pg_size_pretty(pg_database_size('asncorpu_backend_db'));"

# Table sizes
docker exec asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db -c "SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"
```

### Connection Count

```bash
# Active connections
docker exec asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db -c "SELECT count(*) FROM pg_stat_activity;"

# Connections by database
docker exec asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"
```

---

## 🎯 Access URLs

```
Application:  http://localhost:8008/
Admin Panel:  http://localhost:8008/admin/
Dashboard:    http://localhost:8008/dashboard/
API:          http://localhost:8008/api/

PostgreSQL:   localhost:5433 (external)
              asncorpu-backend-postgres:5432 (internal)
Redis:        localhost:6379
```

---

## 📝 Configuration Files

```
.env                    # Environment variables
docker-compose.yml      # Docker services
core/settings.py        # Django settings
requirements.txt        # Python packages
```

---

## 🔐 Credentials

```
PostgreSQL:
  Host:     asncorpu-backend-postgres
  Port:     5432 (internal), 5433 (external)
  Database: asncorpu_backend_db
  User:     asncorpu_user
  Password: asncorpu_secure_password_2026

Django Admin:
  URL:      http://localhost:8008/admin/
  Username: (created via createsuperuser)
  Password: (created via createsuperuser)
```

---

## 🆘 Emergency Commands

### Reset Everything

```bash
# DANGER: This will delete all data!
docker compose down -v
docker compose up -d --build
docker exec asncorpu_backend_app python manage.py migrate
docker exec -it asncorpu_backend_app python manage.py createsuperuser
docker exec asncorpu_backend_app python manage.py seed_menus
```

### Rollback to MySQL

```bash
# 1. Update .env
# Change DB_ENGINE to django.db.backends.mysql
# Change DB_HOST to mysql-main
# Change DB_PORT to 3306

# 2. Restore docker-compose.yml from git
git checkout docker-compose.yml

# 3. Rebuild
docker compose down -v
docker compose up -d --build
```

---

**Last Updated:** April 24, 2026  
**Database:** PostgreSQL 16  
**Project:** ASN CORPU Backend Python
