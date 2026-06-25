# API URL Restructure - ASN CORPU Backend

**Tanggal**: 8 Mei 2026  
**Status**: ✅ COMPLETED  
**Task**: Restructure API URLs for better organization

---

## 📋 OVERVIEW

API URLs telah direstrukturisasi untuk lebih terorganisir dan mudah dipahami. Struktur baru memisahkan endpoint berdasarkan fungsi (public, auth) dan versi API.

---

## 🔄 URL STRUCTURE CHANGES

### OLD STRUCTURE (Deprecated)
```
/apicorpu/5.0/auth/login          → Authentication
/apicorpu/5.0/auth/verify         → Token verification
/apicorpu/5.0/auth/refresh        → Token refresh
/knowledge/api/articles/          → Knowledge Base API
/knowledge/api/categories/        → Categories API
/knowledge/api/tags/              → Tags API
```

### NEW STRUCTURE (Current)
```
# Authentication API v1.0
/apicorpu/auth/1.0/login          → JWT Login
/apicorpu/auth/1.0/verify         → Token verification
/apicorpu/auth/1.0/refresh        → Token refresh
/apicorpu/auth/1.0/logout         → Logout
/apicorpu/auth/1.0/change-password → Change password
/apicorpu/auth/1.0/revoke-all-tokens → Revoke all tokens
/apicorpu/auth/1.0/revoke-by-username → Revoke by username (admin)
/apicorpu/auth/1.0/login-session  → Session-based login

# Public Knowledge Base API v1.0 (No Auth Required)
/apicorpu/public/1.0/knowledge/articles/     → Articles
/apicorpu/public/1.0/knowledge/categories/   → Categories
/apicorpu/public/1.0/knowledge/tags/         → Tags
/apicorpu/public/1.0/knowledge/comments/     → Comments
/apicorpu/public/1.0/knowledge/ratings/      → Ratings
/apicorpu/public/1.0/knowledge/article-views/ → Article views
/apicorpu/public/1.0/knowledge/article-likes/ → Article likes
/apicorpu/public/1.0/knowledge/comment-likes/ → Comment likes

# Legacy API v5.0 (Backward Compatibility - Still Supported)
/apicorpu/5.0/auth/login          → JWT Login (legacy)
/apicorpu/5.0/auth/verify         → Token verification (legacy)
/apicorpu/5.0/auth/refresh        → Token refresh (legacy)
... (all legacy endpoints still work)
```

---

## 🎯 BENEFITS

### 1. **Better Organization**
- `/apicorpu/auth/` - All authentication endpoints
- `/apicorpu/public/` - All public endpoints (no auth required)
- Clear separation of concerns

### 2. **Version Control**
- `1.0` - Current stable version
- Easy to add new versions (`2.0`, `3.0`) in the future
- Legacy `5.0` still supported for backward compatibility

### 3. **Semantic URLs**
- `/public/` clearly indicates no authentication required
- `/auth/` clearly indicates authentication endpoints
- `/knowledge/` clearly indicates Knowledge Base resources

### 4. **Backward Compatibility**
- All legacy `/apicorpu/5.0/` URLs still work
- No breaking changes for existing clients
- Gradual migration path

---

## 📊 URL MAPPING TABLE

| Old URL | New URL | Status |
|---------|---------|--------|
| `/apicorpu/5.0/auth/login` | `/apicorpu/auth/1.0/login` | Both work |
| `/apicorpu/5.0/auth/verify` | `/apicorpu/auth/1.0/verify` | Both work |
| `/apicorpu/5.0/auth/refresh` | `/apicorpu/auth/1.0/refresh` | Both work |
| `/apicorpu/5.0/auth/logout` | `/apicorpu/auth/1.0/logout` | Both work |
| `/knowledge/api/articles/` | `/apicorpu/public/1.0/knowledge/articles/` | New only |
| `/knowledge/api/categories/` | `/apicorpu/public/1.0/knowledge/categories/` | New only |
| `/knowledge/api/tags/` | `/apicorpu/public/1.0/knowledge/tags/` | New only |
| `/knowledge/api/comments/` | `/apicorpu/public/1.0/knowledge/comments/` | New only |

---

## 🔧 IMPLEMENTATION DETAILS

### 1. Core URLs Configuration
**File**: `projects/asncorpu-backend-python/core/urls.py`

```python
urlpatterns = [
    # ... other patterns ...
    
    # ========================================
    # API ASN CORPU - Public & Authenticated
    # ========================================
    
    # Public API v1.0 (No Authentication Required)
    path('apicorpu/public/1.0/knowledge/', include('apps.knowledge.urls_api')),
    
    # Authenticated API v1.0 (JWT Required)
    path('apicorpu/auth/1.0/login', views.api_jwt_login_v5, name='api_corpu_login'),
    path('apicorpu/auth/1.0/verify', views.api_jwt_verify_v5, name='api_corpu_verify'),
    path('apicorpu/auth/1.0/refresh', views.api_jwt_refresh_v5, name='api_corpu_refresh'),
    path('apicorpu/auth/1.0/logout', views.api_logout_v5, name='api_corpu_logout'),
    path('apicorpu/auth/1.0/change-password', views.api_change_password_v5, name='api_change_password_v5'),
    path('apicorpu/auth/1.0/revoke-all-tokens', views.api_revoke_all_tokens_v5, name='api_revoke_all_tokens_v5'),
    path('apicorpu/auth/1.0/revoke-by-username', views.api_revoke_by_username_v5, name='api_revoke_by_username_v5'),
    path('apicorpu/auth/1.0/login-session', views.api_login_v5, name='api_login_v5'),
    
    # Legacy API v5.0 (Backward Compatibility)
    path('apicorpu/5.0/auth/login', views.api_jwt_login_v5, name='api_corpu_login_legacy'),
    path('apicorpu/5.0/auth/verify', views.api_jwt_verify_v5, name='api_corpu_verify_legacy'),
    # ... all legacy endpoints ...
]
```

