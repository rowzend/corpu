# Comprehensive Changes Summary (2026-06-12 to 2026-06-13)

## Overview
Dokumentasi lengkap semua perubahan yang dilakukan pada proyek ASNCORPU dalam sesi ini.

---

## 1. Route Cleanup: Hapus `/knowledge/categories` & `/knowledge/tags`

### Files Deleted:
```
frontend/app/(admin)/knowledge/categories/
├── [id]/page.tsx
├── create/page.tsx
└── page.tsx

frontend/app/(admin)/knowledge/tags/
├── [id]/page.tsx
├── create/page.tsx
└── page.tsx
```

### Files Modified:
- `frontend/app/(admin)/knowledge/page.tsx` — Hapus 2 button "Kategori" & "Tags" yang navigate ke route lama

### Reason:
Route lama digantikan oleh `/manajemen-data/kategori-learning` & `/manajemen-data/tags` (sudah ada di sidebar).

---

## 2. Category Stats: Course Count + Badge Swap

### Backend:
| File | Perubahan |
|------|-----------|
| `backend/apps/knowledge/models.py` | Tambah `get_course_count()` recursive (hitung Course published + children) |
| `backend/apps/knowledge/serializers.py` | Tambah field `course_count` di `CategorySerializer` |

### Frontend:
| File | Perubahan |
|------|-----------|
| `frontend/lib/api/knowledge.ts` | Tambah `course_count` di interface `Category` |
| `frontend/app/(admin)/manajemen-data/kategori-learning/page.tsx` | **Swap badge**: Biru (`PlayCircle`) = `course_count` (Kursus), Hijau (`BookOpen`) = `article_count` (Artikel Knowledge) |

---

## 3. Category Hierarchical Sorting di Courses Create/Edit

### Files Modified:
- `frontend/app/(admin)/learning/courses/create/page.tsx`
- `frontend/app/(admin)/learning/courses/[slug]/page.tsx` (edit)

### Perubahan:
- Tambah `sortCategoriesHierarchy()` & `buildCategoryPath()` (copy dari knowledge/create)
- `fetchCategories` pakai hierarchical sort + indent label `└────`

---

## 4. Knowledge Filter Enhancement

### File: `frontend/app/(admin)/knowledge/page.tsx`

| Fitur | Sebelum | Sesudah |
|-------|---------|---------|
| **Category filter** | Hardcoded array | Dinamis dari API `getCategories()` |
| **Category sorting** | Flat | **Hierarchical** pakai `sortCategoriesHierarchy()` |
| **Status filter** | 4 status | **6 status** lengkap matching model: draft, pending, approved, rejected, published, archived |
| **Component** | Native `<select>` | `RemoteSearchSelect` (searchable) |

---

## 5. Article Status Field di API List

### Backend:
- `backend/apps/knowledge/serializers.py` — `ArticleListSerializer` tambah field `status` (sebelumnya missing → filter status di frontend tidak jalan)

---

## 6. Slug Readonly + Info di Create & Edit

### Files Updated:

#### Knowledge
| File | Jenis | Perubahan |
|------|-------|-----------|
| `frontend/app/(admin)/knowledge/create/page.tsx` | Create | Field readonly slug placeholder `/knowledge/[auto-generated-from-title]` + info "Akan dibuat otomatis" |
| `frontend/app/(admin)/knowledge/[slug]/page.tsx` | Edit | Field readonly actual slug `/knowledge/{slug}` + badge "Tidak bisa diubah" + penjelasan SEO |

#### Learning Courses
| File | Jenis | Perubahan |
|------|-------|-----------|
| `frontend/app/(admin)/learning/courses/create/page.tsx` | Create | Field readonly slug placeholder `/courses/[auto-generated-from-title]` + info |
| `frontend/app/(admin)/learning/courses/[slug]/page.tsx` | Edit | Field readonly actual slug `/courses/{slug}` + badge "Tidak bisa diubah" + penjelasan SEO |

