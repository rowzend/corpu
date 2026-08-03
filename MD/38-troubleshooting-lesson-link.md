# Troubleshooting: Data Link Lesson & SweetAlert

## Masalah yang Diperbaiki

### 1. ✅ Data Link Hilang Saat Edit
**Solusi:** Tambah field `external_url` ke `LessonListSerializer`

### 2. ⚠️ SweetAlert Masih Tertutup Modal
**Solusi:** Update CSS z-index

### 3. ✅ Error Message Lebih Spesifik
**Solusi:** Validasi URL di frontend & backend

---

## Langkah-Langkah Troubleshooting

### Jika Data Link Masih Kosong Saat Edit:

1. **Cek Console Browser (F12)**
   ```
   Opening edit dialog for lesson: {...}
   Lesson data: { external_url: "..." }
   ```
   - Jika `external_url` masih `null` atau `undefined`, data belum di-load dari backend

2. **Refresh/Reload Modules**
   - Tutup modal edit
   - Refresh halaman (F5)
   - Atau klik tab "Informasi Kursus" lalu kembali ke "Modul & Pelajaran"
   - Buka edit lagi

3. **Cek Backend Response**
   ```bash
   # Test API endpoint
   curl http://localhost:8000/api/learning/modules/?course_slug=test-course-dengan-kategori | jq '.results[].lessons[] | {title, content_type, external_url}'
   ```

4. **Pastikan Backend Sudah Restart**
   ```bash
   cd /home/prakom/project-docker/all-projects-darireal/projects/asncorpu
   docker-compose restart asncorpu_backend
   ```

### Jika SweetAlert Masih Tertutup Modal:

1. **Hard Refresh Browser**
   - Chrome/Firefox: `Ctrl + Shift + R` (Linux)
   - Atau clear cache browser

2. **Cek CSS sudah loaded**
   - Buka DevTools (F12) → Elements/Inspector
   - Search untuk `.swal2-container`
   - Pastikan ada style `z-index: 9999 !important`

3. **Rebuild Frontend**
   ```bash
   cd frontend
   npm run build
   # atau untuk development
   npm run dev
   ```

### Jika Validasi Error Tidak Muncul:

1. **Cek Console untuk Error**
   - Buka DevTools (F12) → Console
   - Lihat error JavaScript

2. **Test Validasi Manual**
   - Kosongkan URL → Submit → Harus muncul error
   - Isi URL tanpa http:// → Submit → Harus muncul error
   - Isi URL invalid → Submit → Harus muncul error

---

## Quick Fix Commands

```bash
# 1. Restart Backend
cd /home/prakom/project-docker/all-projects-darireal/projects/asncorpu
docker-compose restart asncorpu_backend

# 2. Rebuild Frontend (if needed)
cd frontend
npm run build

# 3. Clear Browser Cache
# - Chrome: Ctrl + Shift + Delete → Clear cache
# - Firefox: Ctrl + Shift + Delete → Clear cache

# 4. Check Backend Logs
docker-compose logs -f asncorpu_backend | grep -i error

# 5. Test API
curl http://localhost:8000/api/learning/lessons/12312321/ | jq
```

---

## Expected Behavior

### ✅ Correct Flow:
1. User clicks "Edit" pada pelajaran dengan tipe "Link"
2. Modal terbuka dengan:
   - Judul: **12312321** (atau judul yang sesuai)
   - Tipe Konten: **Link**
   - URL Eksternal: **https://example.com/artikel** (URL yang tersimpan, BUKAN placeholder)
3. User bisa edit URL
4. Klik "Simpan"
5. Jika ada error → SweetAlert muncul DI ATAS modal dengan pesan spesifik
6. Jika sukses → Modal tutup, data tersimpan

### ❌ Wrong Behavior:
1. URL Eksternal kosong atau placeholder
2. SweetAlert tertutup oleh modal (tidak terlihat)
3. Error message generic "Request failed"

---

## Verification Checklist

### Backend:
- [ ] File `backend/apps/learning/serializers.py` updated
- [ ] `LessonListSerializer` includes `external_url` field
- [ ] `LessonSerializer` has `validate()` method
- [ ] Backend container restarted

### Frontend:
- [ ] File `frontend/lib/sweetalert.ts` updated with z-index
- [ ] File `frontend/app/globals.css` has `.swal2-container` styles
- [ ] File `frontend/app/(admin)/learning/courses/[slug]/page.tsx` has validations
- [ ] File `frontend/lib/api.ts` has improved `handleApiError`
- [ ] Browser cache cleared
- [ ] Hard refresh done (Ctrl+Shift+R)

### Testing:
- [ ] Edit lesson with link type → URL appears
- [ ] Submit empty URL → Error message appears above modal
- [ ] Submit invalid URL → Specific error message
- [ ] Submit valid URL → Saves successfully

---

## Contact Info

Jika masalah masih berlanjut:
1. Screenshot error di console (F12)
2. Screenshot SweetAlert yang tertutup modal
3. Copy-paste error dari backend logs
4. Kirim informasi di atas untuk troubleshooting lebih lanjut
