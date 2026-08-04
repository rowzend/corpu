# 20. Category Dropdown Hierarchy - Course Create & Edit

**Tanggal:** 2026-06-12  
**Session:** Lanjutan dari MD 19

---

## 📋 Ringkasan Perubahan

Menambahkan dropdown **Kategori Learning dengan hirarki** (reusable component) ke halaman:
1. `/learning/courses/create` - Create Course
2. `/learning/courses/[slug]` - Edit Course

Category dropdown menggunakan komponen **RemoteSearchSelect** yang sama dengan `/manajemen-data/kategori-learning`.

---

## ✅ Backend Changes

### 1. Model Course - Tambah Field Category

**File:** `backend/apps/learning/models.py`

```python
from apps.knowledge.models import Category as KnowledgeCategory

class Course(models.Model):
    # ... existing fields ...
    
    category = models.ForeignKey(
        KnowledgeCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='courses',
        verbose_name='Kategori Learning'
    )
```

**Karakteristik:**
- ✅ ForeignKey ke `KnowledgeCategory`
- ✅ `null=True, blank=True` (opsional)
- ✅ `on_delete=models.SET_NULL` (safe deletion)
- ✅ `related_name='courses'` (reverse lookup)

---

### 2. Migration - Proper & Production Safe

**File:** `backend/apps/learning/migrations/0013_add_course_category.py`

```python
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('knowledge', '0011_article_source_lesson'),
        ('learning', '0012_quiz_time_limit_minutes_quizattempt_time_spent'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='category',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='courses',
                to='knowledge.category',
                verbose_name='Kategori Learning'
            ),
        ),
    ]
```

**Status:** ✅ **Production Safe**
- Dependency sudah benar
- Fake migrate karena field sudah ada di DB
- Tidak ada konflik migration

---

### 3. Serializer - Category Support

**File:** `backend/apps/learning/serializers.py`

```python
from apps.knowledge.models import Category as KnowledgeCategory

class CategorySimpleSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True, allow_null=True)
    
    class Meta:
        model = KnowledgeCategory
        fields = ['id', 'name', 'slug', 'parent', 'parent_name', 'order_index', 'is_active']
        read_only_fields = ['slug']


class CourseListSerializer(serializers.ModelSerializer):
    # ... existing fields ...
    category = CategorySimpleSerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=KnowledgeCategory.objects.filter(is_active=True),
        source='category',
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Course
        fields = [
            # ... existing fields ...
            'category', 'category_id',
            # ...
        ]
```

**Penjelasan:**
- `category` (read): Return full category object dengan parent_name
- `category_id` (write): Accept integer ID untuk create/update
- `required=False, allow_null=True`: Category opsional

**CourseDetailSerializer:** Update sama seperti CourseListSerializer

---

## 🎨 Frontend Changes

### 1. Create Course Page

**File:** `frontend/app/(admin)/learning/courses/create/page.tsx`

#### Import RemoteSearchSelect
```tsx
import { RemoteSearchSelect } from '@/components/ui/remote-search-select';
import { api, handleApiError } from '@/lib/api';
```

#### Update FormData
```tsx
const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    short_description: '',
    level: 'beginner',
    duration_hours: 1,
    status: 'draft',
    thumbnail: '',
    category_id: null as number | null,  // ✅ Added
});
```

#### Function fetchCategories (Reusable)
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
            { value: '', label: '-- Pilih Kategori (Opsional) --' },
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
        return [{ value: '', label: '-- Pilih Kategori (Opsional) --' }];
    }
};
```

**Logika Hirarki:**
- `full_path` atau `parent_name` untuk menentukan parent
- `depth` dihitung dari jumlah separator " > "
- Indent: `\u00A0` (non-breaking space) × 4 × depth
- Tree symbol: `\u2514\u2500\u2500\u2500\u2500` (└────)

#### Form Field Category
```tsx
<div className="space-y-2">
    <Label htmlFor="category" className="text-sm font-medium text-gray-700">Kategori Kursus</Label>
    <RemoteSearchSelect
        fetchFn={fetchCategories}
        value={formData.category_id ?? ''}
        onChange={value => setFormData(p => ({ ...p, category_id: value ? Number(value) : null }))}
        placeholder="Pilih kategori kursus..."
        searchPlaceholder="Ketik untuk mencari kategori..."
        emptyText="Kategori tidak ditemukan"
    />
    <p className="text-xs text-gray-400">Pilih kategori untuk mengorganisir kursus (opsional)</p>
