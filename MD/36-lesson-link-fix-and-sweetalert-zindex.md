# Fix: Data Link Lesson & SweetAlert Z-Index

**Tanggal:** 2026-06-12  
**Status:** ✅ Selesai

## Masalah

### 1. Data Link Hilang Saat Edit
- Saat edit pelajaran dengan tipe konten "link", data `external_url` tidak muncul
- Data sebenarnya tersimpan di database, tapi tidak dimuat saat edit

### 2. SweetAlert Tertutup Modal
- SweetAlert error/konfirmasi muncul di bawah modal dialog
- User tidak bisa melihat pesan error dengan jelas

### 3. Error Message Tidak Spesifik
- Error message hanya "Request failed" tanpa detail
- Tidak ada validasi URL yang jelas untuk pengguna

## Root Cause

### 1. Data Link Hilang
**File:** `backend/apps/learning/serializers.py`

`LessonListSerializer` (yang digunakan untuk menampilkan lessons di modules) tidak menyertakan field content:
```python
fields = [
    'id', 'module', 'title', 'slug', 'content_type', 'duration_minutes',
    'order_index', 'is_free', 'created_at', 'quiz_id'
]
# Missing: 'content', 'video_url', 'video_embed_id', 'file_url', 'external_url'
```

Saat edit lesson, frontend mengambil data dari `modules` state yang sudah di-cache, yang datanya tidak lengkap.

### 2. Z-Index SweetAlert
SweetAlert default z-index tidak cukup tinggi untuk muncul di atas modal dialog yang memiliki z-index tinggi.

### 3. Error Handling
- Frontend: Tidak ada validasi URL sebelum submit
- Backend: Tidak ada validasi khusus untuk URL di serializer
- API error handler: Tidak ekstrak detail error dari response

## Solusi

### 1. Tambah Field ke LessonListSerializer
**File:** `backend/apps/learning/serializers.py`

```python
class LessonListSerializer(serializers.ModelSerializer):
    quiz_id = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            'id', 'module', 'title', 'slug', 'content_type', 'duration_minutes',
            'order_index', 'is_free', 'created_at', 'quiz_id',
            'content', 'video_url', 'video_embed_id', 'file_url', 'external_url'  # ✅ Added
        ]
```

### 2. Tambah Z-Index untuk SweetAlert
**File:** `frontend/app/globals.css`

```css
/* SweetAlert2 z-index for modal overlay */
.swal-high-z-index {
  z-index: 99999 !important;
}

.swal2-container.swal-high-z-index {
  z-index: 99999 !important;
}
```

**File:** `frontend/lib/sweetalert.ts`

Tambahkan `customClass` ke semua SweetAlert:
```typescript
export const showError = (message: string, title: string = 'Error!') => {
    return Swal.fire({
        icon: 'error',
        title: title,
        text: message,
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc2626',
        customClass: {
            container: 'swal-high-z-index'  // ✅ Added
        }
    });
};
```

### 3. Validasi URL di Frontend
**File:** `frontend/app/(admin)/learning/courses/[slug]/page.tsx`

```typescript
const handleLessonSubmit = async () => {
    // Validasi URL untuk tipe link
    if (lessonForm.content_type === 'link') {
        if (!lessonForm.external_url.trim()) {
            showError('URL eksternal harus diisi untuk tipe konten link', 'Validasi URL Link');
            return;
        }
        try {
            new URL(lessonForm.external_url);
            if (!lessonForm.external_url.startsWith('http://') && 
                !lessonForm.external_url.startsWith('https://')) {
                showError('URL harus dimulai dengan http:// atau https://', 'Validasi URL Link');
                return;
            }
        } catch {
            showError('Format URL tidak valid. Contoh: https://example.com/artikel', 
                     'Validasi URL Link');
            return;
        }
    }
    // ... validasi document, video, dll
}
```

### 4. Validasi di Backend Serializer
**File:** `backend/apps/learning/serializers.py`

