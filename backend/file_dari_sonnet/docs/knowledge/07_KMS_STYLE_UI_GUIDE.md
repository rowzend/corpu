# 🎨 Knowledge Base - KMS Style UI Guide

## 🎯 Overview

Panduan implementasi UI Knowledge Base dengan style seperti **KMS Kemenkes**, termasuk:
- ✅ Author info dengan avatar/initial
- ✅ Share button dengan tracking
- ✅ Stats display (views, likes, date)
- ✅ Tags/Keywords
- ✅ Description/Excerpt
- ✅ Video player integration

---

## 📊 Data Structure (API Response)

### Article Detail Response

```json
{
  "id": 17,
  "title": "Menjadi Pembicara Serba Bisa 'Mendapatkan Dukungan Demi Perjuangan'",
  "slug": "pembicara-serba-bisa",
  "content": "...",
  "excerpt": "Video ini merupakan bagian dari rangkaian latihan pidato...",
  
  // Author Info
  "author": 123,
  "author_name": "ANDI ZULFAIDAWATY S.Tr.Keb., S.K.M., M.Kes.",
  "author_username": "andi.zulfaidawaty",
  "author_initial": "AZ",
  "author_role": "Author",
  
  // Media
  "thumbnail": "/media/knowledge/thumbnails/2024/05/thumbnail.jpg",
  "content_type": "video",
  "youtube_url": "https://www.youtube.com/watch?v=xxxxx",
  "youtube_embed_id": "xxxxx",
  "youtube_embed_url": "https://www.youtube.com/embed/xxxxx",
  "video_duration": "1:32:60",
  
  // Category & Tags
  "category": {
    "id": 1,
    "name": "Knowledge Sharing",
    "slug": "knowledge-sharing"
  },
  "tags": [
    {"id": 1, "name": "Kesehatan", "slug": "kesehatan"},
    {"id": 2, "name": "Pengetahuan", "slug": "pengetahuan"},
    {"id": 3, "name": "public speaking", "slug": "public-speaking"}
  ],
  
  // Stats
  "view_count": 36,
  "like_count": 6,
  "dislike_count": 0,
  "like_percentage": 100.0,
  "share_count": 0,
  "rating_avg": 4.50,
  "rating_count": 2,
  "comment_count": 0,
  "time_since_published": "1 minggu yang lalu",
  
  // Dates
  "published_at": "2024-05-01T10:30:00Z",
  "created_at": "2024-05-01T09:00:00Z",
  "updated_at": "2024-05-07T14:20:00Z"
}
```

---

## 💻 Frontend Implementation

### React Component (KMS Style)

