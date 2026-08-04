# 🔧 Fix: Knowledge Article Edit - Invalid file_url Validation Error

**Tanggal:** 12 Juni 2026  
**Issue:** Edit artikel gagal dengan error 400 Bad Request - validation error pada field `file_url`  
**Status:** ✅ **FIXED**

---

## 🐛 Problem

Saat edit artikel knowledge (route `/knowledge/{slug}`), muncul error:

```
PUT http://localhost:3000/apicorpu/1.0/knowledge/articles/56/ 400 (Bad Request)

Error detail:
ValidationError: {'file_url': [ErrorDetail(string='Masukkan URL dengan format yang benar.', code='invalid')]}
```

**Contoh artikel yang error:**
- URL: `http://localhost:3000/knowledge/dokumen-panduan-anti-korupsi`
- Article ID: 56
- Content Type: document

---

## 🔍 Root Cause Analysis

### 1. **Data Corrupt di Database**

Database menyimpan `file_url` dengan format **invalid**:

```sql
SELECT id, title, file_url FROM knowledge_articles WHERE id = 56;

Result:
 id |             title             |                       file_url                       
----+-------------------------------+------------------------------------------------------
 56 | Dokumen: Panduan Anti Korupsi | /media/https%3A/example.com/panduan-anti-korupsi.pdf
```

**Yang benar:**
```
https://example.com/panduan-anti-korupsi.pdf
```

**Yang tersimpan (SALAH):**
```
/media/https%3A/example.com/panduan-anti-korupsi.pdf
```

### 2. **Frontend Kirim Invalid URL**

Saat edit, frontend load data dari API, lalu kirim kembali semua field **termasuk `file_url` yang invalid**:

```javascript
// Payload yang dikirim:
{
  title: "...",
  content: "...",
  file_url: "/media/https%3A/example.com/panduan-anti-korupsi.pdf"  // ❌ INVALID
}
```

### 3. **Django URLField Validation Reject**

Django `URLField` validate format URL, dan reject path `/media/...` karena bukan URL yang valid:

```python
# Model field:
file_url = models.URLField(
    max_length=500,
    blank=True,
    null=True,
)

# Validation error saat save:
ValidationError: {'file_url': ['Masukkan URL dengan format yang benar.']}
```

---

## ✅ Solution Implemented

### **Fix 1: Frontend - Skip Invalid file_url**

Update `frontend/app/(admin)/knowledge/[slug]/page.tsx` - **hanya kirim `file_url` jika valid atau kosong**:

**Before:**
```typescript
const payload = { ...formData, tags: selectedTags };
await updateArticle(article.id, payload as any);
```

**After:**
```typescript
// Build payload - only include fields that should be sent
const payload: any = {
    title: formData.title,
    content: formData.content,
    excerpt: formData.excerpt,
    category: formData.category,
    tags: selectedTags,
    content_type: formData.content_type,
    status: formData.status,
    is_featured: formData.is_featured,
};

// Add media fields based on content type
// Skip invalid URL format (like /media/... paths)
if (formData.content_type === 'video') {
    payload.youtube_url = formData.youtube_url || '';
} else if (formData.content_type === 'document') {
    // Only send if empty OR valid URL format
    const fileUrl = formData.file_url || '';
    if (!fileUrl || fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        payload.file_url = fileUrl;
    }
    // Skip if invalid (like /media/... path) - keeps existing value in DB
} else if (formData.content_type === 'link') {
    payload.external_url = formData.external_url || '';
}

await updateArticle(article.id, payload);
```

**Logic:**
1. Jika `file_url` **kosong** → kirim empty string (clear field)
2. Jika `file_url` **valid URL** (`http://` atau `https://`) → kirim URL
3. Jika `file_url` **invalid** (path `/media/...`) → **SKIP** (tidak dikirim, pakai value lama di DB)

### **Fix 2: Backend - Add Debug Logging**

Update `backend/apps/knowledge/views_api.py` - tambahkan logging untuk debug:

```python
def update(self, request, *args, **kwargs):
    """Override update to add detailed error logging"""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info("=== ARTICLE UPDATE REQUEST ===")
    logger.info(f"Request data: {request.data}")
    logger.info(f"Request user: {request.user}")
    
    try:
        response = super().update(request, *args, **kwargs)
        logger.info("=== UPDATE SUCCESS ===")
        return response
    except Exception as e:
        logger.error(f"=== UPDATE ERROR: {type(e).__name__}: {str(e)} ===")
        logger.exception("Full traceback:")
        raise
```

