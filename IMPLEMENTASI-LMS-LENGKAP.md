# ASNCORPU LMS — Ringkasan Pengembangan Lengkap

## 1. Scoring Quiz — Objective Only
- **File:** `backend/apps/learning/views_api.py:calculate_score()`
- **Logic:** `non_essay = answers.exclude(question__question_type='essay')` — essay di-skip dari total_questions, correct_answers, total_points
- **`attempt` action:** `max_score` exclude essay → auto-mark LessonProgress → update_progress enrollment
- **Time limit:** `Quiz.time_limit_minutes` (0=tak terbatas). Server-side check: jika `time_spent > limit`, tolak submission

## 2. One-Shot Quiz (No Retry)
- Hasil langsung tampil setelah submit
- Tidak ada tombol "Coba Lagi" — hanya "Kembali Belajar"
- Sidebar learn page: score badge (contoh: `70%` hijau/merah)
- Learn page: completed quiz → result card + "Lihat Hasil Kuis"

## 3. Lesson-Type Quiz di Admin
- Course edit admin: dropdown `content_type` include "Kuis"
- Tombol Quiz: jika `lesson.quiz_id` ada → "Edit Quiz" → `/learning/quizzes/{id}/edit`, jika belum → "Buat Quiz" → `/learning/quizzes/create?course_slug=&lesson_id=&module_id=`
- `LessonListSerializer` punya `quiz_id` (SerializerMethodField) dari `obj.quizzes.first().id`
- Quiz create: 3-level selector (Kursus → Modul → Pelajaran) + auto-select dari query params, cascading load synchronous

## 4. Essay Grading
- `QuizAnswer`: field `is_graded`, `grader_notes`, `graded_at`
- API: `GET /quizzes/{id}/essay_answers/`, `POST /quizzes/{id}/grade_essay/`
- Halaman admin: `/learning/quizzes/[id]/essays/` — filter Perlu Dinilai / Sudah Dinilai
- Notifikasi auto-buat saat essay digrading

## 5. Sertifikat Auto-Issue
- **File:** `backend/apps/learning/models.py:Enrollment.update_progress()`
- **Trigger:** saat progress = 100% → `Certificate.objects.get_or_create(enrollment=self, ...)`
- **generate_number():** pake format dari `Course.cert_number_format` > `CertificateSetting.cert_number_format` > default `{PREFIX}-{DATE}-{RANDOM}`
- Variable: `{PREFIX}`, `{DATE}` (YYYYMMDD), `{RANDOM}` (6 hex), `{YEAR}`, `{MONTH}`, `{DAY}`, `{COURSE_ID}`, `{USER_ID}`

## 6. PDF Certificate — ReportLab + WeasyPrint
- `download` action di `CertificateViewSet`
- **Default layout:** ReportLab (border, institution, nama, judul, ttd, logo)
- **HTML Template:** upload `.html` per course → render via **WeasyPrint**
  - Variable: `{{ institution_name }}`, `{{ user_name }}`, `{{ course_title }}`, `{{ certificate_number }}`, `{{ issued_at }}`, `{{ logo }}` (base64), `{{ signature_image }}` (base64), `{{ signature_name }}`, `{{ signature_title }}`, `{{ course_hours }}`, `{{ show_course_hours }}`
  - Jika tidak ada template → fallback ke ReportLab

## 7. Certificate Setting (Global) + Per-Course Override
| Setting | Global | Per-Course Override | Priority |
|---------|--------|---------------------|----------|
| `institution_name` | ✅ | `cert_institution_name` | Course > Global |
| `logo` | ✅ (image) | `cert_logo` (image) | Course > Global |
| `signature_name` | ✅ | `cert_signature_name` | Course > Global |
| `signature_title` | ✅ | `cert_signature_title` | Course > Global |
| `signature_image` | ✅ (image) | `cert_signature_image` (image) | Course > Global |
| `background` | ✅ (image) | `certificate_background` (image) | Course > Global |
| `template HTML` | ❌ | `certificate_template` (file) | Course only |
| `show_course_hours` | ✅ (checkbox) | `cert_show_course_hours` (null=global) | Course > Global |
| `number_prefix` | ✅ | `cert_number_prefix` | Course > Global |
| `number_format` | ✅ | `cert_number_format` | Course > Global |
| `tte_enabled` | ✅ | `cert_tte_enabled` | Course > Global |

Helper `_cert_vals()` di `views_api.py` — logic override: course value > global default

## 8. TTE (Tanda Tangan Elektronik) — Global + Per-Course
- **Lib:** `cryptography` + `pyHanko`
- **Generate global:** `POST /learning/certificate-settings/` — action `generate_tte`
- **Generate per-course:** `POST /learning/certificate-settings/` — action `generate_course_tte`
  - RSA 2048 key pair
  - Self-signed X.509 certificate (5 tahun)
  - Private key dienkripsi dengan passphrase (PKCS8)
- **Sign:** `_sign_pdf_tte()` — pake course TTE jika ada, fallback ke global
- Prioritas: **Course TTE > Global TTE**

