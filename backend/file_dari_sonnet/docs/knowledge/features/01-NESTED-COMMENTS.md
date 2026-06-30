# ✨ Features Documentation - Knowledge Base System

> **Dokumentasi lengkap fitur-fitur Knowledge Base System**

## 📋 Daftar Isi

1. [Nested Comments (2-Level)](#nested-comments-2-level)
2. [Like/Dislike System](#likedislike-system)
3. [Rating System](#rating-system)
4. [View Tracking](#view-tracking)
5. [Approval Workflow](#approval-workflow)
6. [Content Types](#content-types)

---

## 💬 Nested Comments (2-Level)

### Overview
Sistem komentar dengan maksimal 2 level kedalaman untuk menjaga readability dan user experience.

### Struktur
```
📝 Komentar Parent (Level 0)
   ├─ 📝 Reply 1 (Level 1)
   ├─ 📝 Reply 2 (Level 1)
   └─ 📝 Reply 3 (Level 1)

📝 Komentar Parent 2 (Level 0)
   └─ 📝 Reply 1 (Level 1)
```

### Cara Kerja

#### 1. **Reply ke Komentar Parent**
```javascript
// User klik "Balas" di komentar parent
// Form reply muncul
// User submit → Reply tersimpan sebagai Level 1
```

#### 2. **Reply ke Reply (Flat Structure)**
```javascript
// User klik "Balas" di reply (Level 1)
// System otomatis reply ke parent aslinya
// Tetap tersimpan sebagai Level 1 (flat)
```

### Implementation Details

#### Backend Logic (`views.py`)
```python
@login_required
def comment_reply(request, pk):
    parent_comment = get_object_or_404(Comment, pk=pk)
    
    # Check if parent is already a reply (level 1)
    if parent_comment.parent:
        # Reply to reply → redirect to original parent
        actual_parent = parent_comment.parent
    else:
        # Reply to top-level comment
        actual_parent = parent_comment
    
    # Create reply at level 1
    reply = Comment.objects.create(
        article=actual_parent.article,
        user=request.user,
        parent=actual_parent,
        content=content
    )
```

#### Frontend Display
```html
<!-- Parent Comment -->
<div class="comment-parent">
    <div class="comment-content">...</div>
    <button onclick="toggleReplyForm({{ comment.id }})">Balas</button>
    
    <!-- Replies (Level 1) -->
    <div class="replies-container">
        {% for reply in comment.get_replies %}
        <div class="comment-reply">
            <div class="reply-content">...</div>
            <button onclick="toggleReplyForm({{ reply.id }})">Balas</button>
        </div>
        {% endfor %}
    </div>
</div>
```

### Benefits
✅ **Readability**: Tidak terlalu dalam, mudah dibaca  
✅ **Mobile-Friendly**: Tidak ada horizontal scroll berlebihan  
✅ **Performance**: Query lebih efisien (max 2 level)  
✅ **UX**: User tidak bingung dengan nested terlalu dalam  

### Limitations
❌ Tidak bisa reply ke reply secara langsung (akan flat ke level 1)  
❌ Maksimal 2 level saja  

---

## 👍👎 Like/Dislike System

### Overview
User dapat memberikan like atau dislike pada artikel dan komentar.

### Features

#### 1. **Article Like/Dislike**
- ✅ User hanya bisa like ATAU dislike (tidak bisa keduanya)
- ✅ Klik lagi untuk remove like/dislike
- ✅ Real-time counter update
- ✅ Visual feedback (warna berubah)

#### 2. **Comment Like/Dislike**
- ✅ Sama seperti artikel
- ✅ Berlaku untuk parent comment dan reply
- ✅ Counter terpisah per comment

### Database Schema

```python
class ArticleLike(models.Model):
    article = ForeignKey(Article)
    user = ForeignKey(User)
    is_like = BooleanField()  # True=like, False=dislike
    created_at = DateTimeField()
    
    class Meta:
        unique_together = ('article', 'user')

class CommentLike(models.Model):
    comment = ForeignKey(Comment)
    user = ForeignKey(User)
    is_like = BooleanField()
    created_at = DateTimeField()
    
    class Meta:
        unique_together = ('comment', 'user')
```

### API Endpoints

```bash
# Article
POST /knowledge/ajax/articles/{slug}/like/
POST /knowledge/ajax/articles/{slug}/dislike/

# Comment
POST /knowledge/ajax/comments/{id}/like/
POST /knowledge/ajax/comments/{id}/dislike/
```

### Response Format
```json
{
    "success": true,
    "action": "liked",  // or "disliked" or "removed"
    "like_count": 15,
    "dislike_count": 2,
    "like_percentage": 88.2
}
```

### Frontend Implementation

```javascript
function likeArticle(slug) {
    fetch(`/knowledge/ajax/articles/${slug}/like/`, {
        method: 'POST',
        headers: {'X-CSRFToken': csrfToken}
    })
    .then(response => response.json())
    .then(data => {
        // Update counter
        document.getElementById('like-count').textContent = data.like_count;
        
        // Update button state
        if (data.action === 'liked') {
            likeBtn.classList.add('active');
            dislikeBtn.classList.remove('active');
        }
    });
}
```

---

## ⭐ Rating System

### Overview
User dapat memberikan rating 1-5 bintang dengan optional feedback.

### Features
- ✅ Rating 1-5 bintang
- ✅ Optional text feedback
- ✅ User hanya bisa rate 1x per artikel (bisa update)
- ✅ Average rating calculation
- ✅ Rating count display

### Database Schema
```python
class Rating(models.Model):
    article = ForeignKey(Article)
    user = ForeignKey(User)
    rating = IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    feedback = TextField(blank=True, null=True)
    created_at = DateTimeField()
    
    class Meta:
        unique_together = ('article', 'user')
```

### Calculation
```python
def update_rating(self):
    ratings = self.ratings.all()
    if ratings.exists():
        self.rating_avg = ratings.aggregate(Avg('rating'))['rating__avg']
        self.rating_count = ratings.count()
    else:
        self.rating_avg = 0.00
        self.rating_count = 0
    self.save()
```

### Display
```html
<!-- Average Rating -->
<div class="rating-display">
    <i class="fas fa-star text-yellow-500"></i>
    <span>{{ article.rating_avg|floatformat:1 }}</span>
    <span class="text-gray-500">({{ article.rating_count }} ratings)</span>
</div>

<!-- Rating Form -->
<div class="rating-stars">
    {% for i in "12345" %}
    <button onclick="rateArticle('{{ article.slug }}', {{ i }})" 
            class="rating-star {% if user_rating.rating >= i %}active{% endif %}">
        <i class="fas fa-star"></i>
    </button>
    {% endfor %}
</div>
```

---

## 👁️ View Tracking

### Overview
Sistem tracking unique views berdasarkan IP address untuk menghindari duplicate counting.

### Features
- ✅ **Unique View Counting**: 1 IP = 1 view per artikel
- ✅ **User Tracking**: Jika login, user juga di-track
- ✅ **User Agent Logging**: Browser/device info
- ✅ **Timestamp**: Kapan artikel dilihat

### Database Schema
```python
class ArticleView(models.Model):
    article = ForeignKey(Article)
    ip_address = GenericIPAddressField()
    user = ForeignKey(User, null=True, blank=True)
    user_agent = TextField(blank=True, null=True)
    viewed_at = DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('article', 'ip_address')
```

### Implementation
```python
def increment_view_count(self, ip_address=None, user=None):
    if ip_address:
        # Check if IP already viewed
        view_exists = ArticleView.objects.filter(
            article=self,
            ip_address=ip_address
        ).exists()
        
        if not view_exists:
            # Create new view record
            ArticleView.objects.create(
                article=self,
                ip_address=ip_address,
                user=user
            )
            # Increment counter
            self.view_count += 1
            self.save(update_fields=['view_count'])
            return True
        return False
```

### Usage in View
```python
def article_detail(request, slug):
    article = get_object_or_404(Article, slug=slug)
    
    # Track view
    ip_address = get_client_ip(request)
    article.increment_view_count(
        ip_address=ip_address,
        user=request.user if request.user.is_authenticated else None
    )
```

### Analytics
```python
# Most viewed articles
Article.objects.filter(status='published').order_by('-view_count')[:10]

# Views by date
ArticleView.objects.filter(
    viewed_at__date=timezone.now().date()
).count()

# Unique visitors
ArticleView.objects.values('ip_address').distinct().count()
```

---

## ✅ Approval Workflow

### Overview
Sistem approval untuk artikel sebelum dipublikasi.

### Workflow States
```
Draft → Pending → Approved → Published
   ↓                ↓
Rejected ←────────┘
```

### Status Definitions

1. **Draft**: Artikel masih dalam penulisan
2. **Pending**: Disubmit untuk approval
3. **Approved**: Disetujui oleh approver
4. **Rejected**: Ditolak dengan alasan
5. **Published**: Sudah dipublikasi dan visible
6. **Archived**: Artikel lama yang di-archive

### Permissions

| Action | Permission Required |
|--------|-------------------|
| Create Draft | `knowledge.articles.create` |
| Submit for Approval | Author atau `knowledge.articles.edit` |
| Approve | `knowledge.articles.approve` |
| Reject | `knowledge.articles.approve` |
| Publish | `knowledge.articles.approve` |

### Implementation

```python
# Submit for approval
def submit_for_approval(self, user=None):
    if self.status not in ['draft', 'rejected']:
        raise ValueError("Only draft or rejected articles can be submitted")
    
    self.status = 'pending'
    self.submitted_at = timezone.now()
    self.save()
    
    # Create history
    ApprovalHistory.objects.create(
        article=self,
        action='submitted',
        actor=user or self.author,
        reason='Submitted for approval'
    )

# Approve
def approve(self, approver, reason=None):
    if self.status != 'pending':
        raise ValueError("Only pending articles can be approved")
    
    self.status = 'approved'
    self.approved_by = approver
    self.approved_at = timezone.now()
    self.save()

# Reject
def reject(self, rejector, reason):
    if self.status != 'pending':
        raise ValueError("Only pending articles can be rejected")
    
    self.status = 'rejected'
    self.rejection_reason = reason
    self.rejection_count += 1
    self.save()
```

### History Tracking
```python
class ApprovalHistory(models.Model):
    article = ForeignKey(Article)
    action = CharField(choices=[
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('published', 'Published')
    ])
    actor = ForeignKey(User)
    reason = TextField(blank=True, null=True)
    created_at = DateTimeField(auto_now_add=True)
```

---

## 📄 Content Types

### Overview
Artikel mendukung 4 tipe konten berbeda.

### Types

#### 1. **Article** (Text Content)
- Rich text editor (CKEditor)
- Image upload
- Code syntax highlighting
- Embedded media

#### 2. **Video** (YouTube)
- YouTube URL input
- Auto-extract video ID
- Embedded player
- Thumbnail auto-fetch
- Duration tracking

```python
def extract_youtube_id(self, url):
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)',
        r'youtube\.com\/embed\/([^&\n?#]+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None
```

#### 3. **Document** (File Upload)
- PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX
- File size tracking
- File type detection
- Download counter
- Preview support (PDF)

```python
# Supported formats
ALLOWED_EXTENSIONS = [
    'pdf', 'doc', 'docx', 'ppt', 'pptx',
    'xls', 'xlsx', 'zip', 'rar'
]

# File size limit
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB
```

#### 4. **Link** (External URL)
- External website link
- Open in new tab
- Link validation
- Redirect tracking

### Selection in Form
```html
<select name="content_type">
    <option value="article">Artikel</option>
    <option value="video">Video</option>
    <option value="document">Dokumen</option>
    <option value="link">Link Eksternal</option>
</select>
```

### Display Logic
```python
{% if article.content_type == 'video' %}
    <!-- YouTube embed -->
    <iframe src="{{ article.get_youtube_embed_url }}"></iframe>
{% elif article.content_type == 'document' %}
    <!-- File download -->
    <a href="{{ article.file_upload.url }}">Download</a>
{% elif article.content_type == 'link' %}
    <!-- External link -->
    <a href="{{ article.external_url }}" target="_blank">Visit</a>
{% else %}
    <!-- Article content -->
    {{ article.content|safe }}
{% endif %}
```

---

## 📊 Statistics & Analytics

### Article Stats
- View count (unique)
- Like/Dislike count
- Rating average
- Comment count
- Share count

### User Engagement
- Most viewed articles
- Most liked articles
- Highest rated articles
- Most commented articles

### Time-based Analytics
- Views today
- Views this week
- Views this month
- Trending articles

---

**Last Updated**: 11 Mei 2026  
**Version**: 1.0.0