```python
class LessonSerializer(serializers.ModelSerializer):
    # ... existing code ...
    
    def validate(self, data):
        """Validate required fields based on content_type"""
        content_type = data.get('content_type')
        
        if content_type == 'link':
            external_url = data.get('external_url')
            if not external_url or not external_url.strip():
                raise serializers.ValidationError({
                    'external_url': 'URL eksternal harus diisi untuk tipe konten link'
                })
            if not (external_url.startswith('http://') or external_url.startswith('https://')):
                raise serializers.ValidationError({
                    'external_url': 'URL harus dimulai dengan http:// atau https://'
                })
        
        return data
```

### 5. Improved Error Handler
**File:** `frontend/lib/api.ts`

```typescript
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    // Extract detailed error message from response
    if (error.data) {
      // Handle validation errors (422, 400)
      if (error.status === 422 || error.status === 400) {
        if (typeof error.data === 'object') {
          const fieldErrors: string[] = [];
          for (const [field, messages] of Object.entries(error.data)) {
            if (Array.isArray(messages)) {
              fieldErrors.push(`${field}: ${messages.join(', ')}`);
            } else if (typeof messages === 'string') {
              fieldErrors.push(`${field}: ${messages}`);
            }
          }
          if (fieldErrors.length > 0) {
            return fieldErrors.join('\n');
          }
        }
      }
      
      // Handle error with detail/message field
      if (error.data.detail) return error.data.detail;
      if (error.data.message) return error.data.message;
    }
    // ... existing status code handling ...
  }
}
```

## Testing

### Test Case 1: Data Link Muncul Saat Edit
1. Buka course edit page
2. Edit pelajaran dengan tipe "link" yang sudah ada data `external_url`
3. ✅ Data URL eksternal muncul di form input

### Test Case 2: Validasi URL Link
1. Tambah/edit pelajaran dengan tipe "link"
2. Kosongkan URL → ❌ Error: "URL eksternal harus diisi untuk tipe konten link"
3. Isi URL tanpa http:// → ❌ Error: "URL harus dimulai dengan http:// atau https://"
4. Isi URL tidak valid → ❌ Error: "Format URL tidak valid"
5. Isi URL valid (https://example.com) → ✅ Tersimpan

### Test Case 3: SweetAlert Z-Index
1. Buka modal edit pelajaran
2. Submit dengan validasi error
3. ✅ SweetAlert muncul di atas modal, tidak tertutup

### Test Case 4: Error Message Spesifik
1. Submit dengan URL invalid ke backend
2. ✅ Error message menampilkan detail field error dari backend
3. Error message lebih informatif dan spesifik

## File yang Diubah

### Backend
- ✅ `backend/apps/learning/serializers.py`
  - Tambah fields ke `LessonListSerializer`
  - Tambah validasi di `LessonSerializer.validate()`

### Frontend
- ✅ `frontend/lib/sweetalert.ts`
  - Tambah `customClass: { container: 'swal-high-z-index' }` ke semua alert
- ✅ `frontend/app/globals.css`
  - Tambah CSS class `.swal-high-z-index` dengan z-index 99999
- ✅ `frontend/app/(admin)/learning/courses/[slug]/page.tsx`
  - Tambah validasi URL di `handleLessonSubmit()`
- ✅ `frontend/lib/api.ts`
  - Improve `handleApiError()` untuk ekstrak detail error

## Cara Deploy

1. **Backend:**
   ```bash
   # Restart Django server untuk apply serializer changes
   docker-compose restart backend
   ```

2. **Frontend:**
   ```bash
   # Rebuild untuk apply CSS dan TypeScript changes
   cd frontend
   npm run build
   # atau untuk development
   npm run dev
   ```

3. **Test:**
   - Refresh browser
   - Test edit pelajaran dengan tipe link
   - Test validasi URL

## Notes

- Z-index 99999 dipilih karena cukup tinggi untuk override modal dialog (biasanya ~10000)
- Validasi dilakukan di frontend dan backend untuk defense in depth
- Error message sekarang lebih user-friendly dan spesifik
- Semua tipe konten (link, document, video) sudah ada validasi URL

## Related Issues
- Data link hilang: Fixed ✅
- SweetAlert tertutup modal: Fixed ✅  
- Error message tidak spesifik: Fixed ✅
