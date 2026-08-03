# Perbaikan Validasi, Error Handling & HTML Italic pada Nama

## 1. Fix Parsing Error DRF di Frontend (`handleApiError`)

**File:** `frontend/lib/api.ts`

**Masalah:** DRF mengembalikan error field-level (`{"name": ["This field is required."]}`) tapi `handleApiError` hanya cari `data.message || data.detail || data.error`, resulting fallback ke "Request failed".

**Perbaikan:**
- Fungsi `extractFieldErrors()` untuk parse format error DRF:
  - `{"name": ["kategori with this name already exists."]}` → `"name: kategori with this name already exists."`
  - `{"non_field_errors": ["..."]}` → langsung pakai
  - Multiple fields digabung newline
- `handleApiError()` sekarang panggil `extractFieldErrors()` dari `error.errors`

---

## 2. Fix IntegrityError Backend (HTML Error Page)

**File:** `backend/apps/knowledge/models.py`

**Masalah:** Slug `unique=True` — duplicate name bikin IntegrityError dari database, tampil HTML debug page.

**Perbaikan:** Kembalikan `save()` ke default (slug = `slugify(name)` tanpa auto-dedup). Duplicate slug tetap error, tapi ditangani oleh viewset/exception handler.

---

**File:** `backend/apps/knowledge/views_api.py`

**Perbaikan:**
- `CategoryViewSet.create()` — try/except IntegrityError → JSON `'Kategori dengan nama yang sama sudah ada'`
- `CategoryViewSet.perform_update()` — try/except IntegrityError → ValidationError
- `TagViewSet.create()` — try/except IntegrityError → JSON `'Tag dengan nama atau slug yang sama sudah ada'`
- `TagViewSet.perform_update()` — try/except IntegrityError → ValidationError
- Import `from django.db import IntegrityError`

---

## 3. Global DRF Exception Handler

**File:** `backend/core_utils/exceptions.py` (baru)
**File:** `backend/core/settings.py`

**Perbaikan:**
- Custom exception handler `custom_exception_handler` catch `IntegrityError` dari SEMUA viewset
- Deteksi "duplicate key" / "unique constraint" → pesan user-friendly
- Deteksi "not null" → pesan field wajib
- Fallback → pesan umum
- Didaftarkan di `REST_FRAMEWORK.EXCEPTION_HANDLER`

---

## 4. Knowledge Create Page — Validasi + SweetAlert

**File:** `frontend/app/(admin)/knowledge/create/page.tsx`

**Masalah:** Tidak ada client-side validation, error pakai `<div>` merah biasa (bukan SweetAlert), success tanpa notifikasi.

**Perbaikan:**
- Import `showError, showToast` dari sweetalert
- Hapus state `error` dan inline `<div>` merah
- Client validation sebelum submit: title & content wajib
- Error dari API: `showError(handleApiError(err), 'Gagal Membuat Artikel')`
- Success: `showToast('Artikel berhasil dibuat!', 'success')`

---

## 5. Learning Frontend — Perbaikan Error Handling

### 5a. Essay Grading — Validasi Form

**File:** `frontend/app/(admin)/learning/quizzes/[id]/essays/page.tsx`

- Validasi `points_earned >= 0` sebelum submit grade

### 5b. List Pages — SweetAlert pada Fetch Gagal

**Files:**
- `frontend/app/(admin)/learning/courses/page.tsx`
- `frontend/app/(admin)/learning/quizzes/page.tsx`
- `frontend/app/(admin)/learning/enrollments/page.tsx`

**Masalah:** `console.error('Error:', ...)` tanpa notifikasi ke user.

**Perbaikan:** Ganti dengan `showError(handleApiError(error), 'Gagal Memuat ...')`

---

## 6. HTML Italic pada Nama

### 6a. Utility Functions

**File:** `frontend/lib/utils.ts`

Fungsi baru:
- `sanitizeHtml(text)` — hanya izinkan tag `<i>`, `<em>`, `<b>`, `<strong>`, `<br>`; hapus tag lain termasuk `<script>`
- `renderHtml(text)` — return `{ __html: sanitizeHtml(text) }` untuk `dangerouslySetInnerHTML`

### 6b. Penerapan di Komponen

| Lokasi | File | Perubahan |
|--------|------|-----------|
| Tree kategori | `manajemen-data/kategori-learning/page.tsx` | `dangerouslySetInnerHTML={renderHtml(category.name)}` |
| Card tag | `manajemen-data/tags/page.tsx` | `dangerouslySetInnerHTML={renderHtml(tag.name)}` |
| Badge preview tag | `manajemen-data/tags/page.tsx` | `dangerouslySetInnerHTML={renderHtml(formData.name)}` |
| Card artikel | `knowledge/page.tsx` | title & tag pakai `dangerouslySetInnerHTML` |
| Tag badge create | `knowledge/create/page.tsx` | `dangerouslySetInnerHTML={renderHtml(tag.name)}` |
| Tag badge edit | `knowledge/[slug]/page.tsx` | `dangerouslySetInnerHTML={renderHtml(tag.name)}` |
| Select dropdown | `components/ui/remote-search-select.tsx` | trigger & option pakai `dangerouslySetInnerHTML` |

### 6c. Cara Pakai

Input nama: `ASN Maju ( <i>Smarter</i> )`  
Tampil: **ASN Maju ( *Smarter* )** dengan *Smarter* miring.

Terdapat hint di bawah input nama kategori:  
`Gunakan <i>teks asing</i> untuk tulisan miring`

---

## Ringkasan Proteksi Error Duplicate

| Layer | File | Cara Kerja |
|-------|------|------------|
| 1 | `views_api.py` (CategoryViewSet, TagViewSet) | `try/except IntegrityError` langsung di viewset |
| 2 | `core_utils/exceptions.py` | Global DRF handler — catch IntegrityError dari SEMUA viewset (knowledge, learning, dll) |
| 3 | `api.ts` (`handleApiError`) | Parse field-level error DRF ke pesan yang terbaca |
| 4 | Semua halaman CRUD | SweetAlert `showError` untuk error, `showToast` untuk success |
