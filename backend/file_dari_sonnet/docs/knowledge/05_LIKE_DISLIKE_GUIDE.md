# 👍👎 Knowledge Base - Like/Dislike System

## 🎯 Overview

Sistem **Like/Dislike** untuk artikel Knowledge Base dengan tracking per user.

### ✨ Fitur Utama

- ✅ **User-Based Tracking**: 1 user = 1 action (like ATAU dislike) per artikel
- ✅ **Toggle Support**: User bisa ganti dari like ke dislike atau sebaliknya
- ✅ **Remove Action**: User bisa hapus like/dislike mereka
- ✅ **Real-time Counter**: Like count dan dislike count update otomatis
- ✅ **Like Percentage**: Hitung persentase like vs total reactions
- ✅ **Analytics**: Most liked articles, user's like history

---

## 📊 Database Schema

### Tabel: `knowledge_article_likes`

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Primary key |
| `article_id` | BIGINT | Foreign key ke `knowledge_articles` |
| `user_id` | BIGINT | Foreign key ke `users` |
| `is_like` | BOOLEAN | `true` = Like, `false` = Dislike |
| `created_at` | TIMESTAMP | Waktu pertama kali like/dislike |
| `updated_at` | TIMESTAMP | Waktu terakhir update |

**Constraints:**
- `UNIQUE(article_id, user_id)` - 1 user hanya 1 action per artikel

**Indexes:**
- `(article_id, user_id)` - Fast lookup untuk check user action
- `(is_like)` - Fast filtering by like/dislike

### Update Tabel: `knowledge_articles`

Tambahan field:
- `like_count` (INTEGER) - Total likes
- `dislike_count` (INTEGER) - Total dislikes

---

## 🚀 Quick Start

### 1. Run Migration

```bash
cd projects/asncorpu-backend-python
python manage.py makemigrations knowledge
python manage.py migrate knowledge
```

### 2. API Endpoints

#### Like an Article

```bash
POST /api/knowledge/articles/{slug}/like/
Authorization: Bearer <token>

# Response
{
  "message": "Article liked successfully",
  "like_count": 15,
  "dislike_count": 2,
  "like_percentage": 88.2,
  "user_action": "like"
}
```

#### Dislike an Article

```bash
POST /api/knowledge/articles/{slug}/dislike/
Authorization: Bearer <token>

# Response
{
  "message": "Article disliked successfully",
  "like_count": 15,
  "dislike_count": 3,
  "like_percentage": 83.3,
  "user_action": "dislike"
}
```

#### Remove Like/Dislike

```bash
DELETE /api/knowledge/articles/{slug}/unlike/
Authorization: Bearer <token>

# Response
{
  "message": "Like/dislike removed successfully",
  "like_count": 15,
  "dislike_count": 2,
  "like_percentage": 88.2,
  "user_action": "none"
}
```

#### Check User's Action

```bash
GET /api/knowledge/articles/{slug}/user_action/

# Response (if user liked)
{
  "user_action": "like",
  "like_count": 15,
  "dislike_count": 2,
  "like_percentage": 88.2
}

# Response (if user disliked)
{
  "user_action": "dislike",
  "like_count": 15,
  "dislike_count": 3,
  "like_percentage": 83.3
}

# Response (if no action)
{
  "user_action": "none",
  "like_count": 15,
  "dislike_count": 2,
  "like_percentage": 88.2
}
```

#### Get Most Liked Articles

```bash
GET /api/knowledge/articles/most_liked/?limit=10

# Response
[
  {
    "id": 1,
    "title": "Django Best Practices",
    "slug": "django-best-practices",
    "like_count": 150,
    "dislike_count": 5,
    "like_percentage": 96.8,
    ...
  },
  ...
]
```

---

## 💻 Frontend Implementation

### React/Vue Example

```javascript
// Like article
async function likeArticle(slug) {
  const response = await fetch(`/api/knowledge/articles/${slug}/like/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  console.log(data);
  // Update UI with data.like_count, data.dislike_count, data.user_action
}

