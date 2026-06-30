# 🔌 Port Mapping & Network Architecture

## Arsitektur Sebelum (Port Terpisah)

```
Browser
  ├─→ http://localhost:3004 → Frontend Container (Next.js)
  └─→ http://localhost:8008 → Backend Container (Django)
```

**Masalah:**
- ❌ 2 port berbeda
- ❌ CORS issues
- ❌ Tidak bisa pakai 1 domain
- ❌ Sulit setup SSL

## Arsitektur Sekarang (1 Port dengan Nginx)

```
Browser → http://localhost:3000 → Nginx Container
                                      ├─→ / → Frontend Container (port 3004)
                                      └─→ /apicorpu → Backend Container (port 8000)
```

**Keuntungan:**
- ✅ 1 port saja (3000)
- ✅ No CORS issues
- ✅ Bisa pakai 1 domain
- ✅ Mudah setup SSL
- ✅ Load balancing ready

## Detail Port Mapping

### External (dari Browser)
```
http://localhost:3000/              → Frontend (Next.js)
http://localhost:3000/apicorpu      → Backend API (Django)
http://localhost:3000/static        → Static files
http://localhost:3000/media         → Media files
http://localhost:3000/health        → Health check
```

### Internal (antar Container)
```
asncorpu-nginx:80                   → Nginx (exposed ke host:3000)
  ├─→ asncorpu-frontend-nextjs:3004 → Frontend
  └─→ asncorpu_backend_app:8000     → Backend
```

## Environment Variables

### Frontend (.env.local & docker-compose.yml)
```env
# Diakses dari BROWSER, bukan dari container
# Karena NEXT_PUBLIC_* di-render di client-side
NEXT_PUBLIC_API_URL=http://localhost:3000/apicorpu/5.0
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

**Penjelasan:**
- `NEXT_PUBLIC_*` = Client-side environment variable
- Diakses dari browser user
- Harus pakai `localhost:3000` (port nginx)

### Backend (docker-compose.yml)
```env
# Backend tidak perlu tahu tentang nginx
# Dia hanya listen di port 8000 internal
DB_HOST=postgres-main
REDIS_HOST=redis-main
```

## Nginx Configuration

File: `backend/nginx.conf`

```nginx
# Frontend
location / {
    proxy_pass http://asncorpu-frontend-nextjs:3004;
}

# Backend API
location /apicorpu {
    proxy_pass http://asncorpu_backend_app:8000;
}
```

**Penjelasan:**
- Nginx menggunakan **container name** untuk routing internal
- Container bisa saling akses via nama container (DNS internal Docker)

## Testing

### 1. Test Nginx Health
```bash
curl http://localhost:3000/health
# Expected: "healthy"
```

### 2. Test Frontend
```bash
curl http://localhost:3000/
# Expected: HTML dari Next.js
```

### 3. Test Backend API
```bash
curl http://localhost:3000/apicorpu/5.0/
# Expected: JSON response dari Django
```

### 4. Test dari Browser
```
http://localhost:3000           → Frontend UI
http://localhost:3000/apicorpu  → Backend API
```

## Troubleshooting

### Frontend tidak bisa akses backend

**Cek 1: Environment variables**
```bash
docker-compose exec asncorpu-frontend env | grep NEXT_PUBLIC
```

Harus:
```
NEXT_PUBLIC_API_URL=http://localhost:3000/apicorpu/5.0
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

**Cek 2: Nginx routing**
```bash
docker-compose exec asncorpu-nginx cat /etc/nginx/conf.d/default.conf
```

**Cek 3: Network connectivity**
```bash
# Dari nginx ke backend
docker-compose exec asncorpu-nginx wget -O- http://asncorpu_backend_app:8000/health/

# Dari nginx ke frontend
docker-compose exec asncorpu-nginx wget -O- http://asncorpu-frontend-nextjs:3004/
```

### CORS Error

Jika masih ada CORS error, tambahkan di Django settings:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
]
```

### Port 3000 sudah dipakai

Edit `docker-compose.yml`:
```yaml
ports:
  - "3001:80"  # Ganti ke port lain
```

Lalu update environment variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/apicorpu/5.0
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## Production Setup

### Dengan Domain

Edit `docker-compose.yml`:
```yaml
environment:
  - NEXT_PUBLIC_API_URL=https://asncorpu.yourdomain.com/apicorpu/5.0
  - NEXT_PUBLIC_BACKEND_URL=https://asncorpu.yourdomain.com
```

### Dengan Nginx Proxy Manager

1. Nginx Proxy Manager akan forward ke `asncorpu-nginx:80`
2. Tidak perlu expose port 3000 ke host
3. Edit `docker-compose.yml`:
```yaml
# Hapus ports, ganti dengan expose
expose:
  - "80"
```

4. Update environment:
```env
NEXT_PUBLIC_API_URL=https://asncorpu.yourdomain.com/apicorpu/5.0
NEXT_PUBLIC_BACKEND_URL=https://asncorpu.yourdomain.com
```

## Summary

| Akses | URL | Target |
|-------|-----|--------|
| Browser → Frontend | http://localhost:3000/ | Nginx → Frontend:3004 |
| Browser → Backend | http://localhost:3000/apicorpu | Nginx → Backend:8000 |
| Frontend → Backend | Via browser (client-side) | http://localhost:3000/apicorpu |
| Nginx → Frontend | Internal | http://asncorpu-frontend-nextjs:3004 |
| Nginx → Backend | Internal | http://asncorpu_backend_app:8000 |

**Key Point:** 
- Browser selalu akses via `localhost:3000` (Nginx)
- Container internal pakai nama container
- NEXT_PUBLIC_* harus pakai URL yang bisa diakses browser
