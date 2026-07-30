# 📊 Knowledge Base - IP-Based View Count System

## 🎯 Overview

Sistem view count yang sudah diupgrade dengan **IP-based tracking** untuk menghitung unique views secara akurat.

### ✨ Fitur Utama

- ✅ **Unique View Tracking**: 1 IP address = 1 view per artikel
- ✅ **User Tracking**: Track user jika login (optional)
- ✅ **User Agent Tracking**: Simpan info browser/device
- ✅ **Analytics**: View statistics, trending articles, popular articles
- ✅ **Privacy-Friendly**: Support IP anonymization untuk GDPR compliance
- ✅ **Backward Compatible**: View count lama tetap valid

---

## 📁 File Structure

```
apps/knowledge/
├── models.py                    # Model Article, ArticleView, Rating
├── utils.py                     # Helper: get_client_ip(), get_user_agent()
├── serializers.py               # DRF Serializers
├── views_api.py                 # DRF ViewSets dengan IP tracking
├── urls_api.py                  # API URL routing
├── admin.py                     # Django Admin (updated)
├── migrations/
│   └── 0003_articleview_ip_tracking.py  # Migration untuk tabel baru
├── IMPLEMENTATION_GUIDE.md      # Panduan implementasi detail
└── README_VIEW_COUNT.md         # File ini
```

---

## 🚀 Quick Start

### 1. Run Migration

```bash
cd projects/asncorpu-backend-python
python manage.py makemigrations knowledge
python manage.py migrate knowledge
```

### 2. Update URLs (jika pakai API)

Di `core/urls.py` atau `config/urls.py`:

```python
from django.urls import path, include

urlpatterns = [
    # ... existing urls
    path('api/knowledge/', include('apps.knowledge.urls_api')),
]
```

### 3. Implementasi di View

**Option A: Django View (Function-Based)**

```python
from apps.knowledge.models import Article
from apps.knowledge.utils import get_client_ip

def article_detail(request, slug):
    article = Article.objects.get(slug=slug, status='published')
    
    # Track view dengan IP
    ip_address = get_client_ip(request)
    user = request.user if request.user.is_authenticated else None
    
    is_new_view = article.increment_view_count(ip_address=ip_address, user=user)
    
    return render(request, 'article_detail.html', {
        'article': article,
        'is_new_view': is_new_view
    })
```

**Option B: Django REST Framework**

```python
# Sudah built-in di ArticleViewSet.retrieve()
# Tinggal pakai endpoint: GET /api/knowledge/articles/{slug}/
```

---

## 📊 Database Schema

### Tabel: `knowledge_article_views`

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Primary key |
| `article_id` | BIGINT | Foreign key ke `knowledge_articles` |
| `ip_address` | INET | IP address viewer (IPv4/IPv6) |
| `user_id` | BIGINT | Foreign key ke `users` (nullable) |
| `user_agent` | TEXT | Browser/device info (nullable) |
| `viewed_at` | TIMESTAMP | Waktu view |

**Constraints:**
- `UNIQUE(article_id, ip_address)` - 1 IP hanya 1 view per artikel

**Indexes:**
- `(article_id, ip_address)` - Fast lookup untuk check duplicate
- `(viewed_at)` - Fast filtering by date

---

## 🔌 API Endpoints

### Articles

```bash
# List articles
GET /api/knowledge/articles/

# Get article detail + track view
GET /api/knowledge/articles/{slug}/

# Get view statistics
GET /api/knowledge/articles/{slug}/view_stats/

# Get popular articles (most viewed)
GET /api/knowledge/articles/popular/?limit=10

# Get trending articles (most viewed in 7 days)
GET /api/knowledge/articles/trending/?limit=10

# Get featured articles
GET /api/knowledge/articles/featured/?limit=5
```

### Ratings

```bash
# Create/update rating
POST /api/knowledge/ratings/
{
  "article": 1,
  "rating": 5,
  "feedback": "Great article!"
}

# Get my ratings
GET /api/knowledge/ratings/my_ratings/
```

### Analytics (Staff Only)

```bash
# Get all views for an article
GET /api/knowledge/article-views/?article_slug=my-article

# Get my view history
GET /api/knowledge/article-views/my_views/
```

---

## 📈 Usage Examples

### Get View Statistics

```python
from apps.knowledge.models import Article
from django.utils import timezone
from datetime import timedelta

article = Article.objects.get(slug='my-article')

# Total unique views
print(f"Total views: {article.view_count}")

# Views by logged-in users
logged_in = article.views.filter(user__isnull=False).count()
print(f"Logged-in views: {logged_in}")

# Views in last 7 days
seven_days_ago = timezone.now() - timedelta(days=7)
recent = article.views.filter(viewed_at__gte=seven_days_ago).count()
print(f"Recent views: {recent}")
```

