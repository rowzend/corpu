# ASNCORPU - Fullstack Application

Aplikasi fullstack ASNCORPU dengan Next.js frontend dan Django backend, dikelola dalam satu docker-compose dengan Nginx sebagai reverse proxy.

## 📁 Struktur Folder

```
asncorpu/
├── docker-compose.yml      # Konfigurasi Docker gabungan
├── .env                    # Environment variables
├── README.md              # Dokumentasi ini
├── backend/               # Django/Python backend
│   ├── nginx.conf        # Konfigurasi Nginx
│   └── ...
└── frontend/             # Next.js frontend
    └── ...
```

## 🚀 Quick Start

### 1. Jalankan Aplikasi

```bash
cd /home/dev/Documents/vps-settings/all-projects/projects/asncorpu
docker-compose up -d
```

### 2. Akses Aplikasi

- **Frontend & Backend**: http://localhost:3000
- **API Backend**: http://localhost:3000/apicorpu
- **Health Check**: http://localhost:3000/health

### 3. Stop Aplikasi

```bash
docker-compose down
```

## 🔧 Konfigurasi

### Port

- **Port 3000**: Akses utama (Nginx reverse proxy)
  - `/` → Frontend (Next.js)
  - `/apicorpu` → Backend API (Django)
  - `/static` → Static files
  - `/media` → Media files

### Environment Variables

Edit file `.env` untuk mengubah konfigurasi:

```env
ASNCORPU_PORT=3000
ASNCORPU_DOMAIN=asncorpu.local
DB_NAME=asncorpu_backend_db
DB_USER=asncorpu_user
DB_PASSWORD=asncorpu_secure_password_2026
REDIS_DB=4
```

## 📊 Services

### 1. Backend (Django)
- Container: `asncorpu_backend_app`
- Internal Port: 8000
- Database: PostgreSQL (postgres-main)
- Cache: Redis (redis-main)

### 2. Frontend (Next.js)
- Container: `asncorpu-frontend-nextjs`
- Internal Port: 3004
- Mode: Development (hot reload)

### 3. Nginx Reverse Proxy
- Container: `asncorpu-nginx`
- External Port: 3000
- Routing:
  - `/` → Frontend
  - `/apicorpu` → Backend API

## 🛠️ Development

### Logs

```bash
# Semua services
docker-compose logs -f

# Backend saja
docker-compose logs -f asncorpu_backend

# Frontend saja
docker-compose logs -f asncorpu-frontend

# Nginx saja
docker-compose logs -f asncorpu-nginx
```

### Restart Service

```bash
# Restart semua
docker-compose restart

# Restart backend
docker-compose restart asncorpu_backend

# Restart frontend
docker-compose restart asncorpu-frontend
```

### Rebuild

```bash
# Rebuild semua
docker-compose up -d --build

# Rebuild backend saja
docker-compose up -d --build asncorpu_backend

# Rebuild frontend saja
docker-compose up -d --build asncorpu-frontend
```

## 🌐 Setup Domain (Optional)

### Local Development

Tambahkan ke `/etc/hosts`:

```
127.0.0.1 asncorpu.local
```

Akses via: http://asncorpu.local:3000

### Production dengan Nginx Proxy Manager

1. Buka Nginx Proxy Manager: http://localhost:81
2. Tambah Proxy Host:
   - Domain: `asncorpu.yourdomain.com`
   - Forward to: `asncorpu-nginx:80`
3. Enable SSL jika perlu

## 🔍 Troubleshooting

### Container tidak bisa connect

```bash
# Cek network
docker network ls
docker network inspect shared-network

# Pastikan semua container di network yang sama
docker-compose ps
```

### Frontend tidak bisa akses backend

Cek environment variables di frontend:
```bash
docker-compose exec asncorpu-frontend env | grep NEXT_PUBLIC
```

### Nginx error

```bash
# Cek konfigurasi nginx
docker-compose exec asncorpu-nginx nginx -t

# Reload nginx
docker-compose exec asncorpu-nginx nginx -s reload
```

## 📝 Notes

- Frontend menggunakan hot reload untuk development
- Backend menggunakan Gunicorn dengan 4 workers
- Nginx menangani routing dan load balancing
- Semua data persistent disimpan di volumes
- Database dan Redis menggunakan infrastruktur shared (postgres-main, redis-main)
