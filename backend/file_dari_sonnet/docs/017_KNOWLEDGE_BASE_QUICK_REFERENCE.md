# 📚 Knowledge Base - Quick Reference

**Quick commands and code snippets for Knowledge Base module**

---

## 🚀 Setup Commands

```bash
# 1. Seed Permissions
docker exec asncorpu_backend_app python manage.py seed_knowledge_permissions

# 2. Seed Menus
docker exec asncorpu_backend_app python manage.py seed_knowledge_menus

# 3. Seed Categories
docker exec asncorpu_backend_app python manage.py seed_knowledge_categories

# 4. Clear and reseed categories
docker exec asncorpu_backend_app python manage.py seed_knowledge_categories --clear

# 5. Assign to Superadmin
docker exec asncorpu_backend_app python manage.py seed_superadmin_full_access
```

---

## 📊 Query Examples

### Categories

```python
from apps.knowledge.models import Category

# Get all active parent categories
parents = Category.objects.filter(parent__isnull=True, is_active=True)

# Get all active categories (flat list)
all_active = Category.objects.filter(is_active=True)

# Get specific category by slug
teknologi = Category.objects.get(slug='teknologi')

# Get children of a category
children = teknologi.get_children()  # Returns QuerySet of active children

# Get full path
programming = Category.objects.get(slug='programming')
print(programming.get_full_path())  # Output: "Teknologi > Programming"

# Get article count (including children)
count = teknologi.get_article_count()

# Toggle active status
category = Category.objects.get(slug='arsip-lama')
category.is_active = not category.is_active
category.save()
```

### Articles

```python
from apps.knowledge.models import Article, Category

# Create article
article = Article.objects.create(
    title='Tutorial Django untuk Pemula',
    slug='tutorial-django-pemula',  # Auto-generated if not provided
    content='Konten lengkap artikel...',
    excerpt='Ringkasan artikel...',  # Auto-generated if not provided
    author=request.user,
    category=Category.objects.get(slug='programming'),
    status='draft'  # draft, published, archived
)

# Publish article
article.status = 'published'
article.published_at = timezone.now()
article.save()

# Mark as featured
article.is_featured = True
article.save()

# Increment view count
article.increment_view_count()

# Get published articles
published = Article.objects.filter(status='published')

# Get featured articles
featured = Article.objects.filter(is_featured=True, status='published')

# Get popular articles (by view count)
popular = Article.objects.filter(status='published').order_by('-view_count')[:10]

# Get recent articles
recent = Article.objects.filter(status='published').order_by('-published_at')[:10]

# Get articles by category
articles = Article.objects.filter(category__slug='programming', status='published')

# Get articles by author
my_articles = Article.objects.filter(author=request.user)
```

### Tags

```python
from apps.knowledge.models import Tag, ArticleTag

# Create tag
tag = Tag.objects.create(name='Django')  # Slug auto-generated

# Get or create tag
tag, created = Tag.objects.get_or_create(name='Python')

# Add tag to article
ArticleTag.objects.create(article=article, tag=tag)

# Get all tags for an article
tags = article.article_tags.all()

# Get articles by tag
articles = Article.objects.filter(
    article_tags__tag__slug='django',
    status='published'
)

# Get tag with article count
tag = Tag.objects.get(slug='django')
count = tag.get_article_count()
```

### Ratings

```python
from apps.knowledge.models import Rating

# Create rating
rating = Rating.objects.create(
    article=article,
    user=request.user,
    rating=5,  # 1-5 stars
    feedback='Artikel sangat membantu!'
)

# Update rating (if user already rated)
rating, created = Rating.objects.update_or_create(
    article=article,
    user=request.user,
    defaults={'rating': 4, 'feedback': 'Updated feedback'}
)

# Get user's rating for article
try:
    rating = Rating.objects.get(article=article, user=request.user)
except Rating.DoesNotExist:
    rating = None

# Get all ratings for article
ratings = article.ratings.all()

# Get average rating (already calculated in article.rating_avg)
avg = article.rating_avg
count = article.rating_count
```

---

## 🎯 Common Patterns

### Create Article with Tags

```python
from apps.knowledge.models import Article, Category, Tag, ArticleTag

# Create article
article = Article.objects.create(
    title='Tutorial Django REST Framework',
    content='Konten lengkap...',
    author=request.user,
    category=Category.objects.get(slug='programming'),
    status='published',
    published_at=timezone.now()
)

# Add multiple tags
tag_names = ['django', 'python', 'rest-api', 'tutorial']
for tag_name in tag_names:
    tag, _ = Tag.objects.get_or_create(name=tag_name)
    ArticleTag.objects.create(article=article, tag=tag)
```

### Get Category Tree (Hierarchical)

```python
def get_category_tree():
    """Get all categories in hierarchical structure"""
    parents = Category.objects.filter(parent__isnull=True, is_active=True)
    tree = []
    
    for parent in parents:
        tree.append({
            'category': parent,
            'children': parent.get_children()
        })
    
    return tree

# Usage in view
context = {
    'category_tree': get_category_tree()
}
```

### Search Articles

