# Fix: KMS Filter Count Tidak Sesuai dengan Artikel yang Tampil (Pagination)

**Tanggal**: 2026-06-12  
**Status**: ✅ SELESAI

## 📋 Masalah

Pada halaman KMS (`/kms`), filter kategori menunjukkan count badge yang benar tapi artikel yang tampil tidak sesuai.

**Contoh:**
- **ASN Maju** badge count = **2**, tapi setelah diklik hanya menampilkan **1 artikel**
- **KOMPETENSI UMUM** badge count = **3**, tapi cuma menampilkan sebagian

### Gejala
```
Filter Sidebar:
├─ KOMPETENSI UMUM          3  ← Badge benar
├─ ASN Maju                 2  ← Badge benar
│  └─ AI / Literasi Digital 1  ← Badge benar

Setelah klik "ASN Maju": Hanya 1 artikel muncul ❌
```

## 🔍 Root Cause Analysis

**MASALAH UTAMA**: Backend Django REST Framework menggunakan `PageNumberPagination` dengan `PAGE_SIZE=25` dan **tidak menerima parameter `per_page`** dari client.

### Flow Masalah:

1. **Frontend** mengirim request:
   ```
   GET /knowledge/articles/?status=published&per_page=1000&ordering=-id
   ```

2. **Backend** mengabaikan `per_page=1000` karena `PageNumberPagination.page_size_query_param = None`
   - Default `PAGE_SIZE` = 25
   - Hanya mengembalikan **25 artikel pertama** (page 1)

3. **Akibatnya:**
   - Artikel `[21] Dokumen: Contoh Format SKP` (langsung di ASN Maju, ID=6) → ada di **page 2** → **tidak termuat**
   - Artikel `[66] 3333` (di child AI / Literasi Digital, ID=11) → ada di **page 1** → **termuat**
   - Badge count = **2** (hitung dari backend via `get_article_count()` yang rekursif)
   - Tapi cuma **1** yang tampil di frontend

### Hierarki Kategori yang Terlibat:
```
KOMPETENSI UMUM (ID 3)
├── ASN Maju (ID 6)
│   ├── Artificial Inteligent (AI) / Literasi Digital (ID 11) → [66] 3333
│   ├── Pengambilan Keputusan Berbasis Data (ID 12)
│   ├── Berpikir Kritis, Analitis, dan Inovatif (ID 13)
│   └── Global Mindset (ID 14)
├── ASN Tumbuh (ID 4)
└── ASN Berkelanjutan (ID 5)
```

### Kenapa `get_article_count()` return 2?
Method di `models.py:74-79`:
```python
def get_article_count(self):
    count = self.articles.filter(status='published').count()
    for child in self.children.all():
        count += child.get_article_count()
    return count
```
- 1 artikel langsung di ASN Maju: `[21] Dokumen: Contoh Format SKP`
- 1 artikel di child (AI): `[66] 3333`
- **Total = 2** ✅

## ✅ Solusi

Buat custom pagination class yang menerima parameter `per_page` dari client.

### 1. File Baru: `backend/core/pagination.py`

```python
from rest_framework.pagination import PageNumberPagination


class PerPagePagination(PageNumberPagination):
    page_size_query_param = 'per_page'
    max_page_size = 100
```

### 2. Update: `backend/core/settings.py`

```python
# BEFORE
'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',

# AFTER
'DEFAULT_PAGINATION_CLASS': 'core.pagination.PerPagePagination',
```

### Cara Kerja:
- **Default** (tanpa `per_page`): tetap 25 artikel per halaman
- **Dengan `per_page`** (contoh: `?per_page=1000`): mengembalikan sesuai jumlah, maksimal 100
- **Aman**: ada `max_page_size = 100` untuk mencegah abuse

## 📝 Perubahan File

| File | Tipe Perubahan |
|---|---|
| `backend/core/pagination.py` | ✅ **Baru** - Custom pagination class |
| `backend/core/settings.py` | ✅ **Update** - Ganti DEFAULT_PAGINATION_CLASS |

## 🧪 Testing

### Test Case 1: Default pagination
```
GET /knowledge/articles/
→ 25 articles (PAGE_SIZE default)
```

### Test Case 2: per_page=1000
```
GET /knowledge/articles/?per_page=1000
→ 59 articles (semua termuat, capped at 100)
```

### Test Case 3: Filter ASN Maju setelah fix
```
Klik "ASN Maju"
→ Menampilkan 2 artikel:
  - [21] Dokumen: Contoh Format SKP
  - [66] 3333 (via child AI)
✅ Sesuai dengan badge count
```

### Test Case 4: Max page size
```
GET /knowledge/articles/?per_page=200
→ 59 articles (capped at max_page_size=100)
```

## 🚀 Deployment

```bash
# Restart backend container
docker restart asncorpu_backend_app

# Cek status
docker ps | grep asncorpu_backend
```

## 📊 Impact

### Before Fix
- ❌ Filter kategori menampilkan count benar tapi artikel tidak lengkap
- ❌ User bingung karena badge count ≠ artikel yang muncul
- ❌ Artikel lama (ID kecil) sering tidak termuat karena ada di page >1

### After Fix
- ✅ Filter kategori menampilkan artikel sesuai badge count
- ✅ Semua artikel termuat dalam 1 request (max 100)
- ✅ UX konsisten dan tidak membingungkan
- ✅ Default pagination tetap 25 untuk endpoint lain

## 🔄 Alternative Solutions Considered

### Option 1: Naikkan PAGE_SIZE di settings ❌
```python
# Tidak dipilih karena:
# - Mempengaruhi SEMUA endpoint, tidak hanya KMS
# - Beban query jadi besar untuk list lain
```

### Option 2: Infinite scroll / load more di frontend ❌
```python
# Tidak dipilih karena:
# - Perubahan besar di frontend
# - Kompleksitas tinggi
# - Butuh banyak state management
```

### Option 3: Custom pagination class ✅ (DIPILIH)
```python
# Dipilih karena:
# ✅ Minimal change - 1 file baru, 1 line edit
# ✅ Client bisa override per_page, ada max limit
# ✅ Default behavior tetap sama
# ✅ Tidak perlu ubah frontend
```

## 🐛 Potential Issues & Mitigations

### Issue 1: max_page_size=100 kurang untuk data sangat besar
**Mitigation**: Saat ini total artikel 59, masih aman. Jika >100 di masa depan, perlu load more/pagination.

### Issue 2: Satu request besar beban query
**Mitigation**: `max_page_size=100` membatasi maksimal. Untuk KMS dengan puluhan artikel masih wajar.

## 📚 Related Issues

- [x] Issue #35: KMS Filter Category Fix (HTML entities)
- [x] Issue #40: KMS Filter Healthcheck Deploy
- [x] **Issue #41: KMS Pagination Fix** (current)

## ✅ Checklist

- [x] Identify root cause (pagination PAGE_SIZE=25)
- [x] Create custom pagination class
- [x] Update settings.py
- [x] Restart backend container
- [x] Verify API returns all articles with per_page
- [x] Verify filter count matches displayed articles
- [x] Document changes
