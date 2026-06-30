# ASNCORPU LMS — Overview

## Project
LMS Corporate University untuk ASN (Aparatur Sipil Negara).
- **Backend:** Django 5.2.7 + DRF 3.16.1 + PostgreSQL + Redis
- **Frontend:** Next.js 16.2.4 (production standalone, not Turbopack dev)
- **Container:** Docker Compose `asncorpu` project (nginx port 3000, frontend internal 3004)
- **Custom User Model:** tanpa `is_staff`/`is_superuser` — auth via `check_permission()` atau `is_superadmin()`

## Routes
| Route | Fungsi |
|-------|--------|
| `/learning/certificates/user` | List sertifikat user (group by user, search, download PDF) |
| `/learning/certificates/template` | All-in-one: Pengaturan, Template, TTE, Kelola |

## Dependencies Baru
```
weasyprint==69.0
cryptography==48.0.0
pyHanko==0.35.1
```

## Migrations
`0001` through `0012` — 12 migration files total.

## Commands
```bash
docker compose restart asncorpu_backend          # Backend restart
docker compose restart asncorpu-frontend         # Frontend restart
docker compose up -d --build asncorpu-frontend   # Build ulang + restart
docker compose exec asncorpu_backend python manage.py seed_learning_courses
docker compose exec asncorpu_backend python manage.py seed_learning_courses --clear
```