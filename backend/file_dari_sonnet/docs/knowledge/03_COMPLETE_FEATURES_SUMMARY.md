# 📚 Knowledge Base - Complete Features Summary

## 🎯 Overview

Sistem Knowledge Base lengkap dengan tracking **View Count**, **Like/Dislike**, dan **Rating** berdasarkan user.

---

## ✨ Fitur Lengkap

### 1. 👁️ View Count (IP-Based)
- ✅ Track unique views berdasarkan IP address
- ✅ 1 IP = 1 view per artikel
- ✅ Support user tracking (jika login)
- ✅ User agent tracking (browser/device info)
- ✅ Analytics: trending, popular, view statistics

**Database:**
- Tabel: `knowledge_article_views`
- Field di Article: `view_count`

**API Endpoints:**
```bash
GET  /api/knowledge/articles/{slug}/              # Auto-track view
GET  /api/knowledge/articles/{slug}/view_stats/   # View statistics
GET  /api/knowledge/articles/popular/             # Most viewed
GET  /api/knowledge/articles/trending/            # Trending (7 days)
```

---

### 2. 👍👎 Like/Dislike System
- ✅ User-based tracking (1 user = 1 action per artikel)
- ✅ Toggle support (like ↔ dislike ↔ remove)
- ✅ Real-time counter updates
- ✅ Like percentage calculation
- ✅ Most liked articles

**Database:**
- Tabel: `knowledge_article_likes`
- Field di Article: `like_count`, `dislike_count`

**API Endpoints:**
```bash
POST   /api/knowledge/articles/{slug}/like/       # Like artikel
POST   /api/knowledge/articles/{slug}/dislike/    # Dislike artikel
DELETE /api/knowledge/articles/{slug}/unlike/     # Remove action
GET    /api/knowledge/articles/{slug}/user_action/ # Check user's action
GET    /api/knowledge/articles/most_liked/        # Most liked articles
```

---

### 3. ⭐ Rating System (1-5 Stars)
- ✅ User-based rating (1 user = 1 rating per artikel)
- ✅ Rating 1-5 dengan feedback optional
- ✅ Auto-calculate average rating
- ✅ Rating count tracking

**Database:**
- Tabel: `knowledge_ratings`
- Field di Article: `rating_avg`, `rating_count`

**API Endpoints:**
```bash
POST /api/knowledge/ratings/                      # Create/update rating
GET  /api/knowledge/ratings/my_ratings/           # User's ratings
```

---

## 📊 Database Schema Summary

### `knowledge_articles` (Updated)
```sql
- id (BIGINT)
- title, slug, content, excerpt
- view_count (INTEGER)           -- Total unique views
- like_count (INTEGER)            -- Total likes
- dislike_count (INTEGER)         -- Total dislikes
- rating_avg (NUMERIC 3,2)        -- Average rating (0.00-5.00)
- rating_count (INTEGER)          -- Total ratings
- ... (other fields)
```

### `knowledge_article_views` (New)
```sql
- id (BIGINT)
- article_id (BIGINT FK)
- ip_address (INET)               -- IPv4/IPv6
- user_id (BIGINT FK, nullable)
- user_agent (TEXT, nullable)
- viewed_at (TIMESTAMP)
UNIQUE(article_id, ip_address)
```

### `knowledge_article_likes` (New)
```sql
- id (BIGINT)
- article_id (BIGINT FK)
- user_id (BIGINT FK)
- is_like (BOOLEAN)               -- true=like, false=dislike
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
UNIQUE(article_id, user_id)
```

### `knowledge_ratings` (Existing)
```sql
- id (BIGINT)
- article_id (BIGINT FK)
- user_id (BIGINT FK)
- rating (INTEGER 1-5)
- feedback (TEXT, nullable)
- created_at (TIMESTAMP)
UNIQUE(article_id, user_id)
```

---

## 🚀 Migration Steps

```bash
cd projects/asncorpu-backend-python

# Generate migrations
python manage.py makemigrations knowledge

# Apply migrations
python manage.py migrate knowledge

# Expected migrations:
# - 0003_articleview_ip_tracking.py
# - 0004_articlelike_system.py
```

---

