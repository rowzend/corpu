# ASN Corporate University - Backend System

**Status:** 🚀 **Ready for Development**  
**Based on:** dasar-python template (Django 5.2.7)  
**Created:** April 24, 2026  

## 🎯 PROJECT OVERVIEW

**ASN Corporate University (ASN CORPU)** adalah platform terintegrasi yang menggabungkan Learning Management System (LMS) dan Knowledge Management System (KMS) untuk pengembangan kompetensi ASN (Aparatur Sipil Negara) di **Pemerintah Kabupaten Pesisir Selatan**. Platform ini mencakup:

### 📚 LMS (Learning Management System):
- **Course Management** - Course management, modules, lessons
- **User Management** - ASN, instructors, administrators
- **Progress Tracking** - Learning progress, completion tracking
- **Assessment System** - Quizzes, assignments, grading
- **Certificate Management** - Digital certificates, verification
- **Analytics & Reporting** - Dashboard, insights, exports

### 📖 KMS (Knowledge Management System):
- **Knowledge Base** - Articles, documentation, best practices
- **Document Library** - Policies, procedures, guidelines
- **Wiki System** - Collaborative knowledge creation
- **Search & Discovery** - Full-text search, categorization
- **Version Control** - Document versioning, history
- **Collaboration** - Comments, discussions, contributions

Backend system ini dibangun dengan Django 5.2.7 dan menggunakan best practices untuk rapid development.

## 🚀 QUICK START

### 🖥️ **Development (Docker):**
```bash
# Build and start containers
cd all-projects-darireal/projects/asncorpu-backend-python
docker compose up -d --build

# Check logs
docker logs asncorpu_backend_app -f

# Access application
http://localhost:8008/
http://localhost:8008/dashboard/
```

### 📦 **First Time Setup:**
```bash
# Run migrations
docker exec asncorpu_backend_app python manage.py migrate

# Create superuser
docker exec -it asncorpu_backend_app python manage.py createsuperuser

# Seed initial menus and permissions
docker exec asncorpu_backend_app python manage.py seed_menus

# Collect static files
docker exec asncorpu_backend_app python manage.py collectstatic --noinput
```

## 🛠️ TECH STACK

- **Framework:** Django 5.2.7
- **Database:** PostgreSQL 16 (migrated from MySQL)
- **Cache/Session:** Redis 7.4
- **API:** Django REST Framework 3.16.1
- **Authentication:** JWT (djangorestframework-simplejwt)
- **Password Hashing:** Argon2 (OWASP recommended)
- **Frontend:** Tailwind CSS
- **Server:** Gunicorn + Whitenoise
- **Container:** Docker + Docker Compose

## 📁 PROJECT STRUCTURE

```
asncorpu-backend-python/
├── apps/
│   ├── accounts/          # User authentication & management
│   ├── dashboard/         # Dashboard views
│   ├── manajemen/         # Permission & menu management
│   ├── courses/           # Course management (LMS - to be added)
│   ├── enrollments/       # Enrollment & progress (LMS - to be added)
│   ├── assessments/       # Quizzes & assignments (LMS - to be added)
│   ├── certificates/      # Certificate generation (LMS - to be added)
│   ├── knowledge/         # Knowledge base (KMS - to be added)
│   ├── documents/         # Document library (KMS - to be added)
│   ├── wiki/              # Wiki system (KMS - to be added)
│   └── common/            # Shared components
├── core/                  # Django core settings
├── templates/             # HTML templates
├── static/                # Static files (CSS, JS, images)
├── docs/                  # Django documentation
├── file_dari_sonnet/      # AI-generated setup documentation
├── logs/                  # Application logs
└── docker-compose.yml     # Docker configuration
```

## 🔧 CONFIGURATION

### Environment Variables (.env)
```bash
# Application
APP_NAME=ASN CORPU
APP_LONG_NAME=ASN Corporate University
APP_INSTANSI=ASN Corporate University
APP_DESCRIPTION=Learning Management System (LMS) for ASN Corporate University
APP_KEY_PREFIX=asncorpu-backend

# Database
DB_NAME=asncorpu_backend_db
DB_HOST=asncorpu-backend-postgres
DB_USER=asncorpu_user
DB_PASSWORD=your_password

# Redis
REDIS_HOST=asncorpu-backend-redis
REDIS_DB=4

# Ports
Application: 8008
Redis: 6379
PostgreSQL: 5432
```

