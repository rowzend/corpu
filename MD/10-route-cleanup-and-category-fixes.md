# Route Cleanup & Category Fixes (2026-06-12)

## Ringkasan Perubahan

### 1. Hapus Route Knowledge Categories & Tags (Frontend)

**File dihapus:**
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

**File diubah:**
- `frontend/app/(admin)/knowledge/page.tsx` — hapus 2 button "Kategori" & "Tags" yang router.push ke `/knowledge/categories` & `/knowledge/tags`

**Alasan:** Route lama digantikan oleh `/manajemen-data/kategori-learning` & `/manajemen-data/tags` (sidebar sudah pakai ini).

---

### 2. Fix Course Count di Kategori Learning

**Backend (`backend/apps/knowledge/`):**

| File | Perubahan |
|------|-----------|
| `models.py` | Tambah `get_course_count()` recursive (hitung Course status published + children) |
| `serializers.py` | Tambah field `course_count` di `CategorySerializer` |

**Frontend:**
- `frontend/lib/api/knowledge.ts` — tambah `course_count` di interface `Category`
- `frontend/app/(admin)/manajemen-data/kategori-learning/page.tsx` — **swap badge**:
  - **Biru** (`PlayCircle`) = `course_count` (Jumlah Kursus)
  - **Hijau** (`BookOpen`) = `article_count` (Jumlah Artikel Knowledge)

**Note:** Butuh `docker restart asncorpu_backend_app` setelah deploy backend.

---

### 3. Fix Sorting Kategori di Courses Create & Edit

**File diubah:**
- `frontend/app/(admin)/learning/courses/create/page.tsx`
- `frontend/app/(admin)/learning/courses/[slug]/page.tsx` (edit)

**Perubahan:**
- Tambah helper `sortCategoriesHierarchy()` — recursive sort by `order_index` + `name`
- Tambah helper `buildCategoryPath()` — build full path `Parent > Child`
- `fetchCategories` pakai `sortCategoriesHierarchy(active)` (bukan flat sort)

**Hasil:** Dropdown kategori sekarang **hierarchical dengan indent** (`└────`) mirip `/knowledge/create`.

---

## API Reference

### Category Response (Updated)
```json
{
  "id": 1,
  "name": "Tutorial",
  "slug": "tutorial",
  "description": "Panduan langkah-langkah",
  "parent": null,
  "order_index": 0,
  "is_active": true,
  "article_count": 5,
  "course_count": 3,        // ← BARU
  "full_path": "Tutorial",
  "created_at": "2026-06-10T10:00:00Z",
  "updated_at": "2026-06-10T10:00:00Z"
}
```

### Category Model Methods (Updated)
- `get_article_count()` — recursive, filter `status='published'`
- `get_course_count()` — **BARU**, recursive, filter `status='published'`

---

## Verifikasi

```bash
# Backend - cek course_count
docker exec asncorpu_backend_app python manage.py shell -c "
from apps.knowledge.models import Category
for c in Category.objects.filter(id__in=[3,6,7,8]):
    print(f'{c.name}: course_count={c.get_course_count()}')
"

# Expected:
# KOMPETENSI UMUM: course_count=1
# ASN Maju: course_count=1
# KOMPETENSI TEKNIS: course_count=1
# Pemerintahan dan Kesejahteraan: course_count=1
```

---

## Catatan Deploy

1. **Backend changes** → restart container: `docker restart asncorpu_backend_app`
2. **Frontend changes** → hot reload aktif kalau pakai `docker-compose.yml` (dev mode)
3. **Production** → rebuild image: `docker compose -f docker-compose.prod.yml up -d --build`