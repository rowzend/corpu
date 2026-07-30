# API Authentication Guide - ASN CORPU Backend

**Tanggal**: 8 Mei 2026  
**Status**: ✅ PRODUCTION READY  
**Base URL**: `http://localhost:8008`

---

## 🔐 AUTHENTICATION METHODS

ASN CORPU Backend menyediakan 2 metode autentikasi:

1. **JWT Token Authentication** (Recommended) ⭐
2. **Session-based Authentication** (Legacy)

---

## 🎯 JWT TOKEN AUTHENTICATION (Recommended)

### 1. Login & Get Token

**Endpoint (NEW):**
```http
POST /apicorpu/auth/1.0/login
Content-Type: application/json
```

**Endpoint (LEGACY - Still Supported):**
```http
POST /apicorpu/5.0/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "user": {
      "id": 5,
      "username": "johndoe",
      "email": "john@example.com",
      "full_name": "John Doe",
      "nip": "199001012020121001",
      "is_staff": false,
      "is_superuser": false
    }
  }
}
```

**Response (Failed):**
```json
{
  "success": false,
  "message": "Invalid credentials",
  "errors": {
    "username": ["Username atau password salah"]
  }
}
```

---

### 2. Use Token in Requests

**Header:**
```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Example Request:**
```http
GET /knowledge/api/articles/my_articles/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

---

### 3. Verify Token

**Endpoint (NEW):**
```http
POST /apicorpu/auth/1.0/verify
Content-Type: application/json
Authorization: Bearer {access_token}
```

**Endpoint (LEGACY):**
```http
POST /apicorpu/5.0/auth/verify
Content-Type: application/json
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (Valid):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user_id": 5,
    "username": "johndoe",
    "exp": 1715251200
  }
}
```

**Response (Invalid/Expired):**
```json
{
  "success": false,
  "message": "Token is invalid or expired"
}
```

---

### 4. Refresh Token

**Endpoint (NEW):**
```http
POST /apicorpu/auth/1.0/refresh
Content-Type: application/json
```

**Endpoint (LEGACY):**
```http
POST /apicorpu/5.0/auth/refresh
Content-Type: application/json
```

**Request Body:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 86400
  }
}
```

---

### 5. Logout

**Endpoint (NEW):**
```http
POST /apicorpu/auth/1.0/logout
Authorization: Bearer {access_token}
```

**Endpoint (LEGACY):**
```http
POST /apicorpu/5.0/auth/logout
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 6. Change Password

**Endpoint (NEW):**
```http
POST /apicorpu/auth/1.0/change-password
Content-Type: application/json
Authorization: Bearer {access_token}
```

**Endpoint (LEGACY):**
```http
POST /apicorpu/5.0/auth/change-password
Content-Type: application/json
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "old_password": "password123",
  "new_password": "newpassword456",
  "new_password_confirmation": "newpassword456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### 7. Revoke All Tokens (Current User)

**Endpoint (NEW):**
```http
POST /apicorpu/auth/1.0/revoke-all-tokens
Authorization: Bearer {access_token}
```

**Endpoint (LEGACY):**
```http
POST /apicorpu/5.0/auth/revoke-all-tokens
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "message": "All tokens revoked successfully",
  "data": {
    "revoked_count": 3
  }
}
```

---

### 8. Revoke Tokens by Username (Admin Only)

**Endpoint (NEW):**
```http
POST /apicorpu/auth/1.0/revoke-by-username
Content-Type: application/json
Authorization: Bearer {admin_access_token}
```

**Endpoint (LEGACY):**
```http
POST /apicorpu/5.0/auth/revoke-by-username
Content-Type: application/json
Authorization: Bearer {admin_access_token}
```

**Request Body:**
```json
{
  "username": "johndoe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "All tokens for user 'johndoe' revoked successfully",
  "data": {
    "revoked_count": 2
  }
}
```

---

## 📋 SESSION-BASED AUTHENTICATION (Legacy)

### Login

**Endpoint (NEW):**
```http
POST /apicorpu/auth/1.0/login-session
Content-Type: application/json
```

**Endpoint (LEGACY):**
```http
POST /apicorpu/5.0/login/username-corpu
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 5,
      "username": "johndoe",
      "email": "john@example.com",
      "full_name": "John Doe"
    },
    "session_id": "abc123xyz..."
  }
}
```

**Note:** Session cookie akan di-set otomatis. Gunakan cookie ini untuk request selanjutnya.

---

## 🔧 INTEGRATION EXAMPLES

### JavaScript/Fetch

```javascript
// Login
async function login(username, password) {
  const response = await fetch('http://localhost:8008/apicorpu/auth/1.0/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Save token to localStorage
    localStorage.setItem('access_token', data.data.access_token);
    localStorage.setItem('refresh_token', data.data.refresh_token);
    return data.data;
  } else {
    throw new Error(data.message);
  }
}

// Use token in requests
async function getMyArticles() {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('http://localhost:8008/apicorpu/public/1.0/knowledge/articles/my_articles/', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
}

// Refresh token when expired
async function refreshToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  
  const response = await fetch('http://localhost:8008/apicorpu/auth/1.0/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('access_token', data.data.access_token);
    return data.data.access_token;
  } else {
    // Redirect to login
    window.location.href = '/login';
  }
}

// Logout
async function logout() {
  const token = localStorage.getItem('access_token');
  
  await fetch('http://localhost:8008/apicorpu/auth/1.0/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  // Clear tokens
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  
  // Redirect to login
  window.location.href = '/login';
}
```

---

### Axios (React/Vue)

```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:8008';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const { data } = await axios.post(`${API_BASE}/apicorpu/auth/1.0/refresh`, {
          refresh_token: refreshToken
        });
        
        localStorage.setItem('access_token', data.data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.data.access_token}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Login function