## 🔐 SECURITY FEATURES

- ✅ Multi-backend authentication (username/email/NIP)
- ✅ Argon2 password hashing (OWASP recommended)
- ✅ Session inactivity timeout (30 minutes)
- ✅ Force password change for default passwords
- ✅ JWT token authentication for API
- ✅ API logging (file + database)
- ✅ Granular permission system
- ✅ Single session enforcement option
- ✅ CSRF protection
- ✅ XSS protection

## 📊 FEATURES

### Core Features (Ready):
- ✅ User authentication & authorization
- ✅ Role-based access control (RBAC)
- ✅ Dynamic sidebar menu from database
- ✅ Granular permission management system
- ✅ API logging & monitoring
- ✅ Session management with Redis
- ✅ Responsive dashboard with Tailwind CSS
- ✅ Django Admin Panel (built-in CRUD)
- ✅ PostgreSQL database with advanced features
- ✅ Network access (auto-detect IP)

### LMS Features (To Be Developed):
- 🔲 **Course Management** - Create, edit, manage courses
- 🔲 **Module & Lesson System** - Structured learning content
- 🔲 **Enrollment System** - User enrollment & access control
- 🔲 **Progress Tracking** - Track learning progress per user
- 🔲 **Quiz System** - Multiple choice, essay, assignments
- 🔲 **Grading System** - Automated & manual grading
- 🔲 **Certificate Generation** - Digital certificates with verification
- 🔲 **Content Delivery** - Videos, documents, presentations
- 🔲 **Discussion Forum** - Q&A, peer interaction
- 🔲 **Analytics Dashboard** - Learning analytics, reports

### KMS Features (To Be Developed):
- 🔲 **Knowledge Base** - Articles, FAQs, best practices
- 🔲 **Document Library** - Policies, procedures, guidelines
- 🔲 **Wiki System** - Collaborative knowledge creation
- 🔲 **Search & Discovery** - Full-text search, categorization, tagging
- 🔲 **Version Control** - Document versioning, change history
- 🔲 **Collaboration** - Comments, discussions, contributions
- 🔲 **Content Rating** - Upvote/downvote, helpful/not helpful
- 🔲 **Knowledge Sharing** - Share articles, recommend content
- 🔲 **Expert Directory** - Find subject matter experts
- 🔲 **Content Approval** - Review & approval workflow

### API Features (To Be Developed):
- 🔲 RESTful API for all LMS & KMS features
- 🔲 JWT authentication for API
- 🔲 API documentation (Swagger/OpenAPI)
- 🔲 Rate limiting & throttling
- 🔲 API versioning (v1, v2)

## 🧪 DEVELOPMENT

### Database Migrations
```bash
# Create migrations
docker exec asncorpu_backend_app python manage.py makemigrations

# Apply migrations
docker exec asncorpu_backend_app python manage.py migrate

# Check migration status
docker exec asncorpu_backend_app python manage.py showmigrations
```

### Static Files
```bash
# Collect static files
docker exec asncorpu_backend_app python manage.py collectstatic --noinput

# Or use the helper script
./reload-static.sh
```

### Django Shell
```bash
# Access Django shell
docker exec -it asncorpu_backend_app python manage.py shell
```

### Logs
```bash
# Application logs
docker logs asncorpu_backend_app -f

# Django logs
tail -f logs/django.log

# API access logs
tail -f logs/api_access.log
```

## 📚 DOCUMENTATION

### AI-Generated Documentation (Setup & Configuration)
**📁 [file_dari_sonnet/](file_dari_sonnet/)** - Complete setup documentation
- **[00_START_HERE.md](file_dari_sonnet/00_START_HERE.md)** - Start here for navigation
- **[README.md](file_dari_sonnet/README.md)** - Documentation overview
- **[docs/](file_dari_sonnet/docs/)** - Detailed setup & deployment guides
  - 001_CHANGELOG.md - Version history
  - 002_PROJECT_SETUP_SUMMARY.md - Complete setup summary
  - 003_COMPARISON_WITH_TEMPLATE.md - Template comparison
  - 004_DEPLOYMENT_CHECKLIST.md - Deployment checklist
  - 005_SETUP_COMPLETE.md - Setup completion guide

