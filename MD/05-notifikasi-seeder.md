# Notifikasi & Seeder

## Notifikasi
- Model `core.models.Notification`
- API: `GET/POST /apicorpu/1.0/notifications/`
- Auto-buat saat: course completed, essay graded
- `NotificationBell` component (polling 30 detik) di Navbar + AdminHeader

## Seeder
- 8 courses, masing-masing 3 module (3-5 lesson: article/video/link/document/quiz)
- Quiz dengan multiple_choice, true_false, essay
- Semua quiz punya `time_limit_minutes` (10-20 menit)
- `--clear` flag: hapus data diurutkan FK
- Idempoten: pake `update_or_create`