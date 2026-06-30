# Learning Management System - TODO List

> **Tanggal**: 25 Mei 2026 - 15:47 WIB
> **Status**: 🚧 In Progress
> **Prioritas**: High

---

## 📋 STATUS SAAT INI

### ✅ Backend (Sudah Lengkap)
- ✅ Learning app di-restore dari backup
- ✅ Database migrations selesai
- ✅ Permissions dan menus di-seed
- ✅ Super Admin memiliki akses learning features
- ✅ Models lengkap (Course, Module, Lesson, Quiz, Enrollment, dll)

### ✅ Frontend (Basic UI)
- ✅ Halaman Learning Management (/learning)
- ✅ Halaman Courses List (/learning/courses)
- ✅ Halaman Create Course (/learning/courses/create)
- ✅ Halaman Enrollments (/learning/enrollments)
- ✅ Halaman My Learning (/learning/my-learning)
- ✅ Learning menu di sidebar

### ❌ Frontend (Belum Lengkap)
- ❌ Course CRUD dengan form lengkap
- ❌ Module management
- ❌ Lesson management dengan berbagai tipe konten
- ❌ Quiz system dengan soal dan jawaban
- ❌ Enrollment system
- ❌ Progress tracking
- ❌ Certificate generation

---

## 🎯 BACKEND YANG SUDAH TERSEDEDIA

### Models
- **Course**: Course dengan title, description, level, duration, status, instructor, stats
- **Module**: Modul dalam course dengan urutan
- **Lesson**: Materi dengan tipe (article, video, document, link, quiz)
- **Enrollment**: Pendaftaran user ke course dengan progress tracking
- **LessonProgress**: Progress per materi
- **Quiz**: Kuis dengan passing score, max attempts, randomization
- **QuizQuestion**: Soal dengan tipe (multiple choice, true/false, essay)
- **QuizChoice**: Pilihan jawaban untuk soal
- **QuizAttempt**: Percobaan kuis dengan score dan status
- **QuizAnswer**: Jawaban user untuk setiap soal
- **Certificate**: Sertifikat setelah selesai
- **CourseRating**: Rating course
- **CourseComment**: Komentar course dengan reply system
- **CourseCommentLike**: Like/dislike komentar
- **CourseLike**: Like/dislike course

### API Endpoints
- ✅ Course CRUD API
- ✅ Module CRUD API
- ✅ Lesson CRUD API
- ✅ Quiz CRUD API
- ✅ QuizQuestion CRUD API
- ✅ QuizChoice CRUD API
- ✅ Enrollment API
- ✅ Progress API
- ✅ Certificate API

---

## 🔨 FRONTEND YANG PERLU DIBUAT

### Tahap 1 - Course Management (Prioritas)
- [ ] **Course List dengan Filter & Search**
  - Filter by status (draft, published, archived)
  - Filter by level (beginner, intermediate, advanced)
  - Search by title/description
  - Pagination
  - Sort by created_at, updated_at, enrolled_count, rating

- [ ] **Course Detail Page**
  - Tampilkan informasi course lengkap
  - Tampilkan modules dan lessons
  - Tampilkan stats (enrolled_count, lesson_count, rating)
  - Tampilkan instructor info
  - Action buttons (edit, delete, publish, archive)

- [ ] **Course Create Form**
  - Title, slug (auto-generate)
  - Description, short description
  - Thumbnail upload
  - Level selection (beginner, intermediate, advanced)
  - Duration (hours)
  - Status (draft, published, archived)
  - Instructor selection
  - Featured checkbox

- [ ] **Course Edit Form**
  - Same as create form
  - Pre-fill with existing data
  - Update functionality

- [ ] **Course Delete**
  - Confirmation dialog
  - Soft delete atau hard delete
  - Update related data (enrollments, modules, lessons)

### Tahap 2 - Module Management
- [ ] **Module List per Course**
  - Tampilkan modules dalam course
  - Drag & drop untuk reorder
  - Add new module button
  - Edit/delete module buttons

- [ ] **Module Create/Edit Form**
  - Title
  - Description
  - Order index (auto-increment)

- [ ] **Module Delete**
  - Confirmation dialog
  - Delete related lessons

### Tahap 3 - Lesson Management
- [ ] **Lesson List per Module**
  - Tampilkan lessons dalam module
  - Drag & drop untuk reorder
  - Add new lesson button
  - Edit/delete lesson buttons

- [ ] **Lesson Create/Edit Form**
  - Title, slug (auto-generate)
  - Content (textarea rich text editor)
  - Content type selection (article, video, document, link, quiz)
  - Video URL / Video Embed ID
  - File upload / File URL
  - External URL
  - Duration (minutes)
  - Order index (auto-increment)
  - Free preview checkbox

- [ ] **Lesson Delete**
  - Confirmation dialog
  - Delete related quiz (jika ada)

### Tahap 4 - Quiz System (Soal & Jawaban)
- [ ] **Quiz Create/Edit Form**
  - Title
  - Description
  - Passing score percentage (default 70%)
  - Max attempts (default 3)
  - Randomize questions checkbox

