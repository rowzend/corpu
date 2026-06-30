# 🎓 ASN Corporate University - Project Overview

**Project Name:** ASN Corporate University (ASN CORPU)  
**Type:** Learning Management System (LMS) + Knowledge Management System (KMS)  
**Target Users:** ASN (Aparatur Sipil Negara)  
**Instansi:** Pemerintah Kabupaten Pesisir Selatan  
**Created:** April 24, 2026  
**Status:** 🚀 Ready for Development  

---

## 📋 Apa itu ASN Corporate University?

**ASN Corporate University** adalah platform terintegrasi yang menggabungkan Learning Management System (LMS) dan Knowledge Management System (KMS) yang dirancang khusus untuk pengembangan kompetensi ASN (Aparatur Sipil Negara) di **Pemerintah Kabupaten Pesisir Selatan**. Platform ini menyediakan solusi lengkap untuk:

### 🎯 Tujuan Utama:

#### 📚 LMS (Learning Management System):
1. **Pelatihan & Pengembangan** - Menyediakan course online untuk ASN
2. **Manajemen Kompetensi** - Tracking kompetensi dan skill development
3. **Sertifikasi** - Memberikan sertifikat digital untuk course yang diselesaikan
4. **Assessment** - Quiz, assignment, dan grading system
5. **Analytics** - Monitoring progress dan performance ASN

#### 📖 KMS (Knowledge Management System):
1. **Knowledge Sharing** - Berbagi pengetahuan dan best practices
2. **Document Management** - Manage policies, procedures, guidelines
3. **Collaborative Learning** - Wiki, discussions, contributions
4. **Search & Discovery** - Find knowledge quickly and easily
5. **Expert Network** - Connect dengan subject matter experts

---

## 🏗️ Arsitektur System

### System Architecture:

```
┌─────────────────────────────────────────────────────────────┐
│              ASN CORPU SYSTEM (LMS + KMS)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │   FRONTEND       │  HTTP   │    BACKEND       │        │
│  │   (React/Vue)    │ ◄─────► │    (Django)      │        │
│  │                  │ Request │                  │        │
│  │  - LMS Web App   │ Response│  - REST API      │        │
│  │  - KMS Web App   │         │  - Business Logic│        │
│  │  - Mobile App    │         │  - Authentication│        │
│  │  - Admin Panel   │         │  - File Storage  │        │
│  └──────────────────┘         └──────────────────┘        │
│         │                              │                    │
│         │                              │                    │
│    ┌────▼────┐                    ┌───▼────┐              │
│    │  User   │                    │Database│              │
│    │Interface│                    │(PostgreSQL)           │
│    │         │                    │                       │
│    │ - LMS   │                    │ - LMS Tables         │
│    │ - KMS   │                    │ - KMS Tables         │
│    └─────────┘                    │ - Full-text Search   │
│                                   └────────┘              │
│                                        │                    │
│                                   ┌────▼────┐             │
│                                   │  Redis  │             │
│                                   │ (Cache) │             │
│                                   └─────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Backend Responsibilities (Kamu):
- ✅ **REST API Development** - Endpoints untuk frontend
- ✅ **Database Management** - Schema design & optimization
- ✅ **Business Logic** - Core functionality (enrollment, grading, etc)
- ✅ **Authentication & Authorization** - User & permission management
- ✅ **File Management** - Upload/download course materials
- ✅ **Certificate Generation** - PDF generation & verification
- ✅ **Analytics & Reporting** - Data processing & insights
- ✅ **Integration** - Third-party services (email, storage, etc)

### Frontend Responsibilities (Team Lain):
- ❌ UI/UX Design
- ❌ HTML/CSS/JavaScript
- ❌ User interactions
- ❌ Responsive layout
- ❌ Component development

---

## 📖 KMS (Knowledge Management System) Features

### 9. 📚 Knowledge Base

**Deskripsi:** Sistem untuk manage articles, FAQs, dan best practices

**Features:**
- Create/Edit/Delete articles
- Rich text editor (WYSIWYG)
- Categories & tags
- Featured articles
- Related articles
- Article rating & feedback
- View counter
- Bookmark/favorite

**API Endpoints:**
```
GET    /api/v1/knowledge/articles/          # List articles
POST   /api/v1/knowledge/articles/          # Create article
GET    /api/v1/knowledge/articles/{id}/     # Article detail
PUT    /api/v1/knowledge/articles/{id}/     # Update article
DELETE /api/v1/knowledge/articles/{id}/     # Delete article
POST   /api/v1/knowledge/articles/{id}/rate/ # Rate article
GET    /api/v1/knowledge/categories/        # List categories
GET    /api/v1/knowledge/tags/              # List tags
```

**Database Schema:**
```sql
CREATE TABLE knowledge_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id INTEGER REFERENCES users(id),
    category_id INTEGER REFERENCES knowledge_categories(id),
    status VARCHAR(20) DEFAULT 'draft',  -- draft, published, archived
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    rating_avg DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    INDEX idx_featured (is_featured)
);