// Dislike article
async function dislikeArticle(slug) {
  const response = await fetch(`/api/knowledge/articles/${slug}/dislike/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  // Update UI
}

// Remove like/dislike
async function removeAction(slug) {
  const response = await fetch(`/api/knowledge/articles/${slug}/unlike/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  // Update UI
}

// Check user's current action
async function getUserAction(slug) {
  const response = await fetch(`/api/knowledge/articles/${slug}/user_action/`);
  const data = await response.json();
  
  // data.user_action = 'like' | 'dislike' | 'none'
  return data;
}
```

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

function ArticleLikeButtons({ articleSlug }) {
  const [userAction, setUserAction] = useState('none');
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [likePercentage, setLikePercentage] = useState(0);

  useEffect(() => {
    // Load initial state
    fetch(`/api/knowledge/articles/${articleSlug}/user_action/`)
      .then(res => res.json())
      .then(data => {
        setUserAction(data.user_action);
        setLikeCount(data.like_count);
        setDislikeCount(data.dislike_count);
        setLikePercentage(data.like_percentage);
      });
  }, [articleSlug]);

  const handleLike = async () => {
    const response = await fetch(`/api/knowledge/articles/${articleSlug}/like/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      }
    });
    
    const data = await response.json();
    setUserAction(data.user_action);
    setLikeCount(data.like_count);
    setDislikeCount(data.dislike_count);
    setLikePercentage(data.like_percentage);
  };

  const handleDislike = async () => {
    const response = await fetch(`/api/knowledge/articles/${articleSlug}/dislike/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      }
    });
    
    const data = await response.json();
    setUserAction(data.user_action);
    setLikeCount(data.like_count);
    setDislikeCount(data.dislike_count);
    setLikePercentage(data.like_percentage);
  };

  const handleRemove = async () => {
    const response = await fetch(`/api/knowledge/articles/${articleSlug}/unlike/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      }
    });
    
    const data = await response.json();
    setUserAction(data.user_action);
    setLikeCount(data.like_count);
    setDislikeCount(data.dislike_count);
    setLikePercentage(data.like_percentage);
  };

  return (
    <div className="article-reactions">
      <button 
        onClick={userAction === 'like' ? handleRemove : handleLike}
        className={userAction === 'like' ? 'active' : ''}
      >
        👍 Like ({likeCount})
      </button>
      
      <button 
        onClick={userAction === 'dislike' ? handleRemove : handleDislike}
        className={userAction === 'dislike' ? 'active' : ''}
      >
        👎 Dislike ({dislikeCount})
      </button>
      
      <div className="like-percentage">
        {likePercentage}% liked this article
      </div>
    </div>
  );
}

export default ArticleLikeButtons;
```

---

## 🎨 UI/UX Best Practices

### Button States

1. **No Action (Default)**
   - Both buttons inactive/gray
   - Show counts

2. **Liked**
   - Like button active/highlighted (blue/green)
   - Dislike button inactive
   - Click like again to remove

3. **Disliked**
   - Dislike button active/highlighted (red)
   - Like button inactive
   - Click dislike again to remove

### Visual Feedback

```css
.article-reactions button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.article-reactions button:hover {
  background: #f5f5f5;
}