## 📡 Complete API Reference

### Articles

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/knowledge/articles/` | No | List articles |
| GET | `/api/knowledge/articles/{slug}/` | No | Get detail + track view |
| POST | `/api/knowledge/articles/` | Yes | Create article |
| PUT/PATCH | `/api/knowledge/articles/{slug}/` | Yes | Update article |
| DELETE | `/api/knowledge/articles/{slug}/` | Yes | Delete article |
| GET | `/api/knowledge/articles/{slug}/view_stats/` | No | View statistics |
| POST | `/api/knowledge/articles/{slug}/like/` | Yes | Like article |
| POST | `/api/knowledge/articles/{slug}/dislike/` | Yes | Dislike article |
| DELETE | `/api/knowledge/articles/{slug}/unlike/` | Yes | Remove like/dislike |
| GET | `/api/knowledge/articles/{slug}/user_action/` | No | Get user's action |
| GET | `/api/knowledge/articles/popular/` | No | Most viewed |
| GET | `/api/knowledge/articles/trending/` | No | Trending (7 days) |
| GET | `/api/knowledge/articles/featured/` | No | Featured articles |
| GET | `/api/knowledge/articles/most_liked/` | No | Most liked |

### Ratings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/knowledge/ratings/` | No | List ratings |
| POST | `/api/knowledge/ratings/` | Yes | Create/update rating |
| GET | `/api/knowledge/ratings/{id}/` | No | Get rating detail |
| PUT/PATCH | `/api/knowledge/ratings/{id}/` | Yes | Update rating |
| DELETE | `/api/knowledge/ratings/{id}/` | Yes | Delete rating |
| GET | `/api/knowledge/ratings/my_ratings/` | Yes | User's ratings |

### Likes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/knowledge/article-likes/` | Yes | List likes/dislikes |
| POST | `/api/knowledge/article-likes/` | Yes | Create/update like |
| GET | `/api/knowledge/article-likes/{id}/` | Yes | Get like detail |
| DELETE | `/api/knowledge/article-likes/{id}/` | Yes | Delete like |
| GET | `/api/knowledge/article-likes/my_likes/` | Yes | User's likes |

### Views (Analytics - Staff Only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/knowledge/article-views/` | Staff | List all views |
| GET | `/api/knowledge/article-views/{id}/` | Staff | Get view detail |
| GET | `/api/knowledge/article-views/my_views/` | Yes | User's view history |

---

## 💻 Frontend Integration Example

### Complete Article Component

