# User Accounts & Permissions - ASN Corpu Backend

## 📋 Daftar User Default

### 1. **Super Admin User** (Full Access)

#### User: Prakom@admin2025.com
```
Username: Prakom@admin2025.com
Password: Prakom@2025
Email: Prakom@admin2025.com
Name: Prakom Admin
Group: Super Admin
Status: ✅ Active
Knowledge Base Permissions: 23 (Full Access)
```

**Catatan**: Ini adalah satu-satunya Super Admin user yang dibuat oleh seeder. User ini memiliki akses penuh ke semua modul termasuk Knowledge Base.

### 2. **Regular Users** (Limited Access)

#### User 3: Pegawai Biasa
```
Username: 199411192019031001
Password: Pegawai@Pessel
Email: -
Name: Pegawai Biasa
Group: -
Status: ✅ Active
```

#### User 4: DOLLA YULIZA PERTAMA
```
Username: 199107202025212002
Password: (check database)
Email: 199107202025212002
Name: DOLLA YULIZA PERTAMA, S.Si.
Group: -
Status: ✅ Active
```

**Catatan**: User regular tidak memiliki group assignment, sehingga tidak memiliki akses ke Knowledge Base.

## 🔐 Permission System

### Knowledge Base Permissions (23 Total)

#### 1. **Articles** (7 permissions)
- `knowledge.articles.view` - Melihat artikel
- `knowledge.articles.create` - Membuat artikel baru
- `knowledge.articles.edit` - Mengedit artikel
- `knowledge.articles.delete` - Menghapus artikel
- `knowledge.articles.approve` - Menyetujui artikel
- `knowledge.articles.reject` - Menolak artikel
- `knowledge.articles.publish` - Mempublikasikan artikel

#### 2. **Category** (4 permissions)
- `knowledge.category.view` - Melihat kategori
- `knowledge.category.create` - Membuat kategori
- `knowledge.category.edit` - Mengedit kategori
- `knowledge.category.delete` - Menghapus kategori

#### 3. **Tags** (4 permissions)
- `knowledge.tags.view` - Melihat tags
- `knowledge.tags.create` - Membuat tags
- `knowledge.tags.edit` - Mengedit tags
- `knowledge.tags.delete` - Menghapus tags

#### 4. **Comments** (4 permissions)
- `knowledge.comments.view` - Melihat komentar
- `knowledge.comments.create` - Membuat komentar
- `knowledge.comments.edit` - Mengedit komentar
- `knowledge.comments.delete` - Menghapus komentar

#### 5. **Ratings** (4 permissions)
- `knowledge.ratings.view` - Melihat rating
- `knowledge.ratings.create` - Membuat rating
- `knowledge.ratings.edit` - Mengedit rating
- `knowledge.ratings.delete` - Menghapus rating

## 👥 Groups & Role Assignment

### Super Admin Group
```
Name: Super Admin
Members: 
  - Prakom@admin2025.com
Permissions: 23 Knowledge Base permissions (Full Access)
```

## 🔧 Management Commands

### 1. Seed Default Users
```bash
docker exec asncorpu_backend_app python manage.py seed_default_users
```

**Fungsi**: Membuat user default (Super Admin dan Pegawai Biasa)

**File**: `apps/accounts/management/commands/seed_default_users.py`

### 2. Seed Knowledge Base Permissions
```bash
docker exec asncorpu_backend_app python manage.py seed_knowledge_permissions
```

**Fungsi**: Membuat permission rules untuk Knowledge Base module

### 3. Seed Knowledge Base Menus
```bash
docker exec asncorpu_backend_app python manage.py seed_knowledge_menus
```

**Fungsi**: Membuat menu sidebar untuk Knowledge Base

### 4. Assign Full Access to Super Admin
```bash
docker exec asncorpu_backend_app python manage.py seed_superadmin_full_access
```

**Fungsi**: Memberikan semua permission ke group Super Admin

