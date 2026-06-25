# 📚 Knowledge Base - Complete Documentation Index

## 📖 Dokumentasi Lengkap

Sistem Knowledge Base dengan fitur lengkap: View Tracking, Like/Dislike, Rating, dan Comment System.

---

## 📑 Daftar Dokumentasi

### 1. **01_README.md** (Main Documentation)
   - Overview sistem Knowledge Base
   - Quick start guide
   - Database tables summary
   - API endpoints summary
   - Tech stack

### 2. **02_INDEX.md** (File ini - Complete Index)
   - Index lengkap semua dokumentasi
   - Fitur overview
   - Quick links

### 3. **03_COMPLETE_FEATURES_SUMMARY.md**
   - Overview semua fitur lengkap
   - Database schema summary
   - API endpoints lengkap
   - Migration steps
   - Quick start guide

### 4. **04_VIEW_COUNT_GUIDE.md**
   - IP-based view tracking
   - Unique view counting
   - Analytics dan statistics
   - Privacy & GDPR considerations

### 5. **05_LIKE_DISLIKE_GUIDE.md**
   - Like/Dislike system untuk artikel
   - User-based tracking
   - Toggle support
   - Frontend implementation examples

### 6. **06_COMMENT_SYSTEM_GUIDE.md**
   - Comment system dengan nested replies
   - Like/Dislike pada comment
   - Edit dan delete comment
   - Frontend React examples

### 7. **07_KMS_STYLE_UI_GUIDE.md**
   - UI implementation seperti KMS Kemenkes
   - Author info dengan avatar/initial
   - Share button dengan tracking
   - Stats display lengkap
   - Complete React component examples

### 8. **08_APPROVAL_SYSTEM_GUIDE.md**
   - Sistem approval/validasi sebelum publish
   - Workflow: draft → pending → approved/rejected → published
   - Keterangan ditolak (rejection reason)
   - Riwayat approval (history)
   - Staff approval actions

### 9. **09_IMPLEMENTATION_GUIDE.md**
   - Panduan implementasi detail
   - Django view examples
   - DRF API examples
   - Testing guide

### 10. **10_FINAL_SUMMARY.md**
   - Summary lengkap semua fitur
   - Checklist implementasi
   - Production readiness
   - Next steps

### 11. **11_SEEDING_GUIDE.md** ⭐ NEW
   - Database seeding lengkap
   - Sample data (categories, tags, articles)
   - Seeding commands dan verification
   - Customization guide

### 12. **12_BACKEND_CHECKLIST.md** ⭐ NEW
   - Status lengkap backend (100% complete)
   - Checklist semua komponen
   - API endpoints summary
   - Production readiness verification

### 13. **13_FRONTEND_API_GUIDE.md** ⭐ NEW
   - Complete API reference untuk frontend
   - CRUD operations lengkap
   - Request/response examples
   - React/Vue integration examples

### 14. **14_PERMISSION_SYSTEM_GUIDE.md** ⭐ NEW
   - Granular permission system (48 permissions)
   - Role-based access control
   - API & web integration
   - Setup dan usage examples

---

## 🎯 Fitur Lengkap

### 1. 👁️ View Count (IP-Based)
- ✅ Track unique views berdasarkan IP
- ✅ 1 IP = 1 view per artikel
- ✅ User tracking (optional)
- ✅ Analytics: trending, popular

**Dokumentasi:** `README_VIEW_COUNT.md`

---

### 2. 👍👎 Like/Dislike System
- ✅ User-based tracking
- ✅ Toggle support (like ↔ dislike ↔ remove)
- ✅ Like percentage calculation
- ✅ **Lihat siapa yang like/dislike** ⭐ NEW
- ✅ **User anonim TIDAK bisa like/dislike** ⭐ UPDATED

**Dokumentasi:** `LIKE_DISLIKE_GUIDE.md`

**API Endpoints:**
```bash
POST   /api/knowledge/articles/{slug}/like/         # Like (auth required)
POST   /api/knowledge/articles/{slug}/dislike/      # Dislike (auth required)
DELETE /api/knowledge/articles/{slug}/unlike/       # Remove action
GET    /api/knowledge/articles/{slug}/who_liked/    # Lihat siapa yang like ⭐
GET    /api/knowledge/articles/{slug}/who_disliked/ # Lihat siapa yang dislike ⭐
```

---

### 3. ⭐ Rating System (1-5 Stars)
- ✅ User-based rating
- ✅ Rating 1-5 dengan feedback
- ✅ Auto-calculate average

**Dokumentasi:** `COMPLETE_FEATURES_SUMMARY.md`

---

