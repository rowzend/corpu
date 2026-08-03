# VPS Deployment: Lesson Link Fix & SweetAlert Z-Index

**Tanggal:** 12 Juni 2026  
**Status:** ✅ **DEPLOYED ke VPS**

---

## 📦 Deployment Summary

### Target Server
- **Host:** 103.143.152.139
- **User:** admin
- **Project Path:** `/tmp/asncorpu-sync`
- **URL:** http://103.143.152.139:3000

### Containers Updated
1. ✅ `asncorpu_backend_app` - Backend Django (port 8000)
2. ✅ `asncorpu-frontend-nextjs` - Frontend Next.js (port 3004)
3. ℹ️ `asncorpu-nginx` - Nginx reverse proxy (port 3000) - tidak perlu restart

---

## 🚀 Deployment Process

### 1. Rsync Files to VPS
```bash
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='venv' \
  --exclude='.git' \
  --exclude='media' \
  --exclude='staticfiles' \
  --exclude='.env' \
  -e "ssh -o StrictHostKeyChecking=no" \
  ./ \
  admin@103.143.152.139:/tmp/asncorpu-sync/
```

**Files Synced:**
- ✅ `backend/apps/learning/serializers.py` (LessonListSerializer + validation)
- ✅ `backend/apps/knowledge/serializers.py` 
- ✅ `frontend/app/globals.css` (SweetAlert z-index)
- ✅ `frontend/lib/sweetalert.ts` (customClass)
- ✅ `frontend/lib/api.ts` (improved error handler)
- ✅ `frontend/app/(admin)/learning/courses/[slug]/page.tsx` (validations)
- ✅ `frontend/tsconfig.tsbuildinfo`
- ✅ `MD/00-INDEX.md`, `MD/31-38.md` (documentation)

### 2. Restart Containers
```bash
# Backend restart (apply serializer changes)
sudo docker restart asncorpu_backend_app

# Frontend restart (apply CSS/JS changes)
sudo docker restart asncorpu-frontend-nextjs
```

### 3. Verify Deployment
```bash
# Check container status
sudo docker ps --filter 'name=asncorpu'

# Check backend logs
sudo docker logs asncorpu_backend_app --tail 50

# Check frontend logs
sudo docker logs asncorpu-frontend-nextjs --tail 50
```

---

## ✅ Deployment Verification

### Container Status (Post-Deployment)
```
NAMES                      STATUS
asncorpu-frontend-nextjs   Up (healthy)
asncorpu_backend_app       Up (healthy)
asncorpu-nginx             Up (healthy)
```

### Test Checklist
- [ ] Access VPS: http://103.143.152.139:3000
- [ ] Login as admin
- [ ] Navigate to course edit: /learning/courses/{slug}
- [ ] Click "Modul & Pelajaran" tab
- [ ] Edit lesson with type "Link"
- [ ] Verify:
  - [ ] URL eksternal muncul (not empty/placeholder)
  - [ ] Submit with empty URL → SweetAlert appears ABOVE modal
  - [ ] Error message is specific (not "Request failed")
  - [ ] Submit valid URL → Saves successfully

---

## 📊 Changes Deployed

### Backend Changes
**File:** `backend/apps/learning/serializers.py`

1. **LessonListSerializer** - Added content fields:
   ```python
   fields = [
       'id', 'module', 'title', 'slug', 'content_type', 'duration_minutes',
       'order_index', 'is_free', 'created_at', 'quiz_id',
       'content', 'video_url', 'video_embed_id', 'file_url', 'external_url'  # ✅ NEW
   ]
   ```

2. **LessonSerializer** - Added validation:
   ```python
   def validate(self, data):
       content_type = data.get('content_type')
       if content_type == 'link':
           external_url = data.get('external_url')
           if not external_url or not external_url.strip():
               raise ValidationError({'external_url': 'URL eksternal harus diisi...'})
           if not (external_url.startswith('http://') or external_url.startswith('https://')):
               raise ValidationError({'external_url': 'URL harus dimulai dengan http://...'})
       return data
   ```

### Frontend Changes

**File:** `frontend/app/globals.css`
```css
/* SweetAlert2 z-index - MUST be higher than Radix UI Dialog (z-50 = 50) */
.swal2-container {
  z-index: 99999 !important;
}

.swal2-popup {
  z-index: 99999 !important;
}
```

**File:** `frontend/lib/sweetalert.ts`
```typescript
export const showError = (message: string, title: string = 'Error!') => {
    return Swal.fire({
        icon: 'error',
        title: title,
        text: message,
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc2626',
        customClass: {
            container: 'swal-high-z-index'  // ✅ NEW
        },
        heightAuto: false,  // ✅ NEW
        backdrop: true      // ✅ NEW
    });
};
```

**File:** `frontend/lib/api.ts`
```typescript
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    // Extract detailed error from response
    if (error.data) {
      if (error.status === 422 || error.status === 400) {
        // Extract field-specific errors
        const fieldErrors: string[] = [];
        for (const [field, messages] of Object.entries(error.data)) {
          if (Array.isArray(messages)) {
            fieldErrors.push(`${field}: ${messages.join(', ')}`);
          }
        }
        if (fieldErrors.length > 0) return fieldErrors.join('\n');
      }
    }
  }
  // ... rest of error handling
}
```

**File:** `frontend/app/(admin)/learning/courses/[slug]/page.tsx`
- Added URL validation before submit
- Added console.log for debugging
- Specific error messages for each validation type

---

