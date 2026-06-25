# 📚 Knowledge Base (KMS) - ASN Corpu

**Status:** ✅ Models & Seeders Ready  
**Phase:** Phase 2 - Core KMS (Knowledge Base)  
**Priority:** 🔥 HIGH (KMS First, LMS Second)

---

## 📋 Overview

Knowledge Base adalah bagian pertama dari Knowledge Management System (KMS) yang menyediakan platform untuk berbagi pengetahuan, artikel, dan best practices untuk ASN di Kabupaten Pesisir Selatan.

### Features:
- ✅ **Hierarchical Categories** - Parent-child category structure
- ✅ **Articles** - Rich content articles with WYSIWYG editor
- ✅ **Tags** - Flexible tagging system
- ✅ **Ratings** - User ratings and feedback
- ✅ **Active/Inactive Toggle** - Soft delete for categories
- ✅ **View Counter** - Track article popularity
- ✅ **Featured Articles** - Highlight important content
- ✅ **Status Management** - Draft, Published, Archived

---

## 🗄️ Database Schema

### Tables Created:

1. **knowledge_categories** - Hierarchical categories with parent-child
2. **knowledge_articles** - Main article content
3. **knowledge_tags** - Tags for articles
4. **knowledge_article_tags** - Many-to-many relationship
5. **knowledge_ratings** - User ratings for articles

### Category Structure Example:

```
Teknologi (parent, active)
  ├─ Programming (child, active)
  ├─ Database (child, active)
  └─ Keamanan Siber (child, active)

Kepegawaian (parent, active)
  ├─ Rekrutmen (child, active)
  ├─ Promosi & Mutasi (child, active)
  └─ Disiplin & Etika (child, active)

Arsip Lama (parent, inactive) ← For testing inactive state
```

---

## 🚀 Setup & Installation

### 1️⃣ Run Migrations

```bash
# Create migrations (already done)
docker exec asncorpu_backend_app python manage.py makemigrations knowledge

# Apply migrations (already done)
docker exec asncorpu_backend_app python manage.py migrate knowledge
```

### 2️⃣ Seed Permissions

```bash
docker exec asncorpu_backend_app python manage.py seed_knowledge_permissions
```

**Created Permissions:**
- `knowledge.category.view` - Lihat kategori
- `knowledge.category.create` - Tambah kategori
- `knowledge.category.edit` - Edit kategori
- `knowledge.category.delete` - Hapus kategori
- `knowledge.category.toggle_active` - Toggle aktif/nonaktif
- `knowledge.article.view` - Lihat artikel
- `knowledge.article.create` - Tambah artikel
- `knowledge.article.edit` - Edit artikel
- `knowledge.article.delete` - Hapus artikel
- `knowledge.article.publish` - Publish artikel
- `knowledge.article.feature` - Feature artikel
- `knowledge.tag.view` - Lihat tag
- `knowledge.tag.create` - Tambah tag
- `knowledge.tag.edit` - Edit tag
- `knowledge.tag.delete` - Hapus tag

### 3️⃣ Seed Menus

```bash
docker exec asncorpu_backend_app python manage.py seed_knowledge_menus
```

**Menu Structure:**
```
📚 Knowledge Base
  ├─ 📁 Kategori Artikel
  ├─ 📄 Artikel
  └─ 🏷️  Tag
```

### 4️⃣ Seed Dummy Categories

```bash
docker exec asncorpu_backend_app python manage.py seed_knowledge_categories
```

**Options:**
```bash
# Clear existing categories before seeding
docker exec asncorpu_backend_app python manage.py seed_knowledge_categories --clear
```

**Created Categories:**
- 5 Parent categories (Teknologi, Kepegawaian, Keuangan, Pelayanan Publik, Pengembangan SDM)
- 12 Child categories (sub-categories)
- 1 Inactive category (for testing)

### 5️⃣ Assign to Superadmin

```bash
docker exec asncorpu_backend_app python manage.py seed_superadmin_full_access
```

---

## 📊 Models

### 1. Category Model

