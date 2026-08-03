# 11. Sidebar, Kategori Learning Enhancement & Permission Migration

## Tanggal: 2026-06-11 (Update: 2026-06-11 - Final)

## Ringkasan Task
1. Menambahkan menu **Manajemen Data** ke sidebar dengan sub-menu Kategori Learning & Tags
2. Menambahkan fitur yang kurang di `/manajemen-data/kategori-learning` dari `/knowledge/categories/create`
3. Migrasi permission controls dari `knowledge_category`/`knowledge_tag` ke `Md_kategori_learning`/`Md_tags_learning`

---

## 1. Sidebar Update (Frontend)

**File:** `frontend/components/admin/AdminSidebar.tsx`

Menambahkan section `Manajemen Data` dengan item:
- Kategori Learning → `/manajemen-data/kategori-learning`, require `knowledge` module
- Tags → `/manajemen-data/tags`, require `knowledge` module

Permission dicek via `requiredModules: ['knowledge']` dari API `/apicorpu/1.0/management/permissions/user/`

**Debugging:** Ditambahkan console.log `[Sidebar]` untuk memonitor response API permission.

---

## 2. Kategori Learning Page Enhancement (Frontend)

**File:** `frontend/app/(admin)/manajemen-data/kategori-learning/page.tsx`

### Fitur yang Ditambahkan:
| Fitur | Sebelum | Sesudah |
|-------|---------|---------|
| **is_active checkbox** | ❌ Tidak ada | ✅ Ada |
| **order_index field** | ❌ Tidak ada | ✅ Ada |
| **Full parent hierarchy** | ❌ Hanya root | ✅ Full path (e.g., "Teknologi > Programming > Python") |
| **Edit functionality** | ❌ Hanya delete | ✅ Edit + Update via modal |
| **Form components** | Plain input | ✅ shadcn/ui (Input, Textarea, Label, Button) |
| **Create/Edit unified** | Hanya create | ✅ Satu form untuk create & edit |

### Component imports baru:
- `Input`, `Label`, `Textarea` dari `@/components/ui/`
- `Edit`, `Save`, `Loader2`, `X` dari `lucide-react`
- `updateCategory` dari `@/lib/api/knowledge`

### Fungsi baru:
- `buildCategoryPath()` - Rekursif build full path kategori
- `handleEdit()` - Populate form untuk edit
- `handleUpdate()` - Update kategori via API
- `handleCancel()` - Reset form

### State baru:
- `editingCategory` - Category yang sedang diedit
- `newCategory.is_active` - Status aktif kategori

---

## 3. Permission Migration (Backend)

### 3a. Permission Mapping (`backend/apps/knowledge/permissions.py`)

| Action | OLD Control | NEW Control |
|--------|-------------|-------------|
| categories.* | `knowledge` . `categories` . * | `knowledge` . `Md_kategori_learning` . * |
| tags.* | `knowledge` . `tags` . * | `knowledge` . `Md_tags_learning` . * |

### 3b. ViewSet Permissions (`backend/apps/knowledge/views_api.py`)

| ViewSet | Method | OLD Control | NEW Control |
|---------|--------|-------------|-------------|
| CategoryViewSet | get_queryset | `knowledge` . `categories` . `view` | `knowledge` . `Md_kategori_learning` . `view` |
| CategoryViewSet | perform_destroy | `knowledge` . `categories` . `delete` | `knowledge` . `Md_kategori_learning` . `delete` |
| TagViewSet | get_queryset | `knowledge` . `tags` . `view` | `knowledge` . `Md_tags_learning` . `view` |
| TagViewSet | perform_destroy | `knowledge` . `tags` . `delete` | `knowledge` . `Md_tags_learning` . `delete` |

### 3c. Seed Commands Updated

#### `backend/apps/knowledge/management/commands/seed_knowledge_permissions.py`
- `category` → `Md_kategori_learning` (label: "Kategori Learning (KMS+LMS)")
- `tags` → `Md_tags_learning` (label: "Tags Learning (KMS+LMS)")

#### `backend/apps/manajemen/management/commands/seed_asncorpu_permissions.py`
- `knowledge_article` → `articles`
- `knowledge_category` → `Md_kategori_learning`
- `knowledge_tag` → `Md_tags_learning`
- `knowledge_comment` → `comments`
- `knowledge_rating` → `ratings`
- Ditambahkan fetches yang hilang (dashboard_main, dashboard_stats, hcdp_program, dll)

---

## 4. Seed Commands Execution (2026-06-11)

| Command | Status | Hasil |
|---------|--------|-------|
| `seed_knowledge_permissions` | ✅ | Created 15 rules, Updated 8 rules |
| `seed_asncorpu_permissions` | ✅ | 189 total rules (1 new) |
| `seed_superadmin_full_access` | ✅ | 186 permissions assigned to Super Admin |

---

## 5. Verifikasi

### API Permission User (`Prakom@admin2025.com`)
```
GET /apicorpu/1.0/management/permissions/user/ → 200 OK
modules: ["knowledge", "dashboard", "hcdp", ...]
permissions: ["knowledge.view.Md_kategori_learning", "knowledge.create.Md_kategori_learning", ...]
is_superadmin: true
```

### Endpoint
```
GET /manajemen-data/kategori-learning → 200 OK
```

### User
- **Username:** Prakom@admin2025.com
- **is_superuser:** True (via model property)
- **is_staff:** True
- **Groups:** ['Super Admin']
- **Modules:** 11 modules termasuk 'knowledge'

---

## File Terkait
| File | Perubahan |
|------|-----------|
| `frontend/components/admin/AdminSidebar.tsx` | ✅ Tambah section Manajemen Data + debugging |
| `frontend/app/(admin)/manajemen-data/kategori-learning/page.tsx` | ✅ Tambah is_active, order_index, full parent, edit |
| `backend/apps/knowledge/permissions.py` | ✅ Migrasi ke Md_kategori_learning, Md_tags_learning |
| `backend/apps/knowledge/views_api.py` | ✅ Update permission check 4 method |
| `backend/apps/knowledge/management/commands/seed_knowledge_permissions.py` | ✅ Update control names |
| `backend/apps/manajemen/management/commands/seed_asncorpu_permissions.py` | ✅ Update control names + fix query fetches |

---

## Status Final

| Item | Status |
|------|--------|
| Sidebar Manajemen Data | ✅ Done |
| Kategori Learning page - is_active | ✅ Done |
| Kategori Learning page - order_index | ✅ Done |
| Kategori Learning page - full parent hierarchy | ✅ Done |
| Kategori Learning page - edit functionality | ✅ Done |
| Permission mapping updated | ✅ Done |
| ViewSet permission checks updated | ✅ Done |
| Seed commands updated | ✅ Done |
| Seed commands executed | ✅ Done |
| API verified | ✅ Done |