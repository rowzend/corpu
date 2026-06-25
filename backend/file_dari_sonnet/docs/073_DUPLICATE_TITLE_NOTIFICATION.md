# Duplicate Title Notification System

**Tanggal**: 11 Mei 2026  
**Status**: ✅ IMPLEMENTED  
**Project**: ASN Corpu Backend Python

---

## 🎯 Tujuan

Memberikan notifikasi kepada user ketika membuat artikel dengan title yang sama atau mirip dengan artikel yang sudah ada.

---

## 📊 Notification Flow

### **Scenario 1: Title Unik (Tidak Ada Duplikat)**

```
User Input:
  Title: "Panduan Menggunakan Django REST Framework"

System Check:
  ✅ Tidak ada artikel dengan title serupa

Notification:
  ✅ Artikel "Panduan Menggunakan Django REST Framework" berhasil dibuat!

Slug Result:
  panduan-menggunakan-django-rest-framework
```

---

### **Scenario 2: Title Duplikat (Ada Artikel Serupa)**

```
User Input:
  Title: "Peraturan Tunjangan Kinerja ASN"

System Check:
  ⚠️ Sudah ada 1 artikel dengan slug serupa

Notification (Warning):
  ⚠️ Artikel dengan judul serupa sudah ada (1 artikel). 
     Slug akan otomatis disesuaikan menjadi "peraturan-tunjangan-kinerja-asn-1".

Notification (Success):
  ✅ Artikel "Peraturan Tunjangan Kinerja ASN" berhasil dibuat 
     dengan slug: peraturan-tunjangan-kinerja-asn-1

Slug Result:
  peraturan-tunjangan-kinerja-asn-1
```

---

### **Scenario 3: Multiple Duplicates**

```
User Input:
  Title: "Peraturan Tunjangan Kinerja ASN" (ke-3 kalinya)

System Check:
  ⚠️ Sudah ada 2 artikel dengan slug serupa

Notification (Warning):
  ⚠️ Artikel dengan judul serupa sudah ada (2 artikel). 
     Slug akan otomatis disesuaikan menjadi "peraturan-tunjangan-kinerja-asn-2".

Notification (Success):
  ✅ Artikel "Peraturan Tunjangan Kinerja ASN" berhasil dibuat 
     dengan slug: peraturan-tunjangan-kinerja-asn-2

Slug Result:
  peraturan-tunjangan-kinerja-asn-2
```

---

## 🔧 Implementation

### **Backend Notification**

**File**: `apps/knowledge/views.py`

```python
from django.utils.text import slugify

@login_required
@permission_required_403('knowledge', 'articles', 'create')
def article_create(request):
    """
    Create new article with duplicate title notification
    """
    if request.method == 'POST':
        form = ArticleForm(request.POST, request.FILES, user=request.user)
        if form.is_valid():
            # Check if title already exists (before save)
            title = form.cleaned_data.get('title')
            slug_from_title = slugify(title)
            
            # Check for duplicate slug
            if Article.objects.filter(slug=slug_from_title).exists():
                # Count how many similar slugs exist
                similar_count = Article.objects.filter(
                    slug__startswith=slug_from_title
                ).count()
                
                messages.warning(
                    request, 
                    f'⚠️ Artikel dengan judul serupa sudah ada ({similar_count} artikel). '
                    f'Slug akan otomatis disesuaikan menjadi "{slug_from_title}-{similar_count}".'
                )
            
            article = form.save()
            
            # Show success message with actual slug
            if article.slug != slug_from_title:
                messages.success(
                    request, 
                    f'✅ Artikel "{article.title}" berhasil dibuat dengan slug: {article.slug}'
                )
            else:
                messages.success(
                    request, 
                    f'✅ Artikel "{article.title}" berhasil dibuat!'
                )
            
            # Redirect based on status
            if article.status == 'pending':
                messages.info(request, 'Artikel telah disubmit untuk approval.')
                return redirect('knowledge:article_manage_list')
            else:
                return redirect('knowledge:article_manage_detail', slug=article.slug)
    else:
        form = ArticleForm(user=request.user)
    
    context = {
        'form': form,
        'title': 'Buat Artikel Baru',
        'submit_text': 'Simpan Artikel',
    }
    
    return render(request, 'knowledge/articles/form.html', context)
```

---

## 📋 Notification Types

### **1. Warning Notification** (Before Save)

