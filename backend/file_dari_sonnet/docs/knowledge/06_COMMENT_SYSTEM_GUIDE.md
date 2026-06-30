# 💬 Knowledge Base - Comment System dengan Nested Replies

## 🎯 Overview

Sistem **Comment** lengkap dengan:
- ✅ **Nested Replies** (sub-comment/reply to reply)
- ✅ **Like/Dislike** pada comment
- ✅ **Edit Comment** (dengan flag "edited")
- ✅ **Delete Comment** (author atau staff)
- ✅ **User Tracking** (siapa yang comment)
- ✅ **Authentication Required** (user anonim tidak bisa comment/like)

---

## 📊 Database Schema

### Tabel: `knowledge_comments`

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Primary key |
| `article_id` | BIGINT | Foreign key ke `knowledge_articles` |
| `user_id` | BIGINT | Foreign key ke `users` |
| `parent_id` | BIGINT | Foreign key ke `knowledge_comments` (nullable) |
| `content` | TEXT | Isi komentar |
| `like_count` | INTEGER | Total likes |
| `dislike_count` | INTEGER | Total dislikes |
| `is_edited` | BOOLEAN | Apakah sudah diedit |
| `created_at` | TIMESTAMP | Waktu dibuat |
| `updated_at` | TIMESTAMP | Waktu terakhir update |

**Constraints:**
- `parent_id` NULL = top-level comment
- `parent_id` NOT NULL = reply to another comment

### Tabel: `knowledge_comment_likes`

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Primary key |
| `comment_id` | BIGINT | Foreign key ke `knowledge_comments` |
| `user_id` | BIGINT | Foreign key ke `users` |
| `is_like` | BOOLEAN | `true` = Like, `false` = Dislike |
| `created_at` | TIMESTAMP | Waktu like/dislike |

**Constraints:**
- `UNIQUE(comment_id, user_id)` - 1 user = 1 action per comment

---

## 🚀 API Endpoints

### Comments

```bash
# List comments untuk artikel
GET /api/knowledge/comments/?article_slug=my-article&only_top_level=true

# Create top-level comment
POST /api/knowledge/comments/
{
  "article": 1,
  "content": "Great article!",
  "parent": null
}

# Create reply (nested comment)
POST /api/knowledge/comments/
{
  "article": 1,
  "content": "Thanks for your feedback!",
  "parent": 5
}

# Get comment detail with all replies
GET /api/knowledge/comments/5/

# Update comment (author only)
PUT /api/knowledge/comments/5/
{
  "content": "Updated comment text"
}

# Delete comment (author or staff only)
DELETE /api/knowledge/comments/5/

# Like comment
POST /api/knowledge/comments/5/like/

# Dislike comment
POST /api/knowledge/comments/5/dislike/

# Remove like/dislike
DELETE /api/knowledge/comments/5/unlike/

# Check user's action on comment
GET /api/knowledge/comments/5/user_action/
```

---

## 💻 Frontend Implementation

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

