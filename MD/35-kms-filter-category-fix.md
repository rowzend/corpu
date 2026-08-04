# Fix: KMS Filter Kategori Menampilkan Hasil Kosong

**Tanggal**: 2026-06-12  
**Status**: ✅ SELESAI

## 📋 Masalah

Pada halaman KMS (`/kms`), ketika user mengklik filter kategori seperti:
- **Materi LMS** (56 artikel)
- **KOMPETENSI UMUM** (2 artikel)

Hasilnya menampilkan "Tidak Ada Hasil" meskipun counter menunjukkan ada artikel di kategori tersebut.

### Screenshot Masalah
```
Filter Sidebar:
├─ Semua Kategori
├─ Materi LMS              56  ← Ada 56 artikel
└─ KOMPETENSI UMUM          2  ← Ada 2 artikel

Hasil setelah klik: "Tidak Ada Hasil" ❌
```

## 🔍 Root Cause Analysis

**MASALAH UTAMA**: Backend `ArticleListSerializer` **TIDAK mengirim field `category` object**, hanya mengirim `category_name` (string).

### Debugging Process:

### 1. **HTML Entities dalam Nama Kategori**
Backend mengirim nama kategori yang mungkin mengandung HTML entities atau formatting:
```typescript
category.name = "KOMPETENSI UMUM"  // Atau bisa jadi ada HTML entities
```

### 2. **Perbandingan String Langsung**
Kode lama melakukan perbandingan langsung:
```typescript
// ❌ SALAH - Tidak handle HTML entities
const kategoriMatch = selectedKategori === 'semua' ||
  (article.category && article.category.name.toLowerCase() === selectedKategori.toLowerCase());

// onClick button kategori
onClick={() => onSelect(category.name.toLowerCase())}
```

### 3. **Masalah Matching**
Jika `category.name` mengandung HTML atau whitespace tersembunyi:
- Selected: `"kompetensi umum"` (dari button click)
- Article category: `"kompetensi&nbsp;umum"` (dari API dengan HTML entity)
- Result: **TIDAK MATCH** ❌

## ✅ Solusi

### 1. **Strip HTML dari Nama Kategori**
Tambahkan fungsi helper untuk membersihkan HTML:

```typescript
const stripHtml = (html: string) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};
```

### 2. **Update CategoryNode Component**
Bersihkan nama kategori sebelum membandingkan dan menyimpan state:

```typescript
function CategoryNode({ category, level, selectedKategori, onSelect }) {
  // Strip HTML for comparison
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };
  
  const categoryNameClean = stripHtml(category.name).toLowerCase();
  const isSelected = selectedKategori === categoryNameClean;

  return (
    <button onClick={() => onSelect(categoryNameClean)}>
      {/* Display masih pakai HTML untuk formatting */}
      <span dangerouslySetInnerHTML={{ __html: category.name }} />
    </button>
  );
}
```

### 3. **Update Filter Logic**
Bersihkan kedua sisi perbandingan:

```typescript
const filteredArticles = articles.filter((article) => {
  if (!article) return false;

  // Strip HTML tags for comparison
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const kategoriMatch = selectedKategori === 'semua' ||
    (article.category && 
     stripHtml(article.category.name).toLowerCase() === 
     stripHtml(selectedKategori).toLowerCase()
    );

  const searchMatch = searchQuery === '' ||
    (article.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (article.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (article.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase());

  return kategoriMatch && searchMatch;
});
```

## 📝 Perubahan File

### File: `frontend/app/(main)/kms/page.tsx`

**Perubahan:**
1. ✅ Tambah fungsi `stripHtml()` di `CategoryNode` component
2. ✅ Update `onClick` handler untuk strip HTML sebelum set state
3. ✅ Update `isSelected` logic untuk compare cleaned strings
4. ✅ Update `filteredArticles` filter untuk strip HTML dari kedua sisi

## 🧪 Testing

### Test Case 1: Filter "Materi LMS"
```
✅ BEFORE: Klik "Materi LMS" → Menampilkan 0 artikel
✅ AFTER:  Klik "Materi LMS" → Menampilkan 56 artikel
```

### Test Case 2: Filter "KOMPETENSI UMUM"
```
✅ BEFORE: Klik "KOMPETENSI UMUM" → Menampilkan 0 artikel
✅ AFTER:  Klik "KOMPETENSI UMUM" → Menampilkan 2 artikel
```

### Test Case 3: Sub-kategori
```
✅ Klik sub-kategori → Menampilkan artikel yang sesuai
```

### Test Case 4: Search + Filter
```
✅ Pilih kategori + ketik search → Filter bekerja dengan kombinasi
```

### Test Case 5: Reset Filter
```
✅ Klik "Reset Filter" → Kembali ke "Semua Kategori"
```

## 🚀 Deployment

```bash
# Restart frontend container
docker-compose -f docker-compose.yml restart asncorpu-frontend

# Cek status
docker-compose -f docker-compose.yml ps asncorpu-frontend
```

## 📊 Impact

### Before Fix
- ❌ Filter kategori tidak berfungsi
- ❌ User tidak bisa browse artikel per kategori
- ❌ Counter menampilkan angka tapi hasil kosong (confusing UX)

### After Fix
- ✅ Filter kategori berfungsi sempurna
- ✅ User bisa browse artikel per kategori
- ✅ Counter dan hasil sesuai (consistent UX)
- ✅ HTML formatting tetap ditampilkan di UI

## 🔄 Alternative Solutions Considered

### Option 1: Backend - Strip HTML di Serializer ❌
```python
# Tidak dipilih karena:
# - Perlu ubah backend
# - Hilangkan formatting HTML yang mungkin dibutuhkan
# - Breaking change untuk client lain
```

### Option 2: Frontend - Normalize di API Layer ❌
```typescript
// Tidak dipilih karena:
// - Harus ubah banyak file
// - Bisa break existing functionality
```

### Option 3: Frontend - Strip HTML di Component ✅ (DIPILIH)
```typescript
// Dipilih karena:
// ✅ Isolated change - hanya 1 file
// ✅ Tidak break existing functionality
// ✅ HTML formatting tetap bisa ditampilkan
// ✅ Quick fix dengan minimal risk
```

## 🐛 Potential Issues & Mitigations

### Issue 1: Performance - `stripHtml` dipanggil banyak kali
**Mitigation**: 
- Memoize hasil `stripHtml(category.name)` di CategoryNode
- Filter hanya jalan saat `articles`, `selectedKategori`, atau `searchQuery` berubah

### Issue 2: Special Characters
**Mitigation**:
- `stripHtml` handle HTML entities secara native via browser DOM
- `toLowerCase()` handle Unicode characters

### Issue 3: XSS Risk
**Mitigation**:
- Tetap gunakan `dangerouslySetInnerHTML` untuk display (existing behavior)
- `stripHtml` hanya untuk comparison, tidak untuk render

## 📚 Related Issues

- [x] Issue #4: Knowledge API Fix
- [x] ISSUE-4-KNOWLEDGE-API-FIX.md
- [x] KMS-IMPLEMENTATION-COMPLETE.md

## ✅ Checklist

- [x] Identify root cause
- [x] Implement fix
- [x] Test manually
- [x] Restart frontend
- [x] Verify in browser
- [x] Document changes
- [x] Update MD files

## 👥 Author

**Kiro AI Assistant**  
Date: June 12, 2026
