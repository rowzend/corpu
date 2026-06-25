# 🔄 Migration Notes: Port 8008/3004 → Port 3000

Dokumentasi perubahan dari arsitektur port terpisah ke arsitektur 1 port dengan Nginx reverse proxy.

## 📋 Summary Perubahan

### Sebelum (Port Terpisah)
```
Frontend: http://localhost:3004
Backend:  http://localhost:8008
```

### Sesudah (1 Port via Nginx)
```
Semua akses: http://localhost:3000
  ├─ /              → Frontend (Next.js)
  ├─ /apicorpu      → Backend API (Django)
  ├─ /dashboard     → Backend Dashboard (Django)
  └─ /admin         → Backend Admin (Django)
```

## 🔧 File yang Diubah

### 1. Frontend Environment Variables

**File:** `frontend/.env.local`
```diff
- NEXT_PUBLIC_API_URL=http://localhost:8008/apicorpu/5.0
- NEXT_PUBLIC_BACKEND_URL=http://localhost:8008
+ NEXT_PUBLIC_API_URL=http://localhost:3000/apicorpu/5.0
+ NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

**File:** `docker-compose.yml` (frontend service)
```diff
environment:
-  - NEXT_PUBLIC_API_URL=http://localhost:8008/apicorpu/5.0
-  - NEXT_PUBLIC_BACKEND_URL=http://localhost:8008
+  - NEXT_PUBLIC_API_URL=http://localhost:3000/apicorpu/5.0
+  - NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

### 2. Frontend Login Redirect

**File:** `frontend/app/login/page.tsx`
```diff
- // Redirect ke dashboard Django di port 8008
- window.location.href = 'http://localhost:8008/dashboard/';
+ // Redirect ke dashboard Django via Nginx (port 3000)
+ window.location.href = 'http://localhost:3000/dashboard/';
```

### 3. Backend Django Settings

**File:** `backend/core/settings.py`
```diff
# CORS Settings
CORS_ALLOWED_ORIGINS = [
-    "http://localhost:8007",
-    "http://127.0.0.1:8007",
-    "http://localhost:3000",
-    "http://localhost:8080",
-    "http://localhost:4200",
+    "http://localhost:3000",  # Nginx reverse proxy (main access point)
+    "http://127.0.0.1:3000",
+    "http://localhost:8007",
+    "http://127.0.0.1:8007",
]

# Logout redirect
- LOGOUT_REDIRECT_URL = 'http://localhost:3004/'
+ LOGOUT_REDIRECT_URL = 'http://localhost:3000/'

# Trust proxy headers
+ USE_X_FORWARDED_HOST = config('USE_X_FORWARDED_HOST', default=True, cast=bool)
+ USE_X_FORWARDED_PORT = config('USE_X_FORWARDED_PORT', default=True, cast=bool)
```

### 4. Backend Logout View

**File:** `backend/apps/accounts/views.py`
```diff
def logout_view(request):
    ...
-    # Redirect to Next.js landing page
-    return redirect('http://localhost:3004/')
+    # Redirect to Next.js landing page via Nginx
+    return redirect('http://localhost:3000/')
```

### 5. Docker Compose Configuration

**File:** `docker-compose.yml`
```diff
services:
  asncorpu_backend:
-    ports:
-      - "8008:8000"
+    expose:
+      - "8000"
    environment:
+      - USE_X_FORWARDED_HOST=True
+      - USE_X_FORWARDED_PORT=True
+      - ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0,asncorpu_backend_app,asncorpu-nginx

  asncorpu-frontend:
-    ports:
-      - "3004:3004"
+    expose:
+      - "3004"

  asncorpu-nginx:
+    image: nginx:alpine
+    ports:
+      - "3000:80"
+    volumes:
+      - ./backend/nginx.conf:/etc/nginx/conf.d/default.conf:ro
```

### 6. Nginx Configuration

**File:** `backend/nginx.conf` (NEW FILE)
```nginx
upstream frontend {
    server asncorpu-frontend-nextjs:3004;
}

upstream backend {
    server asncorpu_backend_app:8000;
}

server {
    listen 80;
    server_name localhost;
    
    client_max_body_size 128M;
    
    # Frontend - Next.js
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Next.js hot reload
        proxy_read_timeout 86400;
    }
    
    # Backend API - Django
    location /apicorpu {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    # Django Dashboard & Admin
    location /dashboard {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    # Django Admin
    location /admin {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }
    
    # Django static files
    location /static/ {
        proxy_pass http://backend/static/;
        proxy_set_header Host $host;
    }
    
    # Django media files
    location /media/ {
        proxy_pass http://backend/media/;
        proxy_set_header Host $host;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

## ✅ Testing Checklist

Setelah migration, test hal-hal berikut:

- [ ] Frontend bisa diakses: `http://localhost:3000/`
- [ ] Login berhasil dan redirect ke dashboard: `http://localhost:3000/dashboard/`
- [ ] Logout berhasil dan redirect ke landing page: `http://localhost:3000/`
- [ ] Backend API bisa diakses: `http://localhost:3000/apicorpu/auth/1.0/login`
- [ ] Static files ter-load dengan benar
- [ ] Media files ter-load dengan benar
- [ ] Health check: `http://localhost:3000/health`

## 🚀 Deployment ke Production

Untuk production dengan domain, update:

1. **Environment Variables:**
```env
NEXT_PUBLIC_API_URL=https://asncorpu.yourdomain.com/apicorpu/5.0
NEXT_PUBLIC_BACKEND_URL=https://asncorpu.yourdomain.com
```

2. **Frontend Login Redirect:**
```typescript
window.location.href = 'https://asncorpu.yourdomain.com/dashboard/';
```

3. **Backend Logout Redirect:**
```python
return redirect('https://asncorpu.yourdomain.com/')
```

4. **Django Settings:**
```python
CORS_ALLOWED_ORIGINS = [
    "https://asncorpu.yourdomain.com",
]
LOGOUT_REDIRECT_URL = 'https://asncorpu.yourdomain.com/'
```

5. **Nginx Proxy Manager:**
   - Domain: `asncorpu.yourdomain.com`
   - Forward to: `asncorpu-nginx:80`
   - Enable SSL

## 📝 Notes

- Port 8008 dan 3004 tidak lagi di-expose ke host
- Semua akses harus melalui port 3000 (Nginx)
- Internal container masih menggunakan port aslinya (8000 untuk backend, 3004 untuk frontend)
- Nginx menangani routing berdasarkan path
