# 48. Cleanup Seeder & Dummy Data (LMS + KMS)

## Tanggal: 2026-06-13

## Ringkasan
Membersihkan semua data dummy dari seeder (`seed_learning_courses.py` & `seed_knowledge_sample_articles.py`) di database VPS. Hanya menyisakan data real dari course 14+ (Literasi Digital, dll.).

---

## Sebelum Cleanup

| Item | Total |
|------|-------|
| Learning courses | 19 |
| Learning lessons | 97 |
| Knowledge articles | 78 |
| Quizzes | 13 |
| Quiz questions | 81 |
| Quiz choices | 269 |
| Enrollments | 10 |
| Progress | 22 |

## Setelah Cleanup

| Item | Total |
|------|-------|
| Learning courses | **11** (14-25) |
| Learning lessons | **33** |
| Knowledge articles | **22** (link Google Drive real) |
| Quizzes | **6** |
| Quiz questions | **50** |
| Quiz choices | **200** |
| Enrollments | **5** (real users) |
| Progress | **5** (real users) |

---

## Detail Yang Dihapus

### Batch 1: Push Missing Lessons ke KMS
Menambahkan 22 lesson (non-quiz) ke KMS sebagai knowledge_articles dengan kategori:
- ASN Maju (id=6) → 6 artikel
- ASN Tumbuh (id=4) → 8 artikel
- ASN Berkelanjutan (id=5) → 4 artikel
- Fix author_id sesuai instructor course

### Batch 2: Dummy KMS Articles (URL example.com) — 10 artikel
Artikel KMS dengan `external_url = https://example.com/...`:
- `id: 43,45,46,51,52,53,54,55,57,58`

### Batch 3: Dummy LMS Link Lessons (URL example.com) — 9 lesson
Lesson type `link` dengan URL example.com:
- `id: 9,14,22,30,34,38,47,52,60`

### Batch 4: Dummy LMS Video/Doc Lessons (URL example.com) — 15 lesson
Lesson type `video` & `document` dengan URL example.com:
- `id: 4,7,8,13,16,21,25,29,33,40,44,48,55,59,63`

### Batch 5: Seeder Courses 1-8 + Seluruh Turunannya
Dari `seed_learning_courses.py`:
- 8 courses (Dasar Administrasi, Manajemen Kinerja, dll.)
- 24 modules
- 40 lessons (+ 31 sudah dihapus di batch sebelumnya = 71 total)
- 8 quizzes, 31 questions, 69 choices
- 17 progress, 5 enrollments, 3 attempts, 9 answers
- 31 KMS articles (linked ke lesson seeder)
- 3 certificates
- 1 KMS view

### Tidak Dihapus
- **19 quiz lessons** — tetap dipertahankan (punya soal real atau posttest)
- **Course 14+** (Literasi Digital, Global Mindset, dll.) — data real
- **22 KMS articles** dari push (link Google Drive) — data real

---

## Masalah Ditemukan

### Pagination API (PerPagePagination)
VPS masih pakai `PageNumberPagination` default (`PAGE_SIZE=25`), belum support `per_page` parameter. File `core/pagination.py` dengan `PerPagePagination` sudah ada di lokal tapi **belum di-deploy**. Akibatnya:
- Halaman admin `/knowledge` cuma tampil 25 artikel (padahal total 78)
- Halaman publik `/kms` juga cuma 25 (dengan `ordering=-id`, artikel lama tidak muncul)

**Fix:** Deploy `core/pagination.py` + update `settings.py` di VPS.

---

## File Terkait
| File | Perubahan |
|------|-----------|
| `backend/apps/learning/management/commands/seed_learning_courses.py` | Seeder 8 course (data sudah dihapus) |
| `backend/apps/knowledge/management/commands/seed_knowledge_sample_articles.py` | Seeder 4 artikel (data sudah dihapus) |
| `backend/core/pagination.py` | ✅ Perlu deploy ke VPS |
| `backend/core/settings.py` | ✅ Perlu update `DEFAULT_PAGINATION_CLASS` |
