# ASN Academy - Frontend & Backend Integration Guide

## 📋 Overview

Frontend: Next.js (React) - Port 3004
Backend: Django (ASN CORPU) - Port 8008
API Base URL: `http://192.1.6.16:8008/apicorpu/5.0`

---

## 🔐 Authentication & Security

### 1. Login Flow

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (Success):**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "user": {
      "user_id": 3,
      "username": "admin",
      "name": "",
      "email": "admin@asncorpu.com",
      "id_pegawai": 0,
      "is_active": true
    }
  },
  "version": "5.0"
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "Username tidak ditemukan",
  "code": "USER_NOT_FOUND",
  "version": "5.0"
}
```

### 2. Protected Endpoints (Semua endpoint kecuali login/register)

**WAJIB mengirim token di header:**

```
Authorization: Bearer <access_token>
```

Frontend sudah otomatis menambahkan header ini untuk semua request setelah login.

---

## 🔧 Backend Requirements (Django)

### CORS Configuration

Backend **HARUS** enable CORS untuk allow request dari frontend.

**Install:**
```bash
pip install django-cors-headers
```

**Update `settings.py`:**
```python
INSTALLED_APPS = [
    ...
    'corsheaders',
    ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Harus di atas CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    ...
]

# Allow frontend origin
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3004",
    "http://192.1.6.6:3004",  # IP frontend
]

# Atau untuk development (allow semua)
CORS_ALLOW_ALL_ORIGINS = True
```

### Authentication Middleware

Semua endpoint (kecuali login/register) harus cek token:

```python
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

@permission_classes([IsAuthenticated])
def protected_view(request):
    # Endpoint ini hanya bisa diakses dengan valid token
    pass
```

---

## 🚀 Frontend Setup

### Environment Variables

File: `.env.local` dan `docker-compose.yml`

```env
NEXT_PUBLIC_API_URL=http://192.1.6.16:8008/apicorpu/5.0
NEXT_PUBLIC_API_TIMEOUT=30000
```

### Running Frontend

**Development (Docker):**
```bash
docker compose up -d
```

**Rebuild after changes:**
```bash
docker compose down
docker compose up -d --build
```

**View logs:**
```bash
docker logs asn-acad-frontend -f
```

---

## 📡 API Client Usage

Frontend sudah punya API client yang otomatis handle:
- ✅ Token authentication (auto-attach Bearer token)
- ✅ Error handling
- ✅ Timeout handling
- ✅ Multiple response formats

### Example: Call Protected Endpoint

```typescript
import { api } from '@/lib/api';

// GET request (token otomatis ditambahkan)
const users = await api.get('/users/list');

// POST request
const newUser = await api.post('/users/create', {
  username: 'john',
  email: 'john@example.com'
});

// PUT request
const updated = await api.put('/users/1', {
  name: 'John Doe'
});

// DELETE request
await api.delete('/users/1');
```

---

## 🔄 Token Management

### Access Token
- Disimpan di `localStorage.token`
- Otomatis dikirim di setiap request
- Expired: 24 jam (86400 detik)

### Refresh Token
- Disimpan di `localStorage.refresh_token`
- Digunakan untuk mendapatkan access token baru
- Expired: 7 hari

### Logout
```typescript
import { clearAuth } from '@/lib/auth';

// Clear semua auth data
clearAuth();

// Redirect ke login
router.push('/login');
```

---

## 🛡️ Security Checklist

### Backend (Django):
- [x] CORS enabled untuk frontend origin
- [ ] Semua protected endpoints cek token
- [ ] Token validation (expired, invalid)
- [ ] Rate limiting untuk login endpoint
- [ ] HTTPS di production

### Frontend (Next.js):
- [x] Token disimpan di localStorage
- [x] Token otomatis dikirim di header
- [x] Middleware protect routes
- [x] Auto redirect ke login jika tidak authenticated
- [ ] HTTPS di production

---

## 🐛 Troubleshooting

### 1. "Failed to fetch" / Timeout
- Cek backend sudah running
- Cek CORS sudah enabled
- Cek IP dan port sudah benar
- Test dengan curl: `curl http://192.1.6.16:8008/apicorpu/5.0/auth/login`

### 2. "Username tidak ditemukan"
- Username memang tidak ada di database
- Bukan bug, ini validasi dari backend

### 3. "401 Unauthorized" di protected endpoint
- Token expired atau invalid
- Cek token di localStorage
- Coba login ulang

### 4. Environment variable tidak update
- Rebuild Docker: `docker compose down && docker compose up -d --build`
- Cek: `docker exec asn-acad-frontend printenv | grep NEXT_PUBLIC`

---

## 📞 Contact

**Frontend Developer:** [Your Name]
**Backend Developer:** [Backend Dev Name]

---

## 📝 Notes

- Login endpoint: `/auth/login` (tidak perlu token)
- Semua endpoint lain: WAJIB pakai token
- Token format: `Bearer <access_token>`
- Frontend otomatis handle token management
