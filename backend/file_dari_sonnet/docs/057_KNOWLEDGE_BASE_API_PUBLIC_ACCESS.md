# Knowledge Base API - Public Access Documentation

**Tanggal**: 8 Mei 2026  
**Status**: ✅ READY FOR PRODUCTION  
**Base URL**: `/apicorpu/public/1.0/knowledge/`  
**Legacy URL**: `/knowledge/api/` (deprecated, use new URL)

---

## 🌐 PUBLIC API ENDPOINTS (No Authentication Required)

### ✅ ARTICLES

#### 1. List All Published Articles
```http
GET /apicorpu/public/1.0/knowledge/articles/
```

**Query Parameters:**
- `search` - Search in title, content, excerpt
- `ordering` - Sort by: `created_at`, `-view_count`, `-rating_avg`, `-like_count`
- `page` - Page number
- `page_size` - Items per page

**Response:**
```json
{
  "count": 50,
  "next": "http://localhost:8008/apicorpu/public/1.0/knowledge/articles/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Getting Started with Django",
      "slug": "getting-started-with-django",
      "excerpt": "Learn Django basics...",
      "thumbnail": "/media/thumbnails/django.jpg",
      "content_type": "article",
      "author_name": "John Doe",
      "category_name": "Tutorial",
      "is_featured": true,
      "view_count": 1250,
      "like_count": 45,
      "dislike_count": 3,
      "like_percentage": 93.75,
      "rating_avg": 4.5,
      "rating_count": 20,
      "published_at": "2026-05-01T10:00:00Z",
      "created_at": "2026-04-28T15:30:00Z"
    }
  ]
}
```

---

#### 2. Get Article Detail (Auto-track View)
```http
GET /apicorpu/public/1.0/knowledge/articles/{slug}/
```

**Features:**
- ✅ Automatically tracks view with IP address
- ✅ Returns `is_new_view` flag
- ✅ Increments view count for unique IP

**Response:**
```json
{
  "id": 1,
  "title": "Getting Started with Django",
  "slug": "getting-started-with-django",
  "content": "<p>Full article content...</p>",
  "excerpt": "Learn Django basics...",
  "thumbnail": "/media/thumbnails/django.jpg",
  "content_type": "article",
  "author": 5,
  "author_name": "John Doe",
  "author_username": "johndoe",
  "author_initial": "JD",
  "author_role": "Staff",
  "category": {
    "id": 2,
    "name": "Tutorial",
    "slug": "tutorial",
    "description": "Step-by-step tutorials",
    "article_count": 15
  },
  "tags": [
    {"id": 1, "name": "Django", "slug": "django"},
    {"id": 2, "name": "Python", "slug": "python"}
  ],
  "status": "published",
  "is_featured": true,
  "view_count": 1251,
  "like_count": 45,
  "dislike_count": 3,
  "like_percentage": 93.75,
  "share_count": 12,
  "rating_avg": 4.5,
  "rating_count": 20,
  "comment_count": 8,
  "time_since_published": "7 days ago",
  "published_at": "2026-05-01T10:00:00Z",
  "created_at": "2026-04-28T15:30:00Z",
  "updated_at": "2026-05-05T12:00:00Z",
  "is_new_view": true
}
```

---

#### 3. Popular Articles
```http
GET /apicorpu/public/1.0/knowledge/articles/popular/?limit=10
```

**Returns:** Most viewed articles (sorted by `view_count`)

---

#### 4. Featured Articles
```http
GET /apicorpu/public/1.0/knowledge/articles/featured/?limit=5
```

**Returns:** Articles marked as featured

---

#### 5. Trending Articles
```http
GET /apicorpu/public/1.0/knowledge/articles/trending/?limit=10
```

**Returns:** Most viewed articles in last 7 days

---

#### 6. Most Liked Articles
```http
GET /apicorpu/public/1.0/knowledge/articles/most_liked/?limit=10
```

**Returns:** Articles with highest like count

---

#### 7. Get User's Action on Article
```http
GET /apicorpu/public/1.0/knowledge/articles/{slug}/user_action/
```

**Response (Not Authenticated):**
```json
{
  "user_action": "none",
  "like_count": 45,
  "dislike_count": 3,
  "like_percentage": 93.75
}
```

**Response (Authenticated):**
```json
{
  "user_action": "like",  // or "dislike" or "none"
  "like_count": 45,
  "dislike_count": 3,
  "like_percentage": 93.75
}
```

---

### ✅ CATEGORIES

#### 1. List All Active Categories
```http
GET /apicorpu/public/1.0/knowledge/categories/
```

**Response:**
```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "name": "Tutorial",
      "slug": "tutorial",
      "description": "Step-by-step tutorials",
      "parent": null,
      "order_index": 1,
      "is_active": true,
      "article_count": 15,
      "full_path": "Tutorial",
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-05-01T00:00:00Z"
    }
  ]
}
```

---

#### 2. Get Category Detail
```http
GET /apicorpu/public/1.0/knowledge/categories/{slug}/
```

---

### ✅ TAGS

