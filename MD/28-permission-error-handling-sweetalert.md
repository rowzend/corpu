# 28. Permission Error Handling dengan SweetAlert

**Tanggal:** 2026-06-12  
**Status:** ✅ Implemented  
**Model:** Claude Sonnet 4.5

---

## 📋 Overview

Dokumentasi tentang bagaimana sistem menangani permission error dan menampilkan pesan error yang user-friendly menggunakan SweetAlert2.

---

## 🔐 Permission Error Flow

### Backend Response

Ketika user tidak punya permission:

```python
# backend/apps/learning/permissions.py
class LearningPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        # Check granular permission
        if not check_permission(user, 'learning', 'courses', 'edit'):
            return False  # ❌ DRF will return 403 Forbidden
```

**HTTP Response:**
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "detail": "You do not have permission to perform this action."
}
```

### Frontend Error Handling

**1. API Client catches error:**
```typescript
// frontend/lib/api.ts
async handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorMessage = data.message || data.detail || 'Request failed';
    throw new ApiError(errorMessage, response.status);  // ❌ Throw ApiError
  }
}
```

**2. handleApiError processes status code:**
```typescript
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 403:
        return 'Anda tidak memiliki izin untuk melakukan tindakan ini.';  // ✅
      case 401:
        return 'Sesi Anda telah berakhir. Silakan login kembali.';
      case 404:
        return 'Data yang Anda cari tidak ditemukan.';
      default:
        return error.message;
    }
  }
  return 'Terjadi kesalahan yang tidak terduga.';
}
```

**3. Component shows SweetAlert:**
```typescript
// Example: Course edit page
try {
  await updateCourse(slug, formData);
  showToast('Kursus berhasil diperbarui!', 'success');
} catch (error) {
  showError(handleApiError(error), 'Gagal Memperbarui Kursus');  // ✅ SweetAlert shown
}
```

---

## 🎨 SweetAlert Error Display

### Permission Error (403)

```typescript
showError(
  'Anda tidak memiliki izin untuk melakukan tindakan ini.',
  'Gagal Memperbarui Kursus'
);
```

**Visual:**
```
┌─────────────────────────────────────────┐
│              ❌ (Red X Icon)            │
│                                         │
│      Gagal Memperbarui Kursus          │
│                                         │
│  Anda tidak memiliki izin untuk        │
│  melakukan tindakan ini.               │
│                                         │
│           [ OK ]                        │
│        (Red button)                     │
└─────────────────────────────────────────┘
```

### Other Errors

| Status | Title Example | Message |
|--------|---------------|---------|
| **401** | Sesi Berakhir | Sesi Anda telah berakhir. Silakan login kembali. |
| **403** | Gagal [Action] | Anda tidak memiliki izin untuk melakukan tindakan ini. |
| **404** | Data Tidak Ditemukan | Data yang Anda cari tidak ditemukan. |
| **422** | Validasi Gagal | Data yang Anda kirim tidak valid. Silakan periksa kembali. |
| **500** | Server Error | Terjadi kesalahan pada server. Silakan coba lagi nanti. |

---

## 📊 Error Handling Matrix

### Learning Module CRUD Operations

| Operation | Permission Required | Error if No Permission |
|-----------|-------------------|------------------------|
| **View Course List** | `learning.courses.view` | 403 → SweetAlert ❌ |
| **Create Course** | `learning.courses.create` | 403 → SweetAlert ❌ |
| **Edit Course** | `learning.courses.edit` | 403 → SweetAlert ❌ |
| **Delete Course** | `learning.courses.delete` | 403 → SweetAlert ❌ |
| **View Module** | `learning.modules.view` | 403 → SweetAlert ❌ |
| **Edit Module** | `learning.modules.edit` | 403 → SweetAlert ❌ |
| **View Lesson** | `learning.lessons.view` | 403 → SweetAlert ❌ |
| **Edit Lesson** | `learning.lessons.edit` | 403 → SweetAlert ❌ |

---

## 🧪 Testing Permission Error

### Scenario 1: User Without Permission

**Setup:**
```python
# User: 199301092019031001
# Group: User (no learning permissions)
```

**Test Steps:**
1. Login sebagai user `199301092019031001`
2. Navigate ke `/learning/courses`
3. Try to create/edit course

**Expected Result:**
```
❌ SweetAlert Error:
Title: "Gagal Memperbarui Kursus"
Message: "Anda tidak memiliki izin untuk melakukan tindakan ini."
```

### Scenario 2: Superadmin with Permission

**Setup:**
```python
# User: Prakom@admin2025.com
# Group: Super Admin (all 45 learning permissions)
```

**Test Steps:**
1. Login sebagai `Prakom@admin2025.com`
2. Navigate ke `/learning/courses`
3. Create/edit course

**Expected Result:**
```
✅ Success Toast:
"Kursus berhasil diperbarui!"
```

---

## 🔍 Debug Permission Issues

### Check User Permissions

```bash
docker exec asncorpu_backend_app python manage.py shell -c "
from django.contrib.auth import get_user_model
from apps.manajemen.helpers import check_permission

User = get_user_model()
user = User.objects.get(username='<username>')

