# 🌱 Database Seeding Implementation Guide

**Panduan Lengkap Database Seeding**

---

## 📋 Overview

Panduan ini menjelaskan cara membuat database seeder dari nol. **Bukan template**, tapi **panduan** yang bisa kamu ikuti atau minta AI untuk implementasi.

**Inspired by:** `docs/database/SEEDING_GUIDE.md` (ESIMPEG-Python)

---

## 🎯 Struktur Seeder

### File yang Dibutuhkan:

```
apps/your_app/management/commands/
├── __init__.py
└── seed_your_data.py    ← Management command
```

---

## 📝 Step-by-Step Implementation

### Step 1: Create Folder Structure

```bash
mkdir -p apps/your_app/management/commands
touch apps/your_app/management/commands/__init__.py
```

### Step 2: Create Management Command

**File:** `apps/your_app/management/commands/seed_your_data.py`

**Struktur Umum:**
```python
from django.core.management.base import BaseCommand
from apps.your_app.models import YourModel

class Command(BaseCommand):
    help = 'Seed YourModel data'
    
    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true')
    
    def handle(self, *args, **options):
        if options.get('clear'):
            YourModel.objects.all().delete()
        
        data = [
            {'name': 'Item 1', 'slug': 'item-1'},
            {'name': 'Item 2', 'slug': 'item-2'},
        ]
        
        for item_data in data:
            obj, created = YourModel.objects.update_or_create(
                slug=item_data['slug'],
                defaults=item_data
            )
            
            if created:
                self.stdout.write(f'✅ Created: {obj.name}')
            else:
                self.stdout.write(f'♻️  Updated: {obj.name}')
        
        self.stdout.write(self.style.SUCCESS('✅ Seed complete!'))
```

### Step 3: Run Seeder

```bash
# Run seeder
docker exec asncorpu_backend_app python manage.py seed_your_data

# With options
docker exec asncorpu_backend_app python manage.py seed_your_data --clear
```

---

## 🎯 Seeding Patterns

### Pattern 1: Simple (Idempotent)

```python
# Safe to run multiple times
for item_data in data:
    obj, created = YourModel.objects.update_or_create(
        slug=item_data['slug'],
        defaults=item_data
    )
```

**Keuntungan:**
- ✅ Safe to run multiple times
- ✅ Updates existing data
- ✅ No duplicates

### Pattern 2: Bulk Insert (Fast)

```python
# For large datasets
items = [
    YourModel(name='Item 1', slug='item-1'),
    YourModel(name='Item 2', slug='item-2'),
]

YourModel.objects.bulk_create(items, ignore_conflicts=True)
```

**Keuntungan:**
- ✅ Very fast (1 query)
- ✅ Good for large datasets

### Pattern 3: Import from External

```python
# Import from CSV
import csv

with open('data.csv', 'r') as file:
    reader = csv.DictReader(file)
    for row in reader:
        YourModel.objects.update_or_create(
            slug=row['slug'],
            defaults={'name': row['name']}
        )
```

### Pattern 4: Import from Another Database

```python
# Import from Laravel database
from django.db import connections

with connections['laravel'].cursor() as cursor:
    cursor.execute("SELECT * FROM categories")
    rows = cursor.fetchall()
    
    for row in rows:
        YourModel.objects.update_or_create(
            id=row[0],
            defaults={'name': row[1], 'slug': row[2]}
        )
```

---

## 🔧 Common Options

### Command Arguments

```python
def add_arguments(self, parser):
    # Clear existing data
    parser.add_argument('--clear', action='store_true')
    
    # Limit number
    parser.add_argument('--limit', type=int, default=None)
    
    # Include deleted
    parser.add_argument('--include-deleted', action='store_true')
    
    # Skip existing
    parser.add_argument('--skip-existing', action='store_true')
```

### Usage