#### 1. List All Tags
```http
GET /apicorpu/public/1.0/knowledge/tags/
```

**Response:**
```json
{
  "count": 25,
  "results": [
    {
      "id": 1,
      "name": "Django",
      "slug": "django",
      "article_count": 12,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 2. Get Tag Detail
```http
GET /apicorpu/public/1.0/knowledge/tags/{slug}/
```

---

### ✅ COMMENTS (Public Read)

#### 1. List Comments for Article
```http
GET /apicorpu/public/1.0/knowledge/comments/?article_slug={slug}&only_top_level=true
```

**Query Parameters:**
- `article_slug` - Filter by article slug
- `article_id` - Filter by article ID
- `only_top_level` - `true` (default) or `false` (include replies)

**Response:**
```json
{
  "count": 8,
  "results": [
    {
      "id": 1,
      "article": 1,
      "article_title": "Getting Started with Django",
      "user": 5,
      "user_name": "John Doe",
      "user_username": "johndoe",
      "parent": null,
      "content": "Great article! Very helpful.",
      "like_count": 5,
      "dislike_count": 0,
      "like_percentage": 100.0,
      "reply_count": 2,
      "replies": [
        {
          "id": 2,
          "user_name": "Jane Smith",
          "content": "I agree!",
          "created_at": "2026-05-02T11:00:00Z"
        }
      ],
      "is_edited": false,
      "created_at": "2026-05-02T10:00:00Z",
      "updated_at": "2026-05-02T10:00:00Z"
    }
  ]
}
```

---

## 🔐 AUTHENTICATED ENDPOINTS (Login Required)

### ✅ LIKE/DISLIKE ARTICLE

#### 1. Like Article
```http
POST /apicorpu/public/1.0/knowledge/articles/{slug}/like/
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Article liked successfully",
  "like_count": 46,
  "dislike_count": 3,
  "like_percentage": 93.88,
  "user_action": "like"
}
```

---

#### 2. Dislike Article
```http
POST /apicorpu/public/1.0/knowledge/articles/{slug}/dislike/
Authorization: Bearer {token}
```

---

#### 3. Remove Like/Dislike
```http
DELETE /apicorpu/public/1.0/knowledge/articles/{slug}/unlike/
Authorization: Bearer {token}
```

---

### ✅ RATE ARTICLE

#### 1. Create/Update Rating
```http
POST /apicorpu/public/1.0/knowledge/ratings/
Authorization: Bearer {token}
Content-Type: application/json

{
  "article": 1,
  "rating": 5,
  "feedback": "Excellent article!"
}
```

**Response:**
```json
{
  "id": 10,
  "article": 1,
  "article_title": "Getting Started with Django",
  "user": 5,
  "user_name": "John Doe",
  "user_username": "johndoe",
  "rating": 5,
  "feedback": "Excellent article!",
  "created_at": "2026-05-08T10:00:00Z"
}
```

---

#### 2. Get My Ratings
```http
GET /apicorpu/public/1.0/knowledge/ratings/my_ratings/
Authorization: Bearer {token}
```

---

### ✅ COMMENTS

#### 1. Create Comment
```http
POST /apicorpu/public/1.0/knowledge/comments/
Authorization: Bearer {token}
Content-Type: application/json

{
  "article": 1,
  "content": "Great article!",
  "parent": null
}
```

---

#### 2. Create Reply
```http
POST /apicorpu/public/1.0/knowledge/comments/
Authorization: Bearer {token}
Content-Type: application/json

{
  "article": 1,
  "content": "Thanks for the feedback!",
  "parent": 5
}
```

---

#### 3. Update Comment (Author Only)
```http
PATCH /apicorpu/public/1.0/knowledge/comments/{id}/
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Updated comment text"
}
```

---

#### 4. Delete Comment (Author Only)
```http
DELETE /apicorpu/public/1.0/knowledge/comments/{id}/
Authorization: Bearer {token}
```

---

#### 5. Like Comment
```http
POST /apicorpu/public/1.0/knowledge/comments/{id}/like/
Authorization: Bearer {token}
```

---

#### 6. Dislike Comment
```http
POST /apicorpu/public/1.0/knowledge/comments/{id}/dislike/
Authorization: Bearer {token}
```

---

## 📊 ANALYTICS ENDPOINTS

### ✅ View Statistics
```http
GET /apicorpu/public/1.0/knowledge/articles/{slug}/view_stats/
```

**Response:**
```json
{
  "article_id": 1,
  "article_title": "Getting Started with Django",
  "total_views": 1251,
  "logged_in_views": 450,
  "anonymous_views": 801,
  "recent_views_7days": 125,
  "recent_views_30days": 580
}
```

---

### ✅ Who Liked Article
```http
GET /apicorpu/public/1.0/knowledge/articles/{slug}/who_liked/
```

**Response:**
```json
{
  "article_id": 1,
  "article_title": "Getting Started with Django",
  "total_likes": 45,
  "users": [
    {
      "id": 5,
      "username": "johndoe",
      "full_name": "John Doe",
      "liked_at": "2026-05-01T12:00:00Z"
    }
  ]
}
```

---

### ✅ Who Disliked Article
```http
GET /apicorpu/public/1.0/knowledge/articles/{slug}/who_disliked/
```

---

## 🔧 FRONTEND INTEGRATION EXAMPLES

### React/Next.js Example

```javascript
// Fetch articles
const fetchArticles = async () => {
  const response = await fetch('http://localhost:8008/apicorpu/public/1.0/knowledge/articles/?ordering=-view_count');
  const data = await response.json();
  return data.results;
};