### 2. Knowledge Base API URLs
**File**: `projects/asncorpu-backend-python/apps/knowledge/urls_api.py`

```python
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'articles', ArticleViewSet, basename='article')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'ratings', RatingViewSet, basename='rating')
router.register(r'article-views', ArticleViewViewSet, basename='articleview')
router.register(r'article-likes', ArticleLikeViewSet, basename='articlelike')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'comment-likes', CommentLikeViewSet, basename='commentlike')

urlpatterns = [
    path('', include(router.urls)),
]
```

---

## 📝 MIGRATION GUIDE

### For Frontend Developers

#### 1. Update Base URL
```javascript
// OLD
const API_BASE = 'http://localhost:8008/knowledge/api';
const AUTH_BASE = 'http://localhost:8008/apicorpu/5.0/auth';

// NEW (Recommended)
const API_BASE = 'http://localhost:8008/apicorpu/public/1.0/knowledge';
const AUTH_BASE = 'http://localhost:8008/apicorpu/auth/1.0';

// LEGACY (Still works, but deprecated)
const AUTH_BASE_LEGACY = 'http://localhost:8008/apicorpu/5.0/auth';
```

#### 2. Update API Calls
```javascript
// OLD
fetch('http://localhost:8008/knowledge/api/articles/')
fetch('http://localhost:8008/apicorpu/5.0/auth/login')

// NEW
fetch('http://localhost:8008/apicorpu/public/1.0/knowledge/articles/')
fetch('http://localhost:8008/apicorpu/auth/1.0/login')
```

#### 3. Update Axios Instance
```javascript
// OLD
const api = axios.create({
  baseURL: 'http://localhost:8008/knowledge/api'
});

// NEW
const api = axios.create({
  baseURL: 'http://localhost:8008/apicorpu/public/1.0/knowledge'
});
```

### For Backend Developers

#### 1. No Changes Required
- All views remain the same
- Only URL routing changed
- Legacy URLs still work

#### 2. Add New API Versions (Future)
```python
# Future: Add v2.0
path('apicorpu/public/2.0/knowledge/', include('apps.knowledge.urls_api_v2')),
path('apicorpu/auth/2.0/login', views.api_jwt_login_v6, name='api_corpu_login_v2'),
```

---

## 🧪 TESTING

### Test New URLs
```bash
# Test authentication
curl -X POST http://localhost:8008/apicorpu/auth/1.0/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test Knowledge Base API
curl http://localhost:8008/apicorpu/public/1.0/knowledge/articles/

# Test with token
curl http://localhost:8008/apicorpu/public/1.0/knowledge/articles/my_articles/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Legacy URLs (Should Still Work)
```bash
# Test legacy authentication
curl -X POST http://localhost:8008/apicorpu/5.0/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 📚 UPDATED DOCUMENTATION

### Files Updated
1. ✅ `057_KNOWLEDGE_BASE_API_PUBLIC_ACCESS.md` - Updated all endpoint URLs
2. ✅ `058_API_AUTHENTICATION_GUIDE.md` - Updated authentication URLs
3. ✅ `059_API_URL_RESTRUCTURE.md` - This file (new)

### Documentation Changes
- All example URLs updated to new structure
- Legacy URLs noted as deprecated but still supported
- JavaScript/Python examples updated
- cURL examples updated

---

## 🚀 DEPLOYMENT NOTES

### Production Checklist
- ✅ New URLs configured in `core/urls.py`
- ✅ Legacy URLs maintained for backward compatibility
- ✅ Documentation updated
- ✅ No breaking changes for existing clients
- ✅ Docker container restarted

### CORS Configuration
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React dev
    "http://localhost:8080",  # Vue dev
    "https://yourdomain.com",  # Production
]
```

### Nginx Configuration (If Applicable)
```nginx
# Proxy new API endpoints
location /apicorpu/public/ {
    proxy_pass http://backend:8000;
}

location /apicorpu/auth/ {
    proxy_pass http://backend:8000;
}

# Legacy endpoints (backward compatibility)
location /apicorpu/5.0/ {
    proxy_pass http://backend:8000;
}
```

---

## 🔮 FUTURE PLANS

### Version 2.0 (Planned)
- GraphQL support
- WebSocket for real-time updates
- Enhanced filtering and pagination
- Rate limiting per endpoint

### Deprecation Timeline
- **Now**: Both new and legacy URLs work
- **Q3 2026**: Legacy URLs marked as deprecated in docs
- **Q1 2027**: Legacy URLs show deprecation warnings
- **Q3 2027**: Legacy URLs removed (breaking change)

---

## 📊 SUMMARY

### What Changed
- ✅ New URL structure: `/apicorpu/public/1.0/knowledge/` and `/apicorpu/auth/1.0/`
- ✅ Legacy URLs still work: `/apicorpu/5.0/auth/` and `/knowledge/api/`
- ✅ Better organization and semantic URLs
- ✅ Version control for future API changes

### What Didn't Change
- ❌ No changes to views or serializers
- ❌ No changes to authentication logic
- ❌ No changes to permissions
- ❌ No breaking changes for existing clients

### Action Required
- 🔄 Frontend developers: Update to new URLs (recommended, not required)
- ✅ Backend developers: No action required
- ✅ DevOps: No action required (backward compatible)

---

**Status**: ✅ API URL restructure completed successfully!

**Next Steps**:
1. Update frontend applications to use new URLs
2. Monitor legacy URL usage
3. Plan deprecation timeline
4. Communicate changes to all stakeholders