### Django Standard Documentation
**📁 [docs/](docs/)** - Django framework documentation
- **Deploy:** `docs/deploy/` - Production deployment guides
- **Database:** `docs/database/` - Migration & seeding guides
- **Permissions:** `docs/permissions/` - Permission system guides
- **API:** `docs/api/` - API documentation
- **Security:** `docs/security/` - Security best practices
- **UI:** `docs/ui/` - UI components & styling

## 🌐 DEPLOYMENT

### Production Checklist:
- [ ] Update SECRET_KEY in .env.production
- [ ] Set DEBUG=False
- [ ] Configure ALLOWED_HOSTS
- [ ] Setup SSL/HTTPS
- [ ] Configure production database
- [ ] Setup Redis with password
- [ ] Configure email backend
- [ ] Setup backup strategy
- [ ] Configure monitoring
- [ ] Review security settings

### Docker Production:
```bash
# Use production compose file
docker compose -f docker-compose.prod.yml up -d --build
```

## 🔄 MAINTENANCE

### Backup Database
```bash
# Backup PostgreSQL
docker exec asncorpu-backend-postgres pg_dump -U asncorpu_user asncorpu_backend_db > backup.sql

# Restore
docker exec -i asncorpu-backend-postgres psql -U asncorpu_user asncorpu_backend_db < backup.sql
```

### Update Dependencies
```bash
# Update requirements.txt
pip freeze > requirements.txt

# Rebuild container
docker compose up -d --build
```

## 🆘 TROUBLESHOOTING

### Container Issues:
```bash
# Restart containers
docker compose restart

# Rebuild from scratch
docker compose down -v
docker compose up -d --build
```

### Database Connection:
```bash
# Check MySQL connection
docker exec asncorpu_backend_app python manage.py dbshell

# Check Redis connection
docker exec asncorpu-backend-redis redis-cli ping
```

### Permission Issues:
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

## 📞 SUPPORT

### Useful Commands:
```bash
# Check container status
docker compose ps

# View all logs
docker compose logs -f

# Access container shell
docker exec -it asncorpu_backend_app bash

# Run Django management commands
docker exec asncorpu_backend_app python manage.py <command>
```

## 🎯 NEXT STEPS

### Phase 1: Foundation (Current) ✅
- ✅ Project setup complete
- ✅ Database migrated to PostgreSQL
- ✅ Network access configured
- ✅ Documentation complete

---

## 🔥 PRIORITAS: KMS FIRST, LMS SECOND

**Filosofi Development:**
1. **KMS dulu** - Build knowledge base, document library, wiki
2. **ASN belajar dari KMS** - Informal learning, self-paced
3. **Materi KMS matang** - Content sudah lengkap & tervalidasi
4. **Baru buat LMS** - Course formal berdasarkan materi KMS
5. **LMS mengikuti KMS** - Structured learning path dari knowledge yang ada

**Keuntungan Approach Ini:**
- ✅ Content-first approach (materi dulu, struktur kemudian)
- ✅ ASN langsung bisa belajar dari KMS (quick win)
- ✅ Course LMS lebih berkualitas (based on validated content)
- ✅ Avoid empty courses (materi sudah ada di KMS)
- ✅ Natural learning progression (informal → formal)

---

### Phase 2: Core KMS - Knowledge Base (Week 3-5) 🔥 PRIORITY
1. **Knowledge Base (Articles)**
   - Create Article model (title, content, category, tags)
   - Rich text editor (WYSIWYG)
   - Categories & tags system
   - Article CRUD API
   - Article rating & feedback
   - Featured articles
   - View counter & analytics
   - Add Django admin configuration

2. **Search & Discovery**
   - Full-text search (PostgreSQL)
   - Search across articles
   - Filters (category, date, author)
   - Search suggestions
   - Popular searches

**Output:** ASN bisa mulai baca & belajar dari articles

### Phase 3: KMS - Document Library (Week 6-7)
3. **Document Management**
   - Document upload system (PDF, DOCX, XLSX, PPTX)
   - Document metadata & categorization
   - Version control (track changes)
   - Access control (public, restricted, private)
   - Download tracking
   - Document approval workflow
   - Expiry date management

**Output:** Kebijakan, SOP, Juknis tersedia & terorganisir

### Phase 4: KMS - Collaboration (Week 8-10)
4. **Wiki System**
   - Wiki page model (Markdown support)
   - Page history & revisions
   - Revert to previous version
   - Internal linking
   - Collaborative editing
   - Table of contents auto-generate