## 🔍 Post-Deployment Testing

### Test Case 1: Edit Lesson with Link Type
**URL:** http://103.143.152.139:3000/learning/courses/test-course-dengan-kategori

**Steps:**
1. Login as admin
2. Navigate to course edit page
3. Click "Modul & Pelajaran" tab
4. Click "Edit" on lesson "12312321" (type: Link)

**Expected:**
- ✅ Modal opens
- ✅ URL Eksternal field shows saved URL (e.g., "https://example.com/artikel")
- ✅ NOT empty or placeholder

### Test Case 2: Validation - Empty URL
**Steps:**
1. Edit lesson (type: Link)
2. Clear URL field → Click "Simpan"

**Expected:**
- ✅ SweetAlert appears ABOVE modal (not hidden)
- ✅ Icon: Error (red X)
- ✅ Title: "Validasi URL Link"
- ✅ Message: "URL eksternal harus diisi untuk tipe konten link"

### Test Case 3: Validation - Invalid Protocol
**Steps:**
1. Edit lesson (type: Link)
2. Enter URL without http:// (e.g., "example.com")
3. Click "Simpan"

**Expected:**
- ✅ SweetAlert appears above modal
- ✅ Message: "URL harus dimulai dengan http:// atau https://"

### Test Case 4: Validation - Invalid Format
**Steps:**
1. Edit lesson (type: Link)
2. Enter invalid URL (e.g., "htp://wrong")
3. Click "Simpan"

**Expected:**
- ✅ SweetAlert appears above modal
- ✅ Message: "Format URL tidak valid. Contoh: https://example.com/artikel"

### Test Case 5: Successful Update
**Steps:**
1. Edit lesson (type: Link)
2. Enter valid URL (e.g., "https://google.com")
3. Click "Simpan"

**Expected:**
- ✅ Loading indicator shows
- ✅ Modal closes
- ✅ Toast: "Pelajaran berhasil diperbarui!"
- ✅ Data saved to database

---

## 🐛 Troubleshooting

### Issue: URL Still Empty After Deployment
**Solution:**
1. Hard refresh browser: Ctrl+Shift+F5
2. Clear browser cache
3. Check backend logs: `sudo docker logs asncorpu_backend_app --tail 100`
4. Test API directly:
   ```bash
   curl http://103.143.152.139:3000/api/learning/modules/?course_slug=test-course-dengan-kategori
   ```

### Issue: SweetAlert Still Hidden
**Solution:**
1. Clear browser cache (mandatory!)
2. Check DevTools → Elements → Search `.swal2-container`
3. Verify z-index: 99999
4. If still not working, check nginx cache:
   ```bash
   sudo docker exec asncorpu-nginx nginx -s reload
   ```

### Issue: Changes Not Applied
**Solution:**
1. Verify rsync completed successfully
2. Check container restart status:
   ```bash
   sudo docker ps --filter 'name=asncorpu'
   ```
3. Re-restart containers:
   ```bash
   sudo docker restart asncorpu_backend_app asncorpu-frontend-nextjs
   ```

---

## 📝 Rollback Plan

### If Issues Occur
```bash
# Stop containers
sudo docker stop asncorpu_backend_app asncorpu-frontend-nextjs

# Restore from backup (if needed)
# Note: Current deployment should be safe, all changes are backwards compatible

# Start containers
sudo docker start asncorpu_backend_app asncorpu-frontend-nextjs
```

### Restore Previous Version
```bash
# Use git to restore files (if tracked)
cd /tmp/asncorpu-sync
git checkout HEAD~1 -- backend/apps/learning/serializers.py
git checkout HEAD~1 -- frontend/app/globals.css
# etc...

# Then restart containers
sudo docker restart asncorpu_backend_app asncorpu-frontend-nextjs
```

---

## 📞 Support & Monitoring

### Check Logs
```bash
# Backend logs
sudo docker logs -f asncorpu_backend_app

# Frontend logs
sudo docker logs -f asncorpu-frontend-nextjs

# Nginx logs
sudo docker logs -f asncorpu-nginx
```

### Monitor Container Health
```bash
# Status
sudo docker ps --filter 'name=asncorpu'

# Stats
sudo docker stats asncorpu_backend_app asncorpu-frontend-nextjs
```

---

## ✅ Deployment Complete

**Status:** ✅ **SUCCESS**  
**Deployed At:** 2026-06-12 10:30 WIB  
**Deployed By:** Development Team  

**Changes Applied:**
- ✅ Backend serializer updated
- ✅ Frontend CSS updated
- ✅ Frontend JS updated
- ✅ Documentation updated
- ✅ Containers restarted
- ✅ Services healthy

**Next Steps:**
1. Test on VPS: http://103.143.152.139:3000
2. Monitor logs for errors
3. Collect user feedback
4. Document any additional issues

---

## 🔗 Related Documentation

- **[36-lesson-link-fix-and-sweetalert-zindex.md](36-lesson-link-fix-and-sweetalert-zindex.md)** - Technical details
- **[37-fix-summary-lesson-link-sweetalert.md](37-fix-summary-lesson-link-sweetalert.md)** - Quick summary
- **[38-troubleshooting-lesson-link.md](38-troubleshooting-lesson-link.md)** - Troubleshooting guide
- **[07-server-vps.md](07-server-vps.md)** - VPS configuration

---

**Deployment ID:** asncorpu-deploy-20260612-lesson-link-fix  
**Git Commit:** (if tracked)  
**Backup Location:** N/A (backwards compatible changes)
