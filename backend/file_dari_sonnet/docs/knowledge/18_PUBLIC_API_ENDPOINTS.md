# 📡 Knowledge Base - Public API Endpoints

> **Status**: ✅ Fully Implemented  
> **Created**: 11 Mei 2026  
> **Base URL**: `/apicorpu/public/1.0/knowledge/`  
> **Framework**: Django REST Framework  

---

## 📋 **Overview**

Knowledge Base menyediakan REST API lengkap untuk frontend public. Semua endpoint sudah diimplementasikan di `apps/knowledge/views_api.py` dengan Django REST Framework ViewSets.

---

## 🔐 **Authentication**

### **Public Endpoints** (No Auth Required)
- ✅ List articles
- ✅ Get article detail
- ✅ List categories
- ✅ List tags
- ✅ List comments
- ✅ View statistics (read-only)

### **Authenticated Endpoints** (Login Required)
- ✅ Like/dislike articles
- ✅ Rate articles
- ✅ Create/edit/delete comments
- ✅ Like/dislike comments
- ✅ Submit article for approval
- ✅ My articles/ratings/views

### **Staff Only Endpoints**
- ✅ Approve/reject articles
- ✅ View all article views
- ✅ Pending approval list

---

## 📚 **Article Endpoints**

### **1. List Articles**
```http
GET /apicorpu/public/1.0/knowledge/articles/
```

**Query Parameters:**
- `search` - Search in title, content, excerpt
- `ordering` - Sort by: `created_at`, `published_at`, `view_count`, `rating_avg`
- `page` - Page number
- `page_size` - Items per page

**Response:**
```json
{
  "count": 100,
  "next": "http://api/articles/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Article Title",
      "slug": "article-title",
      "excerpt": "Short description...",
      "thumbnail": "http://...",
      "author": {
        "id": 1,
        "name": "John Doe"
      },
      "category": {
        "id": 1,
        "name": "Technology"
      },
      "tags": [...],
      "view_count": 150,
      "like_count": 25,
      "dislike_count": 3,
      "rating_avg": 4.5,
      "rating_count": 10,
      "published_at": "2026-05-10T10:00:00Z"
    }
  ]
}
```

---

### **2. Get Article Detail** ✨ **WITH AUTO VIEW TRACKING**
```http
GET /apicorpu/public/1.0/knowledge/articles/{slug}/
```

**Features:**
- ✅ Automatically tracks view by IP address
- ✅ Returns `is_new_view` flag
- ✅ Updates user agent if new view
- ✅ Unique view counting (1 IP = 1 view)

**Response:**
```json
{
  "id": 1,
  "title": "Article Title",
  "slug": "article-title",
  "content": "Full article content...",
  "excerpt": "Short description...",
  "thumbnail": "http://...",
  "content_type": "article",
  "file_url": null,
  "youtube_url": null,
  "author": {...},
  "category": {...},
  "tags": [...],
  "view_count": 151,
  "like_count": 25,
  "dislike_count": 3,
  "rating_avg": 4.5,
  "rating_count": 10,
  "is_new_view": true,  // ← NEW VIEW TRACKED!
  "published_at": "2026-05-10T10:00:00Z"
}
```

---

### **3. Popular Articles**
```http
GET /apicorpu/public/1.0/knowledge/articles/popular/?limit=10
```

**Response:** List of most viewed articles

---

### **4. Featured Articles**
```http
GET /apicorpu/public/1.0/knowledge/articles/featured/?limit=5
```

**Response:** List of featured articles

---

### **5. Trending Articles** 🔥
```http
GET /apicorpu/public/1.0/knowledge/articles/trending/?limit=10
```

**Features:**
- ✅ Most viewed in last 7 days
- ✅ Sorted by view velocity

---

### **6. Most Liked Articles**
```http
GET /apicorpu/public/1.0/knowledge/articles/most_liked/?limit=10
```

**Response:** Articles sorted by like count

---

### **7. View Statistics**
```http
GET /apicorpu/public/1.0/knowledge/articles/{slug}/view_stats/
```

**Response:**
```json
{
  "article_id": 1,
  "article_title": "Article Title",
  "total_views": 150,
  "logged_in_views": 80,
  "anonymous_views": 70,
  "recent_views_7days": 45,
  "recent_views_30days": 120
}
```