### 4. 💬 Comment System ⭐ NEW
- ✅ **Nested Replies** (unlimited depth)
- ✅ **Like/Dislike pada comment**
- ✅ **Edit comment** (dengan flag "edited")
- ✅ **Delete comment** (author atau staff)
- ✅ **User anonim TIDAK bisa comment/like**

**Dokumentasi:** `COMMENT_SYSTEM_GUIDE.md`

**API Endpoints:**
```bash
# Comments
GET    /api/knowledge/comments/?article_slug=my-article
POST   /api/knowledge/comments/                     # Create comment/reply (auth required)
PUT    /api/knowledge/comments/{id}/                # Edit (author only)
DELETE /api/knowledge/comments/{id}/                # Delete (author/staff only)

# Comment Likes
POST   /api/knowledge/comments/{id}/like/           # Like comment (auth required)
POST   /api/knowledge/comments/{id}/dislike/        # Dislike comment (auth required)
DELETE /api/knowledge/comments/{id}/unlike/         # Remove action
GET    /api/knowledge/comments/{id}/user_action/    # Check user's action
```

**Comment Structure:**
```
Comment 1 (top-level)
├── Reply 1.1 (nested)
│   ├── Reply 1.1.1 (nested deeper)
│   └── Reply 1.1.2
└── Reply 1.2
    └── Reply 1.2.1
```

---

### 5. 🎨 KMS Style UI ⭐ NEW
- ✅ **Author Avatar** dengan initial (e.g., "AZ")
- ✅ **Share Button** dengan dropdown & tracking
- ✅ **Stats Display** (views, likes, shares, date)
- ✅ **Tags/Keywords** display
- ✅ **Time Since Published** (e.g., "1 minggu yang lalu")
- ✅ **Video Player** integration

**Dokumentasi:** `KMS_STYLE_UI_GUIDE.md`

**New Features:**
```bash
# Share tracking
POST /api/knowledge/articles/{slug}/share/
{
  "platform": "facebook|twitter|whatsapp|linkedin|copy"
}

# Response includes new fields:
{
  "author_initial": "AZ",
  "author_role": "Author",
  "share_count": 5,
  "comment_count": 12,
  "time_since_published": "1 minggu yang lalu",
  "tags": [...]
}
```

---

### 6. ✅ Approval/Validation System ⭐ NEW
- ✅ **Workflow approval** (draft → pending → approved/rejected → published)
- ✅ **Validasi oleh staff** (approve/reject)
- ✅ **Keterangan ditolak** (rejection reason - required)
- ✅ **Riwayat approval** (history berapa kali ditolak)
- ✅ **Tracking approver** (siapa yang approve/reject)

**Dokumentasi:** `APPROVAL_SYSTEM_GUIDE.md`

**Workflow:**
```
DRAFT → submit_for_approval() → PENDING
                                   ↓
                    ┌──────────────┴──────────────┐
                    ↓                             ↓
                APPROVED                      REJECTED
                    ↓                             ↓
                PUBLISHED                  (can resubmit)
```

**API Endpoints:**
```bash
POST /api/knowledge/articles/{slug}/submit_for_approval/  # Author
POST /api/knowledge/articles/{slug}/approve/              # Staff
POST /api/knowledge/articles/{slug}/reject/               # Staff (reason required)
POST /api/knowledge/articles/{slug}/publish/              # Staff/Author
GET  /api/knowledge/articles/{slug}/approval_history/     # History
GET  /api/knowledge/articles/pending_approval/            # Staff only
GET  /api/knowledge/articles/my_articles/                 # Author's articles
```

---

## 📊 Database Tables

| Table | Description |
|-------|-------------|
| `knowledge_articles` | Artikel dengan view/like/rating counts |
| `knowledge_article_views` | Track unique views (IP-based) |
| `knowledge_article_likes` | Like/dislike artikel (user-based) |
| `knowledge_ratings` | Rating 1-5 stars (user-based) |
| `knowledge_comments` ⭐ | Comments dengan nested replies |
| `knowledge_comment_likes` ⭐ | Like/dislike comment (user-based) |

---

## 🔒 Permission Summary

### Article Like/Dislike
- ❌ **Anonymous users**: TIDAK bisa like/dislike
- ✅ **Authenticated users**: Bisa like/dislike
- ✅ **Semua users**: Bisa lihat counts dan siapa yang like/dislike

### Comments
- ✅ **Anonymous users**: Bisa lihat comments
- ❌ **Anonymous users**: TIDAK bisa create/edit/delete/like comment
- ✅ **Authenticated users**: Bisa create comment dan like/dislike
- ✅ **Author**: Bisa edit/delete comment sendiri
- ✅ **Staff**: Bisa delete semua comment

