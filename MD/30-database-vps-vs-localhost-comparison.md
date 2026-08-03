# 🔍 Perbandingan Database VPS vs Localhost - ASNCORPU

**Tanggal Pemeriksaan:** 12 Juni 2026  
**VPS:** 103.143.152.139  
**Database:** PostgreSQL (`asncorpu_backend_db`)

---

## 📊 Ringkasan Temuan Utama

### ⚠️ **PERBEDAAN KRITIS DITEMUKAN!**

| Aspek | VPS (Production) | Localhost (Development) |
|-------|------------------|-------------------------|
| **Migration Learning** | 0012 (terakhir) | **0013** ✅ (ada category_id) |
| **Kolom `category_id`** | ❌ **TIDAK ADA** | ✅ **ADA** |
| **Learning Courses** | 15 courses | 10 courses |
| **Learning Lessons** | 76 lessons | 65 lessons |
| **Knowledge Articles** | **0 artikel** ❌ | **58 artikel** ✅ |
| **Knowledge Categories** | 29 categories | 27 categories |

---

## 🗂️ Detail Struktur Tabel

### **1. Tabel `learning_courses`**

#### VPS (Production):
```
❌ TIDAK ADA kolom category_id
✅ Total kolom: 33 kolom
✅ Status: 15 courses (6 published, sisanya draft/archived)
```

**Migration terakhir VPS:**
```
0012_quiz_time_limit_minutes_quizattempt_time_spent
```

#### Localhost (Development):
```
✅ ADA kolom category_id (bigint, nullable)
✅ Total kolom: 34 kolom
✅ Status: 10 courses
✅ Migration tambahan:
   - 0013_add_course_category
   - 0014_course_tags_shared
   - 0015_fix_course_tags_m2m
```

---

## 📈 Perbandingan Data

### **Learning (LMS)**

| Tabel | VPS | Localhost | Selisih |
|-------|-----|-----------|---------|
| learning_courses | 15 | 10 | +5 di VPS |
| learning_modules | 28 | 25 | +3 di VPS |
| learning_lessons | 76 | 65 | +11 di VPS |
| learning_enrollments | 7 | ? | - |
| learning_quizzes | 12 | ? | - |
| learning_quiz_questions | 51 | ? | - |
| learning_certificates | 4 | ? | - |
| learning_course_ratings | 0 | ? | - |

**Kesimpulan:** VPS memiliki **lebih banyak data learning** (production data).

---

### **Knowledge (KMS)**

| Tabel | VPS | Localhost | Selisih |
|-------|-----|-----------|---------|
| knowledge_categories | 29 | 27 | +2 di VPS |
| knowledge_tags | 1 | ? | - |
| knowledge_articles | **0** ❌ | **58** ✅ | +58 di Localhost! |
| knowledge_article_views | 0 | ? | - |
| knowledge_article_likes | 0 | ? | - |
| knowledge_comments | 0 | ? | - |
| knowledge_ratings | 0 | ? | - |

**Kesimpulan:** VPS **TIDAK ADA artikel knowledge sama sekali!** Semua 58 artikel ada di localhost.

---

## 🏗️ Struktur Database Lengkap VPS

Total tabel: **58 tabel**

### Core Tables:
- ✅ users, auth_group, auth_permission
- ✅ django_migrations, django_session, django_admin_log
- ✅ api_documentation, app_settings
- ✅ core_notifications

### Learning (LMS) - 13 tabel:
- ✅ learning_courses (**TANPA category_id!**)
- ✅ learning_modules
- ✅ learning_lessons
- ✅ learning_enrollments
- ✅ learning_lesson_progress
- ✅ learning_quizzes
- ✅ learning_quiz_questions
- ✅ learning_quiz_choices
- ✅ learning_quiz_attempts
- ✅ learning_quiz_answers
- ✅ learning_certificates
- ✅ learning_certificate_settings
- ✅ learning_course_ratings
- ✅ learning_course_comments
- ✅ learning_course_likes
- ✅ learning_comment_likes

### Knowledge (KMS) - 9 tabel:
- ✅ knowledge_categories (29 categories)
- ✅ knowledge_tags (1 tag)
- ✅ knowledge_articles (**0 artikel!**)
- ✅ knowledge_article_tags
- ✅ knowledge_approval_history
- ✅ knowledge_article_views
- ✅ knowledge_article_likes
- ✅ knowledge_comments
- ✅ knowledge_comment_likes
- ✅ knowledge_ratings

### Permission System:
- ✅ permission_modules
- ✅ permission_functions
- ✅ permission_controls
- ✅ permission_rules
- ✅ role_rules