```jsx
import React, { useState, useEffect } from 'react';

function ArticleDetail({ slug }) {
  const [article, setArticle] = useState(null);
  const [userAction, setUserAction] = useState('none');
  const [userRating, setUserRating] = useState(null);

  useEffect(() => {
    // Load article (auto-tracks view)
    fetch(`/api/knowledge/articles/${slug}/`)
      .then(res => res.json())
      .then(data => setArticle(data));
    
    // Load user's action (like/dislike/none)
    fetch(`/api/knowledge/articles/${slug}/user_action/`)
      .then(res => res.json())
      .then(data => setUserAction(data.user_action));
    
    // Load user's rating (if authenticated)
    if (isAuthenticated) {
      fetch(`/api/knowledge/ratings/my_ratings/`)
        .then(res => res.json())
        .then(data => {
          const rating = data.find(r => r.article === article.id);
          setUserRating(rating);
        });
    }
  }, [slug]);

  const handleLike = async () => {
    const endpoint = userAction === 'like' 
      ? `/api/knowledge/articles/${slug}/unlike/`
      : `/api/knowledge/articles/${slug}/like/`;
    
    const method = userAction === 'like' ? 'DELETE' : 'POST';
    
    const response = await fetch(endpoint, {
      method,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    setArticle(prev => ({
      ...prev,
      like_count: data.like_count,
      dislike_count: data.dislike_count
    }));
    setUserAction(data.user_action);
  };

  const handleDislike = async () => {
    const endpoint = userAction === 'dislike' 
      ? `/api/knowledge/articles/${slug}/unlike/`
      : `/api/knowledge/articles/${slug}/dislike/`;
    
    const method = userAction === 'dislike' ? 'DELETE' : 'POST';
    
    const response = await fetch(endpoint, {
      method,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    setArticle(prev => ({
      ...prev,
      like_count: data.like_count,
      dislike_count: data.dislike_count
    }));
    setUserAction(data.user_action);
  };

  const handleRating = async (rating) => {
    const response = await fetch('/api/knowledge/ratings/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        article: article.id,
        rating: rating,
        feedback: ''
      })
    });
    
    const data = await response.json();
    setUserRating(data);
    
    // Reload article to get updated rating_avg
    fetch(`/api/knowledge/articles/${slug}/`)
      .then(res => res.json())
      .then(data => setArticle(data));
  };

  if (!article) return <div>Loading...</div>;

  return (
    <div className="article-detail">
      <h1>{article.title}</h1>
      
      {/* Stats */}
      <div className="article-stats">
        <span>👁️ {article.view_count} views</span>
        <span>⭐ {article.rating_avg} ({article.rating_count} ratings)</span>
        <span>👍 {article.like_count} likes</span>
        <span>👎 {article.dislike_count} dislikes</span>
      </div>

      {/* Content */}
      <div dangerouslySetInnerHTML={{ __html: article.content }} />

      {/* Like/Dislike Buttons */}
      <div className="article-actions">
        <button 
          onClick={handleLike}
          className={userAction === 'like' ? 'active' : ''}
        >
          👍 Like ({article.like_count})
        </button>
        
        <button 
          onClick={handleDislike}
          className={userAction === 'dislike' ? 'active' : ''}
        >
          👎 Dislike ({article.dislike_count})
        </button>
      </div>

      {/* Rating */}
      <div className="article-rating">
        <h3>Rate this article:</h3>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => handleRating(star)}
            className={userRating?.rating >= star ? 'active' : ''}
          >
            ⭐
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## 📈 Analytics Queries

### Get Article Performance

```python
from apps.knowledge.models import Article

article = Article.objects.get(slug='my-article')

print(f"Title: {article.title}")
print(f"Views: {article.view_count}")
print(f"Likes: {article.like_count}")
print(f"Dislikes: {article.dislike_count}")
print(f"Like %: {article.get_like_percentage()}%")
print(f"Rating: {article.rating_avg} ({article.rating_count} ratings)")
```

### Get Top Performing Articles

```python
# Most viewed
top_viewed = Article.objects.filter(
    status='published'
).order_by('-view_count')[:10]

# Most liked
top_liked = Article.objects.filter(
    status='published'
).order_by('-like_count')[:10]

# Highest rated
top_rated = Article.objects.filter(
    status='published',
    rating_count__gte=5  # At least 5 ratings
).order_by('-rating_avg')[:10]

# Best engagement (views + likes + ratings)
from django.db.models import F
best_engagement = Article.objects.filter(
    status='published'
).annotate(
    engagement_score=F('view_count') + F('like_count') * 10 + F('rating_count') * 5
).order_by('-engagement_score')[:10]
```

---

## 📝 Documentation Files

1. **README_VIEW_COUNT.md** - View count system guide
2. **LIKE_DISLIKE_GUIDE.md** - Like/dislike system guide
3. **IMPLEMENTATION_GUIDE.md** - Implementation examples
4. **COMPLETE_FEATURES_SUMMARY.md** - This file

---

## ✅ Checklist

- [x] IP-based view tracking
- [x] Like/Dislike system
- [x] Rating system (existing)
- [x] Django models updated
- [x] Migrations created
- [x] Admin interface updated
- [x] REST API endpoints
- [x] Serializers
- [x] Documentation
- [ ] Run migrations
- [ ] Test API endpoints
- [ ] Frontend integration

---

## 🎉 Summary

Sistem Knowledge Base sekarang punya **3 metrik engagement**:

1. **View Count** - Berapa banyak orang lihat artikel (IP-based)
2. **Like/Dislike** - Apakah artikel helpful atau tidak (user-based)
3. **Rating** - Seberapa bagus artikel (1-5 stars, user-based)

Semua metrik di-track per user/IP dan update real-time!

---

**Author:** ASN Corpu Development Team  
**Last Updated:** 2026-05-07