```bash
# Clear and reseed
docker exec asncorpu_backend_app python manage.py seed_data --clear

# Seed only 100 items
docker exec asncorpu_backend_app python manage.py seed_data --limit 100

# Include deleted items
docker exec asncorpu_backend_app python manage.py seed_data --include-deleted
```

---

## ✅ Best Practices

1. **Make idempotent** - Safe to run multiple times
2. **Use transactions** - All or nothing
3. **Show progress** - User feedback
4. **Handle errors** - Graceful failure
5. **Use bulk operations** - Performance

---

## 🎯 Contoh Lengkap: Kategori Buku

### Request ke AI:

"Buat seeder untuk kategori_buku dengan data: Fiction, Non-Fiction, Science, History"

### AI akan buat:

1. Management command di `apps/books/management/commands/seed_book_categories.py`
2. Data seeding logic
3. Progress output
4. Error handling

### Run:

```bash
docker exec asncorpu_backend_app python manage.py seed_book_categories
```

### Result:

```
✅ Created: Fiction
✅ Created: Non-Fiction
✅ Created: Science
✅ Created: History
✅ Seed complete!
```

---

---

## 🎯 Complete Setup: Permission + Sidebar + Data

### Untuk CRUD yang Lengkap, Perlu 3 Seeder:

#### 1. **Permission Seeder** - Akses control

```python
# apps/your_app/management/commands/seed_permissions.py
class Command(BaseCommand):
    help = 'Seed permissions for your_app'
    
    def handle(self, *args, **options):
        from apps.permissions.models import Permission
        
        permissions = [
            {
                'module': 'your_app',
                'control': 'your_model',
                'function': 'view',
                'name': 'View Your Model',
            },
            {
                'module': 'your_app',
                'control': 'your_model',
                'function': 'create',
                'name': 'Create Your Model',
            },
            {
                'module': 'your_app',
                'control': 'your_model',
                'function': 'edit',
                'name': 'Edit Your Model',
            },
            {
                'module': 'your_app',
                'control': 'your_model',
                'function': 'delete',
                'name': 'Delete Your Model',
            },
        ]
        
        for perm_data in permissions:
            perm, created = Permission.objects.update_or_create(
                module=perm_data['module'],
                control=perm_data['control'],
                function=perm_data['function'],
                defaults={'name': perm_data['name']}
            )
            
            if created:
                self.stdout.write(f'✅ Created permission: {perm.name}')
```

**Run:**
```bash
docker exec asncorpu_backend_app python manage.py seed_permissions
```

#### 2. **Sidebar/Menu Seeder** - Tampilan menu

```python
# apps/your_app/management/commands/seed_menus.py
class Command(BaseCommand):
    help = 'Seed sidebar menus'
    
    def handle(self, *args, **options):
        from apps.sidebar.models import SidebarMenu
        
        # Parent menu
        parent, _ = SidebarMenu.objects.update_or_create(
            name='Master Data',
            defaults={
                'icon': 'fas fa-database',
                'order': 10,
                'is_active': True,
            }
        )
        
        # Child menu
        menu, created = SidebarMenu.objects.update_or_create(
            name='Your Model',
            defaults={
                'parent': parent,
                'url': '/your-app/your-model/',
                'icon': 'fas fa-list',
                'order': 1,
                'is_active': True,
                'permission_key': 'your_app.your_model.view',
            }
        )
        
        if created:
            self.stdout.write(f'✅ Created menu: {menu.name}')
```

**Run:**
```bash
docker exec asncorpu_backend_app python manage.py seed_menus
```

#### 3. **Data Seeder** - Master data

```python
# apps/your_app/management/commands/seed_your_data.py
class Command(BaseCommand):
    help = 'Seed your model data'
    
    def handle(self, *args, **options):
        from apps.your_app.models import YourModel
        
        data = [
            {'name': 'Item 1', 'slug': 'item-1'},
            {'name': 'Item 2', 'slug': 'item-2'},
        ]
        
        for item_data in data:
            obj, created = YourModel.objects.update_or_create(
                slug=item_data['slug'],
                defaults=item_data
            )
            
            if created:
                self.stdout.write(f'✅ Created: {obj.name}')
```