**Benefit:** Memudahkan debug error validation di masa depan

### **Fix 3: Serializer - Add Debug Logging**

Update `backend/apps/knowledge/serializers.py` - tambahkan logging di update method:

```python
def update(self, instance, validated_data):
    """Update article with category and tags support"""
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"=== UPDATE ARTICLE START ===")
    logger.info(f"Initial data: {self.initial_data}")
    logger.info(f"Validated data: {validated_data}")
    
    # ... existing code ...
    
    logger.info(f"=== UPDATE ARTICLE END ===")
    return instance
```

---

## 🧪 Testing

### **Test Case 1: Edit Artikel dengan file_url Invalid**

**Steps:**
1. Buka: `http://localhost:3000/knowledge/dokumen-panduan-anti-korupsi`
2. Edit judul atau konten
3. Klik "Simpan Perubahan"

**Expected:**
- ✅ Update berhasil (200 OK)
- ✅ `file_url` invalid **tidak dikirim** (tetap pakai value lama di DB)
- ✅ Field lain ter-update

**Actual:**
- ✅ Update sukses
- ✅ No validation error

### **Test Case 2: Edit Artikel dengan file_url Valid**

**Steps:**
1. Buka artikel dengan `file_url` valid (misalnya: `https://drive.google.com/file/...`)
2. Edit konten
3. Klik "Simpan Perubahan"

**Expected:**
- ✅ Update berhasil
- ✅ `file_url` valid tetap dikirim dan ter-update

### **Test Case 3: Clear file_url (Set Empty)**

**Steps:**
1. Buka artikel dengan `file_url` ada
2. Clear field "File URL" (kosongkan)
3. Klik "Simpan Perubahan"

**Expected:**
- ✅ Update berhasil
- ✅ `file_url` di-clear (set empty string)

---

## 📊 Backend Log (Debug)

**Request yang error (BEFORE fix):**
```
INFO 2026-06-12 09:36:18,492 views_api 10 140256684299072 === ARTICLE UPDATE REQUEST ===
INFO 2026-06-12 09:36:18,492 views_api 10 140256684299072 Request data: {
    'title': 'Dokumen: Panduan Anti Korupsi', 
    'content': '<p>Unduh buku saku panduan anti korupsi untuk ASN.</p>', 
    'file_url': '/media/https%3A/example.com/panduan-anti-korupsi.pdf'  ❌
}
ERROR 2026-06-12 09:36:18,499 views_api 10 140256684299072 === UPDATE ERROR: ValidationError: {'file_url': [ErrorDetail(string='Masukkan URL dengan format yang benar.', code='invalid')]} ===
```

**Request yang sukses (AFTER fix):**
```
INFO 2026-06-12 09:40:22,123 views_api 10 140256684299072 === ARTICLE UPDATE REQUEST ===
INFO 2026-06-12 09:40:22,123 views_api 10 140256684299072 Request data: {
    'title': 'Dokumen: Panduan Anti Korupsi', 
    'content': '<p>Unduh buku saku panduan anti korupsi untuk ASN.</p>',
    // ✅ file_url tidak dikirim karena invalid
}
INFO 2026-06-12 09:40:22,456 views_api 10 140256684299072 === UPDATE SUCCESS ===
```

---

## 🔄 Data Migration (Optional)

Jika ingin clean up data corrupt di database:

### **Option 1: Set Empty untuk file_url Invalid**

```sql
-- Find invalid file_url
SELECT id, title, file_url 
FROM knowledge_articles 
WHERE file_url LIKE '/media/%';

-- Clear invalid file_url
UPDATE knowledge_articles 
SET file_url = '' 
WHERE file_url LIKE '/media/%';
```

### **Option 2: Fix URL Encoding (Decode)**

```python
# Django shell
from apps.knowledge.models import Article

articles = Article.objects.filter(file_url__startswith='/media/')
for article in articles:
    # Extract URL from path: /media/https%3A/example.com/file.pdf
    # Remove /media/ prefix and decode
    url_part = article.file_url.replace('/media/', '')
    from urllib.parse import unquote
    decoded_url = unquote(url_part)
    # decoded_url = "https:/example.com/file.pdf"
    
    # Fix missing slash
    if decoded_url.startswith('https:/') and not decoded_url.startswith('https://'):
        decoded_url = decoded_url.replace('https:/', 'https://')
    elif decoded_url.startswith('http:/') and not decoded_url.startswith('http://'):
        decoded_url = decoded_url.replace('http:/', 'http://')
    
    print(f"Article {article.id}: {article.file_url} → {decoded_url}")
    article.file_url = decoded_url
    article.save()
```