## 9. Notifikasi
- Model `core.models.Notification`
- API: `GET/POST /apicorpu/1.0/notifications/`
- Auto-buat saat: course completed, essay graded
- `NotificationBell` component (polling 30 detik) di Navbar + AdminHeader

## 10. Sertifikat Management — Routes
| Route | Fungsi |
|-------|--------|
| `/learning/certificates/user` | List sertifikat user (group by user, search, download PDF) |
| `/learning/certificates/template` | **All-in-one:** 4 tab — Pengaturan, Template, TTE, Kelola |

### Tab di Template Page
| Tab | Isi |
|-----|-----|
| **Pengaturan** | Logo, background, ttd upload + nama institusi + penandatangan + format nomor sertifikat |
| **Template** | Upload template HTML & background per course (expand/collapse), atur semua override |
| **TTE** | Generate self-signed certificate global + passphrase |
| **Kelola** | Aktif/nonaktif, hapus, filter sertifikat, download PDF |

### Sidebar
```
👤 Sertifikat User  → /learning/certificates/user
🏆 Template Sertifikat → /learning/certificates/template
```

- `Certificate.is_active` — toggle aktif/nonaktif
- `CertificateViewSet` — ModelViewSet (create, update, delete, toggle_active)
- `PERMISSIONS_SUPERADMIN_OVERRIDE = True` — Super Admin bypass semua permission

## 11. Timer Quiz
- `Quiz.time_limit_minutes` — 0 = tanpa batas, >0 = batas waktu (menit)
- `QuizAttempt.time_spent` — waktu pengerjaan (detik)
- **Server-side check:** jika `time_spent > limit * 60` → tolak submission
- **`has_active_timed_quiz()`:** cek apakah user punya attempt timed yang belum selesai → blokir akses lesson lain
- **UI QuizTaker:** countdown ⏱ `MM:SS` di header soal, merah berkedip ≤60 detik, auto-submit saat habis
- **Quiz create/edit:** input "Batas Waktu (menit)" di form

## 12. Seeder
- 8 courses, masing-masing 3 module (3-5 lesson: article/video/link/document/quiz)
- Quiz dengan multiple_choice, true_false, essay questions
- Semua quiz punya `time_limit_minutes` (10-20 menit) — sudah diupdate
- `--clear` flag: hapus semua data learning diurutkan FK
- Idempoten: pake `update_or_create`

## 13. Teknis
- **Backend:** Django 5.2.7 + DRF 3.16.1 + PostgreSQL + Redis
- **Frontend:** Next.js 16.2.4 Turbopack → production standalone (`node server.js`)
- **Container:** Docker Compose `asncorpu` project (nginx port 3000, frontend internal 3004)
- **Custom User Model:** tanpa `is_staff`/`is_superuser` — auth via `check_permission()` atau `is_superadmin()`
- **Build:** `npm run build` sukses jika `NODE_ENV=development` dihapus dari `.env.local` & docker-compose
- **Cache:** `rm -rf /app/.next/cache` jika route baru tidak terdeteksi
- **Toggle active quiz:** Lesson `has_active_timed_quiz()` memblokir lesson lain jika ada quiz timed aktif

## 14. Dependencies Baru
```
weasyprint==69.0
cryptography==48.0.0
pyHanko==0.35.1
```

## 15. Migrations (11 files)
```
0001_initial.py through 0012_quiz_time_limit_minutes_quizattempt_time_spent.py
```

## File Penting
```
backend/apps/learning/models.py              — Course, Quiz, QuizAttempt, Certificate, CertificateSetting
backend/apps/learning/views_api.py           — download, _cert_vals, _render_html_certificate, _render_reportlab_certificate, _sign_pdf_tte, _generate_course_tte
backend/apps/learning/serializers.py         — LessonListSerializer (quiz_id), CertificateSerializer, CertificateSettingSerializer
backend/apps/learning/permissions.py         — LearningPermission
backend/apps/learning/management/commands/seed_learning_courses.py
frontend/app/(admin)/learning/certificates/user/page.tsx
frontend/app/(admin)/learning/certificates/template/page.tsx
frontend/app/(admin)/learning/courses/[slug]/page.tsx    — quiz button (edit/create logic)
frontend/app/(admin)/learning/quizzes/create/page.tsx    — time_limit field
frontend/app/(main)/courses/[slug]/lessons/[lessonId]/quiz/page.tsx  — timer pass-through
frontend/components/learning/QuizTaker.tsx               — timer display + auto-submit
frontend/components/admin/AdminSidebar.tsx               — sidebar
frontend/lib/api/learning.ts                             — certificate & quiz API
```

## Cara Restart
```bash
docker compose restart asncorpu_backend         # Backend restart
docker compose restart asncorpu-frontend        # Frontend restart
docker compose up -d --build asncorpu-frontend  # Build ulang + restart
docker compose up -d --build asncorpu_backend   # Build ulang backend
```

## Seeder
```bash
docker compose exec asncorpu_backend python manage.py seed_learning_courses
docker compose exec asncorpu_backend python manage.py seed_learning_courses --clear  # Reset + seed
```