```python
class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    parent = models.ForeignKey('self', null=True, blank=True)  # Hierarchical
    order_index = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)  # Active/Inactive toggle
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Methods:**
- `get_full_path()` - Get full category path (e.g., "Teknologi > Programming")
- `get_children()` - Get all active child categories
- `get_article_count()` - Get total articles (including children)

### 2. Article Model

```python
class Article(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    content = models.TextField()
    excerpt = models.TextField(blank=True, null=True)
    author = models.ForeignKey(User)
    category = models.ForeignKey(Category, null=True)
    status = models.CharField(choices=['draft', 'published', 'archived'])
    is_featured = models.BooleanField(default=False)
    view_count = models.IntegerField(default=0)
    rating_avg = models.DecimalField(max_digits=3, decimal_places=2)
    rating_count = models.IntegerField(default=0)
    published_at = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Methods:**
- `increment_view_count()` - Increment view counter
- `update_rating()` - Update average rating

### 3. Tag Model

```python
class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Methods:**
- `get_article_count()` - Get total articles with this tag

### 4. Rating Model

```python
class Rating(models.Model):
    article = models.ForeignKey(Article)
    user = models.ForeignKey(User)
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    feedback = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

---

## 🎯 Next Steps

### Phase 2 Completion (Current):
- ✅ Models created
- ✅ Migrations applied
- ✅ Permissions seeded
- ✅ Menus seeded
- ✅ Dummy categories seeded
- 🔲 Views & URLs (TODO)
- 🔲 Templates (TODO)
- 🔲 REST API (TODO)
- 🔲 CRUD operations (TODO)

### Phase 3: Document Library
- 🔲 Document upload system
- 🔲 Version control
- 🔲 Access control
- 🔲 Approval workflow

### Phase 4: Wiki System
- 🔲 Wiki pages
- 🔲 Markdown support
- 🔲 Page history
- 🔲 Collaborative editing

---

## 📝 Usage Examples

### Query Categories

```python
from apps.knowledge.models import Category

# Get all active parent categories
parents = Category.objects.filter(parent__isnull=True, is_active=True)

# Get all active child categories of "Teknologi"
teknologi = Category.objects.get(slug='teknologi')
children = teknologi.get_children()

# Get full path
category = Category.objects.get(slug='programming')
print(category.get_full_path())  # Output: "Teknologi > Programming"

# Get article count
count = teknologi.get_article_count()
```

### Create Article

```python
from apps.knowledge.models import Article, Category, Tag

# Create article
article = Article.objects.create(
    title='Tutorial Django untuk Pemula',
    content='Konten artikel...',
    author=request.user,
    category=Category.objects.get(slug='programming'),
    status='published',
    is_featured=True
)

# Add tags
tag1 = Tag.objects.get_or_create(name='django')[0]
tag2 = Tag.objects.get_or_create(name='python')[0]
article.article_tags.create(tag=tag1)
article.article_tags.create(tag=tag2)
```

### Rate Article

```python
from apps.knowledge.models import Rating

# User rates article
rating = Rating.objects.create(
    article=article,
    user=request.user,
    rating=5,
    feedback='Artikel sangat membantu!'
)

# Rating will auto-update article.rating_avg and article.rating_count
```

---

## 🔧 Management Commands

### seed_knowledge_categories

Seed dummy categories with parent-child structure.

```bash
# Seed categories
docker exec asncorpu_backend_app python manage.py seed_knowledge_categories

# Clear and reseed
docker exec asncorpu_backend_app python manage.py seed_knowledge_categories --clear
```

### seed_knowledge_permissions

Seed permissions for Knowledge Base module.

```bash
docker exec asncorpu_backend_app python manage.py seed_knowledge_permissions
```

### seed_knowledge_menus

Seed sidebar menus for Knowledge Base.

```bash
docker exec asncorpu_backend_app python manage.py seed_knowledge_menus
```

---

## 📚 Documentation

- [PROJECT_OVERVIEW_ASN_CORPU.md](../../file_dari_sonnet/PROJECT_OVERVIEW_ASN_CORPU.md) - Complete project overview
- [02_SEEDING_GUIDE.md](../../file_dari_sonnet/coding_implementation/02_SEEDING_GUIDE.md) - Seeding guide
- [README.md](../../README.md) - Main project README

---

## ✅ Testing Checklist

### Database:
- [x] Migrations applied successfully
- [x] Tables created in database
- [x] Indexes created properly

### Permissions:
- [x] Module created (knowledge)
- [x] Controls created (category, article, tag)
- [x] Functions created (view, create, edit, delete, etc)
- [x] Rules created (15 permission rules)

### Menus:
- [x] Parent menu created (Knowledge Base)
- [x] Child menus created (3 menus)
- [x] Permission keys linked

### Data:
- [x] Categories seeded (18 total)
- [x] Parent-child relationships working
- [x] Active/inactive toggle working
- [x] Slug auto-generation working

---

**Created:** May 6, 2026  
**Last Updated:** May 6, 2026  
**Status:** ✅ Ready for Views & API Development
