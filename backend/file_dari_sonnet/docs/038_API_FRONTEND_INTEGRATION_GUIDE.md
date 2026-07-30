# 🚀 API Frontend Integration Guide

**File:** `038_API_FRONTEND_INTEGRATION_GUIDE.md`  
**Category:** API Documentation  
**Status:** ✅ Complete  
**Last Updated:** May 7, 2026  

## 📋 Overview

Dokumentasi lengkap untuk integrasi frontend dengan ASN Corpu Backend API. Mencakup authentication, CORS configuration, dan Knowledge Base API endpoints.

## 📡 Base Configuration

### Backend URL
```
http://192.1.6.16:8008
```

### CORS Status
✅ **CORS Configured & Working**
- Middleware: `corsheaders.middleware.CorsMiddleware` 
- Allowed Origins: localhost:3000, localhost:8080, localhost:4200, 192.1.6.16:*
- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Headers: Authorization, Content-Type, etc.

## 🔐 Authentication Endpoints

### Main API Routes (Recommended)
```http
POST /apigorvu/5.0/auth/login
POST /apigorvu/5.0/auth/verify  
POST /apigorvu/5.0/auth/refresh
POST /apigorvu/5.0/auth/logout
POST /apigorvu/5.0/auth/revoke-all-tokens
POST /apigorvu/5.0/auth/revoke-by-username
```

### Legacy Routes (Backward Compatibility)
```http
POST /apiaplikasi-test/4.0/login/username-aplikasi-test  # Session-based (OLD)
POST /apiaplikasi-test/4.0/login/get-token              # JWT (OLD)
POST /apiaplikasi-test/4.0/logout                       # Logout (OLD)
```

### Login Request/Response

**Request:**
```http
POST http://192.1.6.16:8008/apigorvu/5.0/auth/login
Content-Type: application/json

{
    "username": "admin",
    "password": "admin123"
}
```

**Response Success (100% Compatible with ESIMPEG Python):**
```json
{
    "status": "success",
    "message": "Login successful",
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "token_type": "Bearer",
        "expires_in": 86400,
        "user": {
            "user_id": 3,
            "username": "admin",
            "name": "Super Administrator",
            "email": "admin@asncorpu.com",
            "id_pegawai": 0,
            "user_id_opd": 0,
            "is_active": true
        }
    },
    "version": "5.0"
}
```

**Response Error:**
```json
{
    "status": "error",
    "message": "Username atau password salah",
    "code": "INVALID_CREDENTIALS",
    "version": "5.0"
}
```

## 📚 Knowledge Base API Endpoints

### Articles

#### Public Endpoints (No Auth Required)
```http
GET /knowledge/api/articles/                    # List all articles
GET /knowledge/api/articles/{slug}/             # Article detail + view tracking
GET /knowledge/api/articles/popular/            # Popular articles
GET /knowledge/api/articles/featured/           # Featured articles  
GET /knowledge/api/articles/trending/           # Trending (7 days)
GET /knowledge/api/articles/most_liked/         # Most liked articles
```

#### Interactive Endpoints (Auth Required)
```http
POST /knowledge/api/articles/                   # Create article
PUT /knowledge/api/articles/{slug}/             # Update article
DELETE /knowledge/api/articles/{slug}/          # Delete article
POST /knowledge/api/articles/{slug}/like/       # Like article
POST /knowledge/api/articles/{slug}/dislike/    # Dislike article
DELETE /knowledge/api/articles/{slug}/unlike/   # Remove like/dislike
```

#### Information Endpoints
```http
GET /knowledge/api/articles/{slug}/user_action/ # Get user's like/dislike status
GET /knowledge/api/articles/{slug}/who_liked/   # List users who liked
GET /knowledge/api/articles/{slug}/who_disliked/ # List users who disliked
GET /knowledge/api/articles/{slug}/view_stats/  # View statistics
```

### Categories & Tags
```http
GET /knowledge/api/categories/                  # List categories
GET /knowledge/api/categories/{slug}/           # Category detail
GET /knowledge/api/tags/                        # List tags
GET /knowledge/api/tags/{slug}/                 # Tag detail
```

### Ratings & Comments
```http
GET /knowledge/api/ratings/?article_slug={slug}    # Get ratings for article
POST /knowledge/api/ratings/                        # Create/update rating
GET /knowledge/api/comments/?article_slug={slug}   # Get comments for article
POST /knowledge/api/comments/                       # Create comment/reply
POST /knowledge/api/comments/{id}/like/             # Like comment
POST /knowledge/api/comments/{id}/dislike/          # Dislike comment
```

## 🔑 Authentication Headers

For endpoints requiring authentication:
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

## 📝 Frontend Implementation Examples

### JavaScript/Fetch API