```jsx
import React, { useState, useEffect } from 'react';
import './ArticleDetail.css';

function ArticleDetail({ slug }) {
  const [article, setArticle] = useState(null);
  const [userAction, setUserAction] = useState('none');
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    loadArticle();
    loadUserAction();
  }, [slug]);

  const loadArticle = async () => {
    const response = await fetch(`/api/knowledge/articles/${slug}/`);
    const data = await response.json();
    setArticle(data);
  };

  const loadUserAction = async () => {
    const response = await fetch(`/api/knowledge/articles/${slug}/user_action/`);
    const data = await response.json();
    setUserAction(data.user_action);
  };

  const handleLike = async () => {
    const endpoint = userAction === 'like' 
      ? `/api/knowledge/articles/${slug}/unlike/`
      : `/api/knowledge/articles/${slug}/like/`;
    
    const method = userAction === 'like' ? 'DELETE' : 'POST';
    
    const response = await fetch(endpoint, {
      method,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      loadArticle();
      loadUserAction();
    }
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
    
    if (response.ok) {
      loadArticle();
      loadUserAction();
    }
  };

  const handleShare = async (platform) => {
    // Track share
    await fetch(`/api/knowledge/articles/${slug}/share/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ platform })
    });
    
    // Share logic based on platform
    const url = window.location.href;
    const title = article.title;
    
    switch(platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        break;
    }
    
    setShowShareMenu(false);
    loadArticle(); // Reload to get updated share count
  };

  if (!article) return <div>Loading...</div>;

  return (
    <div className="article-detail-kms">
      {/* Video Player */}
      {article.content_type === 'video' && article.youtube_embed_url && (
        <div className="video-container">
          <iframe
            src={article.youtube_embed_url}
            title={article.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
          {article.video_duration && (
            <div className="video-duration">{article.video_duration}</div>
          )}
        </div>
      )}

      {/* Title */}
      <h1 className="article-title">{article.title}</h1>

      {/* Author Info */}
      <div className="author-section">
        <div className="author-avatar">
          {article.author_initial}
        </div>
        <div className="author-info">
          <div className="author-name">{article.author_name}</div>
          <div className="author-role">{article.author_role}</div>
        </div>
        
        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className={`btn-like ${userAction === 'like' ? 'active' : ''}`}
            onClick={handleLike}
          >
            <span className="icon">👍</span>
            <span className="count">{article.like_count}</span>
          </button>
          
          <button 
            className={`btn-dislike ${userAction === 'dislike' ? 'active' : ''}`}
            onClick={handleDislike}
          >
            <span className="icon">👎</span>
          </button>
          
          <div className="share-dropdown">
            <button 
              className="btn-share"
              onClick={() => setShowShareMenu(!showShareMenu)}
            >
              <span className="icon">🔗</span>
              <span>Share</span>
            </button>
            
            {showShareMenu && (
              <div className="share-menu">
                <button onClick={() => handleShare('facebook')}>
                  📘 Facebook
                </button>
                <button onClick={() => handleShare('twitter')}>
                  🐦 Twitter
                </button>
                <button onClick={() => handleShare('whatsapp')}>
                  💬 WhatsApp
                </button>
                <button onClick={() => handleShare('linkedin')}>
                  💼 LinkedIn
                </button>
                <button onClick={() => handleShare('copy')}>
                  📋 Copy Link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="article-stats">
        <span className="stat-item">
          <span className="icon">👁️</span>
          <span>{article.view_count} views</span>
        </span>
        <span className="stat-item">
          <span className="icon">❤️</span>
          <span>{article.like_count} likes</span>
        </span>
        <span className="stat-item">
          <span className="icon">📅</span>
          <span>{article.time_since_published}</span>
        </span>
      </div>

      {/* Description */}
      <div className="article-description">
        <h3>Deskripsi</h3>
        <div dangerouslySetInnerHTML={{ __html: article.content }} />
      </div>

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="article-tags">
          {article.tags.map(tag => (
            <span key={tag.id} className="tag">
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Comments Section */}
      <div className="comments-section">
        <h3>{article.comment_count} Komentar</h3>
        {/* Comment component here */}
      </div>
    </div>
  );
}

export default ArticleDetail;
```

---

## 🎨 CSS Styling (KMS Style)

```css
/* Article Detail - KMS Style */
.article-detail-kms {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: #fff;
}

/* Video Container */
.video-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.video-duration {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}

/* Title */
.article-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  line-height: 1.4;
}

/* Author Section */
.author-section {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 20px;
}

.author-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  flex-shrink: 0;
}

.author-info {
  flex: 1;
}

.author-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.author-role {
  font-size: 14px;
  color: #666;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn-like,
.btn-dislike,
.btn-share {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-like:hover,
.btn-dislike:hover,
.btn-share:hover {
  background: #f5f5f5;
}

.btn-like.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.btn-dislike.active {
  background: #f44336;
  color: white;
  border-color: #f44336;
}

.btn-like .icon,
.btn-dislike .icon {
  font-size: 16px;
}

/* Share Dropdown */
.share-dropdown {
  position: relative;
}

.share-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  z-index: 1000;
}

.share-menu button {
  display: block;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.share-menu button:hover {
  background: #f5f5f5;
}

.share-menu button:first-child {
  border-radius: 8px 8px 0 0;
}

.share-menu button:last-child {
  border-radius: 0 0 8px 8px;
}

/* Stats */
.article-stats {
  display: flex;
  gap: 20px;
  padding: 15px 0;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.stat-item .icon {
  font-size: 16px;
}

/* Description */
.article-description {
  margin-bottom: 30px;
}

.article-description h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
}

.article-description p {
  line-height: 1.8;
  color: #555;
  margin-bottom: 15px;
}

/* Tags */
.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 30px;
}

.tag {
  padding: 6px 14px;
  background: #f0f0f0;
  border-radius: 20px;
  font-size: 13px;
  color: #555;
  transition: all 0.2s;
  cursor: pointer;
}

.tag:hover {
  background: #e0e0e0;
}

/* Comments Section */
.comments-section {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 2px solid #e0e0e0;
}

.comments-section h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #333;
}

/* Responsive */
@media (max-width: 768px) {
  .author-section {
    flex-wrap: wrap;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: flex-start;
  }
  
  .article-stats {
    flex-direction: column;
    gap: 10px;
  }
}
```

---

## 📡 API Endpoints

### Share Tracking

```bash
# Track share
POST /api/knowledge/articles/{slug}/share/
{
  "platform": "facebook"  # facebook|twitter|whatsapp|linkedin|email|copy
}

# Response
{
  "message": "Share tracked successfully",
  "share_count": 5,
  "platform": "facebook"
}
```

### Get Article with Full Stats

```bash
GET /api/knowledge/articles/{slug}/

# Response includes:
# - author_initial, author_name, author_role
# - tags array
# - share_count
# - comment_count
# - time_since_published
```

---

## 🎯 Features Checklist

- ✅ **Author Avatar** dengan initial (e.g., "AZ")
- ✅ **Author Info** (nama lengkap + role)
- ✅ **Like/Dislike Buttons** dengan counter
- ✅ **Share Button** dengan dropdown menu
- ✅ **Share Tracking** (track berapa kali di-share)
- ✅ **Stats Display** (views, likes, date)
- ✅ **Tags/Keywords** dengan styling
- ✅ **Video Player** integration (YouTube)
- ✅ **Time Since Published** (e.g., "1 minggu yang lalu")
- ✅ **Comment Count** display

---

## 📝 Notes

1. **Author Initial**: Auto-generated dari first name + last name
2. **Share Platforms**: Facebook, Twitter, WhatsApp, LinkedIn, Copy Link
3. **Video Duration**: Displayed on video thumbnail
4. **Tags**: Clickable untuk filter artikel by tag
5. **Responsive**: Mobile-friendly design

---

**Author:** ASN Corpu Development Team  
**Last Updated:** 2026-05-07  
**Inspired by:** KMS Kemenkes
