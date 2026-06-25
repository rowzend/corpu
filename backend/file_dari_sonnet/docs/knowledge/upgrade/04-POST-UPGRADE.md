# ✅ Post-Upgrade Tasks

> **Langkah-langkah setelah upgrade selesai**

## 📋 Daftar Isi

1. [Update Permissions](#update-permissions)
2. [Clear Cache](#clear-cache)
3. [Test Critical Features](#test-critical-features)
4. [Monitor System](#monitor-system)
5. [Performance Check](#performance-check)

---

## 🔐 Update Permissions

### 1. Update Django Permissions
```bash
docker-compose run --rm asncorpu_backend python manage.py update_permissions
```

### 2. Fix File Permissions
```bash
# Media files
sudo chown -R www-data:www-data media/
sudo chmod -R 755 media/

# Static files
sudo chown -R www-data:www-data staticfiles/
sudo chmod -R 755 staticfiles/

# Log files
sudo chown -R www-data:www-data /var/log/asncorpu/
sudo chmod -R 755 /var/log/asncorpu/
```

---

## 🗑️ Clear Cache

### 1. Clear Redis Cache
```bash
# Clear all cache
docker-compose exec redis redis-cli FLUSHALL

# Or clear specific keys
docker-compose exec redis redis-cli KEYS "knowledge:*" | xargs docker-compose exec redis redis-cli DEL
```

### 2. Clear Django Cache
```bash
docker-compose run --rm asncorpu_backend python manage.py clear_cache
```

### 3. Clear Browser Cache
Instruksikan user untuk clear browser cache atau hard refresh:
- **Chrome/Firefox**: `Ctrl + Shift + R` (Windows/Linux) atau `Cmd + Shift + R` (Mac)
- **Safari**: `Cmd + Option + R`

---

## ✅ Test Critical Features

### 1. Authentication
- [ ] Login dengan user biasa
- [ ] Login dengan admin
- [ ] Logout
- [ ] Password reset (jika ada)

### 2. Article Management
- [ ] Create artikel baru
- [ ] Edit artikel existing
- [ ] Delete artikel
- [ ] Upload image ke artikel
- [ ] Publish artikel

### 3. Comment System
- [ ] Add comment ke artikel
- [ ] Reply ke comment (Level 1)
- [ ] Reply ke reply (harus flat ke Level 1)
- [ ] Like comment
- [ ] Dislike comment

### 4. Engagement Features
- [ ] Like artikel
- [ ] Dislike artikel
- [ ] Rate artikel (1-5 stars)
- [ ] View count increment

### 5. Approval Workflow
- [ ] Submit artikel untuk approval
- [ ] Approve artikel
- [ ] Reject artikel dengan reason
- [ ] View approval history

### 6. Content Types
- [ ] Create artikel text
- [ ] Create artikel video (YouTube)
- [ ] Create artikel document (PDF/DOC)
- [ ] Create artikel link eksternal

---

## 📊 Monitor System

### 1. Check Application Logs
```bash
# Real-time logs
docker-compose logs -f asncorpu_backend

# Last 100 lines
docker-compose logs --tail=100 asncorpu_backend

# Check for errors
docker-compose logs asncorpu_backend | grep -i error
```

### 2. Check Database Logs
```bash
# PostgreSQL logs
docker-compose logs -f postgres

# MySQL logs
docker-compose logs -f mysql
```

### 3. Check Nginx Logs
```bash
# Access logs
docker-compose logs -f nginx

# Error logs
docker-compose logs nginx | grep -i error
```

### 4. Check System Resources
```bash
# Container stats
docker stats

# Disk usage
df -h

# Memory usage
free -h

# CPU usage
top
```

---

## 🚀 Performance Check

### 1. Response Time Test
```bash
# Test homepage
time curl http://localhost:8008/knowledge/

# Test article detail
time curl http://localhost:8008/knowledge/artikel/test-slug/

# Test API endpoint
time curl -X POST http://localhost:8008/knowledge/ajax/articles/test-slug/like/ \
  -H "X-CSRFToken: <token>" \
  -H "Cookie: sessionid=<session>"
```

### 2. Database Query Performance
```bash
# Check slow queries (PostgreSQL)
docker-compose exec postgres psql -U asncorpu_user -d asncorpu_db -c "
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
"

# Check table sizes
docker-compose exec postgres psql -U asncorpu_user -d asncorpu_db -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### 3. Cache Hit Rate
```bash
# Redis stats
docker-compose exec redis redis-cli INFO stats | grep keyspace

# Check cache keys
docker-compose exec redis redis-cli KEYS "*" | wc -l
```

---

## 🔍 Health Check Endpoints

### 1. Application Health
```bash
curl http://localhost:8008/health/
# Expected: {"status": "healthy"}
```

### 2. Database Health
```bash
curl http://localhost:8008/health/db/
# Expected: {"status": "healthy", "database": "connected"}
```

### 3. Redis Health
```bash
curl http://localhost:8008/health/redis/
# Expected: {"status": "healthy", "redis": "connected"}
```

---

## 📈 Performance Optimization

### 1. Optimize Database
```bash
# Analyze tables (PostgreSQL)
docker-compose exec postgres psql -U asncorpu_user -d asncorpu_db -c "ANALYZE;"

# Vacuum tables
docker-compose exec postgres psql -U asncorpu_user -d asncorpu_db -c "VACUUM ANALYZE;"
```

### 2. Rebuild Search Index (jika ada)
```bash
docker-compose run --rm asncorpu_backend python manage.py rebuild_index
```

### 3. Warm Up Cache
```bash
# Pre-load popular articles
curl http://localhost:8008/knowledge/
curl http://localhost:8008/knowledge/artikel/popular-article-1/
curl http://localhost:8008/knowledge/artikel/popular-article-2/
```

---

## 📝 Update Documentation

### 1. Update Internal Docs
- [ ] Update version number di README
- [ ] Update changelog
- [ ] Update API documentation (jika ada perubahan)

### 2. Notify Team
- [ ] Send email ke development team
- [ ] Update Slack channel
- [ ] Update project management tool (Jira/Trello)

### 3. Update User Documentation
- [ ] Update user guide (jika ada perubahan UI)
- [ ] Update FAQ
- [ ] Create release notes

---

## 🎯 Post-Upgrade Checklist

### Immediate (0-1 hour)
- [ ] All services running
- [ ] No errors in logs
- [ ] Critical features working
- [ ] Cache cleared
- [ ] Permissions updated

### Short-term (1-24 hours)
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] User feedback collection
- [ ] Bug reports tracking

### Long-term (1-7 days)
- [ ] Performance trending
- [ ] User adoption rate
- [ ] System stability
- [ ] Resource utilization

---

## 🐛 Common Post-Upgrade Issues

### Issue 1: Static Files Not Loading
```bash
# Solution
docker-compose run --rm asncorpu_backend python manage.py collectstatic --clear --noinput
docker-compose restart nginx
```

### Issue 2: Cache Issues
```bash
# Solution
docker-compose exec redis redis-cli FLUSHALL
docker-compose restart asncorpu_backend
```

### Issue 3: Permission Errors
```bash
# Solution
sudo chown -R www-data:www-data media/ staticfiles/
sudo chmod -R 755 media/ staticfiles/
```

### Issue 4: Database Connection Pool Exhausted
```bash
# Solution
docker-compose restart postgres
docker-compose restart asncorpu_backend
```

---

## 📞 Support

Jika mengalami masalah setelah upgrade:
1. Check logs: `docker-compose logs -f`
2. Review [02-BACKUP-GUIDE.md](./02-BACKUP-GUIDE.md) untuk rollback
3. Consult development team

---

## 📊 Success Metrics

### Technical Metrics
- ✅ Uptime: 99.9%
- ✅ Response time: < 500ms
- ✅ Error rate: < 0.1%
- ✅ Database query time: < 100ms

### Business Metrics
- ✅ User satisfaction: > 4.5/5
- ✅ Feature adoption: > 80%
- ✅ Bug reports: < 5 per week

---

**Last Updated**: 11 Mei 2026  
**Version**: 1.0.0
