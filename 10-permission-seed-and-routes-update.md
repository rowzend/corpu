# Permission Seed, Routes Update & Super Admin Setup

> **🤖 Dibuat oleh: Nemotron 3 Ultra Free (NVIDIA AI Model)**
> **Via:** OpenCode Agent
> **Tanggal:** 2026-06-11
> **File:** 10-permission-seed-and-routes-update.md
> **Lanjutan dari:** 09-docker-compose-setup-routes-debug.md

---

## Latar Belakang

Perlu menyiapkan sistem permission granular (5-layer) untuk ASNCORPU agar:
1. Semua fungsi permission terdaftar di database
2. Super admin `Prakom@admin2025.com` punya akses penuh
3. Route categories/tags yang dihapus diganti dengan manajemen-data
4. Control baru `Md_kategori_learning` & `Md_tags_learning` untuk shared KMS+LMS

---

## 1. Permission Functions Missing (Ditambahkan)

| Function | Label | Status |
|----------|-------|--------|
| `approve` | Approve | ✅ Created |
| `reject` | Reject | ✅ Created |

Function `create`, `edit`, `delete`, `view`, `export`, `manage`, `publish`, `unpublish`, `sync` sudah ada.

---

## 2. Controls Baru (Shared KMS + LMS)

| Control Name | Label | Deskripsi |
|--------------|-------|-----------|
| `Md_kategori_learning` | Kategori Learning (KMS+LMS) | Kategori untuk Knowledge Base & Learning |
| `Md_tags_learning` | Tags Learning (KMS+LMS) | Tags untuk Knowledge Base & Learning |

Ditambahkan ke `PermissionControl` dengan `module=knowledge`.

---

## 3. Rules Missing yang Ditambahkan

### Untuk Control Baru (4 functions × 2 controls = 8 rules)
| Module | Control | Function |
|--------|---------|----------|
| knowledge | Md_kategori_learning | view, create, edit, delete |
| knowledge | Md_tags_learning | view, create, edit, delete |

### Missing Rules yang Ditambahkan (Existing Controls)
| Module | Control | Function | Status |
|--------|---------|----------|--------|
| knowledge | knowledge_article | approve | ✅ Added |
| knowledge | knowledge_article | reject | ✅ Added |
| knowledge | knowledge_comment | create | ✅ Added |
| knowledge | knowledge_comment | edit | ✅ Added |
| knowledge | knowledge_rating | create | ✅ Added |
| knowledge | knowledge_rating | edit | ✅ Added |
| knowledge | knowledge_rating | delete | ✅ Added |

---

## 4. Update permissions.py Mapping

**File:** `backend/apps/knowledge/permissions.py`

```python
# Categories (shared KMS+LMS)
'categories': {
    'list': ('knowledge', 'Md_kategori_learning', 'view'),
    'retrieve': ('knowledge', 'Md_kategori_learning', 'view'),
    'create': ('knowledge', 'Md_kategori_learning', 'create'),
    'update': ('knowledge', 'Md_kategori_learning', 'edit'),
    'partial_update': ('knowledge', 'Md_kategori_learning', 'edit'),
    'destroy': ('knowledge', 'Md_kategori_learning', 'delete'),
},

# Tags (shared KMS+LMS)
'tags': {
    'list': ('knowledge', 'Md_tags_learning', 'view'),
    'retrieve': ('knowledge', 'Md_tags_learning', 'view'),
    'create': ('knowledge', 'Md_tags_learning', 'create'),
    'update': ('knowledge', 'Md_tags_learning', 'edit'),
    'partial_update': ('knowledge', 'Md_tags_learning', 'edit'),
    'destroy': ('knowledge', 'Md_tags_learning', 'delete'),
},
```

---

## 5. Super Admin Setup

### User
- **Email:** `Prakom@admin2025.com`
- **Username:** `Prakom@admin2025.com`
- **ID:** 1
- **is_superuser:** True
- **is_staff:** True

