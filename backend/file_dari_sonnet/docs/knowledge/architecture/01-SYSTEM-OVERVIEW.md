# 🏗️ Architecture Documentation - Knowledge Base System

> **System architecture dan design patterns**

## 📋 Daftar Isi

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Database Design](#database-design)
4. [API Architecture](#api-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Security Architecture](#security-architecture)

---

## 🎯 System Overview

Knowledge Base System adalah aplikasi web berbasis Django dengan arsitektur monolithic yang menggunakan:
- **Backend**: Django 4.2+ (Python)
- **Database**: PostgreSQL 14+
- **Cache**: Redis 7+
- **Web Server**: Nginx
- **Container**: Docker & Docker Compose

---

## 🏛️ Architecture Diagram

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Browser │  │  Mobile  │  │   API    │  │  Admin   │   │
│  │   User   │  │   App    │  │  Client  │  │  Panel   │   │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘   │
└────────┼─────────────┼─────────────┼─────────────┼─────────┘
         │             │             │             │
         └─────────────┴─────────────┴─────────────┘
                           │
                    ┌──────▼──────┐
                    │    HTTPS    │
                    │   (SSL/TLS) │
                    └──────┬──────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      WEB SERVER LAYER                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Nginx (Reverse Proxy)               │ │
│  │  - SSL Termination                                     │ │
│  │  - Load Balancing                                      │ │
│  │  - Static File Serving                                 │ │
│  │  - Request Routing                                     │ │
│  └────────────────────┬───────────────────────────────────┘ │
└───────────────────────┼─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
   /static/        /media/         /api/
        │               │               │
┌───────▼───────────────▼───────────────▼─────────────────────┐
│                   APPLICATION LAYER                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Django Application (Gunicorn)             │ │
│  │                                                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │   Views      │  │   Models     │  │  Templates │ │ │
│  │  │  - Article   │  │  - Article   │  │  - HTML    │ │ │
│  │  │  - Comment   │  │  - Comment   │  │  - CSS     │ │ │
│  │  │  - Category  │  │  - Category  │  │  - JS      │ │ │
│  │  └──────┬───────┘  └──────┬───────┘  └────────────┘ │ │
│  │         │                  │                          │ │
│  │  ┌──────▼──────────────────▼───────┐                 │ │
│  │  │         ORM (Django)            │                 │ │
│  │  └──────────────┬──────────────────┘                 │ │
│  └─────────────────┼────────────────────────────────────┘ │
└────────────────────┼──────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌───────────┐  ┌──────────┐  ┌─────────┐
│PostgreSQL │  │  Redis   │  │  Media  │
│ Database  │  │  Cache   │  │ Storage │
│           │  │          │  │         │
│ - Articles│  │ - Session│  │ - Images│
│ - Comments│  │ - Cache  │  │ - Files │
│ - Users   │  │ - Queue  │  │ - Videos│
└───────────┘  └──────────┘  └─────────┘
```

---

## 🗄️ Database Design

### Entity Relationship Diagram

```
┌─────────────────┐
│     User        │
│  (Django Auth)  │
└────────┬────────┘
         │
         │ 1:N
         │
    ┌────▼─────────────────────────────────────────┐
    │                                               │
    │                                               │
┌───▼──────────┐  1:N  ┌──────────────┐  N:M  ┌───▼──────┐
│   Article    │◄──────┤ ArticleTag   ├───────►│   Tag    │
│              │       └──────────────┘         └──────────┘
│ - title      │
│ - content    │       ┌──────────────┐
│ - slug       │  1:N  │  Category    │
│ - status     │◄──────┤              │
│ - views      │       │ - name       │
│ - likes      │       │ - parent     │◄─┐
│ - rating     │       └──────────────┘  │ Self-referencing
└──────┬───────┘                         │ (Hierarchical)
       │                                 └─┘
       │ 1:N
       │
   ┌───▼──────────┐
   │   Comment    │
   │              │
   │ - content    │
   │ - parent     │◄─┐ Self-referencing
   │ - likes      │  │ (Max 2 levels)
   │ - dislikes   │  │
   └──────┬───────┘  │
          │          └─┘
          │ 1:N
          │
   ┌──────▼──────────┐
   │  CommentLike    │
   │                 │
   │ - is_like       │
   │ - user_id       │
   │ - comment_id    │
   └─────────────────┘

┌──────────────────┐
│  ArticleLike     │
│                  │
│ - is_like        │
│ - user_id        │
│ - article_id     │
└──────────────────┘

┌──────────────────┐
│  Rating          │
│                  │
│ - rating (1-5)   │
│ - feedback       │
│ - user_id        │
│ - article_id     │
└──────────────────┘

┌──────────────────┐
│  ArticleView     │
│                  │
│ - ip_address     │
│ - user_id        │
│ - article_id     │
│ - viewed_at      │
└──────────────────┘
```

### Database Indexes

```sql
-- Article indexes
CREATE INDEX idx_article_slug ON knowledge_articles(slug);
CREATE INDEX idx_article_status ON knowledge_articles(status);
CREATE INDEX idx_article_category ON knowledge_articles(category_id);
CREATE INDEX idx_article_published ON knowledge_articles(published_at);

-- Comment indexes
CREATE INDEX idx_comment_article ON knowledge_comments(article_id);
CREATE INDEX idx_comment_parent ON knowledge_comments(parent_id);
CREATE INDEX idx_comment_user ON knowledge_comments(user_id);

-- Like indexes
CREATE UNIQUE INDEX idx_article_like_unique ON knowledge_article_likes(article_id, user_id);
CREATE UNIQUE INDEX idx_comment_like_unique ON knowledge_comment_likes(comment_id, user_id);

-- View tracking
CREATE UNIQUE INDEX idx_article_view_unique ON knowledge_article_views(article_id, ip_address);
```

---

## 🔌 API Architecture

### RESTful Endpoints

```
┌─────────────────────────────────────────────────────────┐
│                    API ENDPOINTS                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  PUBLIC ENDPOINTS (No Auth)                             │
│  ├─ GET  /knowledge/                                    │
│  ├─ GET  /knowledge/artikel/{slug}/                     │
│  ├─ GET  /knowledge/tags/                               │
│  └─ GET  /knowledge/tag/{slug}/                         │
│                                                          │
│  AUTHENTICATED ENDPOINTS (Login Required)               │
│  ├─ POST /knowledge/ajax/articles/{slug}/like/          │
│  ├─ POST /knowledge/ajax/articles/{slug}/dislike/       │
│  ├─ POST /knowledge/ajax/articles/{slug}/rate/          │
│  ├─ POST /knowledge/ajax/articles/{slug}/comment/       │
│  ├─ POST /knowledge/ajax/comments/{id}/like/            │
│  ├─ POST /knowledge/ajax/comments/{id}/dislike/         │
│  └─ POST /knowledge/ajax/comments/{id}/reply/           │
│                                                          │
│  MANAGEMENT ENDPOINTS (Permission Required)             │
│  ├─ GET  /knowledge/manage/articles/                    │
│  ├─ POST /knowledge/manage/articles/create/             │
│  ├─ GET  /knowledge/manage/articles/{slug}/view/        │
│  ├─ POST /knowledge/manage/articles/{slug}/edit/        │
│  ├─ POST /knowledge/manage/articles/{slug}/delete/      │
│  ├─ GET  /knowledge/manage/comments/                    │
│  ├─ GET  /knowledge/manage/categories/                  │
│  └─ GET  /knowledge/manage/tags/                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Request/Response Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────►│  Nginx   │────►│  Django  │────►│   DB     │
│          │     │          │     │          │     │          │
│  Browser │     │  Reverse │     │  Views   │     │PostgreSQL│
│          │     │  Proxy   │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     ▲                                   │
     │                                   │
     │           ┌──────────┐            │
     └───────────┤  Redis   │◄───────────┘
                 │  Cache   │
                 └──────────┘
```

### AJAX Request Flow (Comment Like)

```
1. User clicks "Like" button
   │
   ▼
2. JavaScript sends POST request
   POST /knowledge/ajax/comments/123/like/
   Headers: X-CSRFToken, Content-Type
   │
   ▼
3. Django View processes request
   - Authenticate user
   - Get or create CommentLike
   - Toggle like status
   - Update counter
   │
   ▼
4. Database transaction
   - INSERT or UPDATE comment_likes
   - UPDATE comments SET like_count = ...
   │
   ▼
5. Return JSON response
   {
     "success": true,
     "action": "liked",
     "like_count": 15,
     "dislike_count": 2
   }
   │
   ▼
6. JavaScript updates UI
   - Update counter display
   - Change button color
   - Show notification
```

---

## 🎨 Frontend Architecture

### Component Structure

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND LAYERS                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  PRESENTATION LAYER (Templates)                         │
│  ├─ base_dashboard.html (Base template)                 │
│  ├─ knowledge/                                           │
│  │  ├─ articles/                                         │
│  │  │  ├─ list.html                                      │
│  │  │  ├─ detail.html                                    │
│  │  │  ├─ form.html                                      │
│  │  │  └─ manage_list.html                               │
│  │  ├─ comments/                                         │
│  │  │  └─ manage_list.html                               │
│  │  ├─ categories/                                       │
│  │  └─ tags/                                             │
│  │                                                        │
│  STYLING LAYER (CSS)                                     │
│  ├─ Tailwind CSS (Utility-first)                         │
│  ├─ Custom CSS (Component-specific)                      │
│  └─ Font Awesome (Icons)                                 │
│                                                          │
│  INTERACTION LAYER (JavaScript)                          │
│  ├─ Vanilla JS (Core functionality)                      │
│  ├─ AJAX (Fetch API)                                     │
│  ├─ SweetAlert2 (Notifications)                          │
│  └─ Event Handlers                                       │
│     ├─ likeArticle()                                     │
│     ├─ likeComment()                                     │
│     ├─ submitReply()                                     │
│     └─ toggleReplyForm()                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### State Management

```
┌─────────────────────────────────────────┐
│         CLIENT-SIDE STATE               │
├─────────────────────────────────────────┤
│                                          │
│  DOM State                               │
│  ├─ Like button active/inactive          │
│  ├─ Reply form visible/hidden            │
│  ├─ Counter values                       │
│  └─ Loading indicators                   │
│                                          │
│  Session State (Django)                  │
│  ├─ User authentication                  │
│  ├─ CSRF token                           │
│  └─ User permissions                     │
│                                          │
│  Cache State (Redis)                     │
│  ├─ Article list cache                   │
│  ├─ Comment count cache                  │
│  └─ User session cache                   │
│                                          │
└─────────────────────────────────────────┘
```

---

## 🔒 Security Architecture

### Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  NETWORK LAYER                                           │
│  ├─ HTTPS/TLS 1.3 (SSL Certificate)                     │
│  ├─ Firewall (UFW)                                       │
│  │  ├─ Allow: 80, 443, 22                               │
│  │  └─ Deny: All others                                 │
│  └─ DDoS Protection (Cloudflare/AWS Shield)             │
│                                                          │
│  APPLICATION LAYER                                       │
│  ├─ CSRF Protection (Django)                             │
│  ├─ XSS Protection (Content Security Policy)            │
│  ├─ SQL Injection Prevention (ORM)                       │
│  ├─ Rate Limiting (Django Ratelimit)                     │
│  └─ Input Validation (Django Forms)                      │
│                                                          │
│  AUTHENTICATION LAYER                                    │
│  ├─ Session-based Auth (Django)                          │
│  ├─ Password Hashing (PBKDF2)                            │
│  ├─ Password Strength Validation                         │
│  └─ Account Lockout (Fail2ban)                           │
│                                                          │
│  AUTHORIZATION LAYER                                     │
│  ├─ Permission-based Access Control                      │
│  ├─ Role-based Access Control (RBAC)                     │
│  ├─ Object-level Permissions                             │
│  └─ Ownership Checks                                     │
│                                                          │
│  DATA LAYER                                              │
│  ├─ Database Encryption at Rest                          │
│  ├─ Backup Encryption                                    │
│  ├─ Sensitive Data Masking                               │
│  └─ Audit Logging                                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ 1. Login Request
     ▼
┌─────────────────┐
│  Django Auth    │
│                 │
│ 2. Validate     │
│    Credentials  │
└────┬────────────┘
     │
     │ 3. Create Session
     ▼
┌─────────────────┐
│  Redis Session  │
│  Store          │
└────┬────────────┘
     │
     │ 4. Return Session Cookie
     ▼
┌──────────┐
│  User    │
│  (Logged │
│   In)    │
└──────────┘
```

### Permission Check Flow

```
Request → Middleware → View Decorator → Permission Check
                                              │
                                              ├─ Has Permission? → Allow
                                              │
                                              └─ No Permission? → 403 Forbidden
```

---

## 📊 Performance Architecture

### Caching Strategy

```
┌─────────────────────────────────────────────────────────┐
│                   CACHING LAYERS                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  BROWSER CACHE (Client-side)                            │
│  ├─ Static files (CSS, JS, Images)                      │
│  ├─ Cache-Control: max-age=31536000                     │
│  └─ ETag validation                                      │
│                                                          │
│  CDN CACHE (Edge servers)                               │
│  ├─ Static assets                                        │
│  ├─ Media files                                          │
│  └─ Public pages                                         │
│                                                          │
│  REDIS CACHE (Application-level)                        │
│  ├─ Session data                                         │
│  ├─ Query results                                        │
│  ├─ Article list                                         │
│  ├─ Comment count                                        │
│  └─ User permissions                                     │
│                                                          │
│  DATABASE CACHE (Query-level)                           │
│  ├─ Query result cache                                   │
│  ├─ Prepared statements                                  │
│  └─ Connection pooling                                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Load Balancing (Future)

```
                    ┌──────────────┐
                    │ Load Balancer│
                    │   (Nginx)    │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌─────▼────┐      ┌─────▼────┐
   │ Django  │       │ Django   │      │ Django   │
   │ App 1   │       │ App 2    │      │ App 3    │
   └────┬────┘       └─────┬────┘      └─────┬────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼───────┐
                    │  PostgreSQL  │
                    │   (Primary)  │
                    └──────────────┘
```

---

## 🔄 Data Flow

### Comment Creation Flow

```
1. User submits comment form
   │
   ▼
2. AJAX POST request
   POST /knowledge/ajax/articles/{slug}/comment/
   Body: {content: "Great article!"}
   │
   ▼
3. Django View (article_comment)
   - Authenticate user
   - Validate content
   - Create Comment object
   │
   ▼
4. Database INSERT
   INSERT INTO knowledge_comments (article_id, user_id, content, ...)
   │
   ▼
5. Return JSON response
   {
     "success": true,
     "comment": {
       "id": 123,
       "content": "Great article!",
       "user_name": "John Doe",
       "created_at": "11 May 2026 10:30"
     }
   }
   │
   ▼
6. JavaScript updates DOM
   - Insert new comment HTML
   - Update comment counter
   - Show success notification
   - Clear form
```

### Nested Reply Flow (2-Level)

```
1. User clicks "Balas" on comment
   │
   ▼
2. Reply form appears
   │
   ▼
3. User submits reply
   │
   ▼
4. Check parent level
   │
   ├─ Parent is Level 0 (top-level)
   │  └─ Create reply as Level 1
   │
   └─ Parent is Level 1 (reply)
      └─ Create reply to original parent (flat to Level 1)
   │
   ▼
5. Database INSERT
   INSERT INTO knowledge_comments (article_id, user_id, parent_id, content, ...)
   │
   ▼
6. Return JSON response
   │
   ▼
7. JavaScript inserts reply
   - Add to replies container
   - Update reply counter
   - Hide reply form
```

---

## 📈 Scalability Considerations

### Horizontal Scaling

```
Current: Single server
Future:  Multiple app servers + Load balancer

┌─────────────┐
│   Nginx LB  │
└──────┬──────┘
       │
   ┌───┴───┬───────┬───────┐
   │       │       │       │
┌──▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐
│App 1│ │App 2│ │App 3│ │App N│
└──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘
   │       │       │       │
   └───┬───┴───┬───┴───┬───┘
       │       │       │
   ┌───▼───────▼───────▼───┐
   │    PostgreSQL          │
   │    (Primary/Replica)   │
   └────────────────────────┘
```

### Database Scaling

```
Current: Single PostgreSQL instance
Future:  Primary-Replica setup

┌──────────────┐
│  PostgreSQL  │
│   Primary    │
│  (Read/Write)│
└──────┬───────┘
       │
       │ Replication
       │
   ┌───┴───┬───────┐
   │       │       │
┌──▼──┐ ┌──▼──┐ ┌──▼──┐
│Rep 1│ │Rep 2│ │Rep 3│
│(Read)│(Read)│(Read)│
└─────┘ └─────┘ └─────┘
```

---

**Last Updated**: 11 Mei 2026  
**Version**: 1.0.0