---

## 🚀 Quick Start

### 1. Run Migrations

```bash
cd projects/asncorpu-backend-python
python manage.py makemigrations knowledge
python manage.py migrate knowledge
```

**Expected migrations:**
- `0003_articleview_ip_tracking.py` - View tracking
- `0004_articlelike_system.py` - Like/dislike system
- `0005_comment_system.py` - Comment system
- `0006_article_share_count.py` - Share tracking ⭐

### 2. Update URLs

Di `core/urls.py`:
```python
urlpatterns = [
    path('api/knowledge/', include('apps.knowledge.urls_api')),
]
```

### 3. Test API

```bash
# Like artikel (requires auth)
curl -X POST http://localhost:8000/api/knowledge/articles/my-article/like/ \
  -H "Authorization: Bearer <token>"

# Lihat siapa yang like
curl http://localhost:8000/api/knowledge/articles/my-article/who_liked/

# Share artikel
curl -X POST http://localhost:8000/api/knowledge/articles/my-article/share/ \
  -H "Content-Type: application/json" \
  -d '{"platform": "facebook"}'

# Create comment (requires auth)
curl -X POST http://localhost:8000/api/knowledge/comments/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"article": 1, "content": "Great article!", "parent": null}'

# Create reply (requires auth)
curl -X POST http://localhost:8000/api/knowledge/comments/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"article": 1, "content": "Thanks!", "parent": 5}'

# Like comment (requires auth)
curl -X POST http://localhost:8000/api/knowledge/comments/5/like/ \
  -H "Authorization: Bearer <token>"
```

---

## 📈 Analytics Queries

### Article Performance

```python
from apps.knowledge.models import Article

article = Article.objects.get(slug='my-article')

print(f"Views: {article.view_count}")
print(f"Likes: {article.like_count}")
print(f"Dislikes: {article.dislike_count}")
print(f"Like %: {article.get_like_percentage()}%")
print(f"Rating: {article.rating_avg} ({article.rating_count} ratings)")
print(f"Comments: {article.comments.count()}")
```

### Who Liked/Disliked

```python
from apps.knowledge.models import ArticleLike

# Who liked
likes = ArticleLike.objects.filter(
    article=article,
    is_like=True
).select_related('user')

print(f"{likes.count()} users liked this article:")
for like in likes:
    print(f"- {like.user.username} at {like.created_at}")

# Who disliked
dislikes = ArticleLike.objects.filter(
    article=article,
    is_like=False
).select_related('user')

print(f"{dislikes.count()} users disliked this article:")
for dislike in dislikes:
    print(f"- {dislike.user.username} at {dislike.created_at}")
```

### Comment Statistics

```python
from apps.knowledge.models import Comment

# Total comments
total_comments = Comment.objects.filter(article=article).count()

# Top-level comments only
top_level = Comment.objects.filter(
    article=article,
    parent__isnull=True
).count()

# Most liked comment
most_liked = Comment.objects.filter(
    article=article
).order_by('-like_count').first()

print(f"Total comments: {total_comments}")
print(f"Top-level: {top_level}")
print(f"Replies: {total_comments - top_level}")
print(f"Most liked: {most_liked.content[:50]}... ({most_liked.like_count} likes)")
```

---

## 🎨 Frontend Integration

Lihat contoh lengkap di:
- **React Component**: `COMMENT_SYSTEM_GUIDE.md`
- **Like/Dislike Buttons**: `LIKE_DISLIKE_GUIDE.md`
- **View Tracking**: `README_VIEW_COUNT.md`

---

## 📝 Notes

1. **Authentication Required**: Like/dislike dan comment requires authentication
2. **Anonymous Users**: Hanya bisa view, tidak bisa interact
3. **Nested Comments**: Unlimited depth, tapi sebaiknya limit di frontend (3-5 levels)
4. **Performance**: Semua query di-optimize dengan indexes dan select_related
5. **Privacy**: IP address di-track untuk view count (bisa di-anonymize untuk GDPR)

---

## 🔄 Migration Order

```bash
1. 0003_articleview_ip_tracking.py      # View tracking
2. 0004_articlelike_system.py           # Like/dislike
3. 0005_comment_system.py               # Comments
4. 0006_article_share_count.py          # Share tracking
5. 0007_approval_system.py              # Approval/validation ⭐
```

---

## 📞 Support

Jika ada pertanyaan atau issue, silakan buat issue di repository atau hubungi tim development.

---

**Author:** ASN Corpu Development Team  
**Last Updated:** 2026-05-07  
**Version:** 2.2 (with Approval/Validation System)