**Run:**
```bash
docker exec asncorpu_backend_app python manage.py seed_your_data
```

---

## 🎯 Complete Setup Script

### Buat Script untuk Run Semua Seeder

**File:** `scripts/seed_all.sh`

```bash
#!/bin/bash

echo "🌱 Starting complete seed process..."

# 1. Seed permissions
echo "📋 Seeding permissions..."
docker exec asncorpu_backend_app python manage.py seed_permissions

# 2. Seed menus
echo "📋 Seeding menus..."
docker exec asncorpu_backend_app python manage.py seed_menus

# 3. Seed master data
echo "📋 Seeding master data..."
docker exec asncorpu_backend_app python manage.py seed_your_data

# 4. Assign permissions to superadmin
echo "📋 Assigning permissions to superadmin..."
docker exec asncorpu_backend_app python manage.py seed_superadmin_full_access

echo "✅ Complete seed process finished!"
```

**Run:**
```bash
chmod +x scripts/seed_all.sh
./scripts/seed_all.sh
```

---

## 🎯 Contoh Lengkap: Kategori Buku

### Request ke AI:

"Buat complete setup untuk kategori_buku: permission, sidebar, dan data seeding"

### AI akan buat:

#### 1. Permission Seeder
```bash
docker exec asncorpu_backend_app python manage.py seed_book_category_permissions
```

**Result:**
```
✅ Created permission: View Book Category
✅ Created permission: Create Book Category
✅ Created permission: Edit Book Category
✅ Created permission: Delete Book Category
```

#### 2. Sidebar Seeder
```bash
docker exec asncorpu_backend_app python manage.py seed_book_category_menus
```

**Result:**
```
✅ Created menu: Master Data
✅ Created menu: Book Categories
```

#### 3. Data Seeder
```bash
docker exec asncorpu_backend_app python manage.py seed_book_categories
```

**Result:**
```
✅ Created: Fiction
✅ Created: Non-Fiction
✅ Created: Science
✅ Created: History
```

#### 4. Assign to Superadmin
```bash
docker exec asncorpu_backend_app python manage.py seed_superadmin_full_access
```

**Result:**
```
✅ Superadmin now has access to all permissions
```

### Final Result:

**Sidebar akan tampil:**
```
Master Data
  └─ Book Categories  (dengan icon & permission check)
```

**User dengan permission bisa:**
- ✅ View list kategori buku
- ✅ Create kategori baru
- ✅ Edit kategori
- ✅ Delete kategori

**User tanpa permission:**
- ❌ Menu tidak tampil di sidebar
- ❌ Tidak bisa akses URL

---

## 📊 Seeding Order (Penting!)

### Urutan yang Benar:

```
1. Permissions      ← Harus pertama (untuk access control)
2. Menus/Sidebar    ← Kedua (butuh permission_key)
3. Master Data      ← Ketiga (data actual)
4. Superadmin Access ← Terakhir (assign all permissions)
```

### Kenapa Urutan Penting?

```python
# ❌ SALAH: Menu dulu, permission belum ada
SidebarMenu.objects.create(
    name='Book Categories',
    permission_key='books.book_category.view'  # Permission belum ada!
)

# ✅ BENAR: Permission dulu, baru menu
# 1. Seed permission
Permission.objects.create(
    module='books',
    control='book_category',
    function='view'
)

# 2. Baru seed menu
SidebarMenu.objects.create(
    name='Book Categories',
    permission_key='books.book_category.view'  # Permission sudah ada!
)
```

---

## 🔗 Related Documentation

- [SEEDING_GUIDE.md](../../docs/database/SEEDING_GUIDE.md) - Original guide (ESIMPEG-Python)
- [012_BACKEND_FRONTEND_COMMUNICATION.md](../docs/012_BACKEND_FRONTEND_COMMUNICATION.md) - API guide
- [011_DJANGO_ADMIN_PANEL.md](../docs/011_DJANGO_ADMIN_PANEL.md) - Admin panel

