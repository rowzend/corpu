# 🎨 Knowledge Base - Frontend API Guide

**Complete API Reference untuk Frontend Development**

---

## 📋 Overview

Panduan lengkap API endpoints untuk frontend development. Semua endpoint sudah siap untuk integrasi frontend dengan fitur CRUD lengkap.

**Base URL:** `http://localhost:8000/knowledge/api/`

---

## 🔑 Authentication

### Required Headers
```javascript
// For authenticated requests
headers: {
  'Authorization': 'Bearer <your-jwt-token>',
  'Content-Type': 'application/json'
}
```

### Permission Levels
- **🌐 Public** - No authentication required
- **🔐 Auth** - Authentication required
- **👤 Owner** - Must be owner/author
- **👨‍💼 Staff** - Staff/admin only

---

## 📚 Articles API (Complete CRUD)

### 1. **List Articles** 🌐
```javascript
GET /api/knowledge/articles/

// With filters
GET /api/knowledge/articles/?search=django&ordering=-view_count&limit=10

// Response
{
  "count": 25,
  "next": "http://localhost:8000/knowledge/api/articles/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Panduan Django REST Framework",
      "slug": "panduan-django-rest-framework",
      "excerpt": "Tutorial lengkap Django REST Framework...",
      "thumbnail": "/media/knowledge/thumbnails/2026/05/django.jpg",
      "content_type": "article",
      "author_name": "John Doe",
      "category_name": "Programming",
      "is_featured": true,
      "view_count": 150,
      "like_count": 25,
      "dislike_count": 2,
      "like_percentage": 92.6,
      "rating_avg": 4.5,
      "rating_count": 12,
      "published_at": "2026-05-01T10:00:00Z",
      "created_at": "2026-05-01T09:00:00Z"
    }
  ]
}
```

### 2. **Article Detail + View Tracking** 🌐
```javascript
GET /api/knowledge/articles/{slug}/

// Response (includes view tracking)
{
  "id": 1,
  "title": "Panduan Django REST Framework",
  "slug": "panduan-django-rest-framework",
  "content": "# Panduan Lengkap Django REST Framework\n\n...",
  "excerpt": "Tutorial lengkap...",
  "thumbnail": "/media/knowledge/thumbnails/2026/05/django.jpg",
  
  // Author info (KMS style)
  "author": 1,
  "author_name": "John Doe",
  "author_username": "johndoe",
  "author_initial": "JD",
  "author_role": "Senior Developer",
  
  // Category & Tags
  "category": {
    "id": 1,
    "name": "Programming",
    "slug": "programming",
    "full_path": "Teknologi > Programming"
  },
  "tags": [
    {"id": 1, "name": "Python", "slug": "python"},
    {"id": 2, "name": "Django", "slug": "django"}
  ],
  
  // Stats
  "view_count": 151,  // Auto-incremented
  "like_count": 25,
  "dislike_count": 2,
  "like_percentage": 92.6,
  "share_count": 8,
  "rating_avg": 4.5,
  "rating_count": 12,
  "comment_count": 15,
  "time_since_published": "1 minggu yang lalu",
  
  // Status
  "status": "published",
  "is_featured": true,
  "published_at": "2026-05-01T10:00:00Z",
  
  // View tracking result
  "is_new_view": true  // true if this is a new unique view
}
```

### 3. **Create Article** 🔐
```javascript
POST /api/knowledge/articles/

// Request body
{
  "title": "New Article Title",
  "content": "Article content in markdown...",
  "excerpt": "Short description",
  "category": 1,
  "content_type": "article",
  "thumbnail": null,  // File upload
  "youtube_url": "https://youtube.com/watch?v=xxxxx",
  "status": "draft"
}

// Response: Created article object
```

### 4. **Update Article** 👤
```javascript
PUT /api/knowledge/articles/{slug}/
PATCH /api/knowledge/articles/{slug}/  // Partial update

// Request body (same as create)
{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

### 5. **Delete Article** 👤
```javascript
DELETE /api/knowledge/articles/{slug}/

// Response: 204 No Content
```

---

## 👍👎 Like/Dislike API

### 1. **Like Article** 🔐
```javascript
POST /api/knowledge/articles/{slug}/like/

// Response
{
  "message": "Article liked successfully",
  "like_count": 26,
  "dislike_count": 2,
  "like_percentage": 92.9,
  "user_action": "like"
}
```

### 2. **Dislike Article** 🔐
```javascript
POST /api/knowledge/articles/{slug}/dislike/

