# 21. Knowledge Create - RemoteSearchSelect Category Fix

**Tanggal:** 2026-06-12  
**Session:** Lanjutan dari MD 20

---

## 📋 Ringkasan Perubahan

Memperbaiki halaman `/knowledge/create` agar menggunakan **RemoteSearchSelect** untuk dropdown category dengan hirarki visual, sama seperti halaman `/learning/courses/create` dan `/manajemen-data/kategori-learning`.

---

## ❌ Masalah Sebelumnya

### Category Dropdown
```tsx
// ❌ BEFORE: Native select tanpa hirarki visual
<select name="category" value={formData.category || ''} onChange={handleChange}>
    <option value="">-- Pilih Kategori --</option>
    {categories.map(cat => (
        <option key={cat.id} value={cat.id}>
            {cat.parent_name ? `${cat.parent_name} > ` : ''}{cat.name}
        </option>
    ))}
</select>
```

**Kekurangan:**
- ❌ Tidak ada visual hierarchy (indent, tree symbols)
- ❌ Tidak ada search functionality
- ❌ Tidak konsisten dengan halaman lain
- ❌ Native select sulit di-customize

---

## ✅ Solusi

### 1. Import RemoteSearchSelect

```tsx
import { RemoteSearchSelect } from '@/components/ui/remote-search-select';
import { api, handleApiError } from '@/lib/api';
```

---

### 2. Hapus State yang Tidak Diperlukan

```tsx
// ❌ BEFORE
const [loadingData, setLoadingData] = useState(true);
const [categories, setCategories] = useState<Category[]>([]);
const [error, setError] = useState<string | null>(null);

// ✅ AFTER
// State categories dihapus, fetch on-demand via RemoteSearchSelect
```

---

### 3. Tambahkan fetchCategories Function (Reusable)

```tsx
const fetchCategories = async (): Promise<{ value: string | number; label: string }[]> => {
    try {
        const allCats: any[] = [];
        let page = 1;
        let hasMore = true;
        while (hasMore) {
            const res: any = await api.get('knowledge/categories/', { page, page_size: 100 }, true);
            if (res?.results) allCats.push(...res.results);
            hasMore = !!res?.next;
            page++;
        }
        
        const sorted = allCats
            .filter(c => c.is_active)
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0) || a.name.localeCompare(b.name));
        
        return [
            { value: '', label: '-- Pilih Kategori --' },
            ...sorted.map(cat => {
                const fullPath = cat.full_path || (cat.parent_name ? `${cat.parent_name} > ${cat.name}` : cat.name);
                const parts = fullPath.split(' > ');
                const depth = parts.length - 1;
                const indent = '\u00A0'.repeat(4 * depth);
                const label = depth > 0 ? `${indent}\u2514\u2500\u2500\u2500\u2500 ${cat.name}` : cat.name;
                return { value: cat.id, label };
            }),
        ];
    } catch {
        return [{ value: '', label: '-- Pilih Kategori --' }];
    }
};
```

**Features:**
- ✅ Lazy loading (fetch hanya saat dropdown dibuka)
- ✅ Pagination support (handle multiple pages)
- ✅ Hirarki visual dengan indent & tree symbols
- ✅ Filter hanya kategori aktif
- ✅ Sort by order_index dan name

---

### 4. Ganti Dropdown Category

```tsx
// ✅ AFTER: RemoteSearchSelect dengan hirarki
<div className="p-6">
    <RemoteSearchSelect
        fetchFn={fetchCategories}
        value={formData.category ?? ''}
        onChange={value => setFormData(p => ({ ...p, category: value ? Number(value) : null }))}
        placeholder="Pilih kategori artikel..."
        searchPlaceholder="Ketik untuk mencari kategori..."
        emptyText="Kategori tidak ditemukan"
    />
</div>
```

**Benefits:**
- ✅ **Visual hierarchy** - indent + tree symbols
- ✅ **Search** - cari kategori dengan keyword
- ✅ **Lazy loading** - fetch on demand
- ✅ **Consistent UX** - sama dengan pages lain