.article-reactions button.active.like {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.article-reactions button.active.dislike {
  background: #f44336;
  color: white;
  border-color: #f44336;
}

.like-percentage {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}
```

---

## 📈 Analytics & Queries

### Get Most Liked Articles

```python
from apps.knowledge.models import Article

most_liked = Article.objects.filter(
    status='published'
).order_by('-like_count')[:10]

for article in most_liked:
    print(f"{article.title}: {article.like_count} likes, {article.dislike_count} dislikes")
    print(f"  Like percentage: {article.get_like_percentage()}%")
```

### Get User's Like History

```python
from apps.knowledge.models import ArticleLike

user_likes = ArticleLike.objects.filter(
    user=request.user,
    is_like=True
).select_related('article')

print(f"You liked {user_likes.count()} articles:")
for like in user_likes:
    print(f"- {like.article.title}")
```

### Get User's Dislike History

```python
user_dislikes = ArticleLike.objects.filter(
    user=request.user,
    is_like=False
).select_related('article')

print(f"You disliked {user_dislikes.count()} articles:")
for dislike in user_dislikes:
    print(f"- {dislike.article.title}")
```

### Get Articles with High Like Ratio

```python
from django.db.models import F

# Articles with >80% like ratio and at least 10 reactions
high_quality = Article.objects.filter(
    status='published',
    like_count__gte=10
).annotate(
    total_reactions=F('like_count') + F('dislike_count')
).filter(
    like_count__gte=F('total_reactions') * 0.8
).order_by('-like_count')

for article in high_quality:
    print(f"{article.title}: {article.get_like_percentage()}% ({article.like_count}/{article.like_count + article.dislike_count})")
```

---

## 🔄 Behavior Rules

### 1. Toggle Behavior

- User clicks **Like** → Action = Like
- User clicks **Like** again → Action removed
- User clicks **Dislike** while liked → Action changes to Dislike
- User clicks **Dislike** again → Action removed

### 2. Counter Updates

- Like count dan dislike count update **otomatis** via signal
- Method `update_likes()` dipanggil setiap kali ArticleLike di-save/delete

### 3. Authentication

- Like/Dislike **requires authentication**
- Anonymous users bisa lihat counts tapi tidak bisa like/dislike
- Endpoint `user_action` bisa diakses tanpa auth (return 'none')

---

## 🧪 Testing

### Test Like/Dislike

```python
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.knowledge.models import Article, ArticleLike

User = get_user_model()

class LikeDislikeTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser')
        self.article = Article.objects.create(
            title='Test Article',
            slug='test-article',
            content='Test content',
            status='published',
            author=self.user
        )
    
    def test_like_article(self):
        """Test user can like an article"""
        ArticleLike.objects.create(
            article=self.article,
            user=self.user,
            is_like=True
        )
        
        self.article.refresh_from_db()
        self.assertEqual(self.article.like_count, 1)
        self.assertEqual(self.article.dislike_count, 0)
    
    def test_dislike_article(self):
        """Test user can dislike an article"""
        ArticleLike.objects.create(
            article=self.article,
            user=self.user,
            is_like=False
        )
        
        self.article.refresh_from_db()
        self.assertEqual(self.article.like_count, 0)
        self.assertEqual(self.article.dislike_count, 1)
    
    def test_toggle_like_to_dislike(self):
        """Test user can change from like to dislike"""
        # First like
        like_obj = ArticleLike.objects.create(
            article=self.article,
            user=self.user,
            is_like=True
        )
        
        self.article.refresh_from_db()
        self.assertEqual(self.article.like_count, 1)
        
        # Change to dislike
        like_obj.is_like = False
        like_obj.save()
        
        self.article.refresh_from_db()
        self.assertEqual(self.article.like_count, 0)
        self.assertEqual(self.article.dislike_count, 1)
    
    def test_remove_like(self):
        """Test user can remove their like"""
        like_obj = ArticleLike.objects.create(
            article=self.article,
            user=self.user,
            is_like=True
        )
        
        self.article.refresh_from_db()
        self.assertEqual(self.article.like_count, 1)
        
        # Remove like
        like_obj.delete()
        
        self.article.refresh_from_db()
        self.assertEqual(self.article.like_count, 0)
    
    def test_like_percentage(self):
        """Test like percentage calculation"""
        # Create 8 likes and 2 dislikes
        for i in range(8):
            user = User.objects.create_user(username=f'user{i}')
            ArticleLike.objects.create(
                article=self.article,
                user=user,
                is_like=True
            )
        
        for i in range(2):
            user = User.objects.create_user(username=f'dislike_user{i}')
            ArticleLike.objects.create(
                article=self.article,
                user=user,
                is_like=False
            )
        
        self.article.refresh_from_db()
        self.assertEqual(self.article.get_like_percentage(), 80.0)
```

---

## 🔒 Permissions

- **Like/Dislike**: Requires authentication
- **View counts**: Public (no auth required)
- **User action check**: Public (returns 'none' for anonymous)
- **My likes history**: Requires authentication

---

## 📝 Notes

1. **One Action Per User**: User hanya bisa like ATAU dislike, tidak bisa keduanya
2. **Toggle Support**: Click button yang sama 2x akan remove action
3. **Real-time Update**: Counter update otomatis via Django signals
4. **Performance**: Query di-optimize dengan indexes dan select_related

---

## 🚀 Future Enhancements

- [ ] Reaction types (love, laugh, wow, sad, angry) - seperti Facebook
- [ ] Anonymous reactions (based on IP/session)
- [ ] Reaction notifications untuk author
- [ ] Trending based on recent likes (last 7 days)
- [ ] Export like/dislike analytics

---

**Author:** ASN Corpu Development Team  
**Last Updated:** 2026-05-07
