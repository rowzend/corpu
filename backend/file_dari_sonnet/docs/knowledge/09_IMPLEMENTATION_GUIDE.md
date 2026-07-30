# 📖 Knowledge Base - View Count Implementation Guide

## 🎯 Overview

Sistem view count sekarang menggunakan **IP-based tracking** untuk menghitung unique views.
- **1 IP address = 1 view** per artikel
- Jika IP yang sama buka artikel lagi, view count **tidak bertambah**
- Mendukung tracking user (jika login) dan user agent (browser info)

---

## 📊 Database Schema

### Tabel Baru: `knowledge_article_views`

```sql
CREATE TABLE knowledge_article_views (
    id BIGSERIAL PRIMARY KEY,
    article_id BIGINT NOT NULL REFERENCES knowledge_articles(id),
    ip_address INET NOT NULL,
    user_id BIGINT NULL REFERENCES users(id),
    user_agent TEXT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(article_id, ip_address)
);

CREATE INDEX idx_article_ip ON knowledge_article_views(article_id, ip_address);
CREATE INDEX idx_viewed_at ON knowledge_article_views(viewed_at);
```

---

## 🔧 Cara Implementasi

### 1. **Django View (Function-Based View)**

```python
from django.shortcuts import render, get_object_or_404
from apps.knowledge.models import Article
from apps.knowledge.utils import get_client_ip, get_user_agent

def article_detail(request, slug):
    """Detail artikel dengan IP-based view tracking"""
    article = get_object_or_404(Article, slug=slug, status='published')
    
    # Get client IP address
    ip_address = get_client_ip(request)
    
    # Get current user (if logged in)
    user = request.user if request.user.is_authenticated else None
    
    # Increment view count (only if IP belum pernah view)
    is_new_view = article.increment_view_count(
        ip_address=ip_address,
        user=user
    )
    
    # Optional: Track user agent
    if is_new_view:
        view = article.views.filter(ip_address=ip_address).first()
        if view:
            view.user_agent = get_user_agent(request)
            view.save(update_fields=['user_agent'])
    
    context = {
        'article': article,
        'is_new_view': is_new_view,  # True jika ini view pertama dari IP ini
    }
    return render(request, 'knowledge/article_detail.html', context)
```

### 2. **Django REST Framework (API View)**

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.knowledge.models import Article
from apps.knowledge.serializers import ArticleSerializer
from apps.knowledge.utils import get_client_ip, get_user_agent

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.filter(status='published')
    serializer_class = ArticleSerializer
    lookup_field = 'slug'
    
    def retrieve(self, request, *args, **kwargs):
        """Get article detail dan track view"""
        article = self.get_object()
        
        # Track view dengan IP address
        ip_address = get_client_ip(request)
        user = request.user if request.user.is_authenticated else None
        
        is_new_view = article.increment_view_count(
            ip_address=ip_address,
            user=user
        )
        
        # Update user agent jika view baru
        if is_new_view:
            view = article.views.filter(ip_address=ip_address).first()
            if view:
                view.user_agent = get_user_agent(request)
                view.save(update_fields=['user_agent'])
        
        serializer = self.get_serializer(article)
        data = serializer.data
        data['is_new_view'] = is_new_view
        
        return Response(data)
    
    @action(detail=True, methods=['get'])
    def view_stats(self, request, slug=None):
        """Get statistik view untuk artikel"""
        article = self.get_object()
        
        # Total unique views
        total_views = article.view_count
        
        # Views by logged-in users
        logged_in_views = article.views.filter(user__isnull=False).count()
        
        # Views by anonymous users
        anonymous_views = article.views.filter(user__isnull=True).count()
        
        # Recent views (last 7 days)
        from django.utils import timezone
        from datetime import timedelta
        seven_days_ago = timezone.now() - timedelta(days=7)
        recent_views = article.views.filter(viewed_at__gte=seven_days_ago).count()
        
        return Response({
            'article_id': article.id,
            'article_title': article.title,
            'total_views': total_views,
            'logged_in_views': logged_in_views,
            'anonymous_views': anonymous_views,
            'recent_views_7days': recent_views,
        })
```

### 3. **Class-Based View (DetailView)**

```python
from django.views.generic import DetailView
from apps.knowledge.models import Article
from apps.knowledge.utils import get_client_ip, get_user_agent

class ArticleDetailView(DetailView):
    model = Article
    template_name = 'knowledge/article_detail.html'
    context_object_name = 'article'
    slug_field = 'slug'
    
    def get_queryset(self):
        return Article.objects.filter(status='published')
    
    def get_object(self, queryset=None):
        article = super().get_object(queryset)
        
        # Track view dengan IP
        ip_address = get_client_ip(self.request)
        user = self.request.user if self.request.user.is_authenticated else None
        
        is_new_view = article.increment_view_count(
            ip_address=ip_address,
            user=user
        )
        
        # Store untuk context
        self.is_new_view = is_new_view
        
        return article
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['is_new_view'] = getattr(self, 'is_new_view', False)
        return context
