# 📚 Knowledge Base - Media Features (Thumbnail, File, YouTube)

**Date:** May 6, 2026  
**Status:** ✅ **BACKEND COMPLETE**  
**Inspired by:** KMS Kemenkes (https://kms.kemkes.go.id/)

---

## 🎯 New Features Added

### Fitur Baru di Article Model:

1. **✅ Thumbnail** - Gambar preview artikel
2. **✅ File Upload** - Upload file langsung (PDF, DOC, PPT, dll)
3. **✅ File Link** - Link ke file eksternal (Google Drive, Dropbox)
4. **✅ YouTube Video** - Embed video YouTube
5. **✅ External Link** - Link ke website eksternal
6. **✅ Content Type** - Tipe konten (Artikel, Video, Dokumen, Link)

---

## 📊 Database Schema

### New Fields in `knowledge_articles`:

| Field | Type | Description |
|-------|------|-------------|
| `thumbnail` | ImageField | Gambar thumbnail (800x600px recommended) |
| `content_type` | CharField | Tipe konten: article, video, document, link |
| `file_url` | URLField | Link ke file eksternal |
| `file_upload` | FileField | Upload file langsung |
| `file_size` | BigIntegerField | Ukuran file (bytes) |
| `file_type` | CharField | Tipe file (PDF, DOC, PPT, dll) |
| `youtube_url` | URLField | Link video YouTube |
| `youtube_embed_id` | CharField | YouTube video ID (auto-extracted) |
| `video_duration` | CharField | Durasi video (10:30) |
| `external_url` | URLField | Link eksternal |

---

## 🔧 Model Methods

### Auto-Extract YouTube ID:

```python
def extract_youtube_id(self, url):
    """Extract YouTube video ID from URL"""
    # Supports:
    # - https://www.youtube.com/watch?v=xxxxx
    # - https://youtu.be/xxxxx
    # - https://www.youtube.com/embed/xxxxx
```

**Example:**
```python
article.youtube_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
article.save()
# Auto-extracts: youtube_embed_id = "dQw4w9WgXcQ"
```

---

### Get YouTube Embed URL:

```python
def get_youtube_embed_url(self):
    """Get YouTube embed URL"""
    # Returns: https://www.youtube.com/embed/xxxxx
```

**Usage:**
```html
<iframe src="{{ article.get_youtube_embed_url }}" frameborder="0"></iframe>
```

---

### Get YouTube Thumbnail:

```python
def get_youtube_thumbnail(self):
    """Get YouTube thumbnail URL"""
    # Returns: https://img.youtube.com/vi/xxxxx/maxresdefault.jpg
```

**Usage:**
```html
<img src="{{ article.get_youtube_thumbnail }}" alt="Video thumbnail">
```

---

### Get File Icon:

```python
def get_file_icon(self):
    """Get icon class based on file type"""
    # Returns: 'fas fa-file-pdf', 'fas fa-file-word', etc.
```

**Supported File Types:**
- PDF → `fas fa-file-pdf`
- DOC/DOCX → `fas fa-file-word`
- XLS/XLSX → `fas fa-file-excel`
- PPT/PPTX → `fas fa-file-powerpoint`
- ZIP/RAR → `fas fa-file-archive`
- JPG/PNG → `fas fa-file-image`
- MP4/AVI → `fas fa-file-video`
- MP3/WAV → `fas fa-file-audio`

---

### Get File Size Display:

```python
def get_file_size_display(self):
    """Get human-readable file size"""
    # Returns: "2.5 MB", "150 KB", etc.
```

---

## 💾 Migration Applied

### Migration File:
```
apps/knowledge/migrations/0002_article_content_type_article_external_url_and_more.py
```

### Fields Added:
```
✅ content_type
✅ external_url
✅ file_size
✅ file_type
✅ file_upload
✅ file_url
✅ thumbnail
✅ video_duration
✅ youtube_embed_id
✅ youtube_url
✅ Index on content_type
```

---

## 📝 Usage Examples

### Example 1: Article with Thumbnail

```python
from apps.knowledge.models import Article, Category
from django.contrib.auth import get_user_model

User = get_user_model()
author = User.objects.first()
category = Category.objects.first()

article = Article.objects.create(
    title="Panduan Django untuk Pemula",
    content="Ini adalah panduan lengkap Django...",
    author=author,
    category=category,
    content_type='article',
    thumbnail='knowledge/thumbnails/2026/05/django-guide.jpg',
    status='published'
)
```

---

### Example 2: YouTube Video Article

```python
article = Article.objects.create(
    title="Tutorial Django REST Framework",
    content="Video tutorial lengkap DRF...",
    author=author,
    category=category,
    content_type='video',
    youtube_url='https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    video_duration='15:30',
    status='published'
)

# Auto-extracted:
print(article.youtube_embed_id)  # dQw4w9WgXcQ
print(article.get_youtube_embed_url())  # https://www.youtube.com/embed/dQw4w9WgXcQ
print(article.get_youtube_thumbnail())  # https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg
```

---

### Example 3: Document with File Upload

```python
from django.core.files import File

with open('/path/to/document.pdf', 'rb') as f:
    article = Article.objects.create(
        title="Panduan Teknis ASN",
        content="Dokumen panduan teknis...",
        author=author,
        category=category,
        content_type='document',
        file_upload=File(f, name='panduan-asn.pdf'),
        status='published'
    )

# Auto-calculated:
print(article.file_size)  # 2048576 (bytes)
print(article.file_type)  # PDF
print(article.get_file_size_display())  # 2.0 MB
print(article.get_file_icon())  # fas fa-file-pdf
```

---

### Example 4: External File Link

```python
article = Article.objects.create(
    title="Peraturan Pemerintah No. 11 Tahun 2024",
    content="Peraturan tentang...",
    author=author,
    category=category,
    content_type='document',
    file_url='https://drive.google.com/file/d/xxxxx/view',
    file_type='PDF',
    file_size=5242880,  # 5 MB
    status='published'
)
```

---

### Example 5: External Link

```python
article = Article.objects.create(
    title="Website Resmi BKN",
    content="Link ke website BKN...",
    author=author,
    category=category,
    content_type='link',
    external_url='https://www.bkn.go.id',
    status='published'
)
```

---

## 🎨 Content Types

### Available Content Types:

```python
CONTENT_TYPE_CHOICES = [
    ('article', 'Artikel'),      # Text article with optional media
    ('video', 'Video'),          # YouTube video
    ('document', 'Dokumen'),     # PDF, DOC, PPT, etc.
    ('link', 'Link'),            # External link
]
```

### Usage in Templates:

```html
{% if article.content_type == 'video' %}
    <!-- Show YouTube embed -->
    <iframe src="{{ article.get_youtube_embed_url }}"></iframe>
    
{% elif article.content_type == 'document' %}
    <!-- Show file download -->
    <a href="{{ article.file_upload.url }}" download>
        <i class="{{ article.get_file_icon }}"></i>
        Download {{ article.file_type }} ({{ article.get_file_size_display }})
    </a>
    
{% elif article.content_type == 'link' %}
    <!-- Show external link -->
    <a href="{{ article.external_url }}" target="_blank">
        Visit Website <i class="fas fa-external-link-alt"></i>
    </a>
    
{% else %}
    <!-- Show article content -->
    <div class="article-content">
        {{ article.content|safe }}
    </div>
{% endif %}
```

---

## 📊 Query Examples

### Get All Video Articles:

```python
videos = Article.objects.filter(
    content_type='video',
    status='published'
).order_by('-published_at')
```

---

### Get Articles with Thumbnails:

```python
articles_with_thumbnails = Article.objects.filter(
    thumbnail__isnull=False,
    status='published'
)
```

---

### Get Documents by File Type:

```python
pdf_documents = Article.objects.filter(
    content_type='document',
    file_type='PDF',
    status='published'
)
```

---

### Get Featured Videos:

```python
featured_videos = Article.objects.filter(
    content_type='video',
    is_featured=True,
    status='published'
).order_by('-view_count')
```

---

## 🔐 Media Settings

### Required Settings in `settings.py`:

```python
# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10 MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10 MB

# Allowed file extensions
ALLOWED_UPLOAD_EXTENSIONS = [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'jpg', 'jpeg', 'png', 'gif',
    'zip', 'rar',
]
```

---

### URL Configuration:

```python
# urls.py
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ... your urls
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

---

## 📁 File Structure

### Media Files Location:

```
media/
├── knowledge/
│   ├── thumbnails/
│   │   └── 2026/
│   │       └── 05/
│   │           ├── article-1-thumb.jpg
│   │           ├── article-2-thumb.png
│   │           └── ...
│   └── files/
│       └── 2026/
│           └── 05/
│               ├── document-1.pdf
│               ├── presentation-1.pptx
│               └── ...
```

---

## 🎯 Next Steps (Frontend)

### To Implement in Frontend:

1. **✅ Article Form** - Add fields for thumbnail, file, YouTube
2. **✅ File Upload** - Handle file upload with progress bar
3. **✅ YouTube Preview** - Show YouTube thumbnail when URL entered
4. **✅ Card Display** - Show thumbnail in article cards (like KMS Kemenkes)
5. **✅ Video Player** - Embed YouTube player
6. **✅ File Download** - Download button with file info
7. **✅ Content Type Filter** - Filter by content type

---

## 📚 Documentation

**Related Docs:**
```
file_dari_sonnet/docs/036_KNOWLEDGE_BASE_MEDIA_FEATURES.md  ← This file
file_dari_sonnet/docs/016_KNOWLEDGE_BASE_README.md
file_dari_sonnet/docs/017_KNOWLEDGE_BASE_QUICK_REFERENCE.md
```

---

**🎉 BACKEND COMPLETE! Ready for Frontend Implementation!**

**Status:** ✅ **BACKEND DONE**  
**Migration:** ✅ **APPLIED**  
**Models:** ✅ **UPDATED**  
**Methods:** ✅ **ADDED**

**Next:** Frontend implementation (forms, upload, display)

---

**Created by:** Kiro AI Assistant  
**Date:** May 6, 2026  
**Inspired by:** KMS Kemenkes