```python
from django.db.models import Q

def search_articles(query):
    """Search articles by title, content, or tags"""
    return Article.objects.filter(
        Q(title__icontains=query) |
        Q(content__icontains=query) |
        Q(article_tags__tag__name__icontains=query),
        status='published'
    ).distinct()

# Usage
results = search_articles('django')
```

### Get Related Articles

```python
def get_related_articles(article, limit=5):
    """Get related articles by category and tags"""
    # Get articles in same category
    related = Article.objects.filter(
        category=article.category,
        status='published'
    ).exclude(id=article.id)
    
    # Order by rating and view count
    related = related.order_by('-rating_avg', '-view_count')[:limit]
    
    return related
```

---

## 🔧 Admin Customization

```python
# apps/knowledge/admin.py

from django.contrib import admin
from .models import Category, Article, Tag, Rating

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'is_active', 'order_index', 'created_at')
    list_filter = ('is_active', 'parent')
    search_fields = ('name', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('order_index', 'name')
    
    # Add custom actions
    actions = ['activate_categories', 'deactivate_categories']
    
    def activate_categories(self, request, queryset):
        queryset.update(is_active=True)
    activate_categories.short_description = "Activate selected categories"
    
    def deactivate_categories(self, request, queryset):
        queryset.update(is_active=False)
    deactivate_categories.short_description = "Deactivate selected categories"
```

---

## 📝 Forms

```python
# apps/knowledge/forms.py

from django import forms
from .models import Article, Category, Tag

class ArticleForm(forms.ModelForm):
    tags = forms.CharField(
        required=False,
        help_text='Comma-separated tags (e.g., django, python, tutorial)'
    )
    
    class Meta:
        model = Article
        fields = ['title', 'content', 'excerpt', 'category', 'status', 'is_featured']
        widgets = {
            'content': forms.Textarea(attrs={'rows': 10}),
            'excerpt': forms.Textarea(attrs={'rows': 3}),
        }
    
    def save(self, commit=True):
        article = super().save(commit=False)
        
        if commit:
            article.save()
            
            # Handle tags
            if self.cleaned_data.get('tags'):
                tag_names = [t.strip() for t in self.cleaned_data['tags'].split(',')]
                for tag_name in tag_names:
                    tag, _ = Tag.objects.get_or_create(name=tag_name)
                    article.article_tags.get_or_create(tag=tag)
        
        return article
```

---

## 🌐 REST API (DRF)

```python
# apps/knowledge/serializers.py

from rest_framework import serializers
from .models import Category, Article, Tag

class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    article_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'parent', 
                  'is_active', 'children', 'article_count']
    
    def get_children(self, obj):
        if obj.children.exists():
            return CategorySerializer(obj.get_children(), many=True).data
        return []
    
    def get_article_count(self, obj):
        return obj.get_article_count()

class ArticleSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    tags = serializers.SerializerMethodField()
    
    class Meta:
        model = Article
        fields = ['id', 'title', 'slug', 'content', 'excerpt', 'author', 
                  'author_name', 'category', 'category_name', 'status', 
                  'is_featured', 'view_count', 'rating_avg', 'rating_count',
                  'published_at', 'created_at', 'tags']
    
    def get_tags(self, obj):
        return [at.tag.name for at in obj.article_tags.all()]
```

---

## 🎨 Template Examples

```django
{# List categories #}
{% for parent in category_tree %}
  <div class="category-parent">
    <h3>{{ parent.category.name }}</h3>
    <ul>
      {% for child in parent.children %}
        <li>
          <a href="{% url 'knowledge:category_detail' child.slug %}">
            {{ child.name }}
            <span class="badge">{{ child.get_article_count }}</span>
          </a>
        </li>
      {% endfor %}
    </ul>
  </div>
{% endfor %}

{# Article card #}
<div class="article-card">
  <h2>{{ article.title }}</h2>
  <p>{{ article.excerpt }}</p>
  <div class="meta">
    <span>By {{ article.author.username }}</span>
    <span>{{ article.published_at|date:"d M Y" }}</span>
    <span>⭐ {{ article.rating_avg|floatformat:1 }} ({{ article.rating_count }})</span>
    <span>👁️ {{ article.view_count }} views</span>
  </div>
  <div class="tags">
    {% for tag in article.article_tags.all %}
      <span class="tag">{{ tag.tag.name }}</span>
    {% endfor %}
  </div>
</div>
```

---

## 🔍 Useful Queries

```python
# Get top rated articles
top_rated = Article.objects.filter(
    status='published',
    rating_count__gte=5  # At least 5 ratings
).order_by('-rating_avg')[:10]

# Get trending articles (high views in last 7 days)
from datetime import timedelta
from django.utils import timezone

week_ago = timezone.now() - timedelta(days=7)
trending = Article.objects.filter(
    status='published',
    published_at__gte=week_ago
).order_by('-view_count')[:10]

# Get articles by multiple tags
articles = Article.objects.filter(
    article_tags__tag__slug__in=['django', 'python'],
    status='published'
).distinct()

# Get categories with most articles
from django.db.models import Count

popular_categories = Category.objects.annotate(
    article_count=Count('articles')
).filter(
    is_active=True,
    article_count__gt=0
).order_by('-article_count')[:10]
```

---

**Last Updated:** May 6, 2026  
**For:** ASN Corpu Backend - Knowledge Base Module