CREATE TABLE knowledge_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES knowledge_categories(id),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE knowledge_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE knowledge_article_tags (
    article_id INTEGER REFERENCES knowledge_articles(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES knowledge_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

CREATE TABLE knowledge_ratings (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES knowledge_articles(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, user_id)
);
```

---

### 10. 📁 Document Library

**Deskripsi:** Sistem untuk manage documents (policies, procedures, guidelines)

**Features:**
- Upload documents (PDF, DOCX, XLSX, PPTX)
- Document metadata (title, description, tags)
- Version control (track changes)
- Access control (public, restricted, private)
- Download tracking
- Document approval workflow
- Expiry date management
- Document search

**API Endpoints:**
```
GET    /api/v1/documents/                   # List documents
POST   /api/v1/documents/upload/            # Upload document
GET    /api/v1/documents/{id}/              # Document detail
PUT    /api/v1/documents/{id}/              # Update metadata
DELETE /api/v1/documents/{id}/              # Delete document
GET    /api/v1/documents/{id}/download/     # Download document
GET    /api/v1/documents/{id}/versions/     # Version history
POST   /api/v1/documents/{id}/approve/      # Approve document
```

**Database Schema:**
```sql
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,  -- in bytes
    file_type VARCHAR(50),  -- pdf, docx, xlsx, etc
    mime_type VARCHAR(100),
    category_id INTEGER REFERENCES document_categories(id),
    uploaded_by INTEGER REFERENCES users(id),
    access_level VARCHAR(20) DEFAULT 'public',  -- public, restricted, private
    status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    expiry_date DATE,
    download_count INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1,
    parent_id INTEGER REFERENCES documents(id),  -- for versioning
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    INDEX idx_access (access_level)
);

CREATE TABLE document_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES document_categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE document_downloads (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 11. 📝 Wiki System

**Deskripsi:** Collaborative knowledge creation system (seperti Wikipedia internal)

**Features:**
- Create/Edit wiki pages
- Markdown support
- Page history & revisions
- Revert to previous version
- Page linking (internal links)
- Table of contents auto-generate
- Collaborative editing
- Page protection (lock editing)
- Discussion/comments per page

**API Endpoints:**
```
GET    /api/v1/wiki/pages/                  # List wiki pages
POST   /api/v1/wiki/pages/                  # Create page
GET    /api/v1/wiki/pages/{slug}/           # Page detail
PUT    /api/v1/wiki/pages/{slug}/           # Update page
DELETE /api/v1/wiki/pages/{slug}/           # Delete page
GET    /api/v1/wiki/pages/{slug}/history/   # Page history
POST   /api/v1/wiki/pages/{slug}/revert/    # Revert to version
GET    /api/v1/wiki/search/                 # Search pages
```

**Database Schema:**
```sql
CREATE TABLE wiki_pages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    current_version INTEGER DEFAULT 1,
    created_by INTEGER REFERENCES users(id),
    is_protected BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
);

CREATE TABLE wiki_revisions (
    id SERIAL PRIMARY KEY,
    page_id INTEGER REFERENCES wiki_pages(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    edited_by INTEGER REFERENCES users(id),
    edit_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(page_id, version)
);

CREATE TABLE wiki_page_links (
    id SERIAL PRIMARY KEY,
    from_page_id INTEGER REFERENCES wiki_pages(id) ON DELETE CASCADE,
    to_page_slug VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 12. 🔍 Search & Discovery

**Deskripsi:** Full-text search untuk semua content (articles, documents, wiki)

**Features:**
- Full-text search (PostgreSQL full-text search)
- Search across all content types
- Filters (category, date, author, type)
- Search suggestions/autocomplete
- Search history
- Popular searches
- Advanced search (boolean operators)
- Search analytics

**API Endpoints:**
```
GET    /api/v1/search/                      # Global search
GET    /api/v1/search/articles/             # Search articles
GET    /api/v1/search/documents/            # Search documents
GET    /api/v1/search/wiki/                 # Search wiki
GET    /api/v1/search/suggestions/          # Search suggestions
GET    /api/v1/search/popular/              # Popular searches
```

**PostgreSQL Full-Text Search:**
```sql
-- Add full-text search columns
ALTER TABLE knowledge_articles 
ADD COLUMN search_vector tsvector;

-- Create index for fast search
CREATE INDEX idx_articles_search 
ON knowledge_articles 
USING GIN(search_vector);

-- Update search vector on insert/update
CREATE TRIGGER articles_search_update 
BEFORE INSERT OR UPDATE ON knowledge_articles
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', title, content);

-- Search query example
SELECT * FROM knowledge_articles
WHERE search_vector @@ to_tsquery('english', 'django & python');
```

---

### 13. 👥 Expert Directory

**Deskripsi:** Directory untuk find subject matter experts

**Features:**
- Expert profiles (expertise, bio, contact)
- Skill tags
- Contribution tracking (articles, answers)
- Expert rating
- Ask an expert (Q&A)
- Expert availability
- Expert search & filter

**API Endpoints:**
```
GET    /api/v1/experts/                     # List experts
GET    /api/v1/experts/{id}/                # Expert profile
GET    /api/v1/experts/search/              # Search experts
POST   /api/v1/experts/ask/                 # Ask question to expert
GET    /api/v1/experts/{id}/contributions/  # Expert contributions
```

**Database Schema:**
```sql
CREATE TABLE expert_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    bio TEXT,
    expertise_areas TEXT[],  -- Array of expertise
    years_experience INTEGER,
    is_available BOOLEAN DEFAULT TRUE,
    rating_avg DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    contribution_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expert_skills (
    id SERIAL PRIMARY KEY,
    expert_id INTEGER REFERENCES expert_profiles(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level VARCHAR(20),  -- beginner, intermediate, expert
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expert_questions (
    id SERIAL PRIMARY KEY,
    asked_by INTEGER REFERENCES users(id),
    expert_id INTEGER REFERENCES expert_profiles(id),
    question TEXT NOT NULL,
    answer TEXT,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, answered, closed
    is_public BOOLEAN DEFAULT FALSE,
    asked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    answered_at TIMESTAMP
);
```

---

### 14. 💬 Collaboration Features

**Deskripsi:** Features untuk collaboration (comments, discussions)

**Features:**
- Comments on articles/documents/wiki
- Threaded discussions
- Mentions (@username)
- Reactions (like, helpful, etc)
- Comment moderation
- Report inappropriate content
- Follow/unfollow content

**API Endpoints:**
```
POST   /api/v1/comments/                    # Add comment
GET    /api/v1/comments/{content_type}/{id}/ # Get comments
PUT    /api/v1/comments/{id}/               # Edit comment
DELETE /api/v1/comments/{id}/               # Delete comment
POST   /api/v1/comments/{id}/react/         # React to comment
POST   /api/v1/comments/{id}/report/        # Report comment
```

**Database Schema:**
```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL,  -- article, document, wiki, course
    content_id INTEGER NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES comments(id),  -- for threaded comments
    comment_text TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT TRUE,
    is_flagged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_content (content_type, content_id)
);

CREATE TABLE comment_reactions (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20),  -- like, helpful, insightful
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, user_id, reaction_type)
);
```

---

## 🎓 Fitur-Fitur LMS

### 1. 📚 Course Management

**Deskripsi:** Sistem untuk manage course, module, dan lesson

**Entities:**
- **Course** - Course utama (title, description, category, instructor)
- **Module** - Bagian dari course (Chapter 1, Chapter 2, etc)
- **Lesson** - Content dalam module (video, document, quiz)

**Features:**
- Create/Edit/Delete course
- Organize modules & lessons
- Set prerequisites (course A harus selesai sebelum course B)
- Set quota enrollment
- Publish/unpublish course
- Course categories & tags

**API Endpoints:**
```
GET    /api/v1/courses/                    # List courses
POST   /api/v1/courses/                    # Create course
GET    /api/v1/courses/{id}/               # Course detail
PUT    /api/v1/courses/{id}/               # Update course
DELETE /api/v1/courses/{id}/               # Delete course
GET    /api/v1/courses/{id}/modules/       # Get modules
GET    /api/v1/courses/{id}/lessons/       # Get lessons
```

**Database Schema:**
```sql
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    instructor_id INTEGER REFERENCES users(id),
    duration_hours INTEGER,
    max_enrollment INTEGER,
    prerequisites JSONB,  -- [course_id1, course_id2]
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE modules (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content_type VARCHAR(50),  -- video, document, quiz, assignment
    content_url TEXT,
    duration_minutes INTEGER,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2. 👥 User Management

**Deskripsi:** Sistem untuk manage user (ASN, instructor, admin)

**User Roles:**
- **ASN (Learner)** - User yang mengikuti course
- **Instructor** - User yang membuat & mengajar course
- **Admin** - User yang manage system
- **Super Admin** - Full access

**Features:**
- User registration & profile
- Role assignment
- NIP (Nomor Induk Pegawai) integration
- User activity tracking
- User analytics

**API Endpoints:**
```
POST   /api/v1/auth/register               # Register user
POST   /api/v1/auth/login                  # Login
POST   /api/v1/auth/logout                 # Logout
GET    /api/v1/users/profile/              # Get profile
PUT    /api/v1/users/profile/              # Update profile
GET    /api/v1/users/{id}/courses/         # User's courses
GET    /api/v1/users/{id}/certificates/    # User's certificates
```

**Database Schema:**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    nip VARCHAR(18) UNIQUE,  -- NIP ASN
    password VARCHAR(128) NOT NULL,
    role VARCHAR(20) NOT NULL,  -- asn, instructor, admin
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(200),
    photo_url TEXT,
    bio TEXT,
    phone VARCHAR(20),
    organization VARCHAR(200),
    position VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 3. 📝 Enrollment & Progress Tracking

**Deskripsi:** Sistem untuk enroll user ke course dan track progress

**Features:**
- Enroll user ke course
- Check prerequisites
- Track lesson completion
- Calculate progress percentage
- Completion status
- Time tracking (time spent per lesson)

**API Endpoints:**
```
POST   /api/v1/enrollments/                # Enroll to course
GET    /api/v1/enrollments/my-courses/     # My enrolled courses
GET    /api/v1/enrollments/{id}/progress/  # Get progress
POST   /api/v1/progress/complete-lesson/   # Mark lesson complete
GET    /api/v1/progress/stats/             # Progress statistics
```

**Database Schema:**
```sql
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active',  -- active, completed, dropped
    progress INTEGER DEFAULT 0,  -- 0-100%
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE(user_id, course_id)
);

CREATE TABLE progress (
    id SERIAL PRIMARY KEY,
    enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE CASCADE,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    time_spent_minutes INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    UNIQUE(enrollment_id, lesson_id)
);
```

**Business Logic Example:**
```python
def enroll_user(user_id, course_id):
    """Enroll user to course with validation"""
    
    # 1. Check if course exists & active
    course = Course.objects.get(id=course_id, is_active=True)
    
    # 2. Check prerequisites
    if course.prerequisites:
        for prereq_id in course.prerequisites:
            if not Enrollment.objects.filter(
                user_id=user_id,
                course_id=prereq_id,
                status='completed'
            ).exists():
                raise ValidationError(f"Prerequisite course {prereq_id} not completed")
    
    # 3. Check enrollment quota
    current_enrollments = Enrollment.objects.filter(course_id=course_id).count()
    if current_enrollments >= course.max_enrollment:
        raise ValidationError("Course is full")
    
    # 4. Check if already enrolled
    if Enrollment.objects.filter(user_id=user_id, course_id=course_id).exists():
        raise ValidationError("Already enrolled")
    
    # 5. Create enrollment
    enrollment = Enrollment.objects.create(
        user_id=user_id,
        course_id=course_id,
        status='active'
    )
    
    # 6. Initialize progress for all lessons
    lessons = Lesson.objects.filter(module__course_id=course_id)
    Progress.objects.bulk_create([
        Progress(enrollment=enrollment, lesson=lesson)
        for lesson in lessons
    ])
    
    # 7. Send notification
    send_enrollment_notification(user_id, course_id)
    
    return enrollment
```

---

### 4. 📊 Assessment System

**Deskripsi:** Sistem untuk quiz, assignment, dan grading

**Features:**
- Multiple choice quiz
- Essay questions
- Assignment submission
- Automated grading (for multiple choice)
- Manual grading (for essay/assignment)
- Score calculation
- Passing grade validation

**API Endpoints:**
```
GET    /api/v1/quizzes/{id}/               # Get quiz
POST   /api/v1/quizzes/{id}/submit/        # Submit quiz
GET    /api/v1/quizzes/{id}/results/       # Get results
POST   /api/v1/assignments/{id}/submit/    # Submit assignment
GET    /api/v1/assignments/{id}/grade/     # Get grade
```

**Database Schema:**
```sql
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    passing_score INTEGER DEFAULT 70,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20),  -- multiple_choice, essay
    options JSONB,  -- [{"key": "A", "text": "Option A"}, ...]
    correct_answer TEXT,
    points INTEGER DEFAULT 1,
    order_index INTEGER NOT NULL
);

CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    answers JSONB,  -- {"question_id": "answer", ...}
    score INTEGER,
    max_score INTEGER,
    is_passed BOOLEAN,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP
);
```

---

### 5. 🎓 Certificate Management

**Deskripsi:** Sistem untuk generate dan verify certificate

**Features:**
- Auto-generate certificate when course completed
- PDF certificate with digital signature
- Certificate verification (QR code)
- Certificate download
- Certificate sharing

**API Endpoints:**
```
GET    /api/v1/certificates/my-certificates/    # My certificates
GET    /api/v1/certificates/{id}/               # Certificate detail
GET    /api/v1/certificates/{id}/download/      # Download PDF
GET    /api/v1/certificates/{id}/verify/        # Verify certificate
```

**Database Schema:**
```sql
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    certificate_url TEXT,  -- PDF URL
    verification_code VARCHAR(100) UNIQUE,
    is_valid BOOLEAN DEFAULT TRUE
);
```

**Certificate Generation:**
```python
def generate_certificate(user_id, course_id):
    """Generate PDF certificate"""
    
    # 1. Check if course completed
    enrollment = Enrollment.objects.get(
        user_id=user_id,
        course_id=course_id,
        status='completed'
    )
    
    # 2. Generate certificate number
    cert_number = f"ASNCORPU-{course_id}-{user_id}-{datetime.now().strftime('%Y%m%d')}"
    
    # 3. Generate verification code
    verification_code = hashlib.sha256(cert_number.encode()).hexdigest()[:20]
    
    # 4. Create certificate record
    certificate = Certificate.objects.create(
        user_id=user_id,
        course_id=course_id,
        certificate_number=cert_number,
        verification_code=verification_code
    )
    
    # 5. Generate PDF using ReportLab/WeasyPrint
    pdf_path = generate_certificate_pdf(certificate)
    
    # 6. Upload to storage (S3/MinIO)
    certificate_url = upload_to_storage(pdf_path)
    
    # 7. Update certificate URL
    certificate.certificate_url = certificate_url
    certificate.save()
    
    return certificate
```

---

### 6. 📈 Analytics & Reporting

**Deskripsi:** Sistem untuk analytics dan reporting

**Features:**
- Dashboard analytics (enrollment, completion, etc)
- Course performance metrics
- User learning analytics
- Export reports (PDF, Excel)
- Real-time statistics

**API Endpoints:**
```
GET    /api/v1/analytics/dashboard/         # Dashboard stats
GET    /api/v1/analytics/course/{id}/       # Course analytics
GET    /api/v1/analytics/user/{id}/         # User analytics
GET    /api/v1/analytics/export/            # Export report
```

**Analytics Metrics:**
- Total enrollments
- Completion rate
- Average score
- Time spent per course
- Popular courses
- User engagement
- Certificate issued

---

### 7. 📁 Content Management

**Deskripsi:** Sistem untuk manage course materials

**Features:**
- Upload videos (MP4, WebM)
- Upload documents (PDF, DOCX, PPTX)
- Upload images
- File size validation
- File type validation
- Streaming support for videos
- Download management

**API Endpoints:**
```
POST   /api/v1/content/upload/              # Upload file
GET    /api/v1/content/{id}/                # Get file
DELETE /api/v1/content/{id}/                # Delete file
GET    /api/v1/content/{id}/stream/         # Stream video
```

**Storage Options:**
- Local storage (development)
- AWS S3 (production)
- MinIO (self-hosted S3-compatible)

---

### 8. 🔔 Notification System

**Deskripsi:** Sistem untuk notifikasi user

**Features:**
- Email notifications
- Push notifications (optional)
- In-app notifications
- Notification preferences

**Notification Types:**
- Enrollment confirmation
- Course completion
- Certificate issued
- New course available
- Assignment deadline reminder
- Quiz result available

**API Endpoints:**
```
GET    /api/v1/notifications/               # Get notifications
PUT    /api/v1/notifications/{id}/read/     # Mark as read
POST   /api/v1/notifications/preferences/   # Update preferences
```

---

## 🗄️ Database Schema Overview

### LMS Tables:
```
users                 # User accounts
profiles              # User profiles
courses               # Courses
modules               # Course modules
lessons               # Lesson content
enrollments           # User enrollments
progress              # Lesson progress
quizzes               # Quizzes
questions             # Quiz questions
submissions           # Quiz submissions
certificates          # Certificates
notifications         # Notifications
user_activities       # Activity logs
```

### KMS Tables:
```
knowledge_articles    # Knowledge base articles
knowledge_categories  # Article categories
knowledge_tags        # Article tags
knowledge_ratings     # Article ratings
documents             # Document library
document_categories   # Document categories
document_downloads    # Download tracking
wiki_pages            # Wiki pages
wiki_revisions        # Wiki page history
wiki_page_links       # Wiki internal links
expert_profiles       # Expert directory
expert_skills         # Expert skills
expert_questions      # Q&A with experts
comments              # Comments & discussions
comment_reactions     # Comment reactions
```

### Relationships:
```
LMS:
users (1) ←→ (N) enrollments ←→ (N) courses
enrollments (1) ←→ (N) progress ←→ (N) lessons
courses (1) ←→ (N) modules ←→ (N) lessons
lessons (1) ←→ (N) quizzes ←→ (N) questions
users (1) ←→ (N) submissions ←→ (N) quizzes
users (1) ←→ (N) certificates ←→ (N) courses

KMS:
users (1) ←→ (N) knowledge_articles
knowledge_articles (N) ←→ (N) knowledge_tags
users (1) ←→ (N) documents
users (1) ←→ (N) wiki_pages ←→ (N) wiki_revisions
users (1) ←→ (1) expert_profiles ←→ (N) expert_skills
users (1) ←→ (N) comments
```

---

## 🚀 Development Roadmap

**PRIORITAS: KMS First, LMS Second**

**Filosofi:** 
- KMS sebagai foundation - Knowledge base, dokumen, wiki dibuat dulu
- ASN belajar dari KMS (informal learning)
- Berdasarkan materi di KMS, baru dibuat course formal di LMS
- LMS mengikuti dan mengstrukturkan materi yang sudah ada di KMS

---

### Phase 1: Foundation (Week 1-2) ✅
- ✅ Project setup
- ✅ Database design
- ✅ User authentication
- ✅ Basic API structure
- ✅ Admin panel

### Phase 2: Core KMS - Knowledge Base (Week 3-5) 🔥 PRIORITY
- 🔲 **Knowledge Base (Articles)**
  - Article model (title, content, category, tags)
  - Rich text editor support
  - Categories & tags system
  - Article CRUD API
  - Article rating & feedback
  - Featured articles
  - View counter

- 🔲 **Search & Discovery**
  - Full-text search (PostgreSQL)
  - Search across articles
  - Filters (category, date, author)
  - Search suggestions

**Output:** ASN bisa mulai baca & belajar dari articles

### Phase 3: KMS - Document Library (Week 6-7)
- 🔲 **Document Management**
  - Document upload (PDF, DOCX, XLSX, PPTX)
  - Document metadata & categorization
  - Version control
  - Access control (public, restricted, private)
  - Download tracking
  - Document approval workflow

**Output:** Kebijakan, SOP, Juknis tersedia & terorganisir

### Phase 4: KMS - Collaboration (Week 8-10)
- 🔲 **Wiki System**
  - Wiki pages (Markdown support)
  - Page history & revisions
  - Collaborative editing
  - Internal linking

- 🔲 **Comments & Discussions**
  - Comments on articles/documents/wiki
  - Threaded discussions
  - Reactions (like, helpful)
  - Mentions (@username)

- 🔲 **Expert Directory**
  - Expert profiles
  - Q&A system
  - Expert search

**Output:** Collaborative learning environment, ASN bisa diskusi & tanya expert

### Phase 5: KMS Analytics & Content Enrichment (Week 11-12)
- 🔲 **KMS Analytics**
  - Content views & engagement
  - Popular articles/documents
  - User contributions
  - Search analytics

- 🔲 **Content Enrichment**
  - Related content suggestions
  - Content recommendations
  - Bookmarks/favorites
  - Content sharing

**Output:** KMS sudah lengkap dengan banyak materi, siap dijadikan basis untuk LMS

---

### Phase 6: LMS - Course Structure (Week 13-15)
**Sekarang baru mulai LMS, berdasarkan materi KMS yang sudah ada**

- 🔲 **Course Management**
  - Course model (based on KMS content)
  - Module & lesson structure
  - Link lessons to KMS articles/documents
  - Course CRUD API

- 🔲 **Enrollment System**
  - Enrollment model
  - Progress tracking
  - Prerequisites validation

**Output:** Course formal yang terstruktur, menggunakan materi dari KMS

### Phase 7: LMS - Assessment (Week 16-17)
- 🔲 **Quiz & Assignment**
  - Quiz system (based on KMS content)
  - Questions & answers
  - Submission system
  - Grading (automated & manual)

**Output:** Assessment untuk mengukur pemahaman dari materi KMS

### Phase 8: LMS - Certification (Week 18-19)
- 🔲 **Certificate Generation**
  - Certificate model
  - PDF generation
  - Verification system
  - Digital signature

**Output:** Sertifikat untuk ASN yang menyelesaikan course

### Phase 9: Integration & Analytics (Week 20-22)
- 🔲 **LMS-KMS Integration**
  - Link course content to KMS
  - Seamless navigation
  - Unified search

- 🔲 **Unified Analytics**
  - Combined LMS + KMS dashboard
  - Learning path analytics
  - Impact measurement

- 🔲 **Notification System**
  - Email notifications
  - In-app notifications
  - Push notifications (future)

### Phase 10: Testing & Deployment (Week 23-24)
- 🔲 **Testing**
  - Unit testing
  - Integration testing
  - User acceptance testing
  - Performance testing

- 🔲 **Deployment**
  - Production deployment
  - User training
  - Documentation
  - Support setup

---

## 🎯 Success Metrics

### Technical Metrics:
- ✅ API response time < 200ms
- ✅ Database query optimization
- ✅ 99.9% uptime
- ✅ Support 10,000+ concurrent users
- ✅ Automated testing coverage > 80%

### Business Metrics:
- 📊 Course completion rate > 70%
- 📊 User engagement (daily active users)
- 📊 Certificate issued per month
- 📊 Average course rating > 4.0/5.0
- 📊 User satisfaction score

---

## 📚 Documentation References

### Setup & Configuration:
- [00_START_HERE.md](00_START_HERE.md) - Navigation guide
- [CATATAN_DARI_PROGRAMMER.md](CATATAN_DARI_PROGRAMMER.md) - Backend developer notes
- [docs/002_PROJECT_SETUP_SUMMARY.md](docs/002_PROJECT_SETUP_SUMMARY.md) - Setup summary

### Development Guides:
- [coding_implementation/01_API_CRUD_GUIDE.md](coding_implementation/01_API_CRUD_GUIDE.md) - API CRUD guide
- [coding_implementation/02_SEEDING_GUIDE.md](coding_implementation/02_SEEDING_GUIDE.md) - Database seeding guide
- [docs/012_BACKEND_FRONTEND_COMMUNICATION.md](docs/012_BACKEND_FRONTEND_COMMUNICATION.md) - API communication

### Database:
- [docs/006_DATABASE_POSTGRESQL_SETUP.md](docs/006_DATABASE_POSTGRESQL_SETUP.md) - PostgreSQL setup
- [docs/009_POSTGRESQL_QUICK_REFERENCE.md](docs/009_POSTGRESQL_QUICK_REFERENCE.md) - Quick reference

### Admin & Management:
- [docs/011_DJANGO_ADMIN_PANEL.md](docs/011_DJANGO_ADMIN_PANEL.md) - Admin panel guide

---

## ✅ Summary

**ASN Corporate University** adalah platform terintegrasi yang menggabungkan Learning Management System (LMS) dan Knowledge Management System (KMS) untuk pengembangan kompetensi ASN. Backend system ini dibangun dengan:

- ✅ **Django 5.2.7** - Rapid development framework
- ✅ **PostgreSQL 16** - Advanced database features (full-text search)
- ✅ **Redis 7.4** - Caching & session management
- ✅ **Django REST Framework** - API development
- ✅ **Docker** - Containerization

**LMS Key Features:**
- 📚 Course Management
- 👥 User Management
- 📝 Enrollment & Progress
- 📊 Assessment System
- 🎓 Certificate Management
- 📈 Analytics & Reporting
- 📁 Content Management
- 🔔 Notification System

**KMS Key Features:**
- 📖 Knowledge Base (Articles, FAQs)
- 📁 Document Library (Policies, Procedures)
- 📝 Wiki System (Collaborative)
- 🔍 Search & Discovery (Full-text)
- 👥 Expert Directory (SME Network)
- 💬 Collaboration (Comments, Discussions)
- ⭐ Content Rating & Feedback
- 📊 Version Control & History

**Ready to start development!** 🚀

---

**Last Updated:** April 24, 2026  
**Status:** Foundation Complete, Ready for LMS & KMS Development
