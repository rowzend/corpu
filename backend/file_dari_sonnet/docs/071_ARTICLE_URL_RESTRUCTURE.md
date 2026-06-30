# Article URL Restructure - Management vs Public

**Tanggal**: 11 Mei 2026  
**Status**: ✅ COMPLETE  
**Project**: ASN Corpu Backend Python

---

## 🎯 Tujuan

Memisahkan URL artikel untuk public access dan management area:
- **Public**: `/knowledge/artikel/{slug}/` - Untuk pembaca umum
- **Management**: `/knowledge/manage/articles/view/{slug}/` - Untuk admin/staff

---

## 📊 Perubahan URL

### **BEFORE** (Single URL)
```
/knowledge/artikel/{slug}/
- Digunakan untuk public dan management
- Hanya menampilkan artikel published
- Tidak ada permission check
```

### **AFTER** (Dual URL)
```
1. PUBLIC URL (Tetap ada):
   /knowledge/artikel/{slug}/
   - Untuk pembaca umum
   - Hanya artikel published
   - Tidak perlu login
   - View: article_detail()

2. MANAGEMENT URL (Baru):
   /knowledge/manage/articles/view/{slug}/
   - Untuk admin/staff
   - Semua artikel (draft, pending, published)
   - Perlu login + permission
   - View: article_manage_detail()
```

---

## 🔧 Implementasi

### 1. **URL Configuration**

**File**: `apps/knowledge/urls.py`

```python
urlpatterns = [
    # PUBLIC URLS
    path('artikel/<slug:slug>/', views.article_detail, name='article_detail'),
    
    # MANAGEMENT URLS
    path('manage/articles/view/<slug:slug>/', views.article_manage_detail, name='article_manage_detail'),
]
```

---

### 2. **View Functions**

#### **Public View** (`article_detail`)
```python
def article_detail(request, slug):
    """
    Public article detail with view tracking and interactions
    - No authentication required
    - Only shows published articles
    - Tracks views by IP
    """
    article = get_object_or_404(
        Article.objects.select_related('category', 'author'),
        slug=slug,
        status='published'  # ✅ Only published
    )
    # ... rest of the code
```

#### **Management View** (`article_manage_detail`)
```python
@login_required
@permission_required_403('knowledge', 'articles', 'view')
def article_manage_detail(request, slug):
    """
    Article detail for management area
    - Requires authentication + permission
    - Shows all articles (draft, pending, published)
    - Access control: own articles + staff
    """
    article = get_object_or_404(
        Article.objects.select_related('category', 'author'),
        slug=slug  # ✅ All statuses
    )
    
    # Check if user can view this article
    can_view_all = check_permission(request.user, 'knowledge', 'articles', 'edit')
    if not can_view_all and article.author != request.user:
        messages.error(request, 'Anda tidak memiliki akses untuk melihat artikel ini.')
        return redirect('knowledge:article_manage_list')
    
    # ... rest of the code
```

---

### 3. **Template Updates**

#### **Management List** (`article_manage_list.html`)
```django
<!-- BEFORE -->
<a href="{% url 'knowledge:article_detail' article.slug %}">

<!-- AFTER -->
<a href="{% url 'knowledge:article_manage_detail' article.slug %}">
```

#### **Public Templates** (Tetap sama)
```django
<!-- List, Tags, Comments - tetap menggunakan public URL -->
<a href="{% url 'knowledge:article_detail' article.slug %}">
```

---

## 🔍 Potensi Konflik Route

### **Apakah Slug yang Mirip Bisa Konflik?**

**TIDAK**, karena:

1. **URL Pattern Berbeda**:
   ```
   /knowledge/artikel/{slug}/              ← Public
   /knowledge/manage/articles/view/{slug}/ ← Management
   ```
   Pattern URL-nya berbeda, jadi tidak akan konflik.

2. **Slug Unik per Artikel**:
   ```python
   # Model Article
   slug = models.SlugField(unique=True, max_length=255)
   ```
   Django memastikan slug unik, jadi tidak ada duplikat.

3. **Contoh Slug yang Mirip**:
   ```
   peraturan-tunjangan-kinerja-asn-2026
   peraturan-tunjangan-kinerja-asn-2027
   peraturan-tunjangan-kinerja-asn-2028
   ```
   Meskipun mirip, slug tetap unik dan tidak konflik.

---

## 📋 Verifikasi Slug

### **Cek Duplikat Slug**
```python
from apps.knowledge.models import Article
from collections import Counter

slugs = [article.slug for article in Article.objects.all()]
slug_counts = Counter(slugs)
duplicates = {slug: count for slug, count in slug_counts.items() if count > 1}

if duplicates:
    print("❌ DUPLIKAT DITEMUKAN:", duplicates)
else:
    print("✅ TIDAK ADA DUPLIKAT")
```

**Hasil**: ✅ **TIDAK ADA DUPLIKAT**

---

## 🎯 Use Cases

### **Use Case 1: Public Reader**
```
User: Pembaca umum (tidak login)
URL: http://localhost:8008/knowledge/artikel/peraturan-tunjangan-kinerja-asn-2026/
View: article_detail()
Access: ✅ Bisa akses (artikel published)
```