#### Login Function
```javascript
const login = async (username, password) => {
    try {
        const response = await fetch('http://192.1.6.16:8008/apigorvu/5.0/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // Store tokens
            localStorage.setItem('access_token', data.data.access_token);
            localStorage.setItem('refresh_token', data.data.refresh_token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            
            return data.data.user;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};
```

#### Get Articles Function
```javascript
const getArticles = async (params = {}) => {
    const url = new URL('http://192.1.6.16:8008/knowledge/api/articles/');
    
    // Add query parameters
    Object.keys(params).forEach(key => {
        if (params[key]) {
            url.searchParams.append(key, params[key]);
        }
    });
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Get articles error:', error);
        throw error;
    }
};

// Usage examples:
// getArticles({ search: 'django', ordering: '-like_count' })
// getArticles({ limit: 10 })
```

#### Like Article Function (Authenticated)
```javascript
const likeArticle = async (slug) => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        throw new Error('Authentication required');
    }
    
    try {
        const response = await fetch(`http://192.1.6.16:8008/knowledge/api/articles/${slug}/like/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Like article error:', error);
        throw error;
    }
};
```

#### Create Comment Function (Authenticated)
```javascript
const createComment = async (articleId, content, parentId = null) => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        throw new Error('Authentication required');
    }
    
    try {
        const response = await fetch('http://192.1.6.16:8008/knowledge/api/comments/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                article: articleId,
                content: content,
                parent: parentId
            })
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Create comment error:', error);
        throw error;
    }
};
```

### React Hook Example

```javascript
// useAuth.js
import { useState, useEffect } from 'react';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await fetch('http://192.1.6.16:8008/apigorvu/5.0/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                localStorage.setItem('access_token', data.data.access_token);
                localStorage.setItem('refresh_token', data.data.refresh_token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                
                setToken(data.data.access_token);
                setUser(data.data.user);
                
                return data.data.user;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return {
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token
    };
};
```

## 🧪 Test Credentials

**Username:** `admin`  
**Password:** `admin123`

## 📊 Available Sample Data

- ✅ 4 sample articles with different content types
- ✅ 27 hierarchical categories  
- ✅ 27 tags
- ✅ Complete permission system
- ✅ User roles and permissions

## 🚨 Important Notes

### Authentication Requirements
- **Anonymous Access:** View articles, categories, tags
- **Authentication Required:** Like, dislike, comment, rate, create/edit content
- **Token Expiry:** Access token valid for 24 hours, refresh token for 7 days

### CORS Configuration
- ✅ Enabled for common frontend ports (3000, 8080, 4200)
- ✅ Supports credentials (cookies, authorization headers)
- ✅ Preflight requests handled correctly

### Error Handling
- Always check `response.ok` or `data.status` in frontend
- Handle 401 (Unauthorized) for token expiry
- Handle 403 (Forbidden) for insufficient permissions
- Handle 404 (Not Found) for invalid endpoints

### Performance Considerations
- Use pagination for large datasets (`?limit=20&offset=0`)
- Implement caching for frequently accessed data
- Use search/filtering to reduce data transfer

## 🔧 Troubleshooting

### Common Issues

#### "Failed to fetch" Error
- ✅ **Fixed:** CORS middleware added and configured
- Check if backend is running on correct port (8008)
- Verify frontend origin is in `CORS_ALLOWED_ORIGINS`

#### Authentication Errors
- Ensure `Authorization: Bearer {token}` header is included
- Check token expiry and refresh if needed
- Verify user has required permissions

#### CORS Errors
- Backend configured for ports: 3000, 8080, 4200
- Add new origins to `CORS_ALLOWED_ORIGINS` if needed
- Ensure preflight OPTIONS requests are handled

## 📚 Related Documentation

- `015_KNOWLEDGE_BASE_INDEX.md` - Knowledge Base overview
- `019_KNOWLEDGE_BASE_COMPLETE.md` - Complete implementation details
- `012_BACKEND_FRONTEND_COMMUNICATION.md` - Communication setup
- `014_NETWORK_ACCESS_GUIDE.md` - Network configuration

## ✅ Integration Checklist

- [x] Backend running on http://192.1.6.16:8008
- [x] CORS middleware configured and working
- [x] Multiple authentication routes available
- [x] Knowledge Base API endpoints ready
- [x] Test credentials available (admin/admin123)
- [x] Sample data seeded and accessible
- [x] Frontend integration examples provided
- [x] Error handling guidelines documented

**Status:** ✅ Ready for frontend integration

---

**Next Steps:**
1. Frontend developer can choose preferred API route
2. Implement authentication flow using provided examples
3. Integrate Knowledge Base features (articles, comments, likes)
4. Test with provided credentials and sample data
5. Handle errors and edge cases as documented

**Support:** All endpoints tested and verified working. CORS issues resolved.