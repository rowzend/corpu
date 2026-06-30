# 27. Summary - All Learning Permission & CRUD Fixes

**Tanggal:** 2026-06-12  
**Status:** ✅ Completed  
**Model:** Claude Sonnet 4.5

---

## 📋 Overview

Comprehensive fix untuk permission errors dan CRUD issues di Learning module (Courses, Modules, Lessons).

---

## 🔧 Issues Fixed

### 1. ✅ Course Edit Permission Error (MD 25)

**Problem:** Superadmin tidak bisa edit course yang dibuat oleh user lain  
**Cause:** `has_object_permission` hanya allow instructor  
**Solution:** Tambah bypass untuk superuser/staff

```python
# backend/apps/learning/permissions.py
def has_object_permission(self, request, view, obj):
    if request.method in permissions.SAFE_METHODS:
        return True
    
    # ✅ Allow superuser/staff to edit any object
    if request.user.is_superuser or request.user.is_staff:
        return True
    
    if hasattr(obj, 'instructor'):
        return obj.instructor == request.user
    if hasattr(obj, 'user'):
        return obj.user == request.user
    return False
```

### 2. ✅ Course Delete IntegrityError (MD 26)

**Problem:** Cannot delete course - FK constraint violation  
**Cause:** `knowledge_articles.source_lesson_id` FK constraint `NO ACTION`  
**Solution:** Migration untuk ubah constraint jadi `SET NULL`

```python
# backend/apps/knowledge/migrations/0012_fix_source_lesson_cascade.py
migrations.RunSQL(
    sql='ALTER TABLE knowledge_articles DROP CONSTRAINT IF EXISTS knowledge_articles_source_lesson_id_6c2b9e83_fk_learning_;'
),
migrations.RunSQL(
    sql='''
        ALTER TABLE knowledge_articles 
        ADD CONSTRAINT knowledge_articles_source_lesson_id_6c2b9e83_fk_learning_ 
        FOREIGN KEY (source_lesson_id) 
        REFERENCES learning_lessons(id) 
        ON DELETE SET NULL 
        DEFERRABLE INITIALLY DEFERRED;
    '''
),
```

### 3. ✅ Course Update 400 Bad Request (MD 26)

**Problem:** Update course gagal dengan 400 error  
**Cause:** Double FormData processing  
**Solution:** Modified `updateCourse()` untuk accept FormData directly

```typescript
// frontend/lib/api/learning.ts
export async function updateCourse(slug: string, data: any): Promise<Course> {
  // ✅ If data is already FormData, use it directly
  if (data instanceof FormData) {
    return api.put(`/learning/courses/${slug}/`, data);
  }
  
  // Otherwise convert object to FormData
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]: [string, any]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });
  return api.put(`/learning/courses/${slug}/`, formData);
}
```

**Frontend fix:**
```typescript
// frontend/app/(admin)/learning/courses/[slug]/page.tsx
const handleSubmit = async (e: React.FormEvent) => {
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => {
        // Skip slug (readonly) and null values
        if (k === 'slug' || v === null) return;
        fd.append(k, String(v));
    });
    await updateCourse(slug, fd);  // Send FormData directly
};
```

### 4. ✅ Module & Lesson Edit Permission

**Status:** Same fix as Course (MD 25) - superuser/staff bypass  
**Verification:** ✅ Backend permissions OK  

```bash
Module permissions:
  - view: True
  - create: True
  - edit: True    ✅
  - delete: True  ✅

Lesson permissions:
  - view: True
  - create: True
  - edit: True    ✅
  - delete: True  ✅
```

---

## 📊 Permission Architecture

### Two-Level Permission System

```
┌─────────────────────────────────────────────────────┐
│         has_permission() - Module Level             │
│  Check: learning.courses.edit via RoleRule          │
│  Source: apps/manajemen (granular permission)       │
│  Controls: API endpoint access                      │
└─────────────────────────────────────────────────────┘
                       ↓ PASSED
┌─────────────────────────────────────────────────────┐
│     has_object_permission() - Object Level          │
│  Check: is_superuser OR is_staff OR is_instructor   │
│  Source: DRF BasePermission                         │
│  Controls: Specific object modification             │
└─────────────────────────────────────────────────────┘
                       ↓ PASSED
                  ✅ ALLOWED
```

### Permission Flow Matrix

| User Type | Module Permission | Object Permission | Final Result |
|-----------|-------------------|-------------------|--------------|
| Anonymous | ❌ False | - | ❌ Denied |
| User (no perm) | ❌ False | - | ❌ Denied |
| User (has perm, not instructor) | ✅ True | ❌ False (before) | ❌ Denied |
| User (has perm, is instructor) | ✅ True | ✅ True | ✅ Allowed |
| **Superuser/Staff** | ✅ True | ✅ **True (after fix)** | ✅ **Allowed** |

---

## 🗂️ Files Modified

### Backend

| File | Change | MD |
|------|--------|---|
| `backend/apps/learning/permissions.py` | Add superuser/staff bypass in `has_object_permission()` | MD 25 |
| `backend/apps/knowledge/migrations/0012_fix_source_lesson_cascade.py` | Fix FK constraint to SET NULL | MD 26 |

### Frontend

