# ⚡ Quick Reference - Knowledge Base System

> **Cheat sheet untuk developer dan admin**

## 🚀 Quick Commands

### Docker Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart specific service
docker restart asncorpu_backend_app

# View logs
docker-compose logs -f asncorpu_backend

# Execute command in container
docker-compose exec asncorpu_backend python manage.py <command>
```

### Django Management Commands
```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Run development server
python manage.py runserver 0.0.0.0:8000

# Create migration
python manage.py makemigrations knowledge

# Show migrations
python manage.py showmigrations knowledge

# Shell
python manage.py shell
```

### Database Commands
```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U postgres asncorpu_db > backup.sql

# Restore PostgreSQL
docker-compose exec -T postgres psql -U postgres asncorpu_db < backup.sql

# Access PostgreSQL shell
docker-compose exec postgres psql -U postgres asncorpu_db
```

---

## 📁 Important File Locations

### Application Files
```
apps/knowledge/
├── models.py              # Database models
├── views.py               # View logic
├── urls.py                # URL routing
├── forms.py               # Form definitions
├── admin.py               # Admin interface
└── migrations/            # Database migrations

templates/knowledge/
├── articles/
│   ├── detail.html        # Article detail page
│   ├── list.html          # Article list page
│   └── manage_list.html   # Management list
└── comments/
    └── manage_list.html   # Comment management
```

### Configuration Files
```
.env                       # Environment variables
docker-compose.yml         # Docker development config
docker-compose.prod.yml    # Docker production config
requirements.txt           # Python dependencies
```

### Log Files
```
/var/log/asncorpu/
├── django.log             # Application logs
├── access.log             # Access logs
├── error.log              # Error logs
└── backup.log             # Backup logs
```

---

## 🔗 Important URLs

### Development
```
http://localhost:8008/                    # Homepage
http://localhost:8008/admin/              # Admin panel
http://localhost:8008/knowledge/          # Knowledge base
http://localhost:8008/knowledge/manage/   # Management area
```

### Production
```
https://knowledge.asncorpu.com/           # Homepage
https://knowledge.asncorpu.com/admin/     # Admin panel
https://knowledge.asncorpu.com/knowledge/ # Knowledge base
```

---

## 🗄️ Database Quick Reference

### Common Queries

#### Get article with comments
```python
from apps.knowledge.models import Article

article = Article.objects.prefetch_related(
    'comments__user',
    'comments__replies'
).get(slug='my-article')
```

#### Get top-level comments only
```python
from apps.knowledge.models import Comment

comments = Comment.objects.filter(
    article=article,
    parent__isnull=True
).select_related('user')
```

#### Get comment with replies
```python
comment = Comment.objects.prefetch_related('replies').get(id=123)
replies = comment.get_replies()
```

#### Get user's liked articles
```python
from apps.knowledge.models import ArticleLike

liked_articles = ArticleLike.objects.filter(
    user=user,
    is_like=True
).select_related('article')
```

---

## 🎨 Frontend Quick Reference

### JavaScript Functions

#### Article Interactions
```javascript
// Like article
likeArticle(slug)

// Dislike article
dislikeArticle(slug)

// Rate article
rateArticle(slug, rating)

// Submit comment
submitComment(event, slug)
```

#### Comment Interactions
```javascript
// Like comment
likeComment(commentId)

// Dislike comment
dislikeComment(commentId)

// Toggle reply form
toggleReplyForm(commentId)

// Submit reply
submitReply(event, parentCommentId)
```

### CSS Classes

#### Buttons
```css
.action-btn          /* Base button style */
.btn-like            /* Like button */
.btn-dislike         /* Dislike button */
.btn-view            /* View button */
.btn-edit            /* Edit button */
.btn-delete          /* Delete button */
```

#### Comments
```css
.comment-item        /* Comment container */
.comment-avatar      /* User avatar */
.comment-content     /* Comment text */
.comment-header      /* Comment header */
.replies-container   /* Nested replies */
```

---

## 🔐 Permission Quick Reference

### Permission Format
```
app_label.model_name.action
```

### Knowledge Base Permissions
```python
# Articles
'knowledge.articles.view'      # View articles (management)
'knowledge.articles.create'    # Create articles
'knowledge.articles.edit'      # Edit articles
'knowledge.articles.delete'    # Delete articles
'knowledge.articles.approve'   # Approve articles

# Categories
'knowledge.categories.view'    # View categories
'knowledge.categories.create'  # Create categories
'knowledge.categories.edit'    # Edit categories
'knowledge.categories.delete'  # Delete categories

# Tags
'knowledge.tags.view'          # View tags
'knowledge.tags.create'        # Create tags
'knowledge.tags.edit'          # Edit tags
'knowledge.tags.delete'        # Delete tags