### Other Apps:
- ✅ hcdp_programs (HCDP)
- ✅ news (Berita)
- ✅ profile_brands, profile_personalia, profile_sections
- ✅ menu_categories, menu_items
- ✅ combo_box_configs
- ✅ webhook_logs, webhook_registrations
- ✅ password_change_events
- ✅ user_table_selections
- ✅ ms_log_api, ms_log_data

---

## 🚨 Masalah yang Ditemukan

### 1. **Migration 0013 belum dijalankan di VPS**
- VPS masih di migration `0012_quiz_time_limit_minutes`
- Localhost sudah di migration `0013_add_course_category`
- **Dampak:** Kolom `category_id` tidak ada di VPS!

### 2. **Knowledge Articles kosong di VPS**
- VPS: 0 artikel
- Localhost: 58 artikel
- **Dampak:** Fitur Knowledge Base tidak berfungsi di production!

### 3. **Data tidak sinkron**
- Course di VPS lebih banyak (15 vs 10)
- Artikel di localhost lebih banyak (58 vs 0)
- **Dampak:** Development dan production berbeda signifikan!

---

## 💡 Rekomendasi

### **URGENT - Prioritas Tinggi:**

1. **Jalankan migration 0013 di VPS:**
   ```bash
   ssh admin@103.143.152.139
   cd /tmp/asncorpu-sync
   sudo docker exec asncorpu_backend_app python manage.py migrate learning 0013_add_course_category
   ```

2. **Sync artikel dari localhost ke VPS:**
   ```bash
   # Export dari localhost
   docker exec postgres-shared pg_dump -U asncorpu_user -d asncorpu_backend_db \
     -t knowledge_articles -t knowledge_article_tags \
     --data-only --no-owner --no-acl > knowledge_articles_export.sql
   
   # Import ke VPS
   scp knowledge_articles_export.sql admin@103.143.152.139:/tmp/
   ssh admin@103.143.152.139 "sudo docker exec -i postgres-main psql -U asncorpu_user -d asncorpu_backend_db < /tmp/knowledge_articles_export.sql"
   ```

3. **Sync course data dari VPS ke localhost (opsional):**
   ```bash
   # Agar development sama dengan production
   ssh admin@103.143.152.139 "sudo docker exec postgres-main pg_dump -U asncorpu_user -d asncorpu_backend_db -t learning_courses -t learning_modules -t learning_lessons --data-only" > vps_learning_data.sql
   ```

### **Monitoring - Prioritas Sedang:**

4. **Setup cronjob untuk backup database VPS:**
   ```bash
   # Setiap hari jam 2 pagi
   0 2 * * * /usr/bin/docker exec postgres-main pg_dump -U asncorpu_user asncorpu_backend_db | gzip > /backup/asncorpu_$(date +\%Y\%m\%d).sql.gz
   ```

5. **Buat script sync otomatis antara VPS dan localhost**

---

## 📋 Contoh Data VPS

### Courses yang ada di VPS:
1. Integritas dan Anti Korupsi (published, 2 enrollments, 8 lessons)
2. Dasar-Dasar Administrasi Perkantoran (published, 10 lessons)
3. Manajemen Kinerja ASN (published, 8 lessons)
4. Teknologi Informasi untuk ASN (published, 8 lessons)
5. ASN Maju (Smarter) (draft, 0 lessons)
6. ... (10 courses lainnya)

### Kategori Knowledge yang ada:
- KOMPETENSI UMUM (parent)
  - ASN Tumbuh (Bigger)
  - ASN Berkelanjutan (Better)
  - ASN Maju (Smarter)
- KOMPETENSI TEKNIS (parent)
  - Pemerintahan dan Kesejahteraan Rakyat
  - Perekonomian dan Pembangunan
  - Administrasi Umum
  - Artificial Intelligence (AI) / Literasi Digital
  - Pengambilan Keputusan Berbasis Data

---

## 🔄 Status Sinkronisasi

| Item | VPS → Localhost | Localhost → VPS |
|------|-----------------|-----------------|
| Database Schema | ⚠️ **Perlu Update** | ✅ OK |
| Learning Data | ✅ Bisa sync | ⚠️ Akan overwrite |
| Knowledge Data | ❌ **Kosong** | ⚠️ **HARUS SYNC** |
| Migration | ❌ **Tertinggal** | ✅ Up to date |

---

## 📝 Catatan

- File migration `0013_add_course_category.py` sudah ada di localhost
- Perlu di-copy ke VPS dan dijalankan
- Backup database VPS sebelum menjalankan migration baru!
- Koordinasikan dengan tim sebelum sync data ke production

---

**Laporan dibuat oleh:** Kiro AI Assistant  
**Metode:** SSH langsung ke VPS + Query PostgreSQL  
**Waktu pemeriksaan:** ~5 menit