### UI Components:
- Icon `LinkIcon` (lucide-react) di prefix input
- Badge amber "Tidak bisa diubah" / "Akan dibuat otomatis"
- Icon `AlertCircle` + text: *"Slug dibuat otomatis. Tidak berubah meski judul diedit (untuk SEO & link sharing)."*
- Input `readOnly` + `bg-gray-50` + `cursor-not-allowed`

---

## 7. Quiz Randomization: Soal + Jawaban Acak

### Backend:
| File | Perubahan |
|------|-----------|
| `backend/apps/learning/serializers.py` | `QuizQuestionPublicSerializer.get_choices()` — cek `obj.quiz.is_randomized`, kalau true → `order_by('?')` |
| `backend/apps/learning/serializers.py` | `QuizQuestionSerializer.get_choices()` — admin view tetap `order_by('order_index')` |

### Model (Existing):
- `Quiz.is_randomized` (BooleanField, default=False)
- `get_questions_ordered()` — sudah pakai `order_by('?')` kalau randomized

### Behavior:
| Context | Soal | Jawaban (Choices) |
|---------|------|-------------------|
| **Admin (edit quiz)** | Urut `order_index` | Urut `order_index` |
| **Quiz taking (random)** | Acak | **Acak** |
| **Quiz taking (non-random)** | Urut `order_index` | Urut `order_index` |

### UI Warning:
- `learning/quizzes/create/page.tsx` & `learning/quizzes/[id]/edit/page.tsx` — Tambah peringatan: **"Pilihan jawaban juga akan diacak saat ujian."**

---

## 8. Quiz Retry Cooldown

### Backend:
| File | Perubahan |
|------|-----------|
| `backend/apps/learning/models.py` | Tambah field `retry_cooldown_minutes` (default 0, 1440 = 24 jam = jam yang sama besok) |
| `backend/apps/learning/models.py` | `can_user_attempt_detail()` return `(bool, message)` dengan detail cooldown |
| `backend/apps/learning/serializers.py` | `QuizDetailSerializer` & `QuizSerializer` include field baru |
| `backend/apps/learning/views_api.py` | `attempt` action pakai `can_user_attempt_detail()` |
| Migration: `learning.0015_quiz_retry_cooldown_minutes` | Applied |

### Frontend:
- `learning/quizzes/create/page.tsx` — Input field + help text
- `learning/quizzes/[id]/edit/page.tsx` — Input field + help text

### Logic:
- Cooldown hanya apply untuk attempt **GAGAL** (`passed=False`)
- `1440` menit = 24 jam = jam yang sama besok (dari `completed_at` timestamp)
- Response error include remaining time: "Cooldown aktif. Tunggu X jam Y menit lagi."

---

## 9. Certificate Only If Quiz Passed

### Backend:
| File | Perubahan |
|------|-----------|
| `backend/apps/learning/models.py` | `Enrollment.update_progress()` — cek semua quiz di course harus `passed=True` sebelum generate certificate |
| `backend/apps/learning/models.py` | `Enrollment.mark_completed()` — same logic |
| `backend/apps/learning/models.py` | `QuizAttempt.calculate_score()` — auto-call `enrollment.update_progress()` saat quiz lulus |

### Logic:
- Sertifikat generate hanya kalau **semua quiz di course sudah lulus** + progress 100%
- Tidak block lesson completion (user bisa selesaikan lesson tanpa lulus quiz)
- Progress 100% tapi quiz belum lulus → status `active`, `has_certificate = False`
- Auto-trigger saat quiz lulus (via `calculate_score()`)

---

## 10. API Endpoints Verification

### Articles API:
- `GET /apicorpu/1.0/knowledge/articles/` — now includes `status` field
- Filter status di frontend sekarang jalan (approved, rejected, dll)

### Quiz API:
- `POST /api/learning/quizzes/{pk}/attempt/` — returns cooldown error detail
- `GET /api/learning/quizzes/{pk}/` — includes `retry_cooldown_minutes`