// Response
{
  "message": "Article disliked successfully",
  "like_count": 25,
  "dislike_count": 3,
  "like_percentage": 89.3,
  "user_action": "dislike"
}
```

### 3. **Remove Like/Dislike** 🔐
```javascript
DELETE /api/knowledge/articles/{slug}/unlike/

// Response
{
  "message": "Like/dislike removed successfully",
  "like_count": 25,
  "dislike_count": 2,
  "like_percentage": 92.6,
  "user_action": "none"
}
```

### 4. **Check User Action** 🌐
```javascript
GET /api/knowledge/articles/{slug}/user_action/

// Response
{
  "user_action": "like",  // "like" | "dislike" | "none"
  "like_count": 25,
  "dislike_count": 2,
  "like_percentage": 92.6
}
```

### 5. **Who Liked/Disliked** 🌐
```javascript
GET /api/knowledge/articles/{slug}/who_liked/

// Response
{
  "article_id": 1,
  "article_title": "Panduan Django REST Framework",
  "total_likes": 25,
  "users": [
    {
      "id": 1,
      "username": "johndoe",
      "full_name": "John Doe",
      "liked_at": "2026-05-01T10:30:00Z"
    }
  ]
}

GET /api/knowledge/articles/{slug}/who_disliked/
// Similar structure for dislikes
```

---

## 💬 Comments API (Nested Replies)

### 1. **List Comments** 🌐
```javascript
GET /api/knowledge/comments/?article_slug={slug}&only_top_level=true

// Response
{
  "count": 15,
  "results": [
    {
      "id": 1,
      "article": 1,
      "user": 1,
      "user_name": "John Doe",
      "user_username": "johndoe",
      "parent": null,  // Top-level comment
      "content": "Great article! Very helpful.",
      "like_count": 5,
      "dislike_count": 0,
      "like_percentage": 100.0,
      "reply_count": 2,
      "replies": [
        {
          "id": 2,
          "parent": 1,
          "content": "Thanks for the feedback!",
          "user_name": "Jane Smith",
          "like_count": 1,
          "replies": []
        }
      ],
      "is_edited": false,
      "created_at": "2026-05-01T11:00:00Z"
    }
  ]
}
```

### 2. **Create Comment/Reply** 🔐
```javascript
POST /api/knowledge/comments/

// Top-level comment
{
  "article": 1,
  "content": "This is a great article!",
  "parent": null
}

// Reply to comment
{
  "article": 1,
  "content": "I agree with your comment!",
  "parent": 5  // ID of parent comment
}

// Response: Created comment object
```

### 3. **Update Comment** 👤
```javascript
PUT /api/knowledge/comments/{id}/

{
  "content": "Updated comment content"
}

// Response: Updated comment (is_edited: true)
```

### 4. **Delete Comment** 👤
```javascript
DELETE /api/knowledge/comments/{id}/

// Response: 204 No Content
```

### 5. **Like/Dislike Comment** 🔐
```javascript
POST /api/knowledge/comments/{id}/like/
POST /api/knowledge/comments/{id}/dislike/
DELETE /api/knowledge/comments/{id}/unlike/

// Similar response structure as article likes
```

---

## ⭐ Ratings API

### 1. **Create/Update Rating** 🔐
```javascript
POST /api/knowledge/ratings/

{
  "article": 1,
  "rating": 5,
  "feedback": "Excellent tutorial, very detailed!"
}

// Response: Created/updated rating object
```

### 2. **Get Article Ratings** 🌐
```javascript
GET /api/knowledge/ratings/?article_slug={slug}

// Response
{
  "count": 12,
  "results": [
    {
      "id": 1,
      "article": 1,
      "user_name": "John Doe",
      "rating": 5,
      "feedback": "Excellent tutorial!",
      "created_at": "2026-05-01T12:00:00Z"
    }
  ]
}
```

---

## 📊 Analytics & Stats API

### 1. **Popular Articles** 🌐
```javascript
GET /api/knowledge/articles/popular/?limit=10

// Response: Array of most viewed articles
```

### 2. **Featured Articles** 🌐
```javascript
GET /api/knowledge/articles/featured/?limit=5

// Response: Array of featured articles
```

### 3. **Trending Articles** 🌐
```javascript
GET /api/knowledge/articles/trending/?limit=10

// Response: Array of trending articles (most viewed in last 7 days)
```

### 4. **Most Liked Articles** 🌐
```javascript
GET /api/knowledge/articles/most_liked/?limit=10