```

---

## 🚀 Migration

Jalankan migration untuk membuat tabel baru:

```bash
# Generate migration file
python manage.py makemigrations knowledge

# Apply migration
python manage.py migrate knowledge
```

---

## 📈 Query Analytics

### Get Top 10 Most Viewed Articles

```python
from apps.knowledge.models import Article

top_articles = Article.objects.filter(
    status='published'
).order_by('-view_count')[:10]

for article in top_articles:
    print(f"{article.title}: {article.view_count} views")
```

### Get View History for an Article

```python
from apps.knowledge.models import Article, ArticleView

article = Article.objects.get(slug='my-article')

# Get all views
views = article.views.all()

# Get views with user info
logged_in_views = article.views.filter(user__isnull=False).select_related('user')

for view in logged_in_views:
    print(f"{view.user.username} viewed from {view.ip_address} at {view.viewed_at}")
```

### Get Views by Date Range

```python
from django.utils import timezone
from datetime import timedelta

# Views in last 30 days
thirty_days_ago = timezone.now() - timedelta(days=30)
recent_views = article.views.filter(viewed_at__gte=thirty_days_ago)

print(f"Views in last 30 days: {recent_views.count()}")
```

### Get User's View History

```python
from apps.knowledge.models import ArticleView

user = request.user
user_views = ArticleView.objects.filter(user=user).select_related('article')

print(f"{user.username} has viewed {user_views.count()} articles:")
for view in user_views:
    print(f"- {view.article.title} at {view.viewed_at}")
```

---

## 🔒 Privacy & GDPR Considerations

### IP Address Storage

IP addresses adalah **personal data** menurut GDPR. Pertimbangkan:

1. **Anonymization**: Hash IP address sebelum disimpan
2. **Retention Policy**: Hapus data view setelah periode tertentu (misal 90 hari)
3. **User Consent**: Informasikan user bahwa IP mereka di-track

### Contoh Anonymization

```python
import hashlib

def anonymize_ip(ip_address):
    """Hash IP address untuk privacy"""
    return hashlib.sha256(ip_address.encode()).hexdigest()[:16]

# Usage
hashed_ip = anonymize_ip(ip_address)
article.increment_view_count(ip_address=hashed_ip, user=user)
```

### Auto-Delete Old Views (Celery Task)

```python
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from apps.knowledge.models import ArticleView

@shared_task
def cleanup_old_views():
    """Delete view records older than 90 days"""
    ninety_days_ago = timezone.now() - timedelta(days=90)
    deleted_count = ArticleView.objects.filter(
        viewed_at__lt=ninety_days_ago
    ).delete()[0]
    
    return f"Deleted {deleted_count} old view records"
```

---

## 🧪 Testing

### Test View Count

```python
from django.test import TestCase, RequestFactory
from apps.knowledge.models import Article, ArticleView
from apps.knowledge.utils import get_client_ip

class ViewCountTestCase(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.article = Article.objects.create(
            title='Test Article',
            slug='test-article',
            content='Test content',
            status='published'
        )
    
    def test_increment_view_count_new_ip(self):
        """Test view count bertambah untuk IP baru"""
        initial_count = self.article.view_count
        
        result = self.article.increment_view_count(ip_address='192.168.1.1')
        
        self.assertTrue(result)  # Should return True (new view)
        self.article.refresh_from_db()
        self.assertEqual(self.article.view_count, initial_count + 1)
    
    def test_increment_view_count_duplicate_ip(self):
        """Test view count tidak bertambah untuk IP yang sama"""
        ip = '192.168.1.1'
        
        # First view
        self.article.increment_view_count(ip_address=ip)
        count_after_first = self.article.view_count
        
        # Second view from same IP
        result = self.article.increment_view_count(ip_address=ip)
        
        self.assertFalse(result)  # Should return False (duplicate)
        self.article.refresh_from_db()
        self.assertEqual(self.article.view_count, count_after_first)
    
    def test_view_tracking_with_user(self):
        """Test view tracking dengan user login"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        user = User.objects.create_user(username='testuser')
        ip = '192.168.1.1'
        
        self.article.increment_view_count(ip_address=ip, user=user)
        
        view = ArticleView.objects.get(article=self.article, ip_address=ip)
        self.assertEqual(view.user, user)
```

---

## 📝 Notes

1. **Performance**: Query `ArticleView.objects.filter()` di-index, jadi cepat
2. **Scalability**: Untuk traffic tinggi, pertimbangkan caching atau Redis
3. **Proxy/CDN**: Function `get_client_ip()` sudah handle proxy headers
4. **IPv6**: Field `GenericIPAddressField` support IPv4 dan IPv6

---

## 🔄 Migration dari Old System

Jika sudah ada data `view_count` lama (tanpa IP tracking):

```python
# Keep existing view_count as is
# New views akan di-track dengan IP
# Old count tetap valid sebagai historical data
```

Tidak perlu reset `view_count` yang sudah ada!