5. **Comments & Discussions**
   - Comments on articles/documents/wiki
   - Threaded discussions
   - Reactions (like, helpful, insightful)
   - Mentions (@username)
   - Comment moderation

6. **Expert Directory**
   - Expert profiles (expertise, bio)
   - Q&A system (ask expert)
   - Expert search & filter
   - Contribution tracking

**Output:** Collaborative learning environment, ASN bisa diskusi & tanya expert

### Phase 5: KMS Analytics & Content Enrichment (Week 11-12)
7. **KMS Analytics**
   - Content views & engagement metrics
   - Popular articles/documents
   - User contributions tracking
   - Search analytics
   - Export reports

8. **Content Enrichment**
   - Related content suggestions
   - Content recommendations
   - Bookmarks/favorites
   - Content sharing
   - Content tagging improvements

**Output:** KMS sudah lengkap dengan banyak materi, siap dijadikan basis untuk LMS

---

### Phase 6: LMS - Course Structure (Week 13-15)
**Sekarang baru mulai LMS, berdasarkan materi KMS yang sudah ada**

9. **Course Management**
   - Create Course model (based on KMS content)
   - Create Module model (course structure)
   - Create Lesson model (link to KMS articles/documents)
   - Course CRUD API
   - Course categories
   - Prerequisites system

10. **Enrollment System**
    - Create Enrollment model (user-course relationship)
    - Create Progress model (lesson completion tracking)
    - Build enrollment API
    - Add enrollment validation (prerequisites, quota)
    - Progress calculation

**Output:** Course formal yang terstruktur, menggunakan materi dari KMS

### Phase 7: LMS - Assessment (Week 16-17)
11. **Quiz & Assignment System**
    - Quiz model (based on KMS content)
    - Questions & answers
    - Submission model (user answers)
    - Grading system (automated & manual)
    - Score calculation
    - Passing grade validation

**Output:** Assessment untuk mengukur pemahaman dari materi KMS

### Phase 8: LMS - Certification (Week 18-19)
12. **Certificate Generation**
    - Certificate model (user, course, issued date)
    - PDF generation (ReportLab/WeasyPrint)
    - Digital signature
    - Verification system
    - Certificate download

**Output:** Sertifikat untuk ASN yang menyelesaikan course

### Phase 9: Integration & Analytics (Week 20-22)
13. **LMS-KMS Integration**
    - Link course content to KMS articles/documents
    - Seamless navigation between LMS & KMS
    - Unified search (across LMS & KMS)
    - Cross-referencing

14. **Unified Analytics**
    - Combined LMS + KMS dashboard
    - Learning path analytics
    - Impact measurement
    - User engagement metrics
    - Export reports (PDF, Excel)

15. **Notification System**
    - Email notifications
    - In-app notifications
    - Push notifications (future)
    - Notification preferences

### Phase 10: Testing & Deployment (Week 23-24)
16. **Testing**
    - Unit testing
    - Integration testing
    - User acceptance testing (UAT)
    - Performance testing
    - Security audit

17. **Deployment & Training**
    - Production deployment
    - User training (Admin, Instructor, ASN)
    - Documentation finalization
    - Support setup
    - Monitoring & maintenance

### Getting Started with Development:
```bash
# 1. Read documentation
cat file_dari_sonnet/00_START_HERE.md
cat file_dari_sonnet/PROJECT_OVERVIEW_ASN_CORPU.md
cat file_dari_sonnet/INSTANSI_PESISIR_SELATAN.md
cat file_dari_sonnet/CATATAN_DARI_PROGRAMMER.md

# 2. Read coding guides
cat file_dari_sonnet/coding_implementation/01_API_CRUD_GUIDE.md
cat file_dari_sonnet/coding_implementation/02_SEEDING_GUIDE.md

# 3. Start building KMS first!
# Example: Create Knowledge app (KMS - PRIORITY)
docker exec asncorpu_backend_app python manage.py startapp knowledge apps/knowledge

# Example: Create Documents app (KMS)
docker exec asncorpu_backend_app python manage.py startapp documents apps/documents

# Example: Create Wiki app (KMS)
docker exec asncorpu_backend_app python manage.py startapp wiki apps/wiki

# Later: Create Course app (LMS - after KMS is ready)
# docker exec asncorpu_backend_app python manage.py startapp courses apps/courses
```

---

**Project initialized from dasar-python template**  
**Ready for customization and development! 🚀**
