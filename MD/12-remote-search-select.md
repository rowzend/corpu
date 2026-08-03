# 12. RemoteSearchSelect — Parent Kategori Tree Select (ESIMPEG Pattern)

## Tanggal: 2026-06-11

## Ringkasan Task
1. Membuat `RemoteSearchSelect` component — Select2-like searchable dropdown dengan remote fetch
2. Mengganti parent kategori dropdown di `/manajemen-data/kategori-learning` jadi tree view dengan indentasi
3. Hierarchy sorting (parent → children DFS) agar kategori tersusun rapi

---

## 1. RemoteSearchSelect Component (Frontend)

**File:** `frontend/components/ui/remote-search-select.tsx`

### Cara Kerja
- `fetchFn` dipanggil **sekali** saat component mount — ambil semua data (follow pagination via `res.next`)
- Search input **filter lokal** dari data yang sudah diload — tidak ada remote call tambahan
- Dropdown langsung menampilkan semua data saat dibuka
- Ketik → filter case-insensitive dari `label`
- Tutup dropdown → search di-reset

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fetchFn` | `() => Promise<{value, label}[]>` | required | Async function ambil semua data |
| `value` | `string \| number \| null` | required | Nilai terpilih |
| `onChange` | `(value) => void` | required | Callback saat pilih |
| `placeholder` | `string` | `'Pilih...'` | Text saat belum dipilih |
| `emptyText` | `string` | `'Tidak ada data'` | Text saat hasil kosong |
| `searchPlaceholder` | `string` | `'Cari...'` | Placeholder input search |
| `disabled` | `boolean` | `false` | Disabled state |
| `disabledLabel` | `string` | `''` | Text saat disabled |
| `className` | `string` | `''` | Extra CSS class |

### Styling (ESIMPEG Pattern)
| Elemen | Style |
|--------|-------|
| Button | `border-2 rounded-lg px-4 py-3` |
| Focus | `ring-2 ring-indigo-500/20 border-indigo-500` |
| Dropdown | `border rounded-lg shadow-lg` |
| Option hover | `bg-indigo-50` |
| Option selected | `bg-indigo-50 text-indigo-700 font-medium` |

---

## 2. Parent Kategori Tree View

**File:** `frontend/app/(admin)/manajemen-data/kategori-learning/page.tsx`

### Hierarchy Sort — `sortCategoriesHierarchy()`

```
Input:  [KOMPETENSI TEKNIS, ASN Maju, KOMPETENSI UMUM, Artificial Inteligent, ...]
Output: [KOMPETENSI UMUM, ASN Maju, Artificial Inteligent, ..., KOMPETENSI TEKNIS, ...]
```

Algoritma:
1. Group categories by `parent` ID → `childrenMap`
2. Sort children dalam setiap level by `order_index` then `name`
3. DFS traversal dari root (`parent=null`):
   - Tambah kategori ke result
   - Rekursif ke anak-anaknya
4. Orphan fallback: kategori yang parent-nya tidak ada di result set tetap dimasukkan

### Tree Indentation Label

Dari `full_path` (e.g. `"KOMPETENSI UMUM > ASN Maju > Artificial Inteligent"`):
- Split by ` > ` → dapat depth
- `depth = parts.length - 1`
- Indent: 4x `\u00A0` (non-breaking space) per level
- Branch: `└──── ` (Unicode `\u2514\u2500\u2500\u2500\u2500`)

Contoh output:
```
-- Tidak Ada (Root) --
KOMPETENSI UMUM
    └──── ASN Maju ( Smarter )
        └──── Artificial Inteligent (AI) / Literasi Digital
        └──── Berpikir Kritis, Analitis, dan Inovatif
    └──── ASN Tumbuh ( Bigger )
        └──── Kesehatan
KOMPETENSI TEKNIS
    └──── Pemerintahan dan Kesejahteraan Rakyat
        └──── Kesejahteraan Sosial Masyarakat
```

### Fetch All Pages

```typescript
const allCats: Category[] = [];
let page = 1;
let hasMore = true;
while (hasMore) {
    const res: any = await api.get('knowledge/categories/', { page, page_size: 100 }, true);
    if (res?.results) allCats.push(...res.results);
    hasMore = !!res?.next;
    page++;
}
```

Menggunakan `page_size=100` dan looping sampai `next` null untuk memastikan semua kategori terfetch.

---

## 3. Perubahan File

| File | Perubahan |
|------|-----------|
| `frontend/components/ui/remote-search-select.tsx` | **NEW** — Component Select2-like |
| `frontend/app/(admin)/manajemen-data/kategori-learning/page.tsx` | **UPDATE** — Ganti SearchSelect → RemoteSearchSelect, tambah sortCategoriesHierarchy, tree label |
| `frontend/lib/api/knowledge.ts` | **UPDATE** — Tambah field `full_path` ke interface Category |

---

## 4. Referensi ESIMPEG

Pattern diambil dari `projects/ESIMPEG-Python/templates/includes/filter_pegawai_basic.html`:
- Select2 untuk Sub Unit Kerja (`id_sub_opd`)
- Remote AJAX via `data-search-url`
- `data-initial-fetch="1"` untuk load data saat init
- Tree indentation: 4x `\u00A0` + `└────` per level
- Parent-child dependency: pilih Unit Kerja → enable + fetch Sub Unit

Perbedaan dengan ASNCORPU:
| Aspek | ESIMPEG | ASNCORPU |
|-------|---------|----------|
| Framework | Django + jQuery | Next.js + React |
| Search | Remote AJAX tiap ketik | Filter lokal dari data yang sudah diload |
| Init fetch | `data-initial-fetch="1"` | Fetch on mount via useEffect |
| Pagination | `page_size`, `has_more` | Loop `res.next` sampe habis |

---

## 5. File Terkait

| File | Keterangan |
|------|------------|
| `frontend/components/ui/remote-search-select.tsx` | Component utama |
| `frontend/app/(admin)/manajemen-data/kategori-learning/page.tsx` | Halaman yang menggunakan |
| `frontend/lib/api/knowledge.ts` | Type definitions |
| `backend/apps/knowledge/views_api.py` | CategoryViewSet (search + ordering) |
| `backend/apps/knowledge/models.py` | `get_full_path()` method |
| `backend/apps/knowledge/serializers.py` | `full_path` field di serializer |