// Response: Array of most liked articles
```

### 5. **Article View Stats** 🌐
```javascript
GET /api/knowledge/articles/{slug}/view_stats/

// Response
{
  "article_id": 1,
  "article_title": "Panduan Django REST Framework",
  "total_views": 151,
  "logged_in_views": 89,
  "anonymous_views": 62,
  "recent_views_7days": 45,
  "recent_views_30days": 120
}
```

---

## 🔄 Share Tracking API

### 1. **Track Share** 🌐
```javascript
POST /api/knowledge/articles/{slug}/share/

{
  "platform": "facebook"  // "facebook" | "twitter" | "whatsapp" | "linkedin" | "copy"
}

// Response
{
  "message": "Share tracked successfully",
  "share_count": 9,
  "platform": "facebook"
}
```

---

## 📂 Categories & Tags API

### 1. **List Categories** 🌐
```javascript
GET /api/knowledge/categories/

// Response
{
  "count": 13,
  "results": [
    {
      "id": 1,
      "name": "Programming",
      "slug": "programming",
      "description": "Tutorial programming dan coding",
      "parent": 1,  // Parent category ID
      "full_path": "Teknologi > Programming",
      "article_count": 15,
      "is_active": true
    }
  ]
}
```

### 2. **List Tags** 🌐
```javascript
GET /api/knowledge/tags/

// Response
{
  "count": 27,
  "results": [
    {
      "id": 1,
      "name": "Python",
      "slug": "python",
      "article_count": 8
    }
  ]
}
```

---

## ✅ Approval System API

### 1. **Submit for Approval** 👤
```javascript
POST /api/knowledge/articles/{slug}/submit_for_approval/

// Response
{
  "message": "Article submitted for approval successfully",
  "status": "pending",
  "submitted_at": "2026-05-07T10:00:00Z"
}
```

### 2. **Approve Article** 👨‍💼
```javascript
POST /api/knowledge/articles/{slug}/approve/

{
  "reason": "Article meets quality standards"
}

// Response
{
  "message": "Article approved successfully",
  "status": "approved",
  "approved_by": "Admin User",
  "approved_at": "2026-05-07T10:30:00Z"
}
```

### 3. **Reject Article** 👨‍💼
```javascript
POST /api/knowledge/articles/{slug}/reject/

{
  "reason": "Content needs more detail and examples"  // Required!
}

// Response
{
  "message": "Article rejected",
  "status": "rejected",
  "rejection_reason": "Content needs more detail and examples",
  "rejection_count": 1
}
```

### 4. **Publish Article** 👤👨‍💼
```javascript
POST /api/knowledge/articles/{slug}/publish/

// Response
{
  "message": "Article published successfully",
  "status": "published",
  "published_at": "2026-05-07T11:00:00Z"
}
```

### 5. **Approval History** 🌐
```javascript
GET /api/knowledge/articles/{slug}/approval_history/

// Response
{
  "article_id": 1,
  "article_title": "My Article",
  "current_status": "published",
  "rejection_count": 1,
  "history": [
    {
      "id": 1,
      "action": "submitted",
      "actor_name": "John Doe",
      "reason": "Submitted for approval",
      "created_at": "2026-05-07T09:00:00Z"
    },
    {
      "id": 2,
      "action": "rejected",
      "actor_name": "Admin User",
      "reason": "Needs more examples",
      "created_at": "2026-05-07T09:30:00Z"
    },
    {
      "id": 3,
      "action": "approved",
      "actor_name": "Admin User",
      "reason": "Improved content",
      "created_at": "2026-05-07T10:30:00Z"
    }
  ]
}
```

### 6. **Pending Articles** 👨‍💼
```javascript
GET /api/knowledge/articles/pending_approval/

// Response
{
  "count": 5,
  "articles": [
    {
      "id": 1,
      "title": "Article Pending Approval",
      "author_name": "John Doe",
      "submitted_at": "2026-05-07T09:00:00Z"
    }
  ]
}
```

### 7. **My Articles** 👤
```javascript
GET /api/knowledge/articles/my_articles/

// Response: All articles by current user (all statuses)
{
  "count": 8,
  "articles": [
    {
      "id": 1,
      "title": "My Article",
      "status": "published",
      "view_count": 150,
      "like_count": 25
    }
  ]
}
```

---

## 🔍 Search & Filtering

### Query Parameters
```javascript
// Search
GET /api/knowledge/articles/?search=django

// Ordering
GET /api/knowledge/articles/?ordering=-view_count
GET /api/knowledge/articles/?ordering=-like_count,-created_at