---

---

## 🎯 Knowledge Base Seeding (Complete Example)

### Real Implementation: Knowledge Base System

Contoh lengkap seeding untuk Knowledge Base System yang sudah production-ready.

#### 1️⃣ Categories Seeder

**File:** `apps/knowledge/management/commands/seed_knowledge_categories.py`

```bash
docker exec asncorpu_backend_app python manage.py seed_knowledge_categories
```

**Result:**
```
✅ Created: Teknologi
  ✅ Created: Teknologi > Programming
  ✅ Created: Teknologi > Database
  ✅ Created: Teknologi > DevOps
✅ Created: Kepegawaian
  ✅ Created: Kepegawaian > Peraturan
  ✅ Created: Kepegawaian > Tunjangan
✅ Created: Tutorial
✅ Created: Berita
✅ Created: FAQ

✅ Seeding complete! Created: 13, Updated: 0
```

#### 2️⃣ Tags Seeder

**File:** `apps/knowledge/management/commands/seed_knowledge_tags.py`

```bash
docker exec asncorpu_backend_app python manage.py seed_knowledge_tags
```

**Result:**
```
✅ Created: Python
✅ Created: Django
✅ Created: JavaScript
✅ Created: ASN
✅ Created: Tutorial
... (27 tags total)

✅ Seeding complete! Created: 27, Updated: 0
```

#### 3️⃣ Sample Articles Seeder

**File:** `apps/knowledge/management/commands/seed_knowledge_sample_articles.py`

```bash
docker exec asncorpu_backend_app python manage.py seed_knowledge_sample_articles
```

**Result:**
```
📝 Author: admin
✅ Created: Panduan Lengkap Django REST Framework
✅ Created: Optimasi Query Database dengan Django ORM
✅ Created: Cara Menggunakan Sistem Knowledge Base
✅ Created: Peraturan Tunjangan Kinerja ASN 2026

✅ Seeding complete! Created: 4, Updated: 0
```

#### 4️⃣ Complete Setup (3 Commands)

```bash
# Run in order (dependencies)
docker exec asncorpu_backend_app python manage.py seed_knowledge_categories
docker exec asncorpu_backend_app python manage.py seed_knowledge_tags
docker exec asncorpu_backend_app python manage.py seed_knowledge_sample_articles
```

**Total Time:** < 1 minute  
**Total Records:** 52 records across 4 tables

#### 5️⃣ Verification

```bash
# Test API endpoints
curl http://localhost:8000/knowledge/api/categories/
curl http://localhost:8000/knowledge/api/tags/
curl http://localhost:8000/knowledge/api/articles/

# Check database
docker exec asncorpu_backend_app python manage.py shell
>>> from apps.knowledge.models import Category, Tag, Article
>>> Category.objects.count()  # 13
>>> Tag.objects.count()       # 27
>>> Article.objects.count()   # 4
```

#### 6️⃣ Key Features

- ✅ **Hierarchical Categories** (parent-child structure)
- ✅ **Rich Tags** (technology, ASN, general tags)
- ✅ **Sample Articles** (with Markdown content)
- ✅ **Idempotent** (safe to run multiple times)
- ✅ **Clear Options** (--clear flag)
- ✅ **Author Selection** (--user flag)

**📚 Complete Documentation:** [Knowledge Base Seeding Guide](../file_dari_sonnet/docs/knowledge/11_SEEDING_GUIDE.md)

---

**Last Updated:** May 7, 2026


---

## ⚠️ PENTING: Jangan Pakai Shell Script (.sh)

**Programmer tidak suka shell script!**

Alasan:
- ❌ Tidak portable (Linux/Mac vs Windows)
- ❌ Sulit di-debug
- ❌ Tidak konsisten dengan Django workflow
- ❌ Menambah complexity yang tidak perlu