# Comments
'knowledge.comments.view'      # View comments
'knowledge.comments.edit'      # Edit comments
'knowledge.comments.delete'    # Delete comments
'knowledge.comments.moderate'  # Moderate comments
```

### Check Permission in View
```python
from apps.manajemen.helpers import check_permission

# Check permission
if check_permission(request.user, 'knowledge', 'articles', 'edit'):
    # User has permission
    pass
```

### Check Permission in Template
```django
{% load permission_tags %}

{% has_permission 'knowledge' 'articles' 'edit' as can_edit %}
{% if can_edit %}
    <a href="{% url 'knowledge:article_edit' article.slug %}">Edit</a>
{% endif %}
```

---

## 🐛 Debugging Quick Reference

### Enable Debug Mode
```python
# .env
DEBUG=True
```

### View SQL Queries
```python
from django.db import connection
print(connection.queries)
```

### Django Shell
```bash
docker-compose exec asncorpu_backend python manage.py shell

# In shell
from apps.knowledge.models import Article, Comment
articles = Article.objects.all()
comments = Comment.objects.filter(parent__isnull=True)
```

### Check Logs
```bash
# Application logs
docker-compose logs -f asncorpu_backend

# Database logs
docker-compose logs -f postgres

# Nginx logs
docker-compose logs -f nginx

# Tail specific log file
tail -f /var/log/asncorpu/django.log
```

---

## 🔧 Troubleshooting Quick Fixes

### Issue: Static files not loading
```bash
python manage.py collectstatic --clear --noinput
docker restart asncorpu_backend_app
```

### Issue: Database connection error
```bash
docker-compose restart postgres
docker-compose logs postgres
```

### Issue: Migration conflict
```bash
python manage.py makemigrations --merge
python manage.py migrate
```

### Issue: Permission denied
```bash
sudo chown -R $USER:$USER media/
sudo chmod -R 755 media/
```

### Issue: Container won't start
```bash
docker-compose down
docker-compose up -d --force-recreate
```

---

## 📊 Monitoring Quick Reference

### Health Checks
```bash
# Application health
curl http://localhost:8008/health/

# Database health
docker-compose exec postgres pg_isready

# Redis health
docker-compose exec redis redis-cli ping
```

### Resource Usage
```bash
# Docker stats
docker stats

# Disk usage
df -h

# Memory usage
free -h

# CPU usage
top
```

### Database Stats
```sql
-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## 🔄 Backup & Restore Quick Reference

### Backup
```bash
# Database backup
docker-compose exec postgres pg_dump -U postgres asncorpu_db > backup_$(date +%Y%m%d).sql

# Media backup
tar -czf media_backup_$(date +%Y%m%d).tar.gz media/

# Full backup (automated)
/opt/asncorpu/backup.sh
```

### Restore
```bash
# Database restore
docker-compose exec -T postgres psql -U postgres asncorpu_db < backup_20260511.sql

# Media restore
tar -xzf media_backup_20260511.tar.gz
```

---

## 🚀 Deployment Quick Reference

### Production Deployment
```bash
# 1. Pull latest code
git pull origin main

# 2. Build containers
docker-compose -f docker-compose.prod.yml build

# 3. Run migrations
docker-compose -f docker-compose.prod.yml run --rm asncorpu_backend python manage.py migrate

# 4. Collect static
docker-compose -f docker-compose.prod.yml run --rm asncorpu_backend python manage.py collectstatic --noinput

# 5. Restart services
docker-compose -f docker-compose.prod.yml up -d

# 6. Check logs
docker-compose logs -f asncorpu_backend
```

### Rollback
```bash
# 1. Stop services
docker-compose down

# 2. Restore database
docker-compose exec -T postgres psql -U postgres asncorpu_db < backup_YYYYMMDD.sql

# 3. Checkout previous version
git checkout <previous-commit>

# 4. Rebuild and start
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📞 Emergency Contacts

### Development Team
- **Email**: dev@asncorpu.com
- **Slack**: #knowledge-base-dev

### System Administrator
- **Email**: admin@asncorpu.com
- **Phone**: +62 xxx xxxx xxxx

### On-Call Engineer
- **Phone**: +62 xxx xxxx xxxx
- **Email**: oncall@asncorpu.com

---

## 📚 Documentation Links

- [README.md](./README.md) - Overview
- [FEATURES.md](./FEATURES.md) - Feature documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [UPGRADE.md](./UPGRADE.md) - Upgrade guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture documentation
- [INDEX.md](./INDEX.md) - Documentation index

---

**Last Updated**: 11 Mei 2026  
**Version**: 1.0.0
