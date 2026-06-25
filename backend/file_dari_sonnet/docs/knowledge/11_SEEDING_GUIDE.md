# 🌱 Knowledge Base - Seeding Guide

**Panduan Lengkap Database Seeding untuk Knowledge Base System**

---

## 📋 Overview

Panduan ini menjelaskan cara melakukan seeding data untuk Knowledge Base System yang mencakup:
- ✅ Categories (hierarchical)
- ✅ Tags
- ✅ Sample Articles
- ✅ Permissions (optional)
- ✅ Sidebar Menus (optional)

---

## 🎯 Seeder Files

### File Structure

```
apps/knowledge/management/commands/
├── __init__.py
├── seed_knowledge_categories.py      ← Seed categories
├── seed_knowledge_tags.py             ← Seed tags
└── seed_knowledge_sample_articles.py  ← Seed sample articles
```

---

## 🚀 Quick Start (3 Commands)

### 1. Seed Categories

```bash
docker exec asncorpu_backend_app python manage.py seed_knowledge_categories
```

**Output:**
```
======================================================================
🌱 Seeding Knowledge Base Categories
======================================================================
  ✅ Created: Teknologi
    ✅ Created: Teknologi > Programming
    ✅ Created: Teknologi > Database
    ✅ Created: Teknologi > DevOps
  ✅ Created: Kepegawaian
    ✅ Created: Kepegawaian > Peraturan
    ✅ Created: Kepegawaian > Tunjangan
    ✅ Created: Kepegawaian > Pengembangan Karir
  ✅ Created: Tutorial
    ✅ Created: Tutorial > Sistem Informasi
    ✅ Created: Tutorial > Aplikasi
  ✅ Created: Berita
  ✅ Created: FAQ

✅ Seeding complete! Created: 13, Updated: 0

Category structure:
  📁 Teknologi
    └─ Programming
    └─ Database
    └─ DevOps
  📁 Kepegawaian
    └─ Peraturan
    └─ Tunjangan
    └─ Pengembangan Karir
  📁 Tutorial
    └─ Sistem Informasi
    └─ Aplikasi
  📁 Berita
  📁 FAQ
```

**Options:**
```bash
# Clear existing categories before seeding
docker exec asncorpu_backend_app python manage.py seed_knowledge_categories --clear
```

---

### 2. Seed Tags

```bash
docker exec asncorpu_backend_app python manage.py seed_knowledge_tags
```

**Output:**
```
======================================================================
🌱 Seeding Knowledge Base Tags
======================================================================
  ✅ Created: Python
  ✅ Created: Django
  ✅ Created: JavaScript
  ✅ Created: React
  ✅ Created: Vue.js
  ✅ Created: Docker
  ✅ Created: Kubernetes
  ✅ Created: PostgreSQL
  ✅ Created: MySQL
  ✅ Created: Redis
  ✅ Created: API
  ✅ Created: REST
  ✅ Created: GraphQL
  ✅ Created: Tutorial
  ✅ Created: Panduan
  ✅ Created: Tips
  ✅ Created: Best Practice
  ✅ Created: Troubleshooting
  ✅ Created: ASN
  ✅ Created: Kepegawaian
  ✅ Created: Peraturan
  ✅ Created: Tunjangan
  ✅ Created: Promosi
  ✅ Created: Diklat
  ✅ Created: SIMPEG
  ✅ Created: E-Office
  ✅ Created: Sistem Informasi

✅ Seeding complete! Created: 27, Updated: 0
Total tags: 27
```

**Options:**
```bash
# Clear existing tags before seeding
docker exec asncorpu_backend_app python manage.py seed_knowledge_tags --clear
```

---

### 3. Seed Sample Articles

```bash
docker exec asncorpu_backend_app python manage.py seed_knowledge_sample_articles
```

**Output:**
```
======================================================================
🌱 Seeding Knowledge Base Sample Articles
======================================================================
  📝 Author: admin
  ✅ Created: Panduan Lengkap Django REST Framework
  ✅ Created: Optimasi Query Database dengan Django ORM
  ✅ Created: Cara Menggunakan Sistem Knowledge Base
  ✅ Created: Peraturan Tunjangan Kinerja ASN 2026

✅ Seeding complete! Created: 4, Updated: 0
Total articles: 4
```

**Options:**
```bash
# Clear existing articles before seeding
docker exec asncorpu_backend_app python manage.py seed_knowledge_sample_articles --clear

# Specify author username
docker exec asncorpu_backend_app python manage.py seed_knowledge_sample_articles --user=johndoe
```

---

## 📊 Seeded Data Summary

### Categories (13 total)

**Parent Categories:**
1. **Teknologi** (3 children)
   - Programming
   - Database
   - DevOps

2. **Kepegawaian** (3 children)
   - Peraturan
   - Tunjangan
   - Pengembangan Karir

3. **Tutorial** (2 children)
   - Sistem Informasi
   - Aplikasi

4. **Berita** (no children)

5. **FAQ** (no children)

---

### Tags (27 total)

**Technology Tags:**
- Python, Django, JavaScript, React, Vue.js
- Docker, Kubernetes
- PostgreSQL, MySQL, Redis
- API, REST, GraphQL

**General Tags:**
- Tutorial, Panduan, Tips
- Best Practice, Troubleshooting

**ASN/Kepegawaian Tags:**
- ASN, Kepegawaian, Peraturan
- Tunjangan, Promosi, Diklat

**System Tags:**
- SIMPEG, E-Office, Sistem Informasi

---

### Sample Articles (4 total)

1. **Panduan Lengkap Django REST Framework**
   - Category: Programming
   - Tags: Python, Django, Tutorial
   - Status: Published
   - Featured: Yes

