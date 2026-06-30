# 16. Permission System - Explicit RoleRule & Super Admin Fix

## Tanggal: 2026-06-11

## Ringkasan Perubahan

Mengubah sistem permission dari **superadmin bypass (OVERRIDE)** ke **explicit RoleRule assignment** untuk Super Admin.

---

## 1. Perubahan Konfigurasi

### `backend/core/settings.py` (line 485)
```python
# SEBELUM
PERMISSIONS_SUPERADMIN_OVERRIDE = config('PERMISSIONS_SUPERADMIN_OVERRIDE', default=True, cast=bool)

# SESUDAH
PERMISSIONS_SUPERADMIN_OVERRIDE = config('PERMISSIONS_SUPERADMIN_OVERRIDE', default=False, cast=bool)
```

### `docker-compose.local.yml` (line 39)
```yaml
# SEBELUM
- PERMISSIONS_SUPERADMIN_OVERRIDE=True

# SESUDAH
- PERMISSIONS_SUPERADMIN_OVERRIDE=False
```

### `docker-compose.prod.yml` (line 38)
```yaml
# SEBELUM
- PERMISSIONS_SUPERADMIN_OVERRIDE=True

# SESUDAH
- PERMISSIONS_SUPERADMIN_OVERRIDE=False
```

---

## 2. Command Dijalankan

```bash
# Assign semua PermissionRule ke Super Admin group
python manage.py seed_superadmin_full_access
```

**Hasil:**
```
✅ Super Admin full access assigned. New assignments: 186
```

**Verifikasi:**
- Super Admin RoleRules: **186**
- Total PermissionRules aktif: **186**
- Prakom@admin2025.com groups: `['Super Admin']`
- is_superuser: `True`

---

## 3. Perbaikan Frontend

### 3a. Export `renderHtml` - `frontend/lib/utils.ts`
```typescript
export function renderHtml(html: string) {
    return { __html: html || '' }
}
```

### 3b. Fix Syntax Error - `frontend/app/(admin)/manajemen-data/tags/page.tsx`
Line 214-218: Hapus duplicate `<Badge>` tag

### 3c. Sidebar "Manajemen Data" - `frontend/components/admin/AdminSidebar.tsx`
Ditambahkan section baru:
```typescript
{
    title: 'Manajemen Data',
    items: [
        {
            name: 'Kategori Learning',
            href: '/manajemen-data/kategori-learning',
            icon: '📁',
            requiredModules: ['knowledge'],
        },
        {
            name: 'Tags',
            href: '/manajemen-data/tags',
            icon: '🏷️',
            requiredModules: ['knowledge'],
        },
    ],
},
```

---

## 4. Verifikasi Permission Granular

### Learning Module (31 rules)
| Control | Functions |
|---------|-----------|
| courses | view, create, edit, delete, **enroll** |
| modules | view, create, edit, delete |
| lessons | view, create, edit, delete |
| enrollments | view, create, edit, delete |
| quizzes | view, create, edit, delete, **attempt** |
| certificates | view, create, edit, delete |
| ratings | view, create, edit, delete |

### Knowledge Module (Updated)
| Control | Label |
|---------|-------|
| Md_kategori_learning | Kategori Learning (KMS+LMS) |
| Md_tags_learning | Tags Learning (KMS+LMS) |
| articles | Artikel |
| comments | Komentar |
| ratings | Rating |

---

## 5. Alur Permission Sekarang

```
Request → check_permission(user, module, control, function)
    ↓
PERMISSIONS_SUPERADMIN_OVERRIDE = False
    ↓
is_superadmin(user) → True (tapi TIDAK bypass)
    ↓
Cek RoleRule.objects.filter(role__in=user.groups, rule__module=..., rule__control=..., rule__function=...)
    ↓
Return True/False berdasarkan explicit assignment
```

---

## 6. Keuntungan

| Aspek | Sebelum (Override) | Sesudah (Explicit RoleRule) |
|-------|-------------------|----------------------------|
| **Audit** | Tidak bisa trace | Bisa lihat RoleRule per user |
| **Restrict Super Admin** | Harus ubah kode/setting | Cukup hapus RoleRule di DB |
| **Granular** | All-or-nothing | Per module/control/function |
| **Consistency** | Beda logic superuser vs regular | Sama untuk semua user |

---

## 7. File Terkait

| File | Perubahan |
|------|-----------|
| `backend/core/settings.py` | OVERRIDE default → False |
| `docker-compose.local.yml` | Env var → False |
| `docker-compose.prod.yml` | Env var → False |
| `frontend/lib/utils.ts` | Tambah `renderHtml` export |
| `frontend/app/(admin)/manajemen-data/tags/page.tsx` | Fix duplicate Badge |
| `frontend/components/admin/AdminSidebar.tsx` | Tambah section Manajemen Data |
| `backend/apps/manajemen/management/commands/seed_superadmin_full_access.py` | Dijalankan (186 rules) |

---

## 8. Status Final

| Item | Status |
|------|--------|
| PERMISSIONS_SUPERADMIN_OVERRIDE = False | ✅ Done |
| seed_superadmin_full_access executed | ✅ Done (186 rules) |
| Super Admin pakai explicit RoleRule | ✅ Verified |
| renderHtml export added | ✅ Done |
| Tags page syntax fixed | ✅ Done |
| Sidebar Manajemen Data added | ✅ Done |
| Knowledge permissions (Md_kategori_learning, Md_tags_learning) | ✅ Verified |
| Learning permissions (31 rules) | ✅ Verified |
| Frontend build success | ✅ Done |
| Container running | ✅ Done |