### **Use Case 2: Admin View Draft**
```
User: Admin (login + permission)
URL: http://localhost:8008/knowledge/manage/articles/view/artikel-draft-belum-publish/
View: article_manage_detail()
Access: ✅ Bisa akses (semua status artikel)
```

### **Use Case 3: Author View Own Draft**
```
User: Author (login, artikel miliknya)
URL: http://localhost:8008/knowledge/manage/articles/view/artikel-saya-draft/
View: article_manage_detail()
Access: ✅ Bisa akses (artikel milik sendiri)
```

### **Use Case 4: User View Other's Draft**
```
User: Regular user (login, bukan pemilik)
URL: http://localhost:8008/knowledge/manage/articles/view/artikel-orang-lain-draft/
View: article_manage_detail()
Access: ❌ Redirect ke article_manage_list (tidak punya akses)
```

---

## 🔐 Permission Matrix

| User Type | Public URL | Management URL | Can View Draft |
|-----------|------------|----------------|----------------|
| Anonymous | ✅ Published only | ❌ No access | ❌ |
| Regular User | ✅ Published only | ✅ Own articles | ✅ Own only |
| Author | ✅ Published only | ✅ Own articles | ✅ Own only |
| Admin/Staff | ✅ Published only | ✅ All articles | ✅ All |

---

## 📝 Template Usage

### **Public Templates** (Gunakan `article_detail`)
```django
<!-- List, Tags, Related Articles -->
<a href="{% url 'knowledge:article_detail' article.slug %}">
    {{ article.title }}
</a>
```

**Files**:
- `templates/knowledge/articles/list.html`
- `templates/knowledge/tags/detail.html`
- `templates/knowledge/articles/detail.html` (related articles)

---

### **Management Templates** (Gunakan `article_manage_detail`)
```django
<!-- Management List, Comments Management -->
<a href="{% url 'knowledge:article_manage_detail' article.slug %}">
    {{ article.title }}
</a>
```

**Files**:
- `templates/knowledge/articles/manage_list.html`
- `templates/knowledge/comments/manage_list.html` (optional)
- `templates/knowledge/comments/confirm_delete.html` (optional)

---

## 🚀 Testing

### **Test Public URL**
```bash
# Test published article
curl http://localhost:8008/knowledge/artikel/peraturan-tunjangan-kinerja-asn-2026/

# Expected: ✅ 200 OK (article detail page)
```

### **Test Management URL (Without Login)**
```bash
# Test without authentication
curl http://localhost:8008/knowledge/manage/articles/view/peraturan-tunjangan-kinerja-asn-2026/

# Expected: ❌ 302 Redirect to login
```

### **Test Management URL (With Login)**
```bash
# Test with authentication
curl -H "Cookie: sessionid=..." \
     http://localhost:8008/knowledge/manage/articles/view/peraturan-tunjangan-kinerja-asn-2026/

# Expected: ✅ 200 OK (article detail page with management features)
```

---

## ✅ Checklist

### **Implementation**
- [x] Create `article_manage_detail` view
- [x] Add URL pattern for management detail
- [x] Update `article_manage_list.html` template
- [x] Add permission check in management view
- [x] Add access control for own articles
- [x] Test public URL still works
- [x] Test management URL requires login
- [x] Test management URL requires permission

### **Documentation**
- [x] Document URL structure
- [x] Document view differences
- [x] Document permission matrix
- [x] Document slug uniqueness
- [x] Document use cases

---

## 🎯 Benefits

### **1. Separation of Concerns**
- Public URL untuk pembaca umum
- Management URL untuk admin/staff
- Clear distinction antara public dan management

### **2. Better Security**
- Management URL requires authentication
- Management URL requires permission
- Access control untuk artikel draft

### **3. Better UX**
- Public readers tidak perlu login
- Admin bisa lihat semua artikel (termasuk draft)
- Author bisa lihat artikel sendiri (termasuk draft)

### **4. No Route Conflicts**
- URL pattern berbeda
- Slug unik per artikel
- Django routing handles it correctly

---

## 📚 Related Documentation

- `apps/knowledge/urls.py` - URL configuration
- `apps/knowledge/views.py` - View functions
- `templates/knowledge/articles/manage_list.html` - Management template
- `templates/knowledge/articles/detail.html` - Detail template

---

## 🔄 Migration Path

### **For Existing Links**
```
Old: /knowledge/artikel/{slug}/
New: Same (no change for public)

Old: Management area used public URL
New: Management area uses /knowledge/manage/articles/view/{slug}/
```

### **For Bookmarks**
- Public bookmarks: ✅ Still work
- Management bookmarks: ⚠️ Need to update (if any)

---

## ✅ Status

```
✅ Public URL: Working
✅ Management URL: Working
✅ Permission Check: Working
✅ Access Control: Working
✅ No Route Conflicts: Verified
✅ Templates Updated: Complete

Status: COMPLETE ✅
```

---

**Last Updated**: 11 Mei 2026  
**Status**: ✅ COMPLETE  
**Next Steps**: Monitor production usage

---

**END OF DOCUMENT**