2. **Optimasi Query Database dengan Django ORM**
   - Category: Database
   - Tags: Django, PostgreSQL, Tutorial
   - Status: Published
   - Featured: Yes

3. **Cara Menggunakan Sistem Knowledge Base**
   - Category: Tutorial
   - Tags: Tutorial
   - Status: Published
   - Featured: No

4. **Peraturan Tunjangan Kinerja ASN 2026**
   - Category: Peraturan
   - Tags: ASN
   - Status: Published
   - Featured: No

---

## 🔄 Complete Setup (All in One)

### Run All Seeders in Order

```bash
# 1. Seed categories (must be first)
docker exec asncorpu_backend_app python manage.py seed_knowledge_categories

# 2. Seed tags
docker exec asncorpu_backend_app python manage.py seed_knowledge_tags

# 3. Seed sample articles (requires categories and tags)
docker exec asncorpu_backend_app python manage.py seed_knowledge_sample_articles
```

**Total Time:** < 1 minute

---

## 🎯 Database Tables Seeded

| Table | Records | Description |
|-------|---------|-------------|
| `knowledge_categories` | 13 | Hierarchical categories |
| `knowledge_tags` | 27 | Article tags/keywords |
| `knowledge_articles` | 4 | Sample articles |
| `knowledge_article_tags` | 8 | Article-Tag relationships |

**Other Tables (Empty after seeding):**
- `knowledge_article_views` - Will be populated when users view articles
- `knowledge_article_likes` - Will be populated when users like/dislike
- `knowledge_ratings` - Will be populated when users rate articles
- `knowledge_comments` - Will be populated when users comment
- `knowledge_comment_likes` - Will be populated when users like comments
- `knowledge_approval_history` - Will be populated during approval workflow

---

## ✅ Verification

### Check Seeded Data

```bash
# Check categories
docker exec asncorpu_backend_app python manage.py shell
>>> from apps.knowledge.models import Category
>>> Category.objects.count()
13
>>> Category.objects.filter(parent__isnull=True).count()
5

# Check tags
>>> from apps.knowledge.models import Tag
>>> Tag.objects.count()
27

# Check articles
>>> from apps.knowledge.models import Article
>>> Article.objects.count()
4
>>> Article.objects.filter(status='published').count()
4
>>> Article.objects.filter(is_featured=True).count()
2
```

---

## 🔧 Customization

### Add Your Own Categories

Edit `seed_knowledge_categories.py`:

```python
categories_data = [
    {
        'name': 'Your Category',
        'slug': 'your-category',
        'description': 'Your description',
        'order_index': 6,
        'children': [
            {'name': 'Sub Category', 'slug': 'sub-category', ...},
        ]
    },
]
```

### Add Your Own Tags

Edit `seed_knowledge_tags.py`:

```python
tags_data = [
    {'name': 'Your Tag', 'slug': 'your-tag'},
]
```

### Add Your Own Articles

Edit `seed_knowledge_sample_articles.py`:

```python
articles_data = [
    {
        'title': 'Your Article Title',
        'slug': 'your-article-slug',
        'content': 'Your article content...',
        'excerpt': 'Short description',
        'category': your_category,
        'tags': [tag1, tag2],
        'status': 'published',
        'is_featured': True,
    },
]
```

---

## 🎯 Best Practices

1. **Run in Order** - Categories → Tags → Articles
2. **Idempotent** - Safe to run multiple times (uses `update_or_create`)
3. **Use --clear Carefully** - Only use in development (will delete all data)
4. **Check Author** - Make sure superuser exists before seeding articles
5. **Customize** - Edit seeder files to match your needs

---

## 🚨 Troubleshooting

### Error: "No superuser found"

**Solution:**
```bash
# Create superuser first
docker exec -it asncorpu_backend_app python manage.py createsuperuser
```

### Error: "Categories not found"

**Solution:**
```bash
# Seed categories first
docker exec asncorpu_backend_app python manage.py seed_knowledge_categories
```

### Error: "Tags not found"

**Solution:**
```bash
# Seed tags first
docker exec asncorpu_backend_app python manage.py seed_knowledge_tags
```

---

## 📝 Notes

- ✅ All seeders are **idempotent** (safe to run multiple times)
- ✅ Uses `update_or_create` to avoid duplicates
- ✅ Provides clear output with emoji indicators
- ✅ Supports `--clear` option for fresh start
- ✅ Sample articles are in **Markdown format**
- ✅ All sample articles are **published** and ready to view

---

## 🔗 Related Documentation

- [01_README.md](./01_README.md) - Main documentation
- [02_INDEX.md](./02_INDEX.md) - Complete index
- [03_COMPLETE_FEATURES_SUMMARY.md](./03_COMPLETE_FEATURES_SUMMARY.md) - Features overview
- [10_FINAL_SUMMARY.md](./10_FINAL_SUMMARY.md) - Complete summary

---

## 🎉 Next Steps

After seeding:

1. **Test API Endpoints**
   ```bash
   curl http://localhost:8000/knowledge/api/categories/
   curl http://localhost:8000/knowledge/api/tags/
   curl http://localhost:8000/knowledge/api/articles/
   ```

2. **Check Admin Panel**
   - Login to `/admin/`
   - Navigate to Knowledge Base section
   - Verify categories, tags, and articles

3. **Test Frontend**
   - Browse articles by category
   - Search articles
   - Filter by tags
   - View article detail

4. **Add More Content**
   - Create new articles via admin or API
   - Add more categories and tags
   - Customize sample data

---

**Last Updated:** 2026-05-07  
**Version:** 1.0  
**Status:** ✅ Production Ready

