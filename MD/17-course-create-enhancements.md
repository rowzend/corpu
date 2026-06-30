# 17. Course Create/Edit Enhancements - Category, Slug, Status

## Tanggal: 2026-06-11

## Ringkasan Perubahan

Perbaikan pada halaman Create/Edit Course (`/learning/courses/create` dan `/learning/courses/[slug]`):

1. **Slug field di-hide** (auto-generate dari judul)
2. **Kategori Learning dropdown** dari Knowledge Base categories
3. **Status Draft/Published/Archived** berfungsi penuh

---

## 1. Backend Changes

### Model - `backend/apps/learning/models.py`
```python
# Import
from apps.knowledge.models import Category as KnowledgeCategory

# Field baru di Course model
category = models.ForeignKey(
    KnowledgeCategory,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='courses',
    verbose_name='Kategori Learning'
)
```

### Migration - `backend/apps/learning/migrations/0013_add_course_category.py`
```python
dependencies = [
    ('knowledge', '0001_initial'),
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

### Serializers - `backend/apps/learning/serializers.py`
```python
class CategorySimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeCategory
        fields = ['id', 'name', 'slug', 'parent', 'order_index', 'is_active']
        read_only_fields = ['slug']

# CourseListSerializer & CourseDetailSerializer
category = CategorySimpleSerializer(read_only=True)
category_id = serializers.PrimaryKeyRelatedField(
    queryset=KnowledgeCategory.objects.filter(is_active=True),
    source='category',
    write_only=True,
    required=False,
    allow_null=True
)
```

---

## 2. Frontend Changes

### Create Course Page - `frontend/app/(admin)/learning/courses/create/page.tsx`

**Perubahan:**
- Hapus field slug (auto-generate di backend via `save()` method)
- Tambah `RemoteSearchSelect` untuk kategori
- Fetch categories dari `/apicorpu/1.0/knowledge/categories/`

```typescript
const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    level: 'beginner',
    duration_hours: 1,
    status: 'draft',
    thumbnail: '',
    category_id: null as number | null,  // BARU
});

// Category dropdown dengan RemoteSearchSelect
<RemoteSearchSelect
    fetchFn={async () => {
        // Fetch dan sort categories
        return [
            { value: '', label: '-- Pilih Kategori (Opsional) --' },
            ...sorted.map(cat => ({ value: cat.id, label: cat.name })),
        ];
    }}
    value={formData.category_id ?? ''}
    onChange={value => setFormData(p => ({ ...p, category_id: value ? Number(value) : null }))}
    placeholder="Cari kategori..."
/>
```

### Edit Course Page - `frontend/app/(admin)/learning/courses/[slug]/page.tsx`

**Perubahan:**
- Slug field read-only (disabled)
- Tambah category dropdown sama seperti create
- Fetch categories di `useEffect` bersama `fetchCourse`
- Update `fetchCourse` untuk include `category_id` dari response

```typescript
// FormData include category_id
const [formData, setFormData] = useState({
    title: '', slug: '', description: '', short_description: '',
    level: 'beginner', duration_hours: 1, status: 'draft', thumbnail: '',
    certificate_background: '', certificate_template: '',
    category_id: null as number | null,  // BARU
    _cert_bg_file: null as File | null, _cert_tmpl_file: null as File | null,
});

// fetchCourse update
setFormData({
    ...
    category_id: course.category?.id || null,  // BARU
    ...
});
```

---

## 3. Status Verification

### Draft/Published/Archived - ✅ WORKING
```python
# Model choices sudah ada sejak awal
STATUS_CHOICES = [
    ('draft', 'Draft'),
    ('published', 'Dipublikasikan'),
    ('archived', 'Diarsipkan'),
]
default='draft'

# Tested via shell:
Course.objects.create(..., status='draft')     # ✅
Course.objects.create(..., status='published') # ✅
Course.objects.create(..., status='archived')  # ✅
```

### Category Field - ✅ WORKING
```python
# Create via serializer
data = {'title': 'Test', 'description': 'Test', 'category_id': cat.id}
serializer = CourseListSerializer(data=data)
serializer.save(instructor=user)  # ✅ Creates with category

# Update via serializer
serializer = CourseDetailSerializer(course, data={'category_id': cat.id}, partial=True)
serializer.save()  # ✅ Updates category
```

---

## 4. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/apicorpu/1.0/learning/courses/` | POST | Create course dengan `category_id` |
| `/apicorpu/1.0/learning/courses/{slug}/` | PUT/PATCH | Update course dengan `category_id` |
| `/apicorpu/1.0/knowledge/categories/` | GET | List categories untuk dropdown |

### Request Body (Create)
```json
{
    "title": "Python untuk Pemula",
    "description": "Belajar Python dari nol",
    "short_description": "Kursus dasar Python",
    "level": "beginner",
    "duration_hours": 10,
    "status": "draft",
    "thumbnail": "https://example.com/thumb.jpg",
    "category_id": 1
}
```

### Response
```json
{
    "id": 1,
    "title": "Python untuk Pemula",
    "slug": "python-untuk-pemula",
    "status": "draft",
    "category": {
        "id": 1,
        "name": "Materi LMS",
        "slug": "materi-lms",
        "parent": null,
        "order_index": 0,
        "is_active": true
    },
    "category_id": 1,
    ...
}
```

---

## 5. Files Modified

| File | Perubahan |
|------|-----------|
| `backend/apps/learning/models.py` | Add category FK field + import |
| `backend/apps/learning/serializers.py` | Add CategorySimpleSerializer + category/category_id fields |
| `backend/apps/learning/migrations/0013_add_course_category.py` | Migration untuk category field |
| `frontend/app/(admin)/learning/courses/create/page.tsx` | Hide slug, add category dropdown |
| `frontend/app/(admin)/learning/courses/[slug]/page.tsx` | Slug read-only, add category dropdown |

---

## 6. Testing Checklist

- [x] Create course tanpa category → slug auto-generate ✅
- [x] Create course dengan category → tersimpan ✅
- [x] Edit course → slug read-only ✅
- [x] Edit course → ganti category ✅
- [x] Status draft → tersimpan & tidak tampil di public list ✅
- [x] Status published → tersimpan & tampil di public list ✅
- [x] Status archived → tersimpan ✅
- [x] Category dropdown load dari Knowledge Base ✅
- [x] Category search/filter di dropdown ✅

---

## 7. Status Final

| Item | Status |
|------|--------|
| Slug hidden (auto-generate) | ✅ Done |
| Kategori Learning dropdown | ✅ Done |
| Status draft/published/archived | ✅ Verified |
| Backend model + serializer | ✅ Done |
| Frontend create form | ✅ Done |
| Frontend edit form | ✅ Done |
| Migration applied | ✅ Done |
| Containers rebuilt | ✅ Done |