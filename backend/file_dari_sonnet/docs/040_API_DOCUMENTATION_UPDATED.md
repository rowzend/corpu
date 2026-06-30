# ASN CORPU Backend - API Documentation (Updated)

## 📋 Overview

ASN CORPU Backend API telah diupdate dengan:
- ✅ **Port**: 8008 (local & production)
- ✅ **Route Prefix**: `/apicorpu/5.0/` (sebelumnya `/apigorvu/5.0/`)
- ✅ **Container Name**: `asncorpu-backend` (sebelumnya `dasar-python`)
- ✅ **Password Sync Pipeline**: Compatible dengan ESIMPEG
- ✅ **Timezone Import**: Fixed

## 🚀 Base URL

**Local Development:**
```
http://localhost:8008
```

**Production:**
```
http://192.1.6.16:8008
```

## 🔐 Authentication Endpoints

### 1. JWT Login
```http
POST /apicorpu/5.0/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
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

### 2. Session-based Login
```http
POST /apicorpu/5.0/login/username-corpu
Content-Type: application/json

{
  "login_username": "admin",
  "login_password": "admin123"
}
```

### 3. Token Verification
```http
POST /apicorpu/5.0/auth/verify
Authorization: Bearer <access_token>
```

### 4. Token Refresh
```http
POST /apicorpu/5.0/auth/refresh
Content-Type: application/json

{
  "refresh": "<refresh_token>"
}
```

### 5. Logout
```http
POST /apicorpu/5.0/auth/logout
Authorization: Bearer <access_token>
```

### 6. Change Password
```http
POST /apicorpu/5.0/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "old_password": "current_password",
  "new_password": "new_password",
  "confirm_password": "new_password"
}
```

## 👥 User Management

### List Users
```http
GET /apicorpu/5.0/users/list
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 50, max: 100)
- `search`: Search by username/name/email
- `is_active`: Filter by active status (true/false)

## 🔗 Webhook Endpoints (Password Sync Pipeline)

### 1. Register Webhook
```http
POST /apicorpu/5.0/webhooks/register
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "app_name": "esimpeg",
  "webhook_url": "http://esimpeg.local/api/webhooks/password-sync",
  "secret_key": "your_secret_key_here",
  "event_type": "password_changed"
}
```

### 2. List Webhooks
```http
GET /apicorpu/5.0/webhooks/list
Authorization: Bearer <access_token>
```

### 3. Unregister Webhook
```http
DELETE /apicorpu/5.0/webhooks/unregister/esimpeg
Authorization: Bearer <access_token>
```

### 4. Manual Password Sync
```http
POST /apicorpu/5.0/webhooks/sync-password-manual
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "username": "admin"  // Optional: sync specific user only
}
```

## 📚 Knowledge Base API

### Articles
```http
GET /knowledge/api/articles/                    # List articles
POST /knowledge/api/articles/                   # Create article (auth required)
GET /knowledge/api/articles/{slug}/             # Get article detail
POST /knowledge/api/articles/{slug}/like/       # Like article (auth required)
```

### Comments
```http
POST /knowledge/api/comments/                   # Create comment (auth required)
```

## 📋 API Routes List

### Get All Available Routes
```http
GET /apicorpu/5.0/routes
```

Returns complete list of all available API endpoints with descriptions.

## 🔧 Health Check

```http
GET /health/
```

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "cache": "connected",
  "message": "ASN CORPU is running"
}
```

## 🐳 Docker Commands

### Local Development
```bash
# Start all services
docker compose up -d --build

# Stop all services
docker compose down

# View logs
docker compose logs -f asncorpu_backend

# Execute commands in container
docker exec asncorpu_backend_app python manage.py <command>
```

### Production
```bash
# Start production services
docker compose -f docker-compose.prod.yml up -d --build

# Stop production services
docker compose -f docker-compose.prod.yml down
```

## 🔄 Password Sync Pipeline

ASN CORPU Backend dapat melakukan sync password ke aplikasi eksternal (seperti ESIMPEG) melalui webhook system:

1. **Register Webhook**: Aplikasi eksternal mendaftar untuk menerima notifikasi
2. **Password Change**: Ketika user ganti password di ASN CORPU
3. **Event Creation**: System membuat `PasswordChangeEvent`
4. **Webhook Delivery**: System mengirim webhook ke aplikasi terdaftar
5. **Sync Confirmation**: Aplikasi eksternal update password mereka

### Manual Sync Command
```bash
docker exec asncorpu_backend_app python manage.py sync_password_to_apps --username admin
```

## 🚨 Error Handling

All API endpoints return consistent error format:

```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE",
  "version": "5.0"
}
```

Common error codes:
- `MISSING_CREDENTIALS`: Username/password required
- `USER_NOT_FOUND`: User doesn't exist
- `INVALID_CREDENTIALS`: Wrong password
- `USER_INACTIVE`: Account disabled
- `INVALID_TOKEN`: Token expired/invalid
- `MISSING_AUTH_HEADER`: Authorization header required

## 📝 Notes

1. **CORS**: Configured for frontend ports (3000, 8080, 4200)
2. **Rate Limiting**: Applied to login endpoints (10 attempts per minute)
3. **JWT Tokens**: 24 hours lifetime, auto-refresh available
4. **Database**: PostgreSQL (local), MySQL (production)
5. **Cache**: Redis for sessions and caching
6. **Timezone**: Fixed import issues, using Asia/Jakarta

## 🔗 Frontend Integration

Frontend developers dapat menggunakan base URL:
- **Local**: `http://localhost:8008`
- **Production**: `http://192.1.6.16:8008`

Semua endpoint menggunakan prefix `/apicorpu/5.0/` untuk API v5.0.

---

**Last Updated:** January 15, 2025  
**Version:** 5.0  
**Status:** ✅ Ready for Development