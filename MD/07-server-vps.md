# Server VPS ASNCORPU

## Koneksi
- **Host:** 103.143.152.139
- **User:** admin
- **Password:** 5406@Admin
- **Port:** 22 (default SSH)

## Docker Containers (2026-06-12)
| Container | Port | Status |
|-----------|------|--------|
| asncorpu_backend_app | 8000/tcp | Up (healthy) |
| asncorpu-nginx | 3000→80 | Up (healthy) |
| asncorpu-frontend-nextjs | 3004/tcp | Up (healthy) |
| esimpeg-python | 8005→8000 | Up (healthy) |
| nginx-proxy-manager | 80,81,443 | Up |
| sk-generator-app | 3010→3000 | Up (healthy) |
| simak-app | 3002→3000 | Up |
| bkpsdm2-app | 3001→3000 | Up |
| survey-pemda-python | 8006→8000 | Up (healthy) |
| postgres-main | 5432 | Up |
| mysql-main | 3306 | Up |
| redis-main | 6379 | Up |

## Sync ke Laptop (2026-06-10)

> **PENTING:** Kode yang BENAR-BENAR running di VPS ada di `/tmp/asncorpu-sync`
> (compose: `docker-compose.prod.yml`), BUKAN `/root/all-projects/projects/asncorpu`
> (kode lama, beda banyak: apps news, learn, courses, certificates, dll).

```bash
# Project code (dari /tmp/asncorpu-sync = kode running!)
ssh admin@103.143.152.139 "echo '5406@Admin' | sudo -S tar czf /tmp/asncorpu_running_code.tar.gz --exclude=node_modules --exclude=.next --exclude=__pycache__ --exclude=venv -C /tmp asncorpu-sync"
scp admin@103.143.152.139:/tmp/asncorpu_running_code.tar.gz ./

# Database dump
ssh admin@103.143.152.139 "echo '5406@Admin' | sudo -S docker exec postgres-main pg_dump -U asncorpu_user -d asncorpu_backend_db --no-owner --no-acl | gzip > /tmp/asncorpu_db_fresh.sql.gz"
scp admin@103.143.152.139:/tmp/asncorpu_db_fresh.sql.gz ./

# Media files (volume project /tmp/asncorpu-sync -> asncorpu-sync_media_volume)
ssh admin@103.143.152.139 "echo '5406@Admin' | sudo -S tar czf /tmp/asncorpu_media_fresh.tar.gz -C /var/lib/docker/volumes/asncorpu-sync_media_volume/_data ."
scp admin@103.143.152.139:/tmp/asncorpu_media_fresh.tar.gz ./
```