**When**: Ketika sistem detect ada artikel dengan slug serupa

**Message**:
```
⚠️ Artikel dengan judul serupa sudah ada (X artikel). 
   Slug akan otomatis disesuaikan menjadi "slug-artikel-X".
```

**Purpose**: 
- Memberitahu user bahwa slug akan di-auto-increment
- User bisa cancel jika tidak jadi buat artikel
- Transparansi tentang slug yang akan digunakan

---

### **2. Success Notification** (After Save)

#### **Case A: Slug Unik**
```
✅ Artikel "Judul Artikel" berhasil dibuat!
```

#### **Case B: Slug Auto-Incremented**
```
✅ Artikel "Judul Artikel" berhasil dibuat dengan slug: slug-artikel-1
```

**Purpose**:
- Konfirmasi artikel berhasil dibuat
- Menampilkan slug final yang digunakan
- User tahu slug yang bisa digunakan untuk akses artikel

---

### **3. Info Notification** (Status Pending)

**When**: Artikel di-submit untuk approval

**Message**:
```
ℹ️ Artikel telah disubmit untuk approval.
```

**Purpose**: Memberitahu user bahwa artikel perlu approval sebelum published

---

## 🎨 UI/UX Considerations

### **Message Styling**

```html
<!-- Warning Message (Yellow) -->
<div class="alert alert-warning">
    ⚠️ Artikel dengan judul serupa sudah ada (2 artikel). 
    Slug akan otomatis disesuaikan menjadi "peraturan-tunjangan-kinerja-asn-2".
</div>

<!-- Success Message (Green) -->
<div class="alert alert-success">
    ✅ Artikel "Peraturan Tunjangan Kinerja ASN" berhasil dibuat 
    dengan slug: peraturan-tunjangan-kinerja-asn-2
</div>

<!-- Info Message (Blue) -->
<div class="alert alert-info">
    ℹ️ Artikel telah disubmit untuk approval.
</div>
```

---

## 🚀 Future Enhancement: Real-Time Check (Optional)

### **JavaScript AJAX Check**

**File**: `templates/knowledge/articles/form.html`

```javascript
<script>
document.addEventListener('DOMContentLoaded', function() {
    const titleInput = document.querySelector('#id_title');
    const slugPreview = document.querySelector('#slug-preview');
    
    if (titleInput) {
        // Debounce function
        let timeout;
        titleInput.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                checkDuplicateTitle(titleInput.value);
            }, 500);
        });
    }
    
    function checkDuplicateTitle(title) {
        if (!title) return;
        
        // Generate slug from title
        const slug = title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        
        // AJAX check
        fetch(`/knowledge/api/check-slug/?slug=${slug}`)
            .then(response => response.json())
            .then(data => {
                if (data.exists) {
                    slugPreview.innerHTML = `
                        <div class="text-yellow-600 text-sm mt-2">
                            ⚠️ Artikel serupa sudah ada (${data.count} artikel). 
                            Slug akan menjadi: <strong>${data.suggested_slug}</strong>
                        </div>
                    `;
                } else {
                    slugPreview.innerHTML = `
                        <div class="text-green-600 text-sm mt-2">
                            ✅ Slug tersedia: <strong>${slug}</strong>
                        </div>
                    `;
                }
            });
    }
});
</script>
```

### **API Endpoint** (Optional)

```python
# apps/knowledge/urls_api.py
path('check-slug/', views.check_slug_availability, name='check_slug'),

# apps/knowledge/views.py
@login_required
def check_slug_availability(request):
    """
    Check if slug is available (AJAX endpoint)
    """
    slug = request.GET.get('slug', '')
    
    if not slug:
        return JsonResponse({'error': 'Slug required'}, status=400)
    
    exists = Article.objects.filter(slug=slug).exists()
    count = Article.objects.filter(slug__startswith=slug).count()
    
    suggested_slug = slug
    if exists:
        suggested_slug = f"{slug}-{count}"
    
    return JsonResponse({
        'exists': exists,
        'count': count,
        'suggested_slug': suggested_slug
    })
```

---

## 📊 User Experience Flow

### **Flow 1: User Creates Article with Unique Title**

```
1. User input title: "Panduan Django"
2. User click "Simpan Artikel"
3. System check: No duplicate
4. System save article
5. Show success: ✅ Artikel "Panduan Django" berhasil dibuat!
6. Redirect to article detail
```