### Group
- **Group Name:** `Super Admin`
- **User sudah member:** ✅

### Permission Coverage
| Metric | Value |
|--------|-------|
| Total Active Rules in DB | 170 |
| Rules Assigned to Super Admin | 170 |
| Coverage | **100%** |
| Unassigned Rules | 0 |

### Modules Accessible (via `get_user_modules`)
1. dashboard
2. hcdp
3. pegawai
4. knowledge
5. riwayat
6. settings
7. siasn
8. laporan
9. learning
10. profile
11. pengaturan

---

## 6. Routes Update

### Dihapus
| Route | Status |
|-------|--------|
| `/knowledge/categories` | ❌ Deleted |
| `/knowledge/categories/[id]` | ❌ Deleted |
| `/knowledge/categories/create` | ❌ Deleted |
| `/knowledge/tags` | ❌ Deleted |
| `/knowledge/tags/[id]` | ❌ Deleted |
| `/knowledge/tags/create` | ❌ Deleted |

### Ditambahkan (Manajemen Data)
| Route | Status |
|-------|--------|
| `/manajemen-data/kategori-learning` | ✅ Added (from backup) |
| `/manajemen-data/tags` | ✅ Added (from backup) |

### Knowledge Page Buttons
| Button | Status |
|--------|--------|
| Kategori | ❌ Removed |
| Tags | ❌ Removed |
| Tambah Artikel | ✅ Kept |

### Sidebar Update
**File:** `frontend/components/admin/AdminSidebar.tsx`

```typescript
{
    title: 'Manajemen Data',
    items: [
        { name: 'Kategori Learning', href: '/manajemen-data/kategori-learning', icon: '📂' },
        { name: 'Tags', href: '/manajemen-data/tags', icon: '🏷️' },
    ],
},
```

---

## 7. Docker Compose Mode

**Saat ini:** `docker-compose.yml` (Development Mode)
- **CMD:** `npm run dev`
- **Hot Reload:** ✅ Aktif (`WATCHPACK_POLLING=true`)
- **Volume Mount:** `./frontend:/app` (bind mount)
- **NODE_ENV:** `development`

---

## 8. Verifikasi API

```bash
# Test categories/tags API
curl http://localhost:3000/apicorpu/1.0/knowledge/categories/  # 200
curl http://localhost:3000/apicorpu/1.0/knowledge/tags/       # 200

# Test manajemen-data pages
curl http://localhost:3000/manajemen-data/kategori-learning  # 200
curl http://localhost:3000/manajemen-data/tags              # 200
```

---

## 9. File Terkait

| File | Deskripsi |
|------|-----------|
| `backend/apps/knowledge/permissions.py` | Permission mapping DRF |
| `backend/apps/manajemen/models.py` | 5-layer permission models |
| `backend/apps/manajemen/helpers.py` | Permission helper functions |
| `frontend/components/admin/AdminSidebar.tsx` | Sidebar menu |
| `frontend/app/(admin)/knowledge/page.tsx` | Knowledge dashboard |
| `frontend/app/(admin)/manajemen-data/kategori-learning/page.tsx` | Kategori management |
| `frontend/app/(admin)/manajemen-data/tags/page.tsx` | Tags management |

---

## 10. Status Final

| Item | Status |
|------|--------|
| Permission functions missing | ✅ Fixed |
| Controls baru (shared KMS+LMS) | ✅ Created |
| Rules missing | ✅ All seeded |
| permissions.py mapping | ✅ Updated |
| Super admin permissions | ✅ 100% (170/170) |
| Routes categories/tags | ✅ Replaced |
| Manajemen Data routes | ✅ Added |
| Sidebar Manajemen Data | ✅ Added |
| Dev mode hot reload | ✅ Active |

---

*Dokumen ini dibuat oleh **Nemotron 3 Ultra Free** (NVIDIA) via OpenCode agent pada 2026-06-11.*