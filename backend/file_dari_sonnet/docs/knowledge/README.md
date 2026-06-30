# 📚 Dokumentasi Knowledge Base System - ASN CORPU

> **Dibuat oleh**: Claude Sonnet 4.5  
> **Tanggal**: 11 Mei 2026  
> **Versi**: 1.0.0

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Fitur Utama](#fitur-utama)
3. [Struktur URL](#struktur-url)
4. [Database Schema](#database-schema)
5. [Deployment Guide](#deployment-guide)
6. [Upgrade Guide](#upgrade-guide)
7. [API Documentation](#api-documentation)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Knowledge Base System adalah sistem manajemen pengetahuan untuk ASN Corporate University yang memungkinkan:
- Publikasi artikel, video, dokumen, dan link eksternal
- Sistem komentar nested dengan like/dislike
- Rating dan feedback artikel
- Approval workflow untuk artikel
- Kategorisasi dan tagging
- Tracking views dan engagement

---

## ✨ Fitur Utama

### 1. **Artikel Management**
- ✅ Multiple content types: Artikel, Video (YouTube), Dokumen, Link
- ✅ Rich text editor untuk konten
- ✅ Upload thumbnail dan file attachment
- ✅ Approval workflow (Draft → Pending → Approved → Published)
- ✅ Featured articles
- ✅ View tracking dengan IP-based unique counting

### 2. **Komentar System**
- ✅ **2-Level Nested Comments** (Parent → Reply)
- ✅ Like/Dislike untuk komentar dan reply
- ✅ Real-time counter update via AJAX
- ✅ Edit history tracking
- ✅ Moderation tools

### 3. **Engagement Features**
- ✅ Like/Dislike artikel
- ✅ 5-star rating system
- ✅ Share counter
- ✅ View analytics

### 4. **Kategorisasi**
- ✅ Hierarchical categories (parent-child)
- ✅ Multiple tags per artikel
- ✅ Color-coded tags

### 5. **Permission System**
- ✅ Role-based access control
- ✅ Granular permissions (view, create, edit, delete, approve)
- ✅ Author-based ownership

---

## 🔗 Struktur URL

### Public URLs (No Auth Required)
```
/knowledge/                              → Article list (homepage)
/knowledge/artikel/{slug}/               → Article detail (public view)
/knowledge/tags/                         → Tag list
/knowledge/tag/{slug}/                   → Tag detail
```

### Management URLs (Auth + Permission Required)
```
/knowledge/manage/articles/              → Article management list
/knowledge/manage/articles/create/       → Create new article
/knowledge/manage/articles/{slug}/view/  → View article (management)
/knowledge/manage/articles/{slug}/edit/  → Edit article
/knowledge/manage/articles/{slug}/delete/ → Delete article

/knowledge/manage/categories/            → Category management
/knowledge/manage/comments/              → Comment management (nested view)
/knowledge/manage/tags/                  → Tag management
```

### AJAX URLs (Interactive Features)
```
# Article Interactions
/knowledge/ajax/articles/{slug}/like/     → Like article
/knowledge/ajax/articles/{slug}/dislike/  → Dislike article
/knowledge/ajax/articles/{slug}/rate/     → Rate article
/knowledge/ajax/articles/{slug}/comment/  → Add comment

# Comment Interactions
/knowledge/ajax/comments/{id}/like/       → Like comment
/knowledge/ajax/comments/{id}/dislike/    → Dislike comment
/knowledge/ajax/comments/{id}/reply/      → Reply to comment (max 2 levels)
```

---

## 🗄️ Database Schema

### Core Models

#### 1. **Category**
```python
- id (PK)
- name (CharField, max_length=100)
- slug (SlugField, unique)
- description (TextField, optional)
- parent (ForeignKey to self, optional) # Hierarchical
- order_index (IntegerField)
- is_active (BooleanField)
- created_at, updated_at
```

#### 2. **Tag**
```python
- id (PK)
- name (CharField, max_length=50, unique)
- slug (SlugField, unique)
- description (TextField, optional)
- color (CharField, max_length=7) # Hex color
- is_active (BooleanField)
- created_at
```

#### 3. **Article**
```python
- id (PK)
- title (CharField, max_length=200)
- slug (SlugField, unique)
- content (TextField)
- excerpt (TextField, optional)
- thumbnail (ImageField, optional)
- content_type (CharField: article/video/document/link)
- file_url, file_upload, file_size, file_type
- youtube_url, youtube_embed_id, video_duration
- external_url
- author (FK to User)
- category (FK to Category, optional)
- status (CharField: draft/pending/approved/rejected/published/archived)
- is_featured (BooleanField)
- view_count, like_count, dislike_count, share_count
- rating_avg (DecimalField), rating_count
- submitted_at, approved_by, approved_at
- rejection_reason, rejection_count
- published_at, created_at, updated_at
```

#### 4. **Comment** (2-Level Nested)
```python
- id (PK)
- article (FK to Article)
- user (FK to User)
- parent (FK to self, optional) # Max 1 level deep
- content (TextField)
- like_count, dislike_count
- is_edited (BooleanField)
- created_at, updated_at
```

#### 5. **CommentLike**
```python
- id (PK)
- comment (FK to Comment)
- user (FK to User)
- is_like (BooleanField) # True=like, False=dislike
- created_at
- UNIQUE(comment, user)
```

#### 6. **ArticleLike**
```python
- id (PK)
- article (FK to Article)
- user (FK to User)
- is_like (BooleanField)
- created_at, updated_at
- UNIQUE(article, user)
```

#### 7. **Rating**
```python
- id (PK)
- article (FK to Article)
- user (FK to User)
- rating (IntegerField, 1-5)
- feedback (TextField, optional)
- created_at
- UNIQUE(article, user)
```

#### 8. **ArticleView** (Unique View Tracking)
```python
- id (PK)
- article (FK to Article)
- ip_address (GenericIPAddressField)
- user (FK to User, optional)
- user_agent (TextField, optional)
- viewed_at
- UNIQUE(article, ip_address)
```

#### 9. **ApprovalHistory**
```python
- id (PK)
- article (FK to Article)
- action (CharField: submitted/approved/rejected/published)
- actor (FK to User)
- reason (TextField, optional)
- created_at
```

---

## 🚀 Deployment Guide

Lihat file: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📈 Upgrade Guide

Lihat file: [UPGRADE.md](./UPGRADE.md)

---

## 📡 API Documentation

Lihat file: [API.md](./API.md)

---

## 🔧 Troubleshooting

Lihat file: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 📝 Changelog

### Version 1.0.0 (11 Mei 2026)
- ✅ Initial release
- ✅ Article management dengan multiple content types
- ✅ 2-level nested comments dengan like/dislike
- ✅ Rating system
- ✅ Approval workflow
- ✅ View tracking dengan IP-based unique counting
- ✅ Hierarchical categories
- ✅ Tag system dengan color coding
- ✅ Permission-based access control

---

## 👥 Contributors

- **Claude Sonnet 4.5** - AI Assistant
- **Prakom Admin** - Project Owner

---

## 📄 License

Internal use only - ASN Corporate University

---

## 📞 Support

Untuk pertanyaan atau issue, hubungi tim development ASN CORPU.
