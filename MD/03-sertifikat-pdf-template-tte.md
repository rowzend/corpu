# Sertifikat — PDF, Settings, Template, TTE

## Auto-Issue
- **File:** `backend/apps/learning/models.py:Enrollment.update_progress()`
- **Trigger:** progress = 100% → `Certificate.objects.get_or_create(enrollment=self, ...)`

## Nomor Sertifikat
- `cert_number_format` pake variable: `{PREFIX}`, `{DATE}`, `{RANDOM}`, `{YEAR}`, `{MONTH}`, `{DAY}`, `{COURSE_ID}`, `{USER_ID}`
- Prioritas: **Course > Global > Default** (`{PREFIX}-{DATE}-{RANDOM}`)

## PDF Generation
- **Default:** ReportLab — border, nama institusi, nama peserta, judul kursus, nomor, ttd, logo
- **HTML Template:** upload `.html` per course → render via **WeasyPrint**
  - Variable: `{{ institution_name }}`, `{{ user_name }}`, `{{ course_title }}`, `{{ certificate_number }}`, `{{ issued_at }}`, `{{ logo }}` (base64), `{{ signature_image }}` (base64), `{{ signature_name }}`, `{{ signature_title }}`, `{{ course_hours }}`, `{{ show_course_hours }}`
  - Fallback ke ReportLab jika tidak ada template

## Settings — Global + Per-Course Override
Helper `_cert_vals()` — logic: course value > global default

| Setting | Global | Per-Course | Priority |
|---------|--------|------------|----------|
| institution_name | ✅ text | `cert_institution_name` | Course > Global |
| logo | ✅ image | `cert_logo` | Course > Global |
| signature_name | ✅ text | `cert_signature_name` | Course > Global |
| signature_title | ✅ text | `cert_signature_title` | Course > Global |
| signature_image | ✅ image | `cert_signature_image` | Course > Global |
| background | ✅ image | `certificate_background` | Course > Global |
| template HTML | ❌ | `certificate_template` file | Course only |
| show_course_hours | ✅ checkbox | `cert_show_course_hours` null=global | Course > Global |
| number_prefix | ✅ | `cert_number_prefix` | Course > Global |
| number_format | ✅ | `cert_number_format` | Course > Global |
| tte_enabled | ✅ | `cert_tte_enabled` | Course > Global |

## TTE (Tanda Tangan Elektronik)
- **Lib:** `cryptography` + `pyHanko`
- **Generate global:** `POST /learning/certificate-settings/` action=`generate_tte`
- **Generate per-course:** `POST /learning/certificate-settings/` action=`generate_course_tte`
- RSA 2048, self-signed X.509 (5 tahun), private key PKCS8 + passphrase
- Sign: `_sign_pdf_tte()` — prioritas **Course TTE > Global TTE**

## Manage Sertifikat
- `Certificate.is_active` — toggle aktif/nonaktif
- `CertificateViewSet` — ModelViewSet (create, update, delete, toggle_active)
- `PERMISSIONS_SUPERADMIN_OVERRIDE = True`