---

## Migration & Deploy Commands

```bash
# Backend migrations
docker exec asncorpu_backend_app python manage.py makemigrations learning
docker exec asncorpu_backend_app python manage.py migrate learning
docker restart asncorpu_backend_app

# Frontend (dev mode - hot reload)
docker compose -f docker-compose.yml up -d

# Production
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Test Results

### Quiz Cooldown:
- ✅ `can_user_attempt_detail()` returns correct bool + message
- ✅ Cooldown hanya untuk failed attempts
- ✅ 1440 minutes = 24 jam = jam yang sama besok

### Certificate Validation:
| User | Progress | Quiz Passed | Status | Certificate |
|------|----------|-------------|--------|-------------|
| 199605202019031001 | 0% | False | active | False |
| 199411192019031001 | 100% | **False** | completed | True (legacy) |

> Note: User kedua sudah punya sertifikat karena dibuat sebelum logic ini. Enrollment baru akan ikut logic baru.

### Quiz Randomization:
- ✅ Soal acak kalau `is_randomized=true`
- ✅ Choices acak kalau `is_randomized=true` (multiple_choice, true_false)
- ✅ Admin view tetap terurut untuk visibility jawaban benar

---

## Files Modified Summary

### Backend (Django):
```
backend/apps/knowledge/
├── models.py           # get_course_count()
├── serializers.py      # course_count, ArticleListSerializer.status

backend/apps/learning/
├── models.py           # retry_cooldown_minutes, can_user_attempt_detail, 
│                        # Enrollment.update_progress(), mark_completed(),
│                        # QuizAttempt.calculate_score()
├── serializers.py      # QuizQuestionPublicSerializer choices randomization,
│                        # QuizDetailSerializer retry_cooldown_minutes
├── views_api.py        # attempt action with cooldown detail
└── migrations/
    └── 0015_quiz_retry_cooldown_minutes.py
```

### Frontend (Next.js):
```
frontend/app/(admin)/knowledge/
├── page.tsx                    # Filter category/status enhancement
├── create/page.tsx             # Slug info + quiz warning
├── [slug]/page.tsx             # Slug readonly + actual URL

frontend/app/(admin)/learning/courses/
├── create/page.tsx             # Hierarchical category + slug info
├── [slug]/page.tsx             # Hierarchical category + slug readonly

frontend/app/(admin)/manajemen-data/kategori-learning/
└── page.tsx                    # Badge swap: Biru=Kursus, Hijau=Artikel

frontend/app/(admin)/learning/quizzes/
├── create/page.tsx             # retry_cooldown_minutes input + warning
├── [id]/edit/page.tsx          # retry_cooldown_minutes input + warning

frontend/lib/api/knowledge.ts   # Category interface + course_count
```

### Deleted:
```
frontend/app/(admin)/knowledge/categories/
frontend/app/(admin)/knowledge/tags/
```

---

## Related MD Files

| File | Description |
|------|-------------|
| `10-route-cleanup-and-category-fixes.md` | Route cleanup + category course_count + hierarchical sort |
| `20-category-dropdown-hierarchy-course-create-edit.md` | Category dropdown hierarchy di courses |
| `35-kms-filter-category-fix.md` | Knowledge filter category fix |
| `23-article-status-management-complete.md` | Article status management |
| `42-quiz-randomization-and-slug-fixes.md` | Quiz randomization + slug fixes |
| `43-todo-quiz-cooldown-certificate.md` | TODO list untuk cooldown & certificate |
| `44-comprehensive-changes-summary.md` | **This file** |

---

## Next Steps / Future Improvements

1. **Frontend quiz take page** — tampilkan cooldown countdown timer
2. **Certificate page** — tampilkan status "Menunggu quiz lulus" jika progress 100% tapi quiz belum lulus
3. **Quiz analytics** — track attempt history dengan cooldown info
4. **Bulk quiz settings** — set cooldown/default untuk multiple quiz sekaligus