## 📊 Permission Check

### Cek User dan Permission
```python
from django.contrib.auth import get_user_model
from apps.manajemen.models import RoleRule

User = get_user_model()

# Get user
user = User.objects.get(username='Prakom@admin2025.com')

# Check groups
print(f"Groups: {[g.name for g in user.groups.all()]}")

# Check Knowledge Base permissions
for group in user.groups.all():
    kb_perms = RoleRule.objects.filter(
        role=group,
        rule__module__nama_module='knowledge'
    ).count()
    print(f"{group.name}: {kb_perms} KB permissions")
```

## 🚀 Quick Setup

### Setup Lengkap dari Awal
```bash
# 1. Seed menu categories
docker exec asncorpu_backend_app python manage.py seed_menu_categories

# 2. Seed default users
docker exec asncorpu_backend_app python manage.py seed_default_users

# 3. Seed Knowledge Base permissions
docker exec asncorpu_backend_app python manage.py seed_knowledge_permissions

# 4. Seed Knowledge Base menus
docker exec asncorpu_backend_app python manage.py seed_knowledge_menus

# 5. Assign full access to Super Admin
docker exec asncorpu_backend_app python manage.py seed_superadmin_full_access
```

## 🔍 Troubleshooting

### User tidak bisa akses Knowledge Base?

**Cek 1: Apakah user punya group?**
```python
user = User.objects.get(username='username')
print(user.groups.all())
```

**Solusi**: Tambahkan user ke group Super Admin
```python
from django.contrib.auth.models import Group
group = Group.objects.get(name='Super Admin')
user.groups.add(group)
```

**Cek 2: Apakah group punya permission?**
```python
from apps.manajemen.models import RoleRule
kb_perms = RoleRule.objects.filter(
    role__name='Super Admin',
    rule__module__nama_module='knowledge'
).count()
print(f"KB Permissions: {kb_perms}")
```

**Solusi**: Jalankan seeder
```bash
docker exec asncorpu_backend_app python manage.py seed_superadmin_full_access
```

### Menu tidak muncul di sidebar?

**Cek 1: Apakah menu ada di database?**
```python
from apps.manajemen.models import MenuItem
kb_menus = MenuItem.objects.filter(name__icontains='Knowledge')
for menu in kb_menus:
    print(f"{menu.name}: {menu.permission_key}")
```

**Cek 2: Apakah permission_key cocok dengan rules?**
```python
from apps.manajemen.models import PermissionRule
# Menu permission_key harus match dengan rule.permission_string
rule = PermissionRule.objects.filter(
    module__nama_module='knowledge',
    control__nama_kontrol='category',
    function__nama_fungsi='view'
).first()
print(f"Rule: {rule.permission_string}")  # Harus: knowledge.category.view
```

## 📝 Catatan Penting

### Format Permission String
```
{module}.{control}.{function}
```

**Contoh Benar**:
- ✅ `knowledge.category.view`
- ✅ `knowledge.articles.create`
- ✅ `knowledge.tags.edit`

**Contoh Salah**:
- ❌ `knowledge.categories.view` (ada 's')
- ❌ `knowledge.article.view` (tanpa 's')
- ❌ `knowledge_category_view` (format salah)

### User Model Custom
Project ini menggunakan custom User model tanpa field `is_superuser` dan `is_staff`. Permission management menggunakan sistem custom dengan:
- **PermissionModule**: Module/Sidebar Menu
- **PermissionControl**: Controls/Resources
- **PermissionFunction**: Functions/Actions
- **PermissionRule**: Module + Control + Function
- **RoleRule**: Group (Role) + Rule

## 📅 Last Updated
11 Mei 2026

**Changelog**:
- User `admin` dihapus dari seeder dan database
- Ownership artikel ditransfer ke `Prakom@admin2025.com`
- Hanya 1 Super Admin user yang dibuat oleh seeder