// Filtering
GET /api/knowledge/articles/?category=1
GET /api/knowledge/articles/?author=1
GET /api/knowledge/articles/?status=published

// Pagination
GET /api/knowledge/articles/?page=2&page_size=20

// Combined
GET /api/knowledge/articles/?search=python&ordering=-view_count&limit=10
```

### Available Ordering Fields
- `created_at` / `-created_at`
- `published_at` / `-published_at`
- `view_count` / `-view_count`
- `like_count` / `-like_count`
- `rating_avg` / `-rating_avg`
- `title` / `-title`

---

## 🎯 Frontend Integration Examples

### React Hook Example
```javascript
// Custom hook for articles
import { useState, useEffect } from 'react';

export const useArticles = (filters = {}) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchArticles = async () => {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/knowledge/api/articles/?${params}`);
      const data = await response.json();
      setArticles(data.results);
      setLoading(false);
    };
    
    fetchArticles();
  }, [filters]);
  
  return { articles, loading };
};

// Usage
const { articles, loading } = useArticles({ 
  search: 'django', 
  ordering: '-view_count' 
});
```

### Vue.js Composition API Example
```javascript
// composables/useKnowledgeBase.js
import { ref, computed } from 'vue';

export function useKnowledgeBase() {
  const articles = ref([]);
  const loading = ref(false);
  
  const fetchArticles = async (filters = {}) => {
    loading.value = true;
    const params = new URLSearchParams(filters);
    const response = await fetch(`/knowledge/api/articles/?${params}`);
    const data = await response.json();
    articles.value = data.results;
    loading.value = false;
  };
  
  const likeArticle = async (slug) => {
    const response = await fetch(`/knowledge/api/articles/${slug}/like/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  };
  
  return {
    articles,
    loading,
    fetchArticles,
    likeArticle
  };
}
```

---

## 🔐 Error Handling

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `204` - No Content (successful delete)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (permission denied)
- `404` - Not Found
- `500` - Internal Server Error

### Error Response Format
```javascript
// 400 Bad Request
{
  "error": "Validation failed",
  "details": {
    "title": ["This field is required"],
    "rating": ["Rating must be between 1 and 5"]
  }
}

// 403 Forbidden
{
  "error": "Only the author can edit their own articles"
}

// 404 Not Found
{
  "error": "Article not found"
}
```

---

## 📱 Mobile API Considerations

### Optimized Endpoints for Mobile
```javascript
// Lightweight list for mobile
GET /api/knowledge/articles/?fields=id,title,excerpt,thumbnail,view_count

// Paginated comments
GET /api/knowledge/comments/?article_slug={slug}&page_size=10

// Compressed images
GET /api/knowledge/articles/{slug}/?thumbnail_size=small
```

---

## 🎯 Summary

### ✅ **Complete CRUD API Ready**

**Articles:**
- ✅ **C**reate - `POST /articles/`
- ✅ **R**ead - `GET /articles/` (list) + `GET /articles/{slug}/` (detail)
- ✅ **U**pdate - `PUT/PATCH /articles/{slug}/`
- ✅ **D**elete - `DELETE /articles/{slug}/`

**Comments:**
- ✅ **C**reate - `POST /comments/`
- ✅ **R**ead - `GET /comments/` (list) + `GET /comments/{id}/` (detail)
- ✅ **U**pdate - `PUT/PATCH /comments/{id}/`
- ✅ **D**elete - `DELETE /comments/{id}/`

**Plus Advanced Features:**
- ✅ **Like/Dislike** - Complete interaction API
- ✅ **Ratings** - 1-5 star system
- ✅ **View Tracking** - Automatic IP-based tracking
- ✅ **Share Tracking** - Platform-specific tracking
- ✅ **Approval Workflow** - Complete approval system
- ✅ **Analytics** - Popular, trending, featured articles
- ✅ **Search & Filter** - Advanced search capabilities

### 🎨 **Frontend Ready**
- ✅ **List + Detail** - Separate optimized endpoints
- ✅ **Real-time Stats** - Live view/like/comment counts
- ✅ **User Actions** - Check user's like/comment status
- ✅ **Nested Data** - Comments with replies, categories with hierarchy
- ✅ **Rich Metadata** - Author info, timestamps, stats
- ✅ **Error Handling** - Consistent error responses

**Total Endpoints:** 35+ endpoints covering all use cases

---

**Last Updated:** 2026-05-07  
**Version:** 2.2  
**Status:** ✅ Production Ready for Frontend Integration