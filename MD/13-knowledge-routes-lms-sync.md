# 13. Route Migration Knowledge → Manajemen Data & LMS → KMS Sync

## Tanggal: 2026-06-11

## Ringkasan Task
1. **Route migration**: `/knowledge/categories` → redirect ke `/manajemen-data/kategori-learning`, `/knowledge/tags` → redirect ke `/manajemen-data/tags`
2. **Hapus form lama**: `create/` dan `[id]/` di knowledge/categories & knowledge/tags (pindah ke manajemen-data)
3. **RemoteSearchSelect** di knowledge create & edit — category selector pake tree hierarchy
4. **LMS → KMS sync** satu arah (create) lalu dua arah (update)
5. **Seeder sync** — 58 lesson existing di-sync ke knowledge
6. **Fix status**: archived + published_at auto-set

---

## 1. Route Migration (Frontend)

### Redirect Pages
| Old Route | New Route | File |
|-----------|-----------|------|
| `/knowledge/categories` | → `/manajemen-data/kategori-learning` | `knowledge/categories/page.tsx` |
| `/knowledge/categories/create` | ❌ Dihapus | — |
| `/knowledge/categories/[id]` | ❌ Dihapus | — |
| `/knowledge/tags` | → `/manajemen-data/tags` | `knowledge/tags/page.tsx` |
| `/knowledge/tags/create` | ❌ Dihapus | — |
| `/knowledge/tags/[id]` | ❌ Dihapus | — |

### Button Links di `/knowledge`
| Tombol | Sebelum | Sesudah |
|--------|---------|---------|
| Kategori | `/knowledge/categories` | `/manajemen-data/kategori-learning` |
| Tags | `/knowledge/tags` | `/manajemen-data/tags` |

---

## 2. RemoteSearchSelect — Category Selector di Knowledge Create/Edit

### File diubah
| File | Perubahan |
|------|-----------|
| `frontend/app/(admin)/knowledge/create/page.tsx` | Ganti `<select>` → `RemoteSearchSelect` + fetchCategoryOptions |
| `frontend/app/(admin)/knowledge/[slug]/page.tsx` | Sama — ganti `<select>` → `RemoteSearchSelect` |

### fetchCategoryOptions
- `sortCategoriesHierarchy()` — DFS sort parent → children
- `buildCategoryPath()` — rekursif build full path
- Label: indentasi Unicode `├────` per level depth
- Sama persis seperti di `/manajemen-data/kategori-learning`

---

## 3. LMS → KMS Sync (Backend)

### 3a. Model — `source_lesson` field

**File:** `backend/apps/knowledge/models.py`

```python
source_lesson = models.OneToOneField(
    'learning.Lesson',
    on_delete=models.SET_NULL,
    null=True, blank=True,
    related_name='synced_article',
    verbose_name='Sumber Pelajaran LMS'
)
```

**Migration:** `knowledge/migrations/0011_article_source_lesson.py`

### 3b. Signals — `backend/apps/learning/signals.py` (NEW)

| Signal | Arah | Logic |
|--------|------|-------|
| `Lesson.post_save` | LMS → KMS | `sync_lesson_to_article()` |
| `Article.post_save` | KMS → LMS | `sync_article_to_lesson()` (hanya jika `source_lesson` ada) |
| `Lesson.post_delete` | LMS → KMS | Article di-archived |

**Anti infinite loop:** Thread-local `_sync_in_progress` flag

```
Lesson.save() → sync_lesson_to_article() → Article.save()
                                                   ↓ (is_syncing=True → return)
                                              Article.post_save SKIP

Article.edit (manual) → sync_article_to_lesson() → Lesson.save()
                                                       ↓ (is_syncing=True → return)
                                                  Lesson.post_save SKIP
```

### 3c. Mapping Field

| Lesson | Article | Sync Arah |
|--------|---------|-----------|
| `title` | `title` | ↔ |
| `content` | `content` | ↔ |
| `content_type` (`quiz` skip) | `content_type` | ↔ |
| `video_url` | `youtube_url` | ↔ |
| `external_url` | `external_url` | ↔ |
| `file_url` | `file_url` | → (LMS ke KMS only) |
| `module.course.instructor` | `author` | → |
| `module.course.is_featured` | `is_featured` | → |
| — | `category` → "Materi LMS" | Auto |
| — | `status` → 'published' | Auto |

### 3d. Management Command — Sync Existing

**File:** `backend/apps/learning/management/commands/sync_lessons_to_knowledge.py`

```bash
python manage.py sync_lessons_to_knowledge
python manage.py sync_lessons_to_knowledge --dry-run
```

**Hasil:** 58 lesson ter-sync, 9 quiz skip.
Semua article terhubung via `source_lesson` + kategori "Materi LMS".

---

## 4. Fix Status & published_at

### Backend — `Article.save()` (knowledge/models.py)
```python
if self.status == 'published' and not self.published_at:
    self.published_at = timezone.now()
```

### Frontend — `/knowledge/create` page.tsx
- Tambah option `archived` di dropdown status
- Type `status` di-update: `'draft' | 'pending' | 'published' | 'archived'`

### Frontend — `knowledges.ts` API types
- `createArticle` & `updateArticle` type `status` → include `'archived'`

---

## 5. Catatan Penting

| Aspek | Keputusan |
|-------|-----------|
| **Hapus Artikel KMS** | Tidak hapus Lesson LMS — hanya `source_lesson = null` |
| **Hapus Lesson LMS** | Artikel KMS di-`archived` (tidak dihapus) |
| **Quiz** | Tidak pernah sync ke KMS |
| **Sertifikat** | Tidak ada di KMS |
| **File upload** | Hanya sync URL (tidak handle FileField ↔ URLField) |
| **Sync Conflict** | Edit terakhir yang menang (last-write-wins) |

---

## File Terkait

| File | Perubahan |
|------|-----------|
| `frontend/app/(admin)/knowledge/page.tsx` | ✅ Button link → manajemen-data |
| `frontend/app/(admin)/knowledge/categories/page.tsx` | ✅ Redirect → manajemen-data |
| `frontend/app/(admin)/knowledge/tags/page.tsx` | ✅ Redirect → manajemen-data |
| `frontend/app/(admin)/knowledge/categories/create/` | ❌ Dihapus |
| `frontend/app/(admin)/knowledge/categories/[id]/` | ❌ Dihapus |
| `frontend/app/(admin)/knowledge/tags/create/` | ❌ Dihapus |
| `frontend/app/(admin)/knowledge/tags/[id]/` | ❌ Dihapus |
| `frontend/app/(admin)/knowledge/create/page.tsx` | ✅ RemoteSearchSelect + archived status |
| `frontend/app/(admin)/knowledge/[slug]/page.tsx` | ✅ RemoteSearchSelect |
| `frontend/lib/api/knowledge.ts` | ✅ Type status include 'archived' |
| `backend/apps/knowledge/models.py` | ✅ `source_lesson` + `published_at` auto-set |
| `backend/apps/knowledge/migrations/0011_article_source_lesson.py` | ✅ Migration baru |
| `backend/apps/learning/signals.py` | ✅ NEW — two-way sync |
| `backend/apps/learning/apps.py` | ✅ Register signals |
| `backend/apps/learning/management/commands/sync_lessons_to_knowledge.py` | ✅ NEW — sync existing |
