# Extras — Build, Cache, Permission

## Build
- Production standalone: `next build` → `node server.js`
- `NODE_ENV=development` HARUS dihapus dari `.env.local` & docker-compose (kalau ada akan break build)
- Turbopack dipake pas build (bawaan Next.js 16), runtime pake server biasa

## Cache
- Jika route baru tidak terdeteksi: `rm -rf /app/.next/cache` + `docker compose restart asncorpu-frontend`

## Permission
- `PERMISSIONS_SUPERADMIN_OVERRIDE = True` di `core/settings.py`
- Super Admin bypass semua permission check
- `LearningPermission` di `apps/learning/permissions.py` — map action → (module, control, function)

## Key Files
```
backend/apps/learning/models.py              — Course, Quiz, QuizAttempt, Certificate, CertificateSetting
backend/apps/learning/views_api.py           — download, _cert_vals, _render_html_certificate, _sign_pdf_tte
backend/apps/learning/serializers.py         — LessonListSerializer (quiz_id), CertificateSerializer
backend/apps/learning/permissions.py         — LearningPermission PERMISSION_MAP
frontend/components/learning/QuizTaker.tsx   — Timer display + auto-submit
frontend/lib/api/learning.ts                 — All API functions
```