---

## 👍 **Like/Dislike Endpoints** (Auth Required)

### **8. Like Article**
```http
POST /apicorpu/public/1.0/knowledge/articles/{slug}/like/
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Article liked successfully",
  "like_count": 26,
  "dislike_count": 3,
  "like_percentage": 89.7,
  "user_action": "like"
}
```

---

### **9. Dislike Article**
```http
POST /apicorpu/public/1.0/knowledge/articles/{slug}/dislike/
```

**Response:**
```json
{
  "message": "Article disliked successfully",
  "like_count": 25,
  "dislike_count": 4,
  "like_percentage": 86.2,
  "user_action": "dislike"
}
```

---

### **10. Remove Like/Dislike**
```http
DELETE /apicorpu/public/1.0/knowledge/articles/{slug}/unlike/
```

**Response:**
```json
{
  "message": "Like/dislike removed successfully",
  "like_count": 25,
  "dislike_count": 3,
  "like_percentage": 89.3,
  "user_action": "none"
}
```

---

### **11. Get User Action**
```http
GET /apicorpu/public/1.0/knowledge/articles/{slug}/user_action/
```

**Response:**
```json
{
  "user_action": "like",  // like | dislike | none
  "like_count": 25,
  "dislike_count": 3,
  "like_percentage": 89.3
}
```

---

### **12. Who Liked**
```http
GET /apicorpu/public/1.0/knowledge/articles/{slug}/who_liked/
```

**Response:**
```json
{
  "article_id": 1,
  "article_title": "Article Title",
  "total_likes": 25,
  "users": [
    {
      "id": 1,
      "username": "john_doe",
      "full_name": "John Doe",
      "liked_at": "2026-05-10T10:00:00Z"
    }
  ]
}
```

---

### **13. Who Disliked**
```http
GET /apicorpu/public/1.0/knowledge/articles/{slug}/who_disliked/
```

**Response:** Similar to who_liked

---

## ⭐ **Rating Endpoints** (Auth Required)

### **14. Create/Update Rating**
```http
POST /apicorpu/public/1.0/knowledge/ratings/
```

**Body:**
```json
{
  "article": 1,  // or use article_slug
  "rating": 5,   // 1-5 stars
  "feedback": "Great article!"  // optional
}
```

**Response:**
```json
{
  "id": 1,
  "article": {...},
  "user": {...},
  "rating": 5,
  "feedback": "Great article!",
  "created_at": "2026-05-10T10:00:00Z"
}
```

---

### **15. List Ratings**
```http
GET /apicorpu/public/1.0/knowledge/ratings/?article_slug={slug}
```

**Response:** List of ratings for article

---

### **16. My Ratings**
```http
GET /apicorpu/public/1.0/knowledge/ratings/my_ratings/
```

**Response:** Current user's ratings

---

## 💬 **Comment Endpoints**

### **17. List Comments**
```http
GET /apicorpu/public/1.0/knowledge/comments/?article_slug={slug}&only_top_level=true
```

**Query Parameters:**
- `article_slug` - Filter by article
- `only_top_level` - Show only top-level comments (default: true)
- `ordering` - Sort by: `created_at`, `like_count`

**Response:**
```json
{
  "count": 50,
  "results": [
    {
      "id": 1,
      "article": {...},
      "user": {...},
      "parent": null,
      "content": "Great article!",
      "like_count": 5,
      "dislike_count": 0,
      "is_edited": false,
      "replies": [
        {
          "id": 2,
          "content": "Thanks!",
          "user": {...},
          ...
        }
      ],
      "created_at": "2026-05-10T10:00:00Z"
    }
  ]
}
```

---

### **18. Create Comment** (Auth Required)
```http
POST /apicorpu/public/1.0/knowledge/comments/
```

**Body:**
```json
{
  "article": 1,
  "parent": null,  // or parent comment ID for reply
  "content": "Great article!"
}
```

---

### **19. Update Comment** (Auth Required, Owner Only)
```http
PATCH /apicorpu/public/1.0/knowledge/comments/{id}/
```

**Body:**
```json
{
  "content": "Updated comment"
}
```