---

### 5. Tags Dropdown (Tetap Custom)

Tags menggunakan custom dropdown karena **multi-select**. RemoteSearchSelect default single-select.

```tsx
// Keep existing tags implementation (custom multi-select)
const [tags, setTags] = useState<Tag[]>([]);
const [selectedTags, setSelectedTags] = useState<number[]>([]);
const [showTagDropdown, setShowTagDropdown] = useState(false);

const handleTagToggle = (tagId: number) => {
    setSelectedTags(prev =>
        prev.includes(tagId)
            ? prev.filter(id => id !== tagId)
            : [...prev, tagId]
    );
};
```

**Note:** Tags dropdown tetap menggunakan implementasi custom untuk support multi-select dengan checkbox.

---

## 🎯 Tampilan Dropdown

### Sebelum (Native Select)
```
-- Pilih Kategori --
Materi LMS
KOMPETENSI UMUM > ASN Maju ( Smarter )
KOMPETENSI UMUM > ASN Maju ( Smarter ) > Artificial Inteligent (AI)
```
❌ Tidak ada visual indent, sulit dibaca

### Sesudah (RemoteSearchSelect)
```
-- Pilih Kategori --
Materi LMS
KOMPETENSI UMUM
    └──── ASN Maju ( Smarter )
        └──── Artificial Inteligent (AI) / Literasi Digital
        └──── Pengambilan Keputusan Berbasis Data
    └──── ASN Tumbuh ( Bigger )
KOMPETENSI TEKNIS
    └──── Pemerintahan dan Kesejahteraan Rakyat
```
✅ Visual hierarchy jelas dengan indent & symbols

---

## 📁 Files Modified

| File | Changes | Status |
|------|---------|--------|
| `frontend/app/(admin)/knowledge/create/page.tsx` | Import RemoteSearchSelect, add fetchCategories, replace dropdown | ✅ |

**Total:** 1 file modified

---

## ✅ Testing

### Test Case 1: Category Dropdown
1. Buka `/knowledge/create`
2. ✅ Dropdown "Kategori" menggunakan RemoteSearchSelect
3. ✅ Klik dropdown → kategori muncul dengan hirarki visual
4. ✅ Search "artificial" → filter hasil
5. ✅ Pilih kategori → value tersimpan

### Test Case 2: Create Article dengan Category
1. Isi judul & konten
2. Pilih kategori dengan hirarki
3. Submit form
4. ✅ Article tersimpan dengan category

### Test Case 3: Tags Multi-Select
1. ✅ Tags dropdown tetap bekerja (custom multi-select)
2. ✅ Pilih multiple tags dengan checkbox
3. ✅ Submit → tags tersimpan

---

## 🔄 Consistency Across Pages

Sekarang **semua halaman** menggunakan RemoteSearchSelect untuk category:

| Page | Category Dropdown | Status |
|------|-------------------|--------|
| `/manajemen-data/kategori-learning` | ✅ RemoteSearchSelect (parent) | ✅ |
| `/learning/courses/create` | ✅ RemoteSearchSelect (hierarchy) | ✅ |
| `/learning/courses/[slug]` | ✅ RemoteSearchSelect (hierarchy) | ✅ |
| `/knowledge/create` | ✅ RemoteSearchSelect (hierarchy) | ✅ |

**Result:** ✅ **Consistent UX** di seluruh aplikasi

---

## 🎉 Summary

| Item | Before | After |
|------|--------|-------|
| Category dropdown | Native `<select>` | RemoteSearchSelect |
| Visual hierarchy | ❌ Text only | ✅ Indent + symbols |
| Search category | ❌ | ✅ |
| Lazy loading | ❌ | ✅ |
| UX consistency | ❌ | ✅ |
| Code reusability | ❌ | ✅ |

---

**Related Documents:**
- MD 20: Category Dropdown Hierarchy - Course Create & Edit
- MD 19: Slug Hidden Fix & renderHtml Function
- MD 18: Permission System & Learning Course Fixes
