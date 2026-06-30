# Penerapan renderHtml pada Semua Halaman Public & Admin

## Perubahan

Menambahkan `import { renderHtml } from '@/lib/utils'` dan mengganti semua display user-entered text (title, description, name, content, excerpt, question_text, choice_text, essay_answer, grader_notes, user_name, app_name, app_description, category) dengan `dangerouslySetInnerHTML={renderHtml(...)}` agar tag `<i>teks asing</i>` tampil miring.

---

## Daftar File (65+ file)

### Courses & Learning (Sesi 1 & 3 — 22 file)

| File | Display Fields |
|------|---------------|
| `courses/[slug]/page.tsx` | `course.title`, `course.short_description`, `course.description`, `mod.title`, `mod.description`, `rating.comment`, `rating.user_name`, `comment.user_name`, `comment.comment` |
| `courses/[slug]/learn/page.tsx` | `course.title`, `currentLesson.title`, `lesson.title` (sidebar), `group.module_title`, `currentLesson.module_title` |
| `courses/[slug]/lessons/[lessonId]/quiz/page.tsx` | `quiz.title`, `quiz.description` |
| `courses/page.tsx` | `course.title`, `course.short_description / description` |
| `courses/browse/page.tsx` | `course.title`, `course.short_description / description` |
| `courses/my-courses/page.tsx` | `enrollment.course_title`, `enrollment.course_description` |
| `courses/my-progress/page.tsx` | `topCourse.course_title`, `enrollment.course_title` |
| `learning/courses/page.tsx` | `course.title`, `course.short_description / description` |
| `learning/courses/[slug]/page.tsx` | `formData.title`, `formData.short_description / description`, `mod.title`, `mod.description`, `lesson.title` |
| `learning/modules/page.tsx` | `course.title`, `course.short_description / description` |
| `learning/quizzes/page.tsx` | `quiz.title` |
| `learning/quizzes/[id]/page.tsx` | `quiz.title`, `quiz.description` |
| `learning/quizzes/[id]/edit/page.tsx` | `formData.title` |
| `learning/quizzes/[id]/questions/page.tsx` | `quiz.title`, `q.question_text`, `c.choice_text` |
| `learning/quizzes/[id]/essays/page.tsx` | `quiz.title`, `answer.attempt_user_name / username`, `answer.question_text`, `answer.essay_answer`, `answer.grader_notes`, `selectedAnswer.question_text`, `selectedAnswer.essay_answer` |
| `learning/certificates/template/page.tsx` | `course.title`, `cert.user_name`, `cert.course_title` |
| `learning/enrollments/page.tsx` | `enrollment.user_name / username`, `enrollment.course_title` |
| `learning/enrollments/[id]/page.tsx` | `enrollment.course_title`, `enrollment.user_name / user_username` |
| `learning/progress/page.tsx` | `enrollment.user_name / username`, `enrollment.course_title` |
| `learning/progress/[enrollmentId]/page.tsx` | `enrollment.user_name`, `enrollment.course_title` |

### Components (Sesi 3 — 13 file)

| File | Display Fields |
|------|---------------|
| `components/Features.tsx` | `feature.title`, `feature.description`, `akademi.title` |
| `components/LatestNews.tsx` | `item.title`, `item.excerpt / content` |
| `components/Footer.tsx` | `appName`, `appDesc` |
| `components/Brand.tsx` | `brand.app_name`, `brand.app_description` |
| `components/Instructors.tsx` | `instructor.name`, `instructor.position`, `instructor.unit_kerja` |
| `components/learning/CourseCard.tsx` | `course.title`, `course.short_description` |
| `components/learning/LessonViewer.tsx` | `lesson.title` |
| `components/learning/QuizTaker.tsx` | `quiz.title`, `quiz.description`, `choice.choice_text`, `currentQuestion.question_text` |
| `components/learning/QuizCard.tsx` | `quiz.title`, `quiz.description` |
| `components/learning/CourseRatings.tsx` | `r.user_name`, `r.comment` |
| `components/learning/CourseComments.tsx` | `comment.user_name`, `comment.comment`, `reply.user_name`, `reply.comment` |
| `components/admin/UserTable.tsx` | `user.name` |
| `components/admin/ActivityList.tsx` | `activity.title`, `activity.description` |
| `components/admin/AdminHeader.tsx` | `user.name` |
| `components/NotificationBell.tsx` | `n.title`, `n.message` |
| `components/CommentItem.tsx` | `comment.user.name`, `comment.content` |

### Admin Dashboard, Knowledge, Manajemen, Lainnya (Sesi 3 — 10 file)

| File | Display Fields |
|------|---------------|
| `dashboard/page.tsx` | `user.name / username` |
| `dashboard/hcdp/page.tsx` | `program.title`, `program.description` |
| `dashboard/berita/page.tsx` | `item.excerpt / content`, `item.category` |
| `knowledge/page.tsx` | `article.excerpt / content`, `article.category.name`, `article.author.name` |
| `knowledge/create/page.tsx` | `tag.name` (checkbox label) |
| `knowledge/[slug]/page.tsx` | `tag.name` (checkbox label) |
| `manajemen-data/kategori-learning/page.tsx` | `category.description` |
| `manajemen-data/tags/page.tsx` | `tag.description` |
| `roles/[id]/permissions/page.tsx` | `mod.name` |
| `profile/personalia/page.tsx` | `item.position`, `item.unit_kerja` |

### Public Pages (Sesi 2 & 3 — 12 file)

| File | Display Fields |
|------|---------------|
| `app/(main)/kms/page.tsx` | `category.name`, `article.category.name`, `article.title`, `article.excerpt / content`, `tag.name`, `article.author.name` |
| `app/(main)/kms/[slug]/page.tsx` | `article.category.name`, `article.title`, `article.excerpt`, `article.content`, `article.author.name`, `tag.name` |
| `app/(main)/berita/page.tsx` | `item.title`, `item.excerpt / content`, `item.category` |
| `app/(main)/berita/[slug]/page.tsx` | `news.category`, `news.title`, `news.content` |
| `app/(main)/kursus/page.tsx` | `course.title`, `course.description`, `course.category` |
| `app/(main)/hcdp/page.tsx` | `program.title`, `program.description`, `program.instructor`, `program.location` |
| `app/(main)/profil/page.tsx` | `section.title`, `section.content`, `person.name`, `person.position` |
| `app/(main)/profil/personalia/page.tsx` | `person.name`, `person.position`, `person.unit_kerja`, `person.description` |
| `app/(main)/profil/sambutan-visi-misi/page.tsx` | `sambutan.title`, `visiMisi.title` |

---

## Cara Penggunaan

Input nama/title: `Pengantar <i>Fiqh</i> Mumayyiz`  
Tampil: **Pengantar *Fiqh* Mumayyiz** dengan *Fiqh* miring.

Tag yang diizinkan: `<i>`, `<em>`, `<b>`, `<strong>`, `<br>`  
Tag lainnya (termasuk `<script>`) otomatis dihapus oleh `sanitizeHtml()`.

---

## Catatan

- `renderHtml()` dipanggil dari `frontend/lib/utils.ts` yang sudah ada sejak task sebelumnya (MD-14)
- Tidak ada perubahan pada data di backend — semua sanitasi dilakukan client-side
- Container sudah direstart setelah perubahan