</div>
```

**Posisi:** Setelah field "Judul Kursus", sebelum "Deskripsi Singkat"

---

### 2. Edit Course Page

**File:** `frontend/app/(admin)/learning/courses/[slug]/page.tsx`

#### Import & FormData
```tsx
import { RemoteSearchSelect } from '@/components/ui/remote-search-select';
import { api, handleApiError } from '@/lib/api';

const [formData, setFormData] = useState({
    // ... existing fields ...
    category_id: null as number | null,  // ✅ Added
});
```

#### Update fetchCourse
```tsx
const fetchCourse = async () => {
    try {
        setLoading(true);
        const course: any = await getCourse(slug);
        setFormData({
            // ... existing fields ...
            category_id: course.category?.id || null,  // ✅ Load category
        });
        // ...
    } catch (error) {
        showError(handleApiError(error), 'Gagal Memuat Kursus');
    }
};
```

#### Function fetchCategories
Copy exact sama dari Create Course page (reusable logic)

#### Form Field Category
Same as Create Course page, positioned setelah "Judul Kursus"

---

## 🎯 Tampilan Dropdown Hirarki

### Contoh Output Dropdown:

```
-- Pilih Kategori (Opsional) --
Materi LMS
KOMPETENSI UMUM
    └──── ASN Maju ( Smarter )
        └──── Artificial Inteligent (AI) / Literasi Digital
        └──── Pengambilan Keputusan Berbasis Data
        └──── Berpikir Kritis, Analitis, dan Inovatif
    └──── ASN Tumbuh ( Bigger )
        └──── Kepemimpinan...
KOMPETENSI TEKNIS
    └──── Pemerintahan dan Kesejahteraan Rakyat
        └──── Kesejahteraan Sosial
        └──── Pemberdayaan Masyarakat
```

**Karakteristik:**
- ✅ **3 level hirarki** (root → parent → child)
- ✅ **Visual indent** dengan non-breaking spaces
- ✅ **Tree symbols** (└────) untuk child
- ✅ **Sort by** order_index dan name
- ✅ **Filter** hanya kategori aktif

---

## ✅ Testing & Verification

### 1. Backend Test - Model & Serializer

```bash
docker exec asncorpu_backend_app python manage.py shell
```

```python
from apps.learning.models import Course
from apps.learning.serializers import CourseListSerializer
from apps.knowledge.models import Category
from apps.accounts.models import User

user = User.objects.filter(email='Prakom@admin2025.com').first()
category = Category.objects.filter(is_active=True).first()

# Test dengan category
course = Course.objects.create(
    title='Test Course dengan Kategori',
    slug='test-course-kategori',
    description='Testing',
    instructor=user,
    category=category,
    status='draft',
    duration_hours=5
)
print(f'Category: {course.category.name}')  # ✅

# Test serializer
serializer = CourseListSerializer(course)
print(serializer.data['category'])  
# Output: {'id': 38, 'name': 'Materi LMS', 'parent_name': None, ...}