**✅ Gunakan Django Management Commands Langsung:**

```bash
# GOOD ✅ - Direct Django commands
docker exec esimpeg_python_app python manage.py seed_laporan_permissions
docker exec esimpeg_python_app python manage.py seed_laporan_menus
docker exec esimpeg_python_app python manage.py seed_superadmin_full_access

# BAD ❌ - Shell script
./setup_laporan.sh
```

**Keuntungan Manual Commands:**
- ✅ Clear & explicit
- ✅ Easy to debug
- ✅ Works everywhere (Linux/Mac/Windows)
- ✅ Consistent with Django best practices
- ✅ Can run individually if one fails

---

## 🎯 Real-World Example: Laporan Data - Jabatan Struktural Tidak Terisi

### Contoh Lengkap dari ESIMPEG-Python (Production-Ready)

Ini contoh implementasi fitur "Laporan Data - Jabatan Struktural Tidak Terisi" yang sudah production-ready di ESIMPEG-Python.

---

### 1️⃣ Permission Seeder

**File:** `apps/laporan/management/commands/seed_laporan_permissions.py`

```python
"""
Seed permissions for Laporan Data module
Run: python manage.py seed_laporan_permissions
"""
from django.core.management.base import BaseCommand
from apps.manajemen.models import PermissionModule, PermissionControl, PermissionFunction, PermissionRule


class Command(BaseCommand):
    help = 'Seed permissions for Laporan Data module'

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS('🌱 Seeding Laporan Data Permissions'))
        self.stdout.write('=' * 70)

        # 1. Create/Update Module
        module, created = PermissionModule.objects.update_or_create(
            name='laporan',
            defaults={
                'display_name': 'Laporan Data',
                'description': 'Module untuk laporan dan analisis data kepegawaian',
                'is_active': True,
            }
        )
        if created:
            self.stdout.write('  ✓ Created module: Laporan Data')
        else:
            self.stdout.write('  ✓ Updated module: Laporan Data')

        # 2. Create/Update Control
        control, created = PermissionControl.objects.update_or_create(
            module=module,
            name='jabatan_struktural_kosong',
            defaults={
                'display_name': 'Jabatan Struktural Tidak Terisi',
                'description': 'Laporan jabatan struktural yang belum terisi pegawai',
                'is_active': True,
            }
        )
        if created:
            self.stdout.write('  ✓ Created control: Jabatan Struktural Tidak Terisi')

        # 3. Create/Update Functions & Rules
        functions_data = [
            {
                'name': 'view',
                'display_name': 'Lihat Laporan Jabatan Struktural Tidak Terisi',
                'description': 'Akses untuk melihat laporan jabatan struktural yang tidak terisi',
            },
            {
                'name': 'export',
                'display_name': 'Export Laporan Jabatan Struktural Tidak Terisi',
                'description': 'Akses untuk export laporan',
            },
        ]

        for func_data in functions_data:
            func, created = PermissionFunction.objects.update_or_create(
                control=control,
                name=func_data['name'],
                defaults={
                    'display_name': func_data['display_name'],
                    'description': func_data['description'],
                    'is_active': True,
                }
            )
            
            # Create Rule
            rule, created = PermissionRule.objects.update_or_create(
                function=func,
                defaults={
                    'name': f'{module.name}.{control.name}.{func.name}',
                    'display_name': func_data['display_name'],
                    'description': func_data['description'],
                    'is_active': True,
                }
            )
            if created:
                self.stdout.write(f'    ✓ Created rule: {rule.name}')

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('✅ Laporan Data permissions seeded successfully!'))
```

**Run:**
```bash
docker exec esimpeg_python_app python manage.py seed_laporan_permissions
```