| File | Change | MD |
|------|--------|---|
| `frontend/lib/api/learning.ts` | Modified `updateCourse()` to accept FormData | MD 26 |
| `frontend/app/(admin)/learning/courses/[slug]/page.tsx` | Fix FormData building, skip slug & null values | MD 26 |

---

## 🎯 Affected Resources

Semua resource di LearningPermission sekarang support superuser/staff bypass:

- ✅ **Courses** (create, update, delete)
- ✅ **Modules** (create, update, delete)
- ✅ **Lessons** (create, update, delete)
- ✅ **Enrollments** (update, delete)
- ✅ **Quizzes** (create, update, delete)
- ✅ **Ratings** (update, delete)
- ✅ **Comments** (update, delete)

---

## ✅ Testing Checklist

### Course CRUD
- [x] ✅ Edit course (superadmin, bukan instructor)
- [x] ✅ Delete course dengan referenced lessons
- [x] ✅ Update course dengan category
- [x] ✅ Update course dengan file uploads

### Module CRUD
- [ ] 🧪 Create module
- [ ] 🧪 Edit module (superadmin, bukan instructor)
- [ ] 🧪 Delete module
- [ ] 🧪 Reorder modules

### Lesson CRUD
- [ ] 🧪 Create lesson
- [ ] 🧪 Edit lesson (superadmin, bukan instructor)
- [ ] 🧪 Delete lesson
- [ ] 🧪 Reorder lessons
- [ ] 🧪 Upload file/video

---

## 🔍 Debugging Module/Lesson Issues

Jika masih ada error "Gagal Memperbarui Modul/Pelajaran":

### 1. Check Browser DevTools
- Open **Network** tab
- Find failed request
- Check **Response** body untuk error detail

### 2. Check Backend Logs
```bash
docker logs asncorpu_backend_app --tail=50 | grep -i error
```

### 3. Common Issues

**A. Validation Error (400)**
- Missing required field
- Invalid field value type
- Field constraint violation

**B. Permission Error (403)**
- Module-level permission tidak ada
- Backend restart belum dilakukan

**C. Not Found (404)**
- ID/slug salah
- Object sudah dihapus

### 4. Test via Python Shell
```python
docker exec asncorpu_backend_app python manage.py shell -c "
from apps.learning.models import Module, Lesson
from apps.learning.serializers import ModuleSerializer, LessonSerializer

# Test module update
module = Module.objects.first()
serializer = ModuleSerializer(module, data={
    'title': 'Updated Title',
    'description': 'Updated Description',
    'order_index': 1,
    'course': module.course.id
}, partial=True)

print(f'Valid: {serializer.is_valid()}')
if not serializer.is_valid():
    print(f'Errors: {serializer.errors}')
else:
    print('✅ Serializer valid')
"
```

---

## 📚 Related Documentation

- **MD 24:** Sidebar Manajemen Data Fix
- **MD 25:** Learning Course Edit Permission Fix
- **MD 26:** Course Delete & Update Errors Fix
- **MD 27:** Summary All Fixes (this document)

---

## 🚀 Next Steps

### For Module & Lesson

**If error persists:**
1. Check **browser console** untuk error detail
2. Check **Network tab Response** body
3. Share screenshot/error message
4. Test via backend shell untuk isolate issue

**Backend already fixed:**
- ✅ Permission bypass for superuser/staff
- ✅ Backend restarted
- ✅ Verified permissions exist

**Frontend likely OK:**
- ✅ `updateModule()` sends plain object (not FormData)
- ✅ `updateLesson()` sends plain object (not FormData)
- ✅ No double conversion issue

**Possible remaining issues:**
- Frontend validation before request
- Required field missing
- Field type mismatch (string vs number)

---

## ✅ Status Summary

| Feature | Permission | Create | Update | Delete | Status |
|---------|-----------|--------|--------|--------|--------|
| **Course** | ✅ Fixed | ✅ Works | ✅ Fixed | ✅ Fixed | 🎉 Complete |
| **Module** | ✅ Fixed | ✅ Works | ⚠️ Testing | ⚠️ Testing | 🧪 Ready |
| **Lesson** | ✅ Fixed | ✅ Works | ⚠️ Testing | ⚠️ Testing | 🧪 Ready |

---

## 🔑 Key Takeaways

### Permission Best Practices

1. **Two-level check is important:**
   - Module-level: WHO can access API
   - Object-level: WHO can modify WHICH objects

2. **Superuser bypass should be at object-level:**
   - Still require module-level permission (granular control)
   - But allow edit any object (admin privilege)

3. **Document constraint behavior:**
   - `ON DELETE CASCADE` → Delete related
   - `ON DELETE SET NULL` → Keep but unlink
   - `ON DELETE NO ACTION` → Block delete

### FormData Best Practices

1. **Check if data is already FormData:**
   ```typescript
   if (data instanceof FormData) {
       return api.put(url, data);
   }
   ```

2. **Skip readonly fields:**
   ```typescript
   if (k === 'slug' || k === 'id') return;
   ```

3. **Handle null values:**
   ```typescript
   if (v === null) return;  // Skip null
   ```

---

**Session:** Kiro AI Assistant  
**Date:** Friday, June 12, 2026  
**Time:** ~04:30 - 05:00 WIB
