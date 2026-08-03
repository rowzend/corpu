# Permission Granular & Duration Minutes Fix

## Perubahan 1: Permission Granular (Semua CRUD Learning)
**File:** `backend/apps/learning/permissions.py`

### Sebelum
- Ada **bypass CRUD** di `has_permission()`: setiap user login bisa create/edit/delete course, lesson, quiz tanpa granular permission
- `has_object_permission()` pakai `is_superuser or is_staff` → hanya hardcoded admin yang bisa edit objek siapapun

### Sesudah
- **`has_permission()`** — bypass dihapus. Semua action dicek via `check_permission()` sesuai PERMISSION_MAP:
  - `course > create` → butuh `learning > courses > create`
  - `course > edit` → butuh `learning > courses > edit`
  - `course > delete` → butuh `learning > courses > delete`
  - Sama untuk `module`, `lesson`, `quiz`, `enrollment`, dll
- **`has_object_permission()`** — `is_staff`/`is_superuser` diganti `check_permission()` sesuai action granular + ownership (instructor/user)
- **`views_api.py`** — semua `is_staff` di `take()`, `essay_answers()`, `grade_essay()` diganti `check_permission()`

## Perubahan 2: Durasi Course dari Jam ke Menit
**File berubah:**
- `backend/apps/learning/models.py` — field `duration_hours` → `duration_minutes`
- `backend/apps/learning/migrations/0014_remove_course_duration_hours_course_duration_minutes.py` (auto)
- `backend/apps/learning/serializers.py` — field reference
- `backend/apps/learning/admin.py` — field reference
- `backend/apps/learning/views_api.py` — certificate display
- `backend/apps/learning/management/commands/seed_learning_courses.py` — course seed ×60, lesson tetap
- `frontend/lib/api/learning.ts` — type `duration_minutes`
- `frontend/app/(admin)/learning/courses/page.tsx` — list display
- `frontend/app/(admin)/learning/courses/create/page.tsx` — form + display
- `frontend/app/(admin)/learning/courses/[slug]/page.tsx` — edit form + display
- `frontend/app/(admin)/learning/modules/page.tsx` — list display
- `frontend/app/(admin)/courses/page.tsx` — display
- `frontend/app/(admin)/courses/[slug]/page.tsx` — detail display
- `frontend/app/(admin)/courses/browse/page.tsx` — browse display
- `frontend/components/learning/CourseCard.tsx` — card display

## Testing
1. Login sebagai `200112012025062011` (role Super Admin) → lihat draft & archived di `/learning/courses`
2. Login sebagai user tanpa role → hanya lihat published
3. Input durasi di create/edit dalam menit, tampil sebagai "menit"