**Result:**
```
======================================================================
🌱 Seeding Laporan Data Permissions
======================================================================
  ✓ Created module: Laporan Data
  ✓ Created control: Jabatan Struktural Tidak Terisi
    ✓ Created rule: laporan.jabatan_struktural_kosong.view
    ✓ Created rule: laporan.jabatan_struktural_kosong.export

✅ Laporan Data permissions seeded successfully!
```

---

### 2️⃣ Menu Seeder

**File:** `apps/laporan/management/commands/seed_laporan_menus.py`

```python
"""
Seed sidebar menus for Laporan Data module
Run: python manage.py seed_laporan_menus
"""
from django.core.management.base import BaseCommand
from apps.manajemen.models import MenuItem


class Command(BaseCommand):
    help = 'Seed sidebar menus for Laporan Data module'

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS('🌱 Seeding Laporan Data Menus'))
        self.stdout.write('=' * 70)

        # 1. Parent Menu: Laporan Data
        parent_menu, created = MenuItem.objects.update_or_create(
            name='Laporan Data',
            parent__isnull=True,
            defaults={
                'type': 'menuItem',
                'icon': 'fas fa-chart-bar',
                'order': 5,
                'category': 3,  # Category 3 = Laporan
                'is_active': True,
            }
        )
        if created:
            self.stdout.write('  ✓ Created parent menu: Laporan Data')

        # 2. Child Menu: Jabatan Struktural Tidak Terisi
        child_menu, created = MenuItem.objects.update_or_create(
            name='Jabatan Struktural Tidak Terisi',
            parent=parent_menu,
            defaults={
                'permission_key': 'laporan.jabatan_struktural_kosong.view',
                'url_name': 'laporan:jabatan_struktural_kosong_list',
                'icon': 'fas fa-briefcase',
                'type': 'module',
                'order': 1,
                'category': 3,
                'is_active': True,
            }
        )
        if created:
            self.stdout.write('  ✓ Created child menu: Jabatan Struktural Tidak Terisi')

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('✅ Laporan Data menus seeded successfully!'))
        self.stdout.write('')
        self.stdout.write('Menu structure:')
        self.stdout.write('  Laporan Data')
        self.stdout.write('    └─ Jabatan Struktural Tidak Terisi')
```

**Run:**
```bash
docker exec esimpeg_python_app python manage.py seed_laporan_menus
```

**Result:**
```
======================================================================
🌱 Seeding Laporan Data Menus
======================================================================
  ✓ Created parent menu: Laporan Data
  ✓ Created child menu: Jabatan Struktural Tidak Terisi

✅ Laporan Data menus seeded successfully!

Menu structure:
  Laporan Data
    └─ Jabatan Struktural Tidak Terisi
```

---

### 3️⃣ Assign to Superadmin (Otomatis!)

**Command yang sudah ada:**

```bash
docker exec esimpeg_python_app python manage.py seed_superadmin_full_access
```

**Fungsi:**
- ✅ Otomatis assign SEMUA PermissionRule yang aktif ke group "Super Admin"
- ✅ Idempotent (safe to run multiple times)
- ✅ Tidak perlu manual assign per permission
- ✅ Cukup run 1x setelah seed permission baru

**Result:**
```
✅ Super Admin full access assigned. New assignments: 2
```

**Catatan Penting:**
- Command ini akan scan SEMUA `PermissionRule.objects.filter(is_active=True)`
- Lalu assign ke group "Super Admin" (atau group yang di-config di settings)
- Jadi setiap kali ada permission baru, cukup run command ini
- Tidak perlu edit code atau manual assign

---

### 4️⃣ Manual Setup (Recommended)

**Run 3 commands manually:**

```bash
# 1. Seed Permissions
docker exec esimpeg_python_app python manage.py seed_laporan_permissions

# 2. Seed Menus
docker exec esimpeg_python_app python manage.py seed_laporan_menus

# 3. Assign to Superadmin
docker exec esimpeg_python_app python manage.py seed_superadmin_full_access
```

