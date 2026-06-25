# 📚 Knowledge Base System - Complete Documentation

## 🎯 Overview

Sistem **Knowledge Base** lengkap untuk ASN Corpu dengan fitur-fitur modern seperti KMS Kemenkes.

### ✨ Fitur Utama

1. **👁️ View Tracking** - IP-based unique view counting
2. **👍👎 Like/Dislike** - User-based engagement tracking
3. **⭐ Rating System** - 1-5 stars dengan feedback
4. **💬 Comment System** - Nested replies dengan like/dislike
5. **🎨 KMS Style UI** - Modern UI dengan author info, share button, stats

---

## 📖 Dokumentasi

Mulai dari **[02_INDEX.md](./02_INDEX.md)** untuk melihat daftar lengkap dokumentasi.

### Quick Links

- **[03_COMPLETE_FEATURES_SUMMARY.md](./03_COMPLETE_FEATURES_SUMMARY.md)** - Overview lengkap semua fitur
- **[07_KMS_STYLE_UI_GUIDE.md](./07_KMS_STYLE_UI_GUIDE.md)** - Implementasi UI seperti KMS Kemenkes
- **[06_COMMENT_SYSTEM_GUIDE.md](./06_COMMENT_SYSTEM_GUIDE.md)** - Comment system dengan nested replies
- **[08_APPROVAL_SYSTEM_GUIDE.md](./08_APPROVAL_SYSTEM_GUIDE.md)** - Approval/validation system
- **[05_LIKE_DISLIKE_GUIDE.md](./05_LIKE_DISLIKE_GUIDE.md)** - Like/Dislike implementation
- **[04_VIEW_COUNT_GUIDE.md](./04_VIEW_COUNT_GUIDE.md)** - View tracking guide

---

## 🚀 Quick Start

### 1. Run Migrations

```bash
cd projects/asncorpu-backend-python
python manage.py makemigrations knowledge
python manage.py migrate knowledge
```

### 2. Test API

```bash
# Get article detail (auto-track view)
curl http://localhost:8000/api/knowledge/articles/my-article/

# Like article (requires auth)
curl -X POST http://localhost:8000/api/knowledge/articles/my-article/like/ \
  -H "Authorization: Bearer <token>"

# Share article
curl -X POST http://localhost:8000/api/knowledge/articles/my-article/share/ \
  -H "Content-Type: application/json" \
  -d '{"platform": "facebook"}'

# Create comment (requires auth)
curl -X POST http://localhost:8000/api/knowledge/comments/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"article": 1, "content": "Great!", "parent": null}'
```

---

## 📊 Database Tables

| Table | Description |
|-------|-------------|
| `knowledge_articles` | Artikel dengan counters (views, likes, shares, ratings, comments) |
| `knowledge_article_views` | View tracking (IP-based) |
| `knowledge_article_likes` | Like/dislike artikel (user-based) |
| `knowledge_ratings` | Rating 1-5 stars (user-based) |
| `knowledge_comments` | Comments dengan nested replies |
| `knowledge_comment_likes` | Like/dislike comment (user-based) |
| `knowledge_categories` | Kategori artikel |
| `knowledge_tags` | Tags/keywords |

---

## 🔒 Permission Summary

| Action | Anonymous | Authenticated |
|--------|-----------|---------------|
| View artikel | ✅ | ✅ |
| Like/Dislike artikel | ❌ | ✅ |
| View comments | ✅ | ✅ |
| Create comment | ❌ | ✅ |
| Like/Dislike comment | ❌ | ✅ |
| Share artikel | ✅ | ✅ |

---

## 📈 Key Metrics

Setiap artikel memiliki metrics:

- **View Count** - Unique views (IP-based)
- **Like Count** - Total likes
- **Dislike Count** - Total dislikes
- **Share Count** - Total shares
- **Rating Average** - Average rating (1-5)
- **Rating Count** - Total ratings
- **Comment Count** - Total comments (including replies)

---

## 🎨 UI Components

### Article Detail Page

```
┌─────────────────────────────────────────┐
│  [Video Player / Thumbnail]             │
├─────────────────────────────────────────┤
│  Title                                  │
├─────────────────────────────────────────┤
│  [AZ] Author Name                       │
│      Author Role                        │
│                    [👍 6] [👎] [Share ▼]│
├─────────────────────────────────────────┤
│  👁️ 36 views  ❤️ 6 likes  📅 1 minggu   │
├─────────────────────────────────────────┤
│  Deskripsi                              │
│  Content...                             │
├─────────────────────────────────────────┤
│  [Tag1] [Tag2] [Tag3]                   │
├─────────────────────────────────────────┤
│  0 Komentar                             │
│  [Comment form]                         │
│  [Comments list]                        │
└─────────────────────────────────────────┘
```

---

## 🔧 Tech Stack

- **Backend**: Django + Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: JWT / Session
- **Frontend**: React (example provided)

---

## 📝 API Endpoints Summary

### Articles
- `GET /api/knowledge/articles/` - List articles
- `GET /api/knowledge/articles/{slug}/` - Get detail + track view
- `POST /api/knowledge/articles/{slug}/like/` - Like
- `POST /api/knowledge/articles/{slug}/dislike/` - Dislike
- `POST /api/knowledge/articles/{slug}/share/` - Track share
- `GET /api/knowledge/articles/{slug}/who_liked/` - Who liked
- `GET /api/knowledge/articles/popular/` - Most viewed
- `GET /api/knowledge/articles/trending/` - Trending (7 days)
- `GET /api/knowledge/articles/most_liked/` - Most liked

### Comments
- `GET /api/knowledge/comments/?article_slug={slug}` - List comments
- `POST /api/knowledge/comments/` - Create comment/reply
- `PUT /api/knowledge/comments/{id}/` - Edit comment
- `DELETE /api/knowledge/comments/{id}/` - Delete comment
- `POST /api/knowledge/comments/{id}/like/` - Like comment
- `POST /api/knowledge/comments/{id}/dislike/` - Dislike comment

### Ratings
- `POST /api/knowledge/ratings/` - Create/update rating
- `GET /api/knowledge/ratings/my_ratings/` - User's ratings

---

## 🧪 Testing

```bash
# Run tests
python manage.py test apps.knowledge

# Run specific test
python manage.py test apps.knowledge.tests.ViewCountTestCase
```

---

## 📦 Installation

1. Clone repository
2. Install dependencies: `pip install -r requirements.txt`
3. Run migrations: `python manage.py migrate`
4. Create superuser: `python manage.py createsuperuser`
5. Run server: `python manage.py runserver`

---

## 🤝 Contributing

Contributions are welcome! Please read the documentation first.

---

## 📄 License

Internal use only - ASN Corpu

---

## 📞 Support

Contact: ASN Corpu Development Team

---

**Version:** 2.1  
**Last Updated:** 2026-05-07  
**Status:** Production Ready ✅