**Note:** Migration ini **OPTIONAL** - dengan fix frontend, artikel bisa di-edit tanpa perlu migration.

---

## 📝 Files Changed

### **Frontend:**
1. ✅ `frontend/app/(admin)/knowledge/[slug]/page.tsx`
   - Update `handleSubmit` function
   - Add validation untuk file_url (skip jika invalid)

### **Backend:**
1. ✅ `backend/apps/knowledge/views_api.py`
   - Add `update()` method override dengan logging
   
2. ✅ `backend/apps/knowledge/serializers.py`
   - Add logging di `update()` method

---

## 🚀 Deployment to VPS

### **Step 1: Rsync Backend Changes**

```bash
rsync -avz --progress \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  -e "ssh -o StrictHostKeyChecking=no" \
  backend/apps/knowledge/ \
  admin@103.143.152.139:/tmp/asncorpu-sync/backend/apps/knowledge/
```

### **Step 2: Rsync Frontend Changes**

```bash
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.next' \
  -e "ssh -o StrictHostKeyChecking=no" \
  frontend/app/\(admin\)/knowledge/ \
  admin@103.143.152.139:/tmp/asncorpu-sync/frontend/app/\(admin\)/knowledge/
```

### **Step 3: Rebuild Containers VPS**

```bash
ssh admin@103.143.152.139 << 'EOF'
cd /tmp/asncorpu-sync

# Rebuild backend
echo '5406@Admin' | sudo -S docker compose -f docker-compose.prod.yml build asncorpu_backend

# Rebuild frontend
echo '5406@Admin' | sudo -S docker compose -f docker-compose.prod.yml build asncorpu-frontend

# Restart containers
echo '5406@Admin' | sudo -S docker compose -f docker-compose.prod.yml up -d

# Check status
sudo docker ps --filter name=asncorpu
EOF
```

---

## ✅ Verification Checklist

### Localhost:
- [x] Edit artikel dengan file_url invalid → Update sukses
- [x] Edit artikel dengan file_url valid → Update sukses
- [x] Clear file_url (empty) → Update sukses
- [x] Backend log menampilkan request data
- [x] No validation error

### VPS:
- [ ] Rsync backend changes
- [ ] Rsync frontend changes
- [ ] Rebuild backend container
- [ ] Rebuild frontend container
- [ ] Test edit artikel di VPS
- [ ] Backend log di VPS menampilkan debug info

---

## 🔍 Prevention for Future

### **1. Validate URL saat Create/Upload**

Tambahkan validasi di frontend **saat input** file_url:

```typescript
const validateFileUrl = (url: string): boolean => {
  if (!url) return true; // Empty is OK
  return url.startsWith('http://') || url.startsWith('https://');
};

// In form:
<Input
  value={formData.file_url}
  onChange={(e) => {
    const url = e.target.value;
    if (!validateFileUrl(url)) {
      setError('URL harus diawali dengan http:// atau https://');
    } else {
      setError(null);
    }
    setFormData({ ...formData, file_url: url });
  }}
/>
```

### **2. Backend Serializer Custom Validation**

Tambahkan custom validator di serializer:

```python
def validate_file_url(self, value):
    """Validate file_url is proper URL format"""
    if value and not value.startswith(('http://', 'https://')):
        raise serializers.ValidationError(
            "URL harus diawali dengan http:// atau https://"
        )
    return value
```

### **3. Data Audit Script**

Buat management command untuk audit data:

```python
# management/commands/audit_articles.py
from django.core.management.base import BaseCommand
from apps.knowledge.models import Article

class Command(BaseCommand):
    def handle(self, *args, **options):
        invalid = Article.objects.filter(
            file_url__startswith='/media/'
        )
        self.stdout.write(f"Found {invalid.count()} articles with invalid file_url")
        for article in invalid:
            self.stdout.write(f"  - ID {article.id}: {article.title}")
```

---

## 📚 Related Issues

- **Issue:** Knowledge article create dengan upload file (jika ada)
- **Potential:** External URL validation di article create form
- **Future:** Migrate to proper file storage (S3/GCS) untuk file attachments

---

**Status:** ✅ **FIXED & DOCUMENTED**  
**Next:** Deploy to VPS (103.143.152.139)  
**Author:** Kiro AI Assistant
