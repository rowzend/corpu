# CHANGELOG - ASNCORPU Backend Python

## [1.0.0] - 2026-04-24

### 🎉 Initial Release
- Created from dasar-python template
- Renamed project from "dasar-python" to "asncorpu-backend-python"

### ✨ Configuration Changes

#### Application Branding
- **APP_NAME:** `aplikasi-test` → `ASNCORPU`
- **APP_LONG_NAME:** `Aplikasi Test` → `ASN Corpu Backend System`
- **APP_INSTANSI:** `Instansi` → `ASN Corpu Organization`
- **APP_KEY_PREFIX:** `aplikasi-test` → `asncorpu-backend`

#### Database
- **DB_NAME:** `dasar_python_db` → `asncorpu_backend_db`
- **LARAVEL_DB_NAME:** `esim_pegawai` → `asncorpu_laravel_db`

#### Redis
- **REDIS_HOST:** `redis-main` → `asncorpu-backend-redis`
- **REDIS_DB:** `3` → `4`
- **Container Name:** `dasar-python-redis` → `asncorpu-backend-redis`

#### Docker Services
- **Service Name:** `aplikasi_test` → `asncorpu_backend`
- **Container Name:** `dasar_python_app` → `asncorpu_backend_app`
- **Port:** `8007` → `8008`
- **MySQL Init Container:** `dasar_python_mysql_init` → `asncorpu_backend_mysql_init`
- **MySQL Check Container:** `dasar_python_mysql_check` → `asncorpu_backend_mysql_check`

#### Security
- **SECRET_KEY:** Updated with new project-specific key
- **ALLOWED_HOSTS:** Updated to include `asncorpu-backend.local`
- **JWT_ISSUER:** Updated to `asncorpu-backend`

### 📦 Included Features (from dasar-python template)

#### Core Features
- ✅ Django 5.2.7 framework
- ✅ MySQL 8.4.6 database
- ✅ Redis 7.4 for caching and sessions
- ✅ Django REST Framework 3.16.1
- ✅ JWT authentication (djangorestframework-simplejwt)
- ✅ Argon2 password hashing (OWASP recommended)
- ✅ Tailwind CSS for styling
- ✅ Docker containerization

#### Security Features
- ✅ Multi-backend authentication (username/email/NIP)
- ✅ Session inactivity timeout (30 minutes)
- ✅ Force password change for defaults
- ✅ API logging (file + database)
- ✅ Granular permission system
- ✅ Single session enforcement option
- ✅ CSRF & XSS protection

#### Apps Included
- ✅ `apps.accounts` - User authentication & management
- ✅ `apps.dashboard` - Dashboard views
- ✅ `apps.manajemen` - Permission & menu management
- ✅ `apps.common` - Shared components

#### Documentation
- ✅ Complete documentation in `docs/` folder
- ✅ Deploy guides
- ✅ Database migration guides
- ✅ Permission system guides
- ✅ API documentation
- ✅ Security best practices
- ✅ UI component guides

### 🗑️ Cleaned Up
- Removed old SQLite database file
- Removed old log files
- Removed Python cache files
- Removed backup files from template

### 📝 Files Modified
- `.env` - Updated all configuration values
- `.env.example` - Updated template values
- `.env.production` - Updated production configuration
- `docker-compose.yml` - Updated service names and ports
- `Dockerfile` - Updated Django settings module reference
- `core/settings.py` - Updated default values
- `README.md` - Created new project-specific README

### 🎯 Ready For
- Custom app development
- API endpoint creation
- Business logic implementation
- Frontend integration
- Production deployment

---

## Template Source
Based on **dasar-python** template (April 2026)
- Clean Django boilerplate with best practices
- Production-ready security features
- Comprehensive documentation
- Docker-ready deployment

## Next Steps
1. Customize branding and configuration
2. Add domain-specific Django apps
3. Implement business logic
4. Create API endpoints
5. Customize UI/UX
6. Setup CI/CD pipeline
7. Deploy to production

---

**Project Status:** ✅ Ready for Development  
**Last Updated:** April 24, 2026
