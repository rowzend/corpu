# Quiz Randomization & Slug Fixes (2026-06-12)

## Ringkasan Perubahan

### 1. Quiz Randomization (Soal + Jawaban Acak)

**Backend (`backend/apps/learning/`):**

| File | Perubahan |
|------|-----------|
| `serializers.py` | `QuizQuestionPublicSerializer.get_choices()` — cek `obj.quiz.is_randomized`, kalau true → `order_by('?')` |
| `serializers.py` | `QuizQuestionSerializer.get_choices()` — admin view tetap `order_by('order_index')` (biar lihat jawaban benar) |

**Model (existing):**
- `Quiz.is_randomized` (BooleanField, default=False) — sudah ada
- `get_questions_ordered()` — sudah pakai `order_by('?')` kalau randomized

**Behavior:**
| Context | Soal | Jawaban (Choices) |
|---------|------|-------------------|
| **Admin (edit quiz)** | Urut `order_index` | Urut `order_index` ✅ |
| **Quiz taking (start)** | Acak kalau `is_randomized=true` | **Acak kalau `is_randomized=true`** ✅ |
| **Quiz taking (non-random)** | Urut `order_index` | Urut `order_index` |

**UI Note:** Di form create/edit quiz, checkbox "Acak Pertanyaan" sekarang berlaku untuk **soal DAN jawaban**. Pertimbangkan tambah label info: "Akan mengacak urutan soal DAN pilihan jawaban".

---

### 2. Slug Readonly + Info di Create & Edit

**Files Updated:**

#### Knowledge
| File | Jenis | Perubahan |
|------|-------|-----------|
| `frontend/app/(admin)/knowledge/create/page.tsx` | Create | Tambah field readonly slug dengan placeholder `/knowledge/[auto-generated-from-title]` + info "Slug dibuat otomatis saat submit. Tidak bisa diubah setelah publish." |
| `frontend/app/(admin)/knowledge/[slug]/page.tsx` | Edit | Tambah field readonly menampilkan actual slug `/knowledge/{slug}` + badge "Tidak bisa diubah" + penjelasan SEO |

#### Learning Courses
| File | Jenis | Perubahan |
|------|-------|-----------|
| `frontend/app/(admin)/learning/courses/create/page.tsx` | Create | Tambah field readonly slug dengan placeholder `/courses/[auto-generated-from-title]` + info |
| `frontend/app/(admin)/learning/courses/[slug]/page.tsx` | Edit | Tambah field readonly menampilkan actual slug `/courses/{slug}` + badge "Tidak bisa diubah" + penjelasan SEO |

**Komponen UI:**
- Icon `LinkIcon` (lucide-react) di prefix input
- Badge amber "Tidak bisa diubah" / "Akan dibuat otomatis"
- Icon `AlertCircle` + text penjelasan: *"Slug dibuat otomatis. Tidak berubah meski judul diedit (untuk SEO & link sharing)."*
- Input `readOnly` + `bg-gray-50` + `cursor-not-allowed`

---

### 3. Knowledge Filter Category & Status Enhancement

**File:** `frontend/app/(admin)/knowledge/page.tsx`

| Fitur | Sebelum | Sesudah |
|-------|---------|---------|
| **Category filter** | Hardcoded array `['all', 'Tutorial', ...]` | Dinamis dari API `getCategories()` |
| **Category sorting** | Flat | **Hierarchical** (mirip `/knowledge/create`) pakai `sortCategoriesHierarchy()` + indent `└────` |
| **Status filter** | `draft, pending, published, archived` | **Lengkap** matching model: `draft, pending, approved, rejected, published, archived` |
| **Component** | Native `<select>` | `RemoteSearchSelect` (searchable) |

---

### 4. Category Stats: Course Count + Badge Swap

**Backend:**
| File | Perubahan |
|------|-----------|
| `backend/apps/knowledge/models.py` | Tambah `get_course_count()` recursive (hitung Course published + children) |
| `backend/apps/knowledge/serializers.py` | Tambah field `course_count` di `CategorySerializer` |

**Frontend:**
| File | Perubahan |
|------|-----------|
| `frontend/lib/api/knowledge.ts` | Tambah `course_count` di interface `Category` |
| `frontend/app/(admin)/manajemen-data/kategori-learning/page.tsx` | **Swap badge**: Biru (`PlayCircle`) = `course_count`, Hijau (`BookOpen`) = `article_count` |

---

### 5. Category Hierarchical Sorting di Courses Create/Edit

**Files:**
- `frontend/app/(admin)/learning/courses/create/page.tsx`
- `frontend/app/(admin)/learning/courses/[slug]/page.tsx`

**Perubahan:**
- Tambah `sortCategoriesHierarchy()` & `buildCategoryPath()` (copy dari knowledge/create)
- `fetchCategories` pakai hierarchical sort + indent label

---

### 6. Route Cleanup: Hapus `/knowledge/categories` & `/knowledge/tags`

**Dihapus:**
```
frontend/app/(admin)/knowledge/categories/
frontend/app/(admin)/knowledge/tags/
```

**Diubah:**
- `frontend/app/(admin)/knowledge/page.tsx` — hapus 2 button "Kategori" & "Tags"

**Alasan:** Sudah digantikan `/manajemen-data/kategori-learning` & `/manajemen-data/tags` di sidebar.

---

### 7. Article Status Field di API List

**Backend:** `backend/apps/knowledge/serializers.py`
- `ArticleListSerializer` tambah field `status` (sebelumnya missing → filter status di frontend tidak jalan)

---

## Verifikasi & Test

```bash
# 1. Backend restart (required for serializer/model changes)
docker restart asncorpu_backend_app

# 2. Cek quiz randomization
# - Buat quiz, centang "Acak Pertanyaan"
# - Start quiz → soal DAN pilihan jawaban keduanya random

# 3. Cek slug readonly
# - /knowledge/create → lihat field slug "Akan dibuat otomatis"
# - /knowledge/{slug} (edit) → lihat field slug readonly dengan actual URL
# - /learning/courses/create & edit → same

# 4. Cek knowledge filter
# - /knowledge → category filter hierarchical + status lengkap (approved, rejected dll)

# 5. Cek category stats
# - /manajemen-data/kategori-learning → badge Biru = Kursus, Hijau = Artikel

# 6. Cek courses create/edit category dropdown
# - Hierarchical dengan indent seperti knowledge/create
```

---

## Catatan Deploy

1. **Backend changes** → `docker restart asncorpu_backend_app` (serializer, model)
2. **Frontend changes** → Hot reload aktif kalau pakai `docker-compose.yml` (dev mode)
3. **Production** → Rebuild: `docker compose -f docker-compose.prod.yml up -d --build`

---

## File MD Terkait

| File | Deskripsi |
|------|-----------|
| `10-route-cleanup-and-category-fixes.md` | Route cleanup + category course_count + hierarchical sort |
| `20-category-dropdown-hierarchy-course-create-edit.md` | Category dropdown hierarchy di courses |
| `35-kms-filter-category-fix.md` | Knowledge filter category fix |
| `23-article-status-management-complete.md` | Article status management |