### Get Top 10 Most Viewed Articles

```python
top_articles = Article.objects.filter(
    status='published'
).order_by('-view_count')[:10]

for article in top_articles:
    print(f"{article.title}: {article.view_count} views")
```

### Get User's View History

```python
from apps.knowledge.models import ArticleView

user_views = ArticleView.objects.filter(
    user=request.user
).select_related('article').order_by('-viewed_at')

print(f"You have viewed {user_views.count()} articles:")
for view in user_views:
    print(f"- {view.article.title} at {view.viewed_at}")
```

---

## 🔒 Privacy & GDPR

### IP Anonymization

Untuk comply dengan GDPR, hash IP address sebelum disimpan:

```python
import hashlib

def anonymize_ip(ip_address):
    """Hash IP address untuk privacy"""
    return hashlib.sha256(ip_address.encode()).hexdigest()[:16]

# Usage
ip = get_client_ip(request)
hashed_ip = anonymize_ip(ip)
article.increment_view_count(ip_address=hashed_ip, user=user)
```

### Auto-Delete Old Views

Setup Celery task untuk hapus data lama:

```python
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

@shared_task
def cleanup_old_views():
    """Delete views older than 90 days"""
    ninety_days_ago = timezone.now() - timedelta(days=90)
    deleted = ArticleView.objects.filter(
        viewed_at__lt=ninety_days_ago
    ).delete()[0]
    return f"Deleted {deleted} old views"
```

---

## 🧪 Testing

```bash
# Run tests
python manage.py test apps.knowledge

# Test specific case
python manage.py test apps.knowledge.tests.ViewCountTestCase
```

### Manual Testing

```bash
# Test API endpoint
curl -X GET http://localhost:8000/api/knowledge/articles/my-article/

# Test with different IP (using X-Forwarded-For header)
curl -X GET http://localhost:8000/api/knowledge/articles/my-article/ \
  -H "X-Forwarded-For: 192.168.1.100"

# Get view stats
curl -X GET http://localhost:8000/api/knowledge/articles/my-article/view_stats/
```

---

## 📊 Analytics Dashboard (Future Enhancement)

Bisa ditambahkan dashboard untuk visualisasi:

- 📈 View trends (daily/weekly/monthly)
- 🌍 Geographic distribution (by IP location)
- 📱 Device/browser breakdown (from user agent)
- 👥 User engagement (logged-in vs anonymous)
- 🔥 Trending topics/categories

---

## 🐛 Troubleshooting

### View count tidak bertambah

**Penyebab:**
- IP address tidak dikirim ke `increment_view_count()`
- IP sudah pernah view artikel tersebut

**Solusi:**
```python
# Check apakah IP sudah view
from apps.knowledge.models import ArticleView

ip = get_client_ip(request)
already_viewed = ArticleView.objects.filter(
    article=article,
    ip_address=ip
).exists()

print(f"Already viewed: {already_viewed}")
```

### IP address selalu sama (127.0.0.1)

**Penyebab:**
- Request dari localhost
- Proxy headers tidak di-forward

**Solusi:**
- Pastikan nginx/proxy forward headers `X-Forwarded-For` atau `X-Real-IP`
- Function `get_client_ip()` sudah handle proxy headers

### Migration error

**Penyebab:**
- Conflict dengan migration lain

**Solusi:**
```bash
# Reset migrations (HATI-HATI: akan hapus data!)
python manage.py migrate knowledge zero
python manage.py migrate knowledge

# Atau fake migration jika tabel sudah ada
python manage.py migrate knowledge 0003_articleview_ip_tracking --fake
```

---

## 📚 References

- [Django Models Documentation](https://docs.djangoproject.com/en/stable/topics/db/models/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [GDPR Compliance Guide](https://gdpr.eu/)
- [IP Address Privacy Best Practices](https://www.eff.org/deeplinks/2014/06/why-metadata-matters)

---

## 🤝 Contributing

Jika ada bug atau feature request, silakan buat issue atau pull request!

---

## 📝 Changelog

### Version 2.0 (Current)
- ✅ IP-based view tracking
- ✅ User agent tracking
- ✅ Analytics endpoints
- ✅ Trending articles
- ✅ View statistics

### Version 1.0 (Old)
- ❌ Simple counter (no IP tracking)
- ❌ No unique view validation

---

**Author:** ASN Corpu Development Team  
**Last Updated:** 2026-05-07