export const login = async (username, password) => {
  const { data } = await api.post('/apicorpu/auth/1.0/login', {
    username,
    password
  });
  
  if (data.success) {
    localStorage.setItem('access_token', data.data.access_token);
    localStorage.setItem('refresh_token', data.data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
  }
  
  return data;
};

// Get my articles
export const getMyArticles = async () => {
  const { data } = await api.get('/apicorpu/public/1.0/knowledge/articles/my_articles/');
  return data;
};

// Logout
export const logout = async () => {
  try {
    await api.post('/apicorpu/auth/1.0/logout');
  } finally {
    localStorage.clear();
    window.location.href = '/login';
  }
};

export default api;
```

---

### Python Requests

```python
import requests

API_BASE = 'http://localhost:8008'

class APIClient:
    def __init__(self):
        self.access_token = None
        self.refresh_token = None
        self.session = requests.Session()
    
    def login(self, username, password):
        """Login and get tokens"""
        response = self.session.post(
            f'{API_BASE}/apicorpu/auth/1.0/login',
            json={'username': username, 'password': password}
        )
        
        data = response.json()
        
        if data['success']:
            self.access_token = data['data']['access_token']
            self.refresh_token = data['data']['refresh_token']
            return data['data']['user']
        else:
            raise Exception(data['message'])
    
    def get_headers(self):
        """Get headers with token"""
        return {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
    
    def get_my_articles(self):
        """Get my articles"""
        response = self.session.get(
            f'{API_BASE}/apicorpu/public/1.0/knowledge/articles/my_articles/',
            headers=self.get_headers()
        )
        return response.json()
    
    def refresh_access_token(self):
        """Refresh access token"""
        response = self.session.post(
            f'{API_BASE}/apicorpu/auth/1.0/refresh',
            json={'refresh_token': self.refresh_token}
        )
        
        data = response.json()
        
        if data['success']:
            self.access_token = data['data']['access_token']
            return self.access_token
        else:
            raise Exception('Failed to refresh token')
    
    def logout(self):
        """Logout"""
        self.session.post(
            f'{API_BASE}/apicorpu/auth/1.0/logout',
            headers=self.get_headers()
        )
        self.access_token = None
        self.refresh_token = None

# Usage
client = APIClient()
user = client.login('johndoe', 'password123')
print(f'Logged in as: {user["full_name"]}')

articles = client.get_my_articles()
print(f'My articles: {articles["count"]}')

client.logout()
```

---

## 🔒 TOKEN SECURITY

### Token Lifetime
- **Access Token**: 24 hours (86400 seconds)
- **Refresh Token**: 7 days

### Best Practices
1. ✅ Store tokens in `localStorage` or `sessionStorage`
2. ✅ Never store tokens in cookies (XSS vulnerable)
3. ✅ Always use HTTPS in production
4. ✅ Implement token refresh logic
5. ✅ Clear tokens on logout
6. ✅ Handle 401 errors gracefully

### Token Storage Comparison

| Storage | Security | Persistence | XSS Risk | CSRF Risk |
|---------|----------|-------------|----------|-----------|
| localStorage | Medium | Permanent | High | Low |
| sessionStorage | Medium | Session only | High | Low |
| Cookie (HttpOnly) | High | Configurable | Low | High |
| Memory only | Highest | Session only | None | None |

**Recommendation**: Use `localStorage` for web apps, implement proper XSS protection.

---

## 📊 ERROR CODES

| Status Code | Meaning | Action |
|-------------|---------|--------|
| 200 | Success | Continue |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Refresh token or re-login |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Check endpoint URL |
| 422 | Validation Error | Check request data |
| 500 | Server Error | Contact admin |

---

## 🎯 COMPLETE WORKFLOW

### 1. Initial Login
```
User → POST /apicorpu/auth/1.0/login
     ← access_token + refresh_token
```

### 2. Make Authenticated Requests
```
User → GET /apicorpu/public/1.0/knowledge/articles/my_articles/
       Header: Authorization: Bearer {access_token}
     ← Article data
```

### 3. Token Expires (After 24h)
```
User → GET /apicorpu/public/1.0/knowledge/articles/my_articles/
       Header: Authorization: Bearer {expired_token}
     ← 401 Unauthorized
```

### 4. Refresh Token
```
User → POST /apicorpu/auth/1.0/refresh
       Body: { refresh_token: "..." }
     ← new access_token
```

### 5. Retry Request
```
User → GET /apicorpu/public/1.0/knowledge/articles/my_articles/
       Header: Authorization: Bearer {new_access_token}
     ← Article data
```

### 6. Logout
```
User → POST /apicorpu/auth/1.0/logout
       Header: Authorization: Bearer {access_token}
     ← Success
```

---

## 🚀 QUICK START

### 1. Get Token
```bash
curl -X POST http://localhost:8008/apicorpu/auth/1.0/login \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","password":"password123"}'
```

### 2. Use Token
```bash
curl -X GET http://localhost:8008/apicorpu/public/1.0/knowledge/articles/my_articles/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### 3. Refresh Token
```bash
curl -X POST http://localhost:8008/apicorpu/auth/1.0/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."}'
```

---

## 📝 NOTES

- JWT tokens are stateless (tidak disimpan di database)
- Refresh token dapat digunakan untuk mendapatkan access token baru
- Logout akan menambahkan token ke blacklist
- Token yang sudah di-revoke tidak dapat digunakan lagi
- Admin dapat revoke token user lain

---

**Status**: ✅ Production Ready - Authentication system fully functional!