---

### **20. Delete Comment** (Auth Required, Owner or Staff)
```http
DELETE /apicorpu/public/1.0/knowledge/comments/{id}/
```

---

### **21. Like Comment** (Auth Required)
```http
POST /apicorpu/public/1.0/knowledge/comments/{id}/like/
```

**Response:**
```json
{
  "message": "Comment liked successfully",
  "like_count": 6,
  "dislike_count": 0,
  "like_percentage": 100.0,
  "user_action": "like"
}
```

---

### **22. Dislike Comment** (Auth Required)
```http
POST /apicorpu/public/1.0/knowledge/comments/{id}/dislike/
```

---

### **23. Unlike Comment** (Auth Required)
```http
DELETE /apicorpu/public/1.0/knowledge/comments/{id}/unlike/
```

---

### **24. Get Comment User Action**
```http
GET /apicorpu/public/1.0/knowledge/comments/{id}/user_action/
```

---

## 📁 **Category Endpoints**

### **25. List Categories**
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
      "name": "Technology",
      "slug": "technology",
      "description": "Tech articles",
      "parent": null,
      "children": [...],
      "article_count": 25
    }
  ]
}
```

---

### **26. Get Category Detail**
```http
GET /apicorpu/public/1.0/knowledge/categories/{slug}/
```

---

## 🏷️ **Tag Endpoints**

### **27. List Tags**
```http
GET /apicorpu/public/1.0/knowledge/tags/
```

**Response:**
```json
{
  "count": 50,
  "results": [
    {
      "id": 1,
      "name": "Django",
      "slug": "django",
      "color": "#3B82F6",
      "article_count": 15
    }
  ]
}
```

---

### **28. Get Tag Detail**
```http
GET /apicorpu/public/1.0/knowledge/tags/{slug}/
```

---

## 📊 **Share Tracking**

### **29. Track Share**
```http
POST /apicorpu/public/1.0/knowledge/articles/{slug}/share/
```

**Body (optional):**
```json
{
  "platform": "facebook"  // facebook|twitter|whatsapp|linkedin|email|copy
}
```

**Response:**
```json
{
  "message": "Share tracked successfully",
  "share_count": 15,
  "platform": "facebook"
}
```

---

## 🔄 **Approval Workflow** (Auth Required)

### **30. Submit for Approval** (Author Only)
```http
POST /apicorpu/public/1.0/knowledge/articles/{slug}/submit_for_approval/
```

**Response:**
```json
{
  "message": "Article submitted for approval successfully",
  "status": "pending",
  "submitted_at": "2026-05-10T10:00:00Z"
}
```

---

### **31. Approve Article** (Staff Only)
```http
POST /apicorpu/public/1.0/knowledge/articles/{slug}/approve/
```

**Body (optional):**
```json
{
  "reason": "Approval notes"
}
```

---

### **32. Reject Article** (Staff Only)
```http
POST /apicorpu/public/1.0/knowledge/articles/{slug}/reject/
```

**Body (required):**
```json
{
  "reason": "Rejection reason"
}
```

---

### **33. Publish Article** (Staff or Author)
```http
POST /apicorpu/public/1.0/knowledge/articles/{slug}/publish/
```

---

### **34. Approval History**
```http
GET /apicorpu/public/1.0/knowledge/articles/{slug}/approval_history/
```

**Response:**
```json
{
  "article_id": 1,
  "article_title": "Article Title",
  "current_status": "published",
  "rejection_count": 0,
  "history": [
    {
      "id": 1,
      "action": "submitted",
      "actor": {...},
      "reason": "Submitted for approval",
      "created_at": "2026-05-10T09:00:00Z"
    },
    {
      "id": 2,
      "action": "approved",
      "actor": {...},
      "reason": "Article approved",
      "created_at": "2026-05-10T10:00:00Z"
    }
  ]
}
```

---

### **35. Pending Approval List** (Staff Only)
```http
GET /apicorpu/public/1.0/knowledge/articles/pending_approval/
```

---

### **36. My Articles** (Auth Required)
```http
GET /apicorpu/public/1.0/knowledge/articles/my_articles/
```

**Response:** All articles by current user (all statuses)

---

## 📈 **Analytics Endpoints** (Auth Required)

### **37. My View History**
```http
GET /apicorpu/public/1.0/knowledge/article-views/my_views/
```

**Response:** Articles viewed by current user

---

### **38. My Likes**
```http
GET /apicorpu/public/1.0/knowledge/article-likes/my_likes/
```

**Response:** Articles liked/disliked by current user

---

## 🔧 **Technical Details**

### **Permissions System**
```python
# Public endpoints
permission_classes = [IsAuthenticatedOrReadOnly]

