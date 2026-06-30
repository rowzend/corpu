# Docker Compose Setup, Routes & Debug

## Latar Belakang

Proyek ASNCORPU memiliki banyak file `docker-compose` yang membingungkan. Dokumentasi ini mencatat semua temuan, masalah, dan solusi.

---

## 1. Daftar Semua Docker Compose File

### Di `projects/asncorpu/`

| File | Dockerfile | Target | Mode | Volume Mount | Hot Reload |
|------|-----------|--------|------|-------------|------------|
| `docker-compose.yml` | `Dockerfile` | `dev` | Development ✅ | ✅ `./frontend:/app` | ✅ Next.js dev |
| `docker-compose.dev.yml` | `Dockerfile` | `dev` | Development ✅ | ✅ `./frontend:/app` | ✅ Webpack + polling |
| `docker-compose.dev2.yml` | `Dockerfile.prod` | - | Production ❌ | ❌ (read-only) | ❌ rebuild |
| `docker-compose.local.yml` | `Dockerfile.prod` | - | Production ❌ | ❌ | ❌ rebuild |
| `docker-compose.prod.yml` | `Dockerfile.prod` | - | Production ❌ | ❌ | ❌ rebuild |

### Perbedaan Dockerfile

**`Dockerfile`** (multi-stage):
- `deps` — install npm packages
- `builder` — `npm run build` (production build)
- `runner` — production: `node server.js`
- `dev` — development: `npm run dev`

**`Dockerfile.prod`** (multi-stage):
- `builder` — `npm ci` + `npm run build`
- `runner` — production: `node server.js`

### Kesimpulan Penting

| File | Efek |
|------|------|
| `docker-compose.yml` | Hot reload, polling aktif, mount `./frontend:/app` |
| `docker-compose.dev.yml` | Sama + Webpack (bukan Turbopack) + `CHOKIDAR_USEPOLLING=true` |
| `docker-compose.local.yml` | **TIDAK** ada mount, setiap perubahan harus rebuild image |

---

## 2. Route Knowledge Categories & Tags

### Masalah Awal

User ingin:
- `/knowledge/categories` → `/manajemen-data/kategori-learning`
- `/knowledge/tags` → `/manajemen-data/tags`
- Hapus route `/knowledge/categories/` dan `/knowledge/tags/`

### File yang Diubah

**Route dihapus:**
```
frontend/app/(admin)/knowledge/categories/
├── [id]/page.tsx
├── create/page.tsx
└── page.tsx

frontend/app/(admin)/knowledge/tags/
├── [id]/page.tsx
├── create/page.tsx
└── page.tsx
```

**Tombol di knowledge page dihapus:**
`frontend/app/(admin)/knowledge/page.tsx` — hapus 2 button Kategori & Tags.

### Kenapa Perubahan Tidak Muncul?

1. **Container jalan dengan `docker-compose.local.yml`** — menggunakan `Dockerfile.prod`
2. **`Dockerfile.prod` tidak punya volume mount** — source code di-*copy* saat build, bukan di-*mount*
3. **Perubahan file di host tidak terlihat di container** — beda dengan dev mode yang pakai bind mount
4. **Solusi: ganti ke `docker-compose.yml`** — pakai `target: dev` + volume `./frontend:/app`

---

## 3. VPS vs Local

### Informasi Server

| Server | IP | User | Password |
|--------|----|------|----------|
| VPS Production | `103.143.152.139` | `admin` | `5406@Admin` |
| Local laptop | `archprakom` | `prakom` | - |

### VPS

- **Code running:** `/tmp/asncorpu-sync/`
- **Compose:** `docker-compose.prod.yml`
- **Build:** `Dockerfile.prod` (production, tanpa mount)
- **Container:** `asncorpu-frontend-nextjs` (Up 27h+)

### Local laptop

- **Code:** `projects/asncorpu/` (sync dari VPS 2026-06-10)
- **Harusnya pakai:** `docker-compose.yml` (dev mode)
- **Salah jalan:** `docker-compose.local.yml` (production mode)

---

## 4. Cara SSH ke VPS

```bash
sshpass -p '5406@Admin' ssh -o StrictHostKeyChecking=no admin@103.143.152.139
# lalu sudo untuk docker:
echo '5406@Admin' | sudo -S docker ps
```

### Sync Code VPS → Local

```bash
# Buat tar di VPS
sshpass -p '5406@Admin' ssh admin@103.143.152.139 \
  "echo '5406@Admin' | sudo -S tar czf /tmp/asncorpu-code.tar.gz \
  --exclude=node_modules --exclude=.next --exclude=__pycache__ -C /tmp asncorpu-sync"

# Download ke local
sshpass -p '5406@Admin' scp admin@103.143.152.139:/tmp/asncorpu-code.tar.gz /tmp/

# Extract
tar xzf /tmp/asncorpu-code.tar.gz -C /tmp/
cp -a /tmp/asncorpu-sync/* /path/to/projects/asncorpu/
```

---

## 5. Cara Menjalankan (Local)

### Mode Development (HOT RELOAD) — ✅ RECOMMENDED

```bash
cd /home/prakom/project-docker/all-projects-darireal/projects/asncorpu
docker compose -f docker-compose.yml up -d --build
```

Ciri:
- `npm run dev` → perubahan file langsung ke-reflect
- `WATCHPACK_POLLING=true` → polling untuk Docker
- Bind mount: `./frontend:/app`

### Mode Development Webpack (lebih stabil)

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

Perbedaan: pake Webpack (bukan Turbopack), `CHOKIDAR_USEPOLLING=true`.

### Mode Production (perlu rebuild setiap perubahan)

```bash
docker compose -f docker-compose.local.yml up -d --build
```

⚠ **TIDAK** hot reload — setiap ganti file harus rebuild image.

---

## 6. Debug Container

### Cek Mode (dev vs production)

```bash
docker inspect asncorpu-frontend-nextjs --format 'Cmd: {{.Config.Cmd}}'
# Harusnya: [npm run dev] (dev) atau [node server.js] (production)
```

### Cek Volume Mount

```bash
docker inspect asncorpu-frontend-nextjs --format '{{range .Mounts}}{{.Type}} {{.Destination}}{{"\n"}}{{end}}'
# Harusnya ada: bind /app (dev) atau tidak ada (production)
```

### Cek Route di Container

```bash
docker exec asncorpu-frontend-nextjs ls /app/app/\(admin\)/knowledge/
```

### Cek Log Container

```bash
docker logs asncorpu-frontend-nextjs --tail 20
```

---

## 7. Backup

| File | Deskripsi | Lokasi |
|------|-----------|--------|
| Local backup 2026-06-11 | Code lokal sebelum dihapus | `/tmp/asncorpu-local-backup-20260611-142031.tar.gz` |
| VPS code 2026-06-11 | Code fresh dari VPS | `/tmp/asncorpu-vps-code.tar.gz` |

---

## 8. Ringkasan

1. **Gunakan `docker-compose.yml`** untuk development lokal — hot reload aktif
2. **Jangan gunakan `docker-compose.local.yml`** — itu production mode, tidak ada hot reload
3. **`docker-compose.dev.yml`** alternatif lebih stabil (Webpack instead of Turbopack)
4. **VPS** pakai `docker-compose.prod.yml` — wajar tanpa mount (production)
5. Kalau mau hapus route `/knowledge/categories` dan `/knowledge/tags`:
   - Hapus folder `categories/` dan `tags/` di `frontend/app/(admin)/knowledge/`
   - Hapus button di `page.tsx`
   - Kalau dev mode: langsung ke-reflect
   - Kalau production: rebuild container
