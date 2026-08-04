# Quiz & Scoring

## Objective-Only Scoring
- **File:** `backend/apps/learning/views_api.py:calculate_score()`
- Essay di-skip dari scoring: `non_essay = answers.exclude(question__question_type='essay')`
- `max_score` hanya dari soal objektif (multiple_choice, true_false)

## One-Shot Quiz (No Retry)
- Hasil langsung tampil setelah submit
- Tidak ada tombol "Coba Lagi" — hanya "Kembali Belajar"
- Sidebar learn page: score badge (contoh: `70%` hijau/merah)
- Learn page: completed quiz → result card + "Lihat Hasil Kuis"

## Timer Quiz
- `Quiz.time_limit_minutes` — 0 = tanpa batas, >0 = batas waktu (menit)
- `QuizAttempt.time_spent` — waktu pengerjaan (detik)
- **Server check:** jika `time_spent > limit * 60` → tolak submission
- **`has_active_timed_quiz()`:** blokir akses lesson lain selama ada quiz timed aktif
- **UI QuizTaker:** countdown ⏱ `MM:SS`, merah berkedip ≤60 detik, auto-submit saat habis
- **Form:** input "Batas Waktu (menit)" di quiz create/edit

## Essay Grading
- `QuizAnswer`: field `is_graded`, `grader_notes`, `graded_at`
- API: `GET /quizzes/{id}/essay_answers/`, `POST /quizzes/{id}/grade_essay/`
- Halaman admin: `/learning/quizzes/[id]/essays/`
- Notifikasi auto-buat saat essay digrading

## Lesson-Type Quiz di Admin
- Dropdown `content_type` include "Kuis"
- Tombol Quiz di course edit: jika `lesson.quiz_id` ada → "Edit Quiz" → `/learning/quizzes/{id}/edit`, jika belum → "Buat Quiz"
- `LessonListSerializer` punya field `quiz_id` (SerializerMethodField)
- Quiz create: 3-level selector cascading, auto-select dari query params