**Why Manual?**
- ✅ Clear & explicit
- ✅ Easy to debug if one fails
- ✅ Can run individually
- ✅ Works everywhere (Linux/Mac/Windows)
- ✅ Consistent with Django best practices

**⚠️ Jangan Pakai Shell Script (.sh):**
- ❌ Tidak portable
- ❌ Sulit di-debug
- ❌ Menambah complexity
- ❌ Programmer tidak suka

---

### 5️⃣ Sidebar Result

Setelah setup, sidebar akan tampil:

```
📊 Laporan Data
  └─ 💼 Jabatan Struktural Tidak Terisi
```

**Permission Check:**
- ✅ User dengan permission `laporan.jabatan_struktural_kosong.view` → Menu tampil
- ❌ User tanpa permission → Menu tidak tampil
- ❌ Direct URL access tanpa permission → 403 Forbidden

---

### 6️⃣ Key Learnings

**✅ Best Practices:**

1. **Idempotent Seeders** - Safe to run multiple times
   ```python
   obj, created = Model.objects.update_or_create(
       unique_field='value',
       defaults={'other': 'fields'}
   )
   ```

2. **Hierarchical Structure** - Module → Control → Function → Rule
   ```
   laporan (module)
     └─ jabatan_struktural_kosong (control)
          ├─ view (function) → laporan.jabatan_struktural_kosong.view (rule)
          └─ export (function) → laporan.jabatan_struktural_kosong.export (rule)
   ```

3. **Menu Categories** - Organize by category
   - Category 1: Pengaturan Sistem
   - Category 2: Data Pegawai
   - Category 3: Laporan ← Our category
   - Category 6: Beranda

4. **Auto Superadmin Access** - No manual assignment needed
   - `seed_superadmin_full_access` handles all active rules
   - Run once after seeding new permissions
   - Idempotent & safe

5. **Setup Script** - One command to rule them all
   - Combines all seeding steps
   - User-friendly output
   - Error handling

---

### 7️⃣ Testing Checklist

**Setup Testing:**
- [ ] Run 3 manual commands (permissions, menus, superadmin)
- [ ] Check permissions in DB: `PermissionRule.objects.filter(name__startswith='laporan')`
- [ ] Check menus in DB: `MenuItem.objects.filter(name='Laporan Data')`
- [ ] Check superadmin access: `RoleRule.objects.filter(rule__name__startswith='laporan')`

**Functional Testing:**
- [ ] Login as superadmin
- [ ] Sidebar shows "Laporan Data" menu
- [ ] Click menu → Page loads
- [ ] Filter works
- [ ] Export works

**Permission Testing:**
- [ ] Create user without permission
- [ ] Menu tidak tampil
- [ ] Direct URL → 403

---

### 📚 Complete File Structure

```
apps/laporan/
├── __init__.py
├── apps.py
├── urls.py
├── views.py
├── README.md
├── setup_laporan.sh                     ← Quick setup
├── management/
│   ├── __init__.py
│   └── commands/
│       ├── __init__.py
│       ├── seed_laporan_permissions.py  ← Permission seeder
│       └── seed_laporan_menus.py        ← Menu seeder
└── templates/
    └── laporan/
        └── jabatan_struktural_kosong/
            ├── list.html
            └── partials/
                └── _table.html
```

---

### 🎯 Summary

**3 Manual Commands = Complete Setup**

```bash
# Just run these 3 commands:
docker exec esimpeg_python_app python manage.py seed_laporan_permissions
docker exec esimpeg_python_app python manage.py seed_laporan_menus
docker exec esimpeg_python_app python manage.py seed_superadmin_full_access
```

**Result:**
- ✅ Permissions created
- ✅ Menu displayed in sidebar
- ✅ Superadmin has access
- ✅ Ready for production

**Time to Setup:** < 1 minute (3 commands)

**⚠️ Note:** Jangan pakai shell script (.sh) - programmer tidak suka!

---

**Last Updated:** 27 April 2026  
**Source:** ESIMPEG-Python Production Implementation