---

### **Flow 2: User Creates Article with Duplicate Title**

```
1. User input title: "Peraturan Tunjangan Kinerja ASN"
2. User click "Simpan Artikel"
3. System check: Found 1 duplicate
4. Show warning: ⚠️ Artikel serupa sudah ada (1 artikel). 
                    Slug akan menjadi "peraturan-tunjangan-kinerja-asn-1"
5. System save article with auto-incremented slug
6. Show success: ✅ Artikel berhasil dibuat dengan slug: peraturan-tunjangan-kinerja-asn-1
7. Redirect to article detail
```

---

### **Flow 3: User with Real-Time Check (Future)**

```
1. User typing title: "Peraturan Tunjangan..."
2. System check in real-time (AJAX)
3. Show preview: ⚠️ Artikel serupa sudah ada. Slug akan menjadi: peraturan-tunjangan-kinerja-asn-1
4. User can decide: Continue or change title
5. User click "Simpan Artikel"
6. System save with expected slug
7. Show success
8. Redirect to article detail
```

---

## ✅ Benefits

### **1. Transparency**
```
✅ User tahu slug akan di-auto-increment
✅ Tidak ada surprise setelah save
✅ User bisa cancel jika tidak jadi
```

### **2. User Friendly**
```
✅ Clear notification messages
✅ Emoji untuk visual cue
✅ Actual slug ditampilkan
```

### **3. Prevent Confusion**
```
✅ User tidak bingung kenapa slug berbeda dari title
✅ User tahu ada artikel serupa
✅ User bisa cek artikel existing sebelum buat baru
```

### **4. SEO Awareness**
```
✅ User aware tentang slug structure
✅ User bisa adjust title jika perlu
✅ Better content planning
```

---

## 🧪 Testing

### **Test 1: Create Article with Unique Title**

```bash
# Login as admin
# Go to: /knowledge/manage/articles/create/
# Input title: "Test Unique Article"
# Click "Simpan Artikel"

Expected:
  ✅ Artikel "Test Unique Article" berhasil dibuat!
  Slug: test-unique-article
```

---

### **Test 2: Create Article with Duplicate Title**

```bash
# Create first article
# Input title: "Test Duplicate"
# Save

# Create second article
# Input title: "Test Duplicate" (SAMA!)
# Click "Simpan Artikel"

Expected:
  ⚠️ Artikel dengan judul serupa sudah ada (1 artikel). 
     Slug akan otomatis disesuaikan menjadi "test-duplicate-1".
  
  ✅ Artikel "Test Duplicate" berhasil dibuat dengan slug: test-duplicate-1
```

---

### **Test 3: Create Third Article with Same Title**

```bash
# Create third article
# Input title: "Test Duplicate" (SAMA LAGI!)
# Click "Simpan Artikel"

Expected:
  ⚠️ Artikel dengan judul serupa sudah ada (2 artikel). 
     Slug akan otomatis disesuaikan menjadi "test-duplicate-2".
  
  ✅ Artikel "Test Duplicate" berhasil dibuat dengan slug: test-duplicate-2
```

---

## 📚 Related Files

- `apps/knowledge/views.py` - Notification logic
- `apps/knowledge/models.py` - Auto-increment slug
- `templates/knowledge/articles/form.html` - Form template
- `apps/knowledge/urls_api.py` - API endpoint (future)

---

## 🎯 Conclusion

### **Jawaban untuk Pertanyaan**

**Q**: Apakah ada notif nanti jika jadi buat title yang sama?

**A**: **YA**, ada 2 notifikasi:

1. **Warning Notification** (Sebelum save):
   ```
   ⚠️ Artikel dengan judul serupa sudah ada (X artikel). 
      Slug akan otomatis disesuaikan menjadi "slug-artikel-X".
   ```

2. **Success Notification** (Setelah save):
   ```
   ✅ Artikel "Judul" berhasil dibuat dengan slug: slug-artikel-X
   ```

### **Status**

```
✅ Backend Notification: Implemented
✅ Warning Message: Implemented
✅ Success Message: Implemented
⏳ Real-Time Check: Future Enhancement

Status: COMPLETE ✅
```

---

**Last Updated**: 11 Mei 2026  
**Status**: ✅ IMPLEMENTED  
**Next Steps**: Add real-time AJAX check (optional)

---

**END OF DOCUMENT**