function CommentSection({ articleSlug }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    loadComments();
  }, [articleSlug]);

  const loadComments = async () => {
    const response = await fetch(
      `/api/knowledge/comments/?article_slug=${articleSlug}&only_top_level=true`
    );
    const data = await response.json();
    setComments(data);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    const response = await fetch('/api/knowledge/comments/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        article: articleId,
        content: newComment,
        parent: replyTo
      })
    });
    
    if (response.ok) {
      setNewComment('');
      setReplyTo(null);
      loadComments(); // Reload comments
    }
  };

  const handleLikeComment = async (commentId) => {
    const response = await fetch(`/api/knowledge/comments/${commentId}/like/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      loadComments(); // Reload to get updated counts
    }
  };

  const handleDislikeComment = async (commentId) => {
    const response = await fetch(`/api/knowledge/comments/${commentId}/dislike/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      loadComments();
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    
    const response = await fetch(`/api/knowledge/comments/${commentId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      loadComments();
    }
  };

  return (
    <div className="comment-section">
      <h3>Comments ({comments.length})</h3>
      
      {/* Comment Form */}
      <form onSubmit={handleSubmitComment}>
        {replyTo && (
          <div className="reply-indicator">
            Replying to comment #{replyTo}
            <button onClick={() => setReplyTo(null)}>Cancel</button>
          </div>
        )}
        
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
          required
        />
        
        <button type="submit">
          {replyTo ? 'Post Reply' : 'Post Comment'}
        </button>
      </form>
      
      {/* Comments List */}
      <div className="comments-list">
        {comments.map(comment => (
          <Comment
            key={comment.id}
            comment={comment}
            onReply={setReplyTo}
            onLike={handleLikeComment}
            onDislike={handleDislikeComment}
            onDelete={handleDeleteComment}
          />
        ))}
      </div>
    </div>
  );
}

function Comment({ comment, onReply, onLike, onDislike, onDelete, depth = 0 }) {
  const [showReplies, setShowReplies] = useState(true);
  const isAuthor = currentUser?.id === comment.user;

  return (
    <div className="comment" style={{ marginLeft: `${depth * 20}px` }}>
      <div className="comment-header">
        <strong>{comment.user_name}</strong>
        <span className="comment-date">
          {new Date(comment.created_at).toLocaleString()}
        </span>
        {comment.is_edited && <span className="edited-badge">Edited</span>}
      </div>
      
      <div className="comment-content">
        {comment.content}
      </div>
      
      <div className="comment-actions">
        <button onClick={() => onLike(comment.id)}>
          👍 Like ({comment.like_count})
        </button>
        
        <button onClick={() => onDislike(comment.id)}>
          👎 Dislike ({comment.dislike_count})
        </button>
        
        <button onClick={() => onReply(comment.id)}>
          💬 Reply
        </button>
        
        {isAuthor && (
          <button onClick={() => onDelete(comment.id)}>
            🗑️ Delete
          </button>
        )}
        
        {comment.reply_count > 0 && (
          <button onClick={() => setShowReplies(!showReplies)}>
            {showReplies ? '▼' : '▶'} {comment.reply_count} replies
          </button>
        )}
      </div>
      
      {/* Nested Replies */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map(reply => (
            <Comment
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onLike={onLike}
              onDislike={onDislike}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentSection;
```

---

## 🎨 CSS Example

```css
.comment-section {
  margin-top: 40px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
}

.comment-section h3 {
  margin-bottom: 20px;
}

.comment-section form {
  margin-bottom: 30px;
}

.comment-section textarea {
  width: 100%;
  min-height: 100px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  resize: vertical;
}

.comment-section button[type="submit"] {
  margin-top: 10px;
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.reply-indicator {
  padding: 10px;
  background: #e3f2fd;
  border-left: 3px solid #2196F3;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comment {
  background: white;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 14px;
}

.comment-header strong {
  color: #333;
}

.comment-date {
  color: #999;
  font-size: 12px;
}

.edited-badge {
  background: #ffc107;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
}

.comment-content {
  margin-bottom: 10px;
  line-height: 1.6;
  color: #555;
}

.comment-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.comment-actions button {
  padding: 5px 10px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.comment-actions button:hover {
  background: #e0e0e0;
}

.comment-replies {
  margin-top: 15px;
  padding-left: 20px;
  border-left: 2px solid #e0e0e0;
}
```

---

## 📈 Query Examples

### Get All Comments for Article

```python
from apps.knowledge.models import Comment

article = Article.objects.get(slug='my-article')

# Get top-level comments only
top_comments = Comment.objects.filter(
    article=article,
    parent__isnull=True
).order_by('-created_at')

for comment in top_comments:
    print(f"{comment.user.username}: {comment.content}")
    print(f"  Likes: {comment.like_count}, Dislikes: {comment.dislike_count}")
    print(f"  Replies: {comment.get_reply_count()}")
```

### Get Comment with All Nested Replies

```python
def get_comment_tree(comment):
    """Recursively get comment with all nested replies"""
    data = {
        'id': comment.id,
        'user': comment.user.username,
        'content': comment.content,
        'like_count': comment.like_count,
        'dislike_count': comment.dislike_count,
        'created_at': comment.created_at,
        'replies': []
    }
    
    for reply in comment.get_replies():
        data['replies'].append(get_comment_tree(reply))
    
    return data

comment = Comment.objects.get(id=5)
tree = get_comment_tree(comment)
```

### Get User's Comments

```python
user_comments = Comment.objects.filter(
    user=request.user
).select_related('article').order_by('-created_at')

print(f"{request.user.username} has {user_comments.count()} comments:")
for comment in user_comments:
    print(f"- On '{comment.article.title}': {comment.content[:50]}...")
```

### Get Most Liked Comments

```python
popular_comments = Comment.objects.filter(
    article__status='published'
).order_by('-like_count')[:10]

for comment in popular_comments:
    print(f"{comment.like_count} likes: {comment.content[:50]}...")
```

---

## 🔒 Permissions

| Action | Anonymous | Authenticated | Author | Staff |
|--------|-----------|---------------|--------|-------|
| View comments | ✅ | ✅ | ✅ | ✅ |
| Create comment | ❌ | ✅ | ✅ | ✅ |
| Edit comment | ❌ | ❌ | ✅ | ✅ |
| Delete comment | ❌ | ❌ | ✅ | ✅ |
| Like/Dislike | ❌ | ✅ | ✅ | ✅ |

---

## 🎯 Features Summary

### 1. **Nested Replies** (Unlimited Depth)
```
Comment 1
├── Reply 1.1
│   ├── Reply 1.1.1
│   └── Reply 1.1.2
└── Reply 1.2
    └── Reply 1.2.1
```

### 2. **Like/Dislike on Comments**
- User bisa like atau dislike comment
- 1 user = 1 action per comment
- Toggle support (like → dislike → remove)

### 3. **Edit Tracking**
- Flag `is_edited` otomatis set saat comment diedit
- Show "Edited" badge di UI

### 4. **Delete Protection**
- Hanya author atau staff yang bisa delete
- Cascade delete: hapus comment = hapus semua replies

---

## 🧪 Testing

```bash
# Test create comment
curl -X POST http://localhost:8000/api/knowledge/comments/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"article": 1, "content": "Great article!", "parent": null}'

# Test create reply
curl -X POST http://localhost:8000/api/knowledge/comments/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"article": 1, "content": "Thanks!", "parent": 5}'

# Test like comment
curl -X POST http://localhost:8000/api/knowledge/comments/5/like/ \
  -H "Authorization: Bearer <token>"

# Test get comments
curl http://localhost:8000/api/knowledge/comments/?article_slug=my-article
```

---

## 📝 Notes

1. **Nested Depth**: Tidak ada limit depth, tapi untuk UX sebaiknya limit di frontend (max 3-5 levels)
2. **Performance**: Query di-optimize dengan `select_related` dan indexes
3. **Cascade Delete**: Hapus comment akan hapus semua replies-nya
4. **Edit History**: Saat ini hanya flag `is_edited`, bisa ditambahkan edit history table jika perlu

---

**Author:** ASN Corpu Development Team  
**Last Updated:** 2026-05-07