## Setup Lokal di Laptop (2026-06-10) - BERHASIL
- Kode running VPS di-extract ke: `projects/asncorpu/` (kode lama di-backup ke `projects/asncorpu_OLD_before_vps_sync_20260610/`)
- File sync mentah: `projects/asncorpu_vps_sync_20260610/`
- Compose lokal: `projects/asncorpu/docker-compose.local.yml` (copy prod, beda: ESIMPEG_API_URL=http://esimpeg_python_app:8000, NEXT_PUBLIC_*=localhost:3000)
- Postgres lokal: container `postgres-shared` (alias `postgres-main` di shared-network), superuser `shared_admin`
- Redis lokal: `redis-main` di-connect manual ke `shared-network` (`docker network connect shared-network redis-main`) - ulangi jika container redis dibuat ulang!
- esimpeg lokal juga di-connect ke shared-network
- DB restore: drop+create `asncorpu_backend_db` owner `asncorpu_user`, lalu restore dump
- Media restore ke volume `asncorpu_media_volume`
- Setelah up: `docker exec asncorpu_backend_app python manage.py collectstatic --noinput`
- Jalankan: `docker compose -f docker-compose.local.yml up -d` (dari `projects/asncorpu/`)
- Akses: http://localhost:3000 (verified: respons identik dengan VPS, health 200, media 200)

## ESIMPEG-Python di VPS (2026-06-10)

> ASNCORPU backend tergantung esimpeg untuk data pegawai:
> `ESIMPEG_API_URL=http://172.16.30.139:8005` (di VPS) / `http://esimpeg_python_app:8000` (lokal laptop).

### Container `esimpeg-python`
- **Image:** `esimpeg-python:latest` (build manual 2026-06-08, BUKAN via docker compose — tidak ada compose label)
- **Port:** 8005 → 8000 (akses: `http://103.143.152.139:8005`)
- **Command:** `/app/entrypoint.sh gunicorn esimpeg_core.wsgi:application --config gunicorn.conf.py`
- **Restart:** unless-stopped
- **Networks:** bridge, proxy-network, shared-network
- **Healthcheck:** `curl -f http://localhost:8000/health/`

### Environment penting
| Variable | Value |
|----------|-------|
| DB_HOST / DB_PORT | mysql-main / 3306 (pakai **MySQL**, bukan postgres!) |
| DB_NAME | esimpeg_python_db |
| DB_USER / DB_PASSWORD | root / `5406@Pessel!23#` |
| REDIS_HOST / REDIS_DB | redis-main / **3** (asncorpu pakai DB 4) |
| REDIS_PASSWORD | `5406@Pessel!23#` |
| DEBUG / SECURE_SSL_REDIRECT | 0 / 0 |
| DJANGO_SETTINGS_MODULE | esimpeg_core.settings |
| GUNICORN_WORKERS / TIMEOUT | 4 / 300 |

### Volumes
- `esimpeg_python_static` → /app/staticfiles
- `esimpeg_python_media` → /app/media
- `esimpeg_python_logs` → /app/logs

### Source code di VPS
- **Source utama:** `/root/all-projects/projects/ESIMPEG-Python/` (full Django project: esimpeg_core, apps, Dockerfile, entrypoint.sh, docker-compose.{dev,prod}.yml)
- `/root/all-projects/projects/esimpeg-python/` = folder hampir kosong, abaikan
- `/tmp/esimpeg-rsync/` = sisa rsync (cuma templates), abaikan
- Ada setup cron SIASN ETL: lihat `SETUP_CRON_JOB.md` & `SIASN_ETL_SETUP_COMPLETE.md` di folder project, ref `/tmp/esimpeg_siasn_cron.txt`

### Database MySQL di VPS (mysql-main)
- **Root password SEBENARNYA:** `5406@Pessel!23#` (env `MYSQL_ROOT_PASSWORD=5406@Pesselclear#` di container = STALE, hanya dipakai saat init pertama)
- Databases: `esimpeg_python_db`, `esim_pegawai`, `20260115_esimpeg`, `bkpsdm_prod`, `bkpsdm_dev`, `bkpsdm2_prod`, `nginx_proxy_manager`

### Sync esimpeg ke laptop
```bash
# Code
ssh admin@103.143.152.139 "echo '5406@Admin' | sudo -S tar czf /tmp/esimpeg_code.tar.gz --exclude=node_modules --exclude=__pycache__ --exclude=staticfiles --exclude=logs -C /root/all-projects/projects ESIMPEG-Python"
scp admin@103.143.152.139:/tmp/esimpeg_code.tar.gz ./

# Database (MySQL)
ssh admin@103.143.152.139 "echo '5406@Admin' | sudo -S docker exec mysql-main sh -c 'MYSQL_PWD=5406@Pessel\!23# mysqldump -uroot esimpeg_python_db' | gzip > /tmp/esimpeg_db.sql.gz"
scp admin@103.143.152.139:/tmp/esimpeg_db.sql.gz ./

# Media
ssh admin@103.143.152.139 "echo '5406@Admin' | sudo -S tar czf /tmp/esimpeg_media.tar.gz -C /var/lib/docker/volumes/esimpeg_python_media/_data ."
scp admin@103.143.152.139:/tmp/esimpeg_media.tar.gz ./
```

### ESIMPEG lokal di laptop (kondisi 2026-06-10)
- `esimpeg_python_app` → port 8005 (dipakai asncorpu lokal via shared-network)
- `esimpeg_python_backup_app` → port 8015
- Source lokal: `projects/ESIMPEG-Python/`
- `esimpeg_python_app` sudah di-connect ke `shared-network` (manual, ulangi jika container di-recreate)

## KMS vs LMS (2026-06-12)
- **KMS** (Knowledge Management System): `/kms` — kategori KOMPETENSI UMUM (id=3) & KOMPETENSI TEKNIS (id=7)
- **LMS** (Learning Management System): `/courses`, `/learning` — kategori Materi LMS (id=38)
- Filter `/kms` hanya menampilkan kategori KMS, kategori "Materi LMS" (id=38) tidak muncul
- Semua artikel (58) ada di **Materi LMS**, bukan di kategori KMS
- Untuk isi KMS, perlu bikin artikel baru di kategori KMS

## Notes
- User `admin` perlu `sudo` untuk akses Docker
- Password sudo = password SSH = `5406@Admin`
- Local backup: `/home/prakom/project-docker/all-projects-darireal/projects/asncorpu_local_backup_20260610/`