- [ ] **QuizQuestion List per Quiz**
  - Tampilkan questions dalam quiz
  - Drag & drop untuk reorder
  - Add new question button
  - Edit/delete question buttons

- [ ] **QuizQuestion Create/Edit Form**
  - Question text
  - Question type (multiple choice, true/false, essay)
  - Points (default 1)
  - Order index (auto-increment)

- [ ] **QuizChoice Management**
  - Untuk multiple choice dan true/false
  - Choice text
  - Is correct checkbox
  - Order index (auto-increment)
  - Minimum 2 choices untuk multiple choice
  - Minimum 2 choices untuk true/false

- [ ] **Quiz Taking Interface (User)**
  - Tampilkan questions satu per satu atau semua sekaligus
  - Timer (opsional)
  - Save draft answers
  - Submit quiz
  - Auto-grading untuk multiple choice dan true/false
  - Manual grading untuk essay

- [ ] **Quiz Result Page**
  - Tampilkan score
  - Tampilkan correct/incorrect answers
  - Tampilkan passing status
  - Tampilkan attempt history
  - Retry button (jika masih ada attempts)

### Tahap 5 - Enrollment System
- [ ] **Course Enrollment (User)**
  - Enroll button di course detail
  - Enrollment confirmation
  - Update enrolled_count di course

- [ ] **Enrollment List (Admin)**
  - Tampilkan semua enrollments
  - Filter by course, user, status
  - Search functionality
  - Pagination

- [ ] **Enrollment Detail**
  - Tampilkan enrollment info
  - Tampilkan progress
  - Tampilkan lesson progress
  - Tampilkan quiz attempts
  - Action buttons (complete, drop, delete)

### Tahap 6 - Progress Tracking
- [ ] **Lesson Progress Tracking**
  - Mark lesson as completed
  - Update progress percentage
  - Update enrollment status jika 100%

- [ ] **Progress Dashboard (User)**
  - Tampilkan enrolled courses
  - Tampilkan progress per course
  - Tampilkan completed courses
  - Tampilkan certificates

- [ ] **Progress Analytics (Admin)**
  - Tampilkan enrollment stats
  - Tampilkan completion rates
  - Tampilkan quiz performance
  - Charts dan graphs

### Tahap 7 - Certificate System
- [ ] **Certificate Generation**
  - Auto-generate setelah course completion
  - Certificate number (auto-generate)
  - Download certificate (PDF)
  - Print certificate

- [ ] **Certificate List**
  - Tampilkan semua certificates
  - Filter by user, course
  - Search functionality

### Tahap 8 - Rating & Comment System
- [ ] **Course Rating**
  - Rating form (1-5 stars)
  - Feedback text
  - Update rating_avg di course

- [ ] **Course Comment**
  - Comment form
  - Reply system
  - Like/dislike comments
  - Edit/delete comments

---

## 📅 PRIORITAS PENGEMBANGAN

### High Priority (Segera)
1. **Course Management (Tahap 1)**
   - Foundation untuk semua fitur lain
   - CRUD Course dengan form lengkap
   - Course detail dengan modules dan lessons

2. **Quiz System (Tahap 4)**
   - Fitur yang paling penting untuk soal dan jawaban
   - Quiz CRUD dengan soal dan jawaban
   - Quiz taking interface

### Medium Priority (Setelah High Priority)
3. **Module Management (Tahap 2)**
   - Diperlukan untuk lesson management
   - CRUD Module dengan reorder

4. **Lesson Management (Tahap 3)**
   - Diperlukan untuk quiz system
   - CRUD Lesson dengan berbagai tipe konten

### Low Priority (Opsional)
5. **Enrollment System (Tahap 5)**
6. **Progress Tracking (Tahap 6)**
7. **Certificate System (Tahap 7)**
8. **Rating & Comment System (Tahap 8)**

---

## 🚀 LANGKAH SELANJUTNYA

### Immediate (Hari Ini)
1. ✅ Buat file MD TODO ini
2. ⏳ Mulai Tahap 1 - Course Management
   - Course List dengan Filter & Search
   - Course Detail Page
   - Course Create Form
   - Course Edit Form
   - Course Delete

### Short Term (Minggu Ini)
3. Tahap 4 - Quiz System
   - Quiz CRUD
   - QuizQuestion CRUD
   - QuizChoice CRUD
   - Quiz Taking Interface

### Medium Term (Bulan Ini)
4. Tahap 2 - Module Management
5. Tahap 3 - Lesson Management
6. Tahap 5 - Enrollment System

### Long Term (Bulan Depan)
7. Tahap 6 - Progress Tracking
8. Tahap 7 - Certificate System
9. Tahap 8 - Rating & Comment System

---

## 📝 CATATAN

- Backend sudah lengkap dengan semua models dan API endpoints
- Frontend perlu dibuat untuk mengakses backend API
- Gunakan shadcn/ui components untuk UI yang konsisten
- Gunakan API helper yang sudah ada di `lib/api/`
- Pastikan permission check untuk setiap fitur
- Test setiap fitur sebelum lanjut ke tahap berikutnya

---

**Last Updated**: 25 Mei 2026 - 15:47 WIB
**Updated By**: Cascade AI Assistant