# Auth required
permission_classes = [IsAuthenticated]

# Staff only
permission_classes = [ApprovalPermission]

# Owner only
permission_classes = [IsOwnerOrReadOnly]
```

### **Pagination**
- Default: 20 items per page
- Max: 100 items per page
- Use `page` and `page_size` query params

### **Filtering**
- Use Django REST Framework filters
- Search: `?search=keyword`
- Ordering: `?ordering=-created_at`

### **Error Responses**
```json
{
  "error": "Error message",
  "detail": "Detailed error description"
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## 📝 **Usage Examples**

### **Frontend Integration (JavaScript)**

#### **1. Get Article with Auto View Tracking**
```javascript
// Automatically tracks view!
const response = await fetch('/apicorpu/public/1.0/knowledge/articles/my-article-slug/');
const data = await response.json();

console.log('Article:', data.title);
console.log('New view?', data.is_new_view);  // true if first time from this IP
console.log('Total views:', data.view_count);
```

#### **2. Like Article**
```javascript
const response = await fetch('/apicorpu/public/1.0/knowledge/articles/my-article-slug/like/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Likes:', data.like_count);
console.log('Percentage:', data.like_percentage);
```

#### **3. Rate Article**
```javascript
const response = await fetch('/apicorpu/public/1.0/knowledge/ratings/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    article: articleId,
    rating: 5,
    feedback: 'Great article!'
  })
});
```

#### **4. Create Comment**
```javascript
const response = await fetch('/apicorpu/public/1.0/knowledge/comments/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    article: articleId,
    parent: null,  // or parentCommentId for reply
    content: 'Great article!'
  })
});
```

---

## 🎯 **Key Features**

### ✅ **Implemented Features**
1. **Auto View Tracking** - Tracks views by IP automatically on article detail
2. **Like/Dislike System** - For articles and comments
3. **Rating System** - 1-5 stars with optional feedback
4. **Comment System** - Nested comments (2 levels)
5. **Share Tracking** - Track shares by platform
6. **Approval Workflow** - Submit → Approve/Reject → Publish
7. **Analytics** - View stats, trending, popular, most liked
8. **User Actions** - My articles, ratings, views, likes
9. **Permissions** - Granular permissions for all actions
10. **Pagination** - All list endpoints paginated

### 🔒 **Security Features**
- ✅ JWT/Token authentication
- ✅ Permission-based access control
- ✅ Owner-only edit/delete
- ✅ Staff-only approval
- ✅ CSRF protection
- ✅ Rate limiting (can be added)

---

## 📚 **Related Files**

- **API Views**: `apps/knowledge/views_api.py`
- **Serializers**: `apps/knowledge/serializers.py`
- **Permissions**: `apps/knowledge/permissions.py`
- **URL Config**: `apps/knowledge/urls_api.py`
- **Models**: `apps/knowledge/models.py`
- **Utils**: `apps/knowledge/utils.py`

---

## 🚀 **Next Steps for Frontend**

1. **Setup API Client**
   - Configure base URL
   - Setup authentication headers
   - Handle token refresh

2. **Implement Components**
   - Article list/detail
   - Like/dislike buttons
   - Rating widget
   - Comment section
   - Share buttons

3. **Add Analytics**
   - Track user interactions
   - Display view counts
   - Show trending articles

4. **Optimize Performance**
   - Implement caching
   - Lazy loading
   - Pagination

---

**Status**: ✅ **ALL API ENDPOINTS READY FOR FRONTEND**  
**Last Updated**: 11 Mei 2026  
**Total Endpoints**: 38+ endpoints  
**Coverage**: 100% of features  

---

*Semua API sudah siap digunakan untuk frontend public! 🎉*