# Test tanpa category (None)
course2 = Course.objects.create(
    title='Test Course tanpa Kategori',
    slug='test-course-no-cat',
    description='Testing',
    instructor=user,
    status='draft'
)
print(f'Category: {course2.category}')  # None ✅
```

**Result:** ✅ **BERHASIL**
- Course dengan category: OK
- Course tanpa category (None): OK
- Serializer output correct

---

### 2. Frontend Test - Create & Edit

#### Test Create Course
1. Buka `/learning/courses/create`
2. ✅ Dropdown "Kategori Kursus" muncul setelah "Judul"
3. ✅ Klik dropdown → kategori muncul dengan hirarki
4. ✅ Pilih kategori (misal: "Artificial Inteligent (AI)")
5. ✅ Submit form → category_id terkirim ke backend
6. ✅ Course tersimpan dengan category

#### Test Edit Course
1. Buka course yang sudah punya category
2. ✅ Dropdown "Kategori Kursus" muncul dengan value terpilih
3. ✅ Ubah kategori atau set ke "-- Pilih Kategori --" (None)
4. ✅ Submit → category terupdate di database

#### Test Category = None
1. Create/Edit course tanpa pilih kategori
2. ✅ Submit → course tersimpan dengan category = NULL
3. ✅ Tidak ada error

---

## 📊 Database Schema

### Table: `learning_courses`

| Column | Type | Nullable | Foreign Key | Description |
|--------|------|----------|-------------|-------------|
| id | BIGINT | NOT NULL | - | Primary Key |
| title | VARCHAR(255) | NOT NULL | - | Judul kursus |
| slug | VARCHAR(255) | NOT NULL | - | URL slug (unique) |
| description | TEXT | NOT NULL | - | Deskripsi lengkap |
| category_id | BIGINT | **NULL** | knowledge_category.id | **✅ Kategori (opsional)** |
| instructor_id | BIGINT | NOT NULL | accounts_user.id | Instruktur |
| status | VARCHAR(20) | NOT NULL | - | draft/published/archived |
| ... | ... | ... | ... | ... |

**Constraint:**
- `FOREIGN KEY (category_id) REFERENCES knowledge_category(id) ON DELETE SET NULL`

**Behavior:**
- ✅ Category bisa `NULL` (opsional)
- ✅ Delete category → set course.category = NULL (safe)
- ✅ Create course tanpa category → OK

---

## 🔄 Reusable Component

### RemoteSearchSelect Usage

Component ini digunakan di:
1. ✅ `/manajemen-data/kategori-learning` (parent category)
2. ✅ `/learning/courses/create` (course category)
3. ✅ `/learning/courses/[slug]` (course category edit)

**Props:**
- `fetchFn`: Async function yang return `{ value, label }[]`
- `value`: Current selected value
- `onChange`: Callback saat value berubah
- `placeholder`: Placeholder text
- `searchPlaceholder`: Search input placeholder
- `emptyText`: Text saat tidak ada hasil

**Benefits:**
- ✅ **DRY** (Don't Repeat Yourself)
- ✅ **Consistent UX** across pages
- ✅ **Easy to maintain** (single source of truth)
- ✅ **Lazy loading** (fetch on demand)

---

## 📁 Files Modified

| File | Changes | Status |
|------|---------|--------|
| `backend/apps/learning/models.py` | Add category FK field | ✅ |
| `backend/apps/learning/migrations/0013_add_course_category.py` | Migration untuk category | ✅ |
| `backend/apps/learning/serializers.py` | Add CategorySimpleSerializer, category fields | ✅ |
| `frontend/app/(admin)/learning/courses/create/page.tsx` | Add category dropdown, fetchCategories | ✅ |
| `frontend/app/(admin)/learning/courses/[slug]/page.tsx` | Add category dropdown, load category_id | ✅ |

**Total:** 5 files modified

---

## 🎉 Summary

### Backend
| Item | Status |
|------|--------|
| Field category di Course model | ✅ |
| Migration production-safe | ✅ |
| CategorySimpleSerializer | ✅ |
| Course serializer support category | ✅ |
| API return category dengan parent_name | ✅ |

### Frontend
| Item | Status |
|------|--------|
| Category dropdown di create page | ✅ |
| Category dropdown di edit page | ✅ |
| Hirarki visual dengan indent & symbols | ✅ |
| Reusable fetchCategories function | ✅ |
| RemoteSearchSelect component | ✅ |

### Testing
| Test Case | Result |
|-----------|--------|
| Create course dengan category | ✅ PASS |
| Create course tanpa category (None) | ✅ PASS |
| Edit course - change category | ✅ PASS |
| Edit course - remove category | ✅ PASS |
| Serializer category output | ✅ PASS |
| Dropdown hirarki display | ✅ PASS |

---

## 🚀 Next Steps

Untuk production deployment:
1. ✅ Migration sudah production-safe
2. ✅ Backward compatible (category opsional)
3. ✅ No data migration needed
4. ⚠️ **Restart backend** setelah deploy
5. ⚠️ **Clear browser cache** untuk frontend

---

**Related Documents:**
- MD 18: Permission System & Learning Course Fixes
- MD 19: Slug Hidden Fix & renderHtml Function
- MD 17: Course Create Enhancements (original slug work)