// Get article detail (auto-track view)
const fetchArticle = async (slug) => {
  const response = await fetch(`http://localhost:8008/apicorpu/public/1.0/knowledge/articles/${slug}/`);
  const data = await response.json();
  console.log('Is new view:', data.is_new_view);
  return data;
};

// Like article (authenticated)
const likeArticle = async (slug, token) => {
  const response = await fetch(`http://localhost:8008/apicorpu/public/1.0/knowledge/articles/${slug}/like/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
};

// Get comments
const fetchComments = async (articleSlug) => {
  const response = await fetch(`http://localhost:8008/apicorpu/public/1.0/knowledge/comments/?article_slug=${articleSlug}&only_top_level=true`);
  const data = await response.json();
  return data.results;
};

// Post comment (authenticated)
const postComment = async (articleId, content, token) => {
  const response = await fetch('http://localhost:8008/apicorpu/public/1.0/knowledge/comments/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      article: articleId,
      content: content,
      parent: null
    })
  });
  return await response.json();
};
```

---

### Vue.js Example

```javascript
// Using Axios
import axios from 'axios';

const API_BASE = 'http://localhost:8008/apicorpu/public/1.0/knowledge';

// Get popular articles
export const getPopularArticles = async (limit = 10) => {
  const { data } = await axios.get(`${API_BASE}/articles/popular/?limit=${limit}`);
  return data;
};

// Get article with view tracking
export const getArticle = async (slug) => {
  const { data } = await axios.get(`${API_BASE}/articles/${slug}/`);
  return data;
};

// Rate article
export const rateArticle = async (articleId, rating, feedback, token) => {
  const { data } = await axios.post(
    `${API_BASE}/ratings/`,
    { article: articleId, rating, feedback },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};
```

---

## 🔒 AUTHENTICATION

### JWT Token Authentication

```http
POST /api/token/
Content-Type: application/json

{
  "username": "johndoe",
  "password": "password123"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Use Token:**
```http
GET /knowledge/api/articles/my_articles/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

---

## 📋 PERMISSION MATRIX

| Endpoint | Public | Authenticated | Staff Only |
|----------|--------|---------------|------------|
| List Articles | ✅ | ✅ | ✅ |
| Get Article Detail | ✅ | ✅ | ✅ |
| Create Article | ❌ | ✅ | ✅ |
| Update Article | ❌ | ✅ (author) | ✅ |
| Delete Article | ❌ | ✅ (author) | ✅ |
| Like/Dislike | ❌ | ✅ | ✅ |
| Rate Article | ❌ | ✅ | ✅ |
| List Comments | ✅ | ✅ | ✅ |
| Create Comment | ❌ | ✅ | ✅ |
| Update Comment | ❌ | ✅ (author) | ✅ |
| Delete Comment | ❌ | ✅ (author) | ✅ |
| View Analytics | ✅ | ✅ | ✅ |
| Approve/Reject | ❌ | ❌ | ✅ |

---

## 🎯 KEY FEATURES

### ✅ Public Access
- No authentication required for reading articles
- Automatic view tracking with IP address
- Public comments (read-only)
- Public statistics

### ✅ IP-Based View Tracking
- Unique views per IP address
- Prevents duplicate counting
- Tracks user agent
- Analytics by logged-in vs anonymous

### ✅ Interactive Features (Auth Required)
- Like/Dislike articles
- Rate articles (1-5 stars)
- Comment & Reply
- Like/Dislike comments

### ✅ Advanced Filtering
- Search in title, content, excerpt
- Sort by views, likes, rating, date
- Filter by category, tags, status
- Pagination support

### ✅ Nested Comments
- Top-level comments
- Unlimited reply depth
- Like/Dislike on comments
- Author-only edit/delete

---

## 🚀 DEPLOYMENT NOTES

### CORS Configuration
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React
    "http://localhost:8080",  # Vue
    "https://yourdomain.com",  # Production
]
```

### Rate Limiting (Recommended)
```python
# Install: pip install django-ratelimit
from django_ratelimit.decorators import ratelimit

@ratelimit(key='ip', rate='100/h')
def article_list(request):
    ...
```

---

## 📝 CHANGELOG

### v1.0.0 (2026-05-08)
- ✅ Public API for articles, categories, tags
- ✅ IP-based view tracking
- ✅ Like/Dislike system
- ✅ Rating system (1-5 stars)
- ✅ Nested comments with replies
- ✅ Analytics endpoints
- ✅ JWT authentication
- ✅ Granular permissions

---

**Status**: ✅ Production Ready - API fully functional and documented!