# Check specific permission
has_perm = check_permission(user, 'learning', 'courses', 'edit')
print(f'Has permission: {has_perm}')

# Check user groups
print(f'Groups: {[g.name for g in user.groups.all()]}')
"
```

### Check Group Permissions

```bash
docker exec asncorpu_backend_app python manage.py shell -c "
from django.contrib.auth.models import Group
from apps.manajemen.models import RoleRule

group = Group.objects.get(name='User')
learning_rules = RoleRule.objects.filter(
    role=group,
    rule__module__nama_module='learning'
).count()

print(f'Learning permissions: {learning_rules}')
"
```

---

## 📝 Implementation Files

### Backend

| File | Responsibility |
|------|---------------|
| `backend/apps/learning/permissions.py` | Check granular permissions, return 403 if denied |
| `backend/apps/manajemen/helpers.py` | `check_permission()` function |

### Frontend

| File | Responsibility |
|------|---------------|
| `frontend/lib/api.ts` | API client, throw ApiError with status code |
| `frontend/lib/api.ts` | `handleApiError()` function, map status to message |
| `frontend/lib/sweetalert.ts` | `showError()` function, display SweetAlert |

---

## 🎯 User Experience Flow

### Happy Path (Has Permission)

```
User clicks "Edit Course"
    ↓
Check permission (module-level)
    ✅ PASS
    ↓
Check object permission
    ✅ PASS
    ↓
Update course
    ✅ SUCCESS
    ↓
✅ Toast: "Kursus berhasil diperbarui!"
```

### Error Path (No Permission)

```
User clicks "Edit Course"
    ↓
Check permission (module-level)
    ❌ FAIL (no RoleRule)
    ↓
Backend returns 403 Forbidden
    ↓
Frontend catches ApiError
    ↓
handleApiError(error)
    → "Anda tidak memiliki izin..."
    ↓
showError(message, title)
    ↓
❌ SweetAlert: Error dialog shown
```

---

## ✅ Best Practices

### Backend

1. **Return 403 for permission denial:**
   ```python
   def has_permission(self, request, view):
       if not check_permission(...):
           return False  # DRF returns 403
   ```

2. **Return 404 for object not found:**
   ```python
   try:
       obj = Model.objects.get(id=id)
   except Model.DoesNotExist:
       raise Http404  # DRF returns 404
   ```

3. **Return 400 for validation errors:**
   ```python
   serializer.is_valid(raise_exception=True)  # DRF returns 400
   ```

### Frontend

1. **Always wrap API calls in try-catch:**
   ```typescript
   try {
       await updateCourse(slug, data);
       showToast('Success!', 'success');
   } catch (error) {
       showError(handleApiError(error), 'Operation Failed');
   }
   ```

2. **Use handleApiError for consistent messages:**
   ```typescript
   // Good ✅
   showError(handleApiError(error), 'Title');
   
   // Bad ❌
   showError(error.message, 'Title');  // May not be user-friendly
   ```

3. **Provide context in error title:**
   ```typescript
   // Good ✅
   showError(message, 'Gagal Memperbarui Kursus');
   
   // Bad ❌
   showError(message, 'Error');  // Too generic
   ```

---

## 🔑 Key Points

### Permission Denial is User-Friendly

**Ya**, jika user tidak dikasih permission, akan ada notification via SweetAlert:

- ✅ **Clear message:** "Anda tidak memiliki izin untuk melakukan tindakan ini."
- ✅ **Proper icon:** ❌ Red X icon
- ✅ **Context:** Title includes operation (e.g., "Gagal Memperbarui Kursus")
- ✅ **User action:** OK button to dismiss

### All HTTP Errors are Handled

| Status | User sees |
|--------|-----------|
| 401 | "Sesi Anda telah berakhir..." |
| 403 | "Anda tidak memiliki izin..." |
| 404 | "Data yang Anda cari tidak ditemukan" |
| 422 | "Data yang Anda kirim tidak valid..." |
| 500 | "Terjadi kesalahan pada server..." |

### Consistency Across All Modules

Error handling pattern sama untuk:
- ✅ Learning (Course, Module, Lesson)
- ✅ Knowledge (Article, Category)
- ✅ HCDP
- ✅ User Management
- ✅ Semua module lain

---

## 📚 Related Documentation

- **MD 25:** Learning Course Edit Permission Fix
- **MD 27:** Summary All Fixes Learning Permission
- **SweetAlert2 Docs:** https://sweetalert2.github.io/

---

## ✅ Summary

**Q: Jika misalnya tidak dikasih permission, akan diberitahukan sesuai sweetalert dia bilang kan?**

**A: Ya, benar! ✅**

Sistem akan:
1. ✅ Detect permission denial (403)
2. ✅ Map error ke message yang jelas
3. ✅ Tampilkan SweetAlert dengan:
   - Icon: ❌ (red error)
   - Title: Context (e.g., "Gagal Memperbarui Kursus")
   - Message: "Anda tidak memiliki izin untuk melakukan tindakan ini."
   - Button: OK (red)

User tidak akan kebingungan, akan langsung tahu bahwa mereka tidak punya akses.

---

**Session:** Kiro AI Assistant  
**Date:** Friday, June 12, 2026  
**Time:** ~05:00 WIB
