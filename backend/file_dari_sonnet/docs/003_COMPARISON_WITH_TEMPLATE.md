# 📊 Comparison: asncorpu-backend-python vs dasar-python Template

## Overview

This document shows the differences between the new **asncorpu-backend-python** project and its source template **dasar-python**.

---

## 🔄 Configuration Changes

### Application Identity

| Configuration | dasar-python | asncorpu-backend-python |
|--------------|--------------|-------------------------|
| **APP_NAME** | aplikasi-test | ASNCORPU |
| **APP_LONG_NAME** | Aplikasi Test | ASN Corpu Backend System |
| **APP_INSTANSI** | Instansi | ASN Corpu Organization |
| **APP_DESCRIPTION** | Aplikasi internal | Backend system for ASN Corpu platform |
| **APP_KEY_PREFIX** | aplikasi-test | asncorpu-backend |

### Database Configuration

| Configuration | dasar-python | asncorpu-backend-python |
|--------------|--------------|-------------------------|
| **DB_NAME** | dasar_python_db | asncorpu_backend_db |
| **LARAVEL_DB_NAME** | esim_pegawai | asncorpu_laravel_db |

### Redis Configuration

| Configuration | dasar-python | asncorpu-backend-python |
|--------------|--------------|-------------------------|
| **REDIS_HOST** | redis-main | asncorpu-backend-redis |
| **REDIS_DB** | 3 | 4 |
| **Container Name** | dasar-python-redis | asncorpu-backend-redis |

### Docker Services

| Configuration | dasar-python | asncorpu-backend-python |
|--------------|--------------|-------------------------|
| **Service Name** | aplikasi_test | asncorpu_backend |
| **Container Name** | dasar_python_app | asncorpu_backend_app |
| **Port Mapping** | 8007:8000 | 8008:8000 |
| **MySQL Init Container** | dasar_python_mysql_init | asncorpu_backend_mysql_init |
| **MySQL Check Container** | dasar_python_mysql_check | asncorpu_backend_mysql_check |

### Security

| Configuration | dasar-python | asncorpu-backend-python |
|--------------|--------------|-------------------------|
| **SECRET_KEY** | django-insecure-aplikasi-test-... | django-insecure-asncorpu-backend-... |
| **ALLOWED_HOSTS** | ...,aplikasi-test.local | ...,asncorpu-backend.local |
| **JWT_ISSUER** | aplikasi-test | asncorpu-backend |

---

## 📁 File Changes

### Modified Files

| File | Changes |
|------|---------|
| `.env` | Updated all configuration values |
| `.env.example` | Updated template values |
| `.env.production` | Updated production configuration |
| `docker-compose.yml` | Updated service names, ports, database names |
| `Dockerfile` | Updated Django settings module reference |
| `core/settings.py` | Updated default values for APP_NAME, DB_NAME, etc. |

### New Files Created

| File | Purpose |
|------|---------|
| `README.md` | Project-specific overview and documentation |
| `CHANGELOG.md` | Version history and changes |
| `QUICK_START.md` | 5-minute setup guide |
| `PROJECT_SETUP_SUMMARY.md` | Setup completion summary |
| `COMPARISON_WITH_TEMPLATE.md` | This file |

### Removed Files

| File | Reason |
|------|--------|
| `db.sqlite3` | Old database file |
| `tailwind.pid` | Old process ID file |
| `tailwind-watch.log` | Old log file |
| `__pycache__/` | Python cache files |
| `backups/` | Old backup files |
| `logs/*.log` | Old log files |

---

## ✅ What Stayed the Same

### Core Framework
- ✅ Django 5.2.7
- ✅ Python 3.11
- ✅ MySQL 8.4.6
- ✅ Redis 7.4

### Dependencies (requirements.txt)
- ✅ All Python packages unchanged
- ✅ Same versions maintained

### App Structure
- ✅ `apps/accounts/` - User authentication
- ✅ `apps/dashboard/` - Dashboard views
- ✅ `apps/manajemen/` - Permission management
- ✅ `apps/common/` - Shared components

### Security Features
- ✅ Multi-backend authentication
- ✅ Argon2 password hashing
- ✅ Session timeout (30 minutes)
- ✅ Force password change
- ✅ API logging
- ✅ Permission system
- ✅ CSRF & XSS protection

### Documentation Structure
- ✅ `docs/deploy/` - Deployment guides
- ✅ `docs/database/` - Database guides
- ✅ `docs/permissions/` - Permission guides
- ✅ `docs/api/` - API documentation
- ✅ `docs/security/` - Security guides
- ✅ `docs/ui/` - UI guides

### Docker Configuration
- ✅ Same Dockerfile structure
- ✅ Same docker-compose structure
- ✅ Same entrypoint.sh
- ✅ Same gunicorn configuration

---

## 🎯 Why These Changes?

### Unique Identity
Each project needs its own:
- Database names (avoid conflicts)
- Redis database number (isolation)
- Container names (Docker requirement)
- Port numbers (avoid port conflicts)
- Secret keys (security)

### Isolation
Separate Redis and database ensures:
- No data collision between projects
- Independent scaling
- Easier debugging
- Clean separation of concerns

### Branding
Custom branding allows:
- Project-specific UI
- Clear identification
- Professional appearance
- Custom messaging

---

## 🚀 Migration Path

If you want to migrate from dasar-python to asncorpu-backend-python:

### 1. Export Data (if needed)
```bash
# From dasar-python
docker exec dasar_python_app python manage.py dumpdata > data.json
```

### 2. Import Data
```bash
# To asncorpu-backend-python
docker exec asncorpu_backend_app python manage.py loaddata data.json
```

### 3. Update References
- Update any hardcoded references to old names
- Update environment variables
- Update documentation

---

## 📊 Port Allocation

| Project | Port | Status |
|---------|------|--------|
| ESIMPEG-Python | 8005 | In use |
| survey_pemda_python | 8006 | In use |
| dasar-python | 8007 | Template |
| **asncorpu-backend-python** | **8008** | **New** |

---

## 🔍 Quick Verification

### Check Configuration
```bash
# Check .env file
cat all-projects-darireal/projects/asncorpu-backend-python/.env | grep asncorpu

# Check docker-compose.yml
cat all-projects-darireal/projects/asncorpu-backend-python/docker-compose.yml | grep asncorpu

# Check settings.py
cat all-projects-darireal/projects/asncorpu-backend-python/core/settings.py | grep asncorpu
```

### Test Setup
```bash
# Start containers
cd all-projects-darireal/projects/asncorpu-backend-python
docker compose up -d --build

# Check containers are running
docker ps | grep asncorpu

# Check logs
docker logs asncorpu_backend_app
```

---

## 📝 Summary

### Changed (Project-Specific)
- ✅ Project name and branding
- ✅ Database names
- ✅ Redis configuration
- ✅ Docker service names
- ✅ Port numbers
- ✅ Container names
- ✅ Secret keys
- ✅ Documentation

### Unchanged (Template Features)
- ✅ Django framework and version
- ✅ App structure and code
- ✅ Security features
- ✅ Authentication system
- ✅ Permission system
- ✅ Dependencies
- ✅ Docker setup pattern

---

## 🎉 Result

**asncorpu-backend-python** is now a completely independent project with:
- ✅ Unique identity and configuration
- ✅ Isolated database and cache
- ✅ Independent Docker containers
- ✅ Custom branding
- ✅ All template features intact
- ✅ Ready for development

**Template integrity maintained:** All best practices and features from dasar-python are preserved!

---

**Last Updated:** April 24, 2026
