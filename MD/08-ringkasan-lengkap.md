# Ringkasan Lengkap — All Features (Updated 2026-06-09)

## 🔧 Fix Terbaru (2026-06-09)

### 1. Login Hybrid asncorpu → esimpeg-python
- **Masalah:** `ESIMPEG_API_URL` tidak di-set di `docker-compose.yml` → default `localhost:8005` (gak bisa konek dari container)
- **Fix:** Tambah `ESIMPEG_API_URL=http://172.16.30.139:8005` ke `docker-compose.yml`
- **Masalah 2:** User sudah ada di DB asncorpu tapi password lokal beda → `_create_user_from_esimpeg()` gagal `duplicate key`
- **Fix 2:** Ganti jadi `_get_or_create_user_from_esimpeg()` — jika user sudah ada, update password + sync data, bukan create baru

### 2. Notifikasi 500 Error
- **Masalah:** Migration `core.0005_add_notification_model` belum dijalankan → tabel `core_notifications` tidak ada
- **Fix:** `python manage.py migrate core 0005`

### 3. Sidebar External Links
- **Fitur baru:** AdminSidebar sekarang ada section **🌐 Website Lain** di bawah menu navigasi
- Links: ESIMPEG, SIMAK, BKPSDM, SK Generator, Survey Pemda
- **No permission granular** — semua user bisa melihat dan klik
- Dibuka di tab baru (`target="_blank"`)

## 1. Quiz & Scoring
- **Objective-only scoring:** essay di-skip dari nilai
- **One-shot:** tidak ada retry, hasil langsung tampil
- **Timer quiz:** `time_limit_minutes`, countdown ⏱ di UI, auto-submit, blokir akses lesson lain selama timer aktif
- **Essay grading:** admin nilai manual + notifikasi ke user
- **Tombol Quiz di course edit:** cek `quiz_id` → kalo ada "Edit Quiz", kalo belum "Buat Quiz"

## 2. Sertifikat
- **Auto-issue** saat progress 100%
- **Nomor custom:** prefix + format (`{PREFIX}-{DATE}-{RANDOM}`)
- **PDF:** ReportLab default / HTML template via WeasyPrint
- **Per-course override:** nama institusi, logo, ttd, background, template, nomor, TTE — semua bisa beda per course
- **TTE:** self-signed certificate (RSA 2048 + passphrase), sign PDF otomatis — global atau per-course

## 3. Routes
| Route | Fungsi |
|-------|--------|
| `/learning/certificates/user` | List sertifikat user |
| `/learning/certificates/template` | All settings: global, template per course, TTE, kelola |

## 4. Notifikasi
- Model `core.Notification`, API `/apicorpu/1.0/notifications/`
- Auto-buat: course completed, essay graded
- NotificationBell polling 30 detik

## 5. Permission
- `PERMISSIONS_SUPERADMIN_OVERRIDE = True`
- Modul `learning` harus ada di DB PermissionModule — kalo gak ada, sidebar Learning tidak muncul

## 6. Server VPS
| Info | Detail |
|------|--------|
| Host | `103.143.152.139` |
| User | `admin` |
| Password | `5406@Admin` |
| Project | `/root/all-projects/projects/asncorpu/` |
| Laptop sync | `rsync` via SSH, `docker compose up -d --build` + migrate + seed |

## 7. Build & Deploy
```bash
# Laptop → VPS sync
rsync -avz --exclude='.next' --exclude='node_modules' --exclude='__pycache__' ... /local/asncorpu/ admin@103.143.152.139:/tmp/asncorpu-sync/
sudo cp -a /tmp/asncorpu-sync/* /root/all-projects/projects/asncorpu/

# Build & restart
sudo docker compose up -d --build asncorpu_backend asncorpu-frontend

# Migrate
python manage.py migrate learning

# Seed
python manage.py seed_learning_courses
python manage.py seed_superadmin_full_access

# Jika permission module learning belum ada → buat manual via shell
```

## 8. Files Penting
```
backend/apps/learning/models.py           — Course, Quiz, Certificate, CertificateSetting
backend/apps/learning/views_api.py        — download, _cert_vals, _sign_pdf_tte, _generate_course_tte
backend/apps/learning/serializers.py      — LessonListSerializer (quiz_id), CertificateSerializer
backend/apps/learning/permissions.py      — LearningPermission
frontend/components/learning/QuizTaker.tsx — Timer + auto-submit
frontend/components/admin/AdminSidebar.tsx — Sidebar permission filter
```

## 9. Migrations
- `0001` through `0012` — 12 migrations total
- Terakhir: `0012_quiz_time_limit_minutes_quizattempt_time_spent`