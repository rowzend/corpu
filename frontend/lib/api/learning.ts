import { api } from '../api';

// ==================== Interfaces ====================

export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  thumbnail?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes: number;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  instructor: { id: number; username: string; first_name?: string; last_name?: string };
  enrolled_count: number;
  lesson_count: number;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface CourseList {
  count: number;
  next?: string;
  previous?: string;
  results: Course[];
}

export interface Module {
  id: number;
  course: number;
  title: string;
  description?: string;
  order_index: number;
  lessons: Lesson[];
  created_at: string;
}

export interface Lesson {
  id: number;
  module: number;
  title: string;
  slug: string;
  content?: string;
  content_type: 'article' | 'video' | 'document' | 'link' | 'quiz';
  video_url?: string;
  video_embed_id?: string;
  file_url?: string;
  external_url?: string;
  duration_minutes: number;
  order_index: number;
  is_free: boolean;
  created_at: string;
  quiz_id?: number;
}

export interface Enrollment {
  id: number;
  course: number;
  course_title: string;
  course_slug: string;
  course_thumbnail?: string;
  user: number;
  user_name: string;
  status: 'active' | 'completed' | 'dropped';
  progress_percentage: number;
  has_certificate: boolean;
  enrolled_at: string;
  completed_at?: string;
  last_accessed_at: string;
}

export interface Quiz {
  id: number;
  lesson: number;
  title: string;
  description?: string;
  passing_score_percentage: number;
  max_attempts: number;
  is_randomized: boolean;
  time_limit_minutes?: number;
  retry_cooldown_minutes?: number;
  total_questions: number;
  questions: QuizQuestion[];
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'essay';
  order_index: number;
  points: number;
  essay_word_limit?: number;
  choices: QuizChoice[];
}

export interface QuizChoice {
  id: number;
  choice_text: string;
  order_index: number;
}

export interface QuizAttempt {
  id: number;
  quiz: number;
  quiz_title: string;
  user: number;
  user_name: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  passed: boolean;
  status?: string;
  started_at: string;
  completed_at?: string;
  answers?: QuizAnswer[];
}

export interface QuizAnswer {
  id: number;
  attempt: number;
  question: number;
  question_text: string;
  question_type: string;
  selected_choice?: number;
  selected_choice_text?: string;
  is_correct_bool?: boolean;
  essay_answer?: string;
  is_correct: boolean;
  points_earned: number;
  is_graded: boolean;
  grader_notes?: string;
  graded_at?: string;
}

export interface Certificate {
  id: number;
  enrollment: number;
  certificate_number: string;
  user_name: string;
  user_username: string;
  course_title: string;
  course_slug: string;
  issued_at: string;
  pdf_url?: string;
  is_active: boolean;
}

export interface CertificateSetting {
  id: number;
  institution_name: string;
  signature_name: string;
  signature_title: string;
  logo: string | null;
  background: string | null;
  signature_image: string | null;
  show_course_hours: boolean;
  tte_enabled: boolean;
  tte_has_certificate: boolean;
  tte_created_at: string | null;
  cert_number_prefix: string;
  cert_number_format: string;
  updated_at: string;
}

export interface CourseRating {
  id: number;
  course: number;
  user: number;
  user_name: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface CourseComment {
  id: number;
  course: number;
  user: number;
  user_name: string;
  comment: string;
  parent_comment?: number;
  likes: CourseCommentLike[];
  created_at: string;
  updated_at: string;
}

export interface CourseCommentLike {
  id: number;
  user: number;
  user_name: string;
  created_at: string;
}

// ==================== Course API ====================

export async function getCourses(params?: {
  page?: number;
  page_size?: number;
  level?: string;
  search?: string;
  ordering?: string;
}): Promise<CourseList> {
  return api.get('/learning/courses/', params);
}

export async function getCourse(slug: string): Promise<Course> {
  return api.get(`/learning/courses/${slug}/`);
}

export async function createCourse(data: any): Promise<Course> {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]: [string, any]) => {
    if (value !== undefined && value !== null) {
      if (key === 'thumbnail' && value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    }
  });
  return api.post('/learning/courses/', formData);
}

export async function updateCourse(slug: string, data: any): Promise<Course> {
  // If data is already FormData, use it directly
  if (data instanceof FormData) {
    return api.put(`/learning/courses/${slug}/`, data);
  }
  
  // Otherwise convert object to FormData
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]: [string, any]) => {
    if (value !== undefined && value !== null) {
      if (key === 'thumbnail' && value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    }
  });
  return api.put(`/learning/courses/${slug}/`, formData);
}

export async function deleteCourse(slug: string): Promise<void> {
  await api.delete(`/learning/courses/${slug}/`);
}

export async function getFeaturedCourses(): Promise<Course[]> {
  return api.get('/learning/courses/featured/');
}

export async function getPopularCourses(): Promise<Course[]> {
  return api.get('/learning/courses/popular/');
}

export async function getMyCourses(): Promise<Course[]> {
  return api.get('/learning/courses/my_courses/');
}

export async function getMyTeachingCourses(): Promise<Course[]> {
  return api.get('/learning/courses/my_teaching/');
}

export async function enrollCourse(slug: string): Promise<Enrollment> {
  return api.post(`/learning/courses/${slug}/enroll/`);
}

export async function likeCourse(slug: string): Promise<{ is_like: boolean; created: boolean }> {
  return api.post(`/learning/courses/${slug}/like/`);
}

export async function dislikeCourse(slug: string): Promise<{ is_like: boolean; deleted: boolean }> {
  return api.post(`/learning/courses/${slug}/dislike/`);
}

export async function getCourseProgress(slug: string): Promise<{
  enrollment_id: number;
  enrollment_status: string;
  progress_percentage: number;
  completed_lessons: number;
  total_lessons: number;
  lessons: Lesson[];
  certificate?: {
    id: number;
    certificate_number: string;
    issued_at: string;
  } | null;
}> {
  return api.get(`/learning/courses/${slug}/progress/`);
}

// ==================== Module API ====================

export async function getModules(courseSlug: string): Promise<{ results: Module[] }> {
  return api.get('/learning/modules/', { course_slug: courseSlug });
}

export async function getModule(id: number): Promise<Module> {
  return api.get(`/learning/modules/${id}/`);
}

export async function createModule(data: any): Promise<Module> {
  return api.post('/learning/modules/', data);
}

export async function updateModule(id: number, data: any): Promise<Module> {
  return api.put(`/learning/modules/${id}/`, data);
}

export async function deleteModule(id: number): Promise<void> {
  await api.delete(`/learning/modules/${id}/`);
}

// ==================== Lesson API ====================

export async function markLessonComplete(slug: string, timeSpentMinutes?: number): Promise<{
  is_completed: boolean;
  progress: number;
}> {
  return api.post(`/learning/lessons/${slug}/mark_complete/`, {
    time_spent_minutes: timeSpentMinutes || 0,
  });
}

export async function saveTimerProgress(slug: string, timeSpentMinutes: number): Promise<{
  saved: boolean;
  time_spent_minutes: number;
}> {
  return api.post(`/learning/lessons/${slug}/save_timer/`, {
    time_spent_minutes: timeSpentMinutes,
  });
}

export async function getLessons(moduleId: number): Promise<Lesson[]> {
  const data: any = await api.get('/learning/lessons/', { module_id: moduleId });
  return data?.results || data || [];
}

export async function getLesson(slug: string): Promise<Lesson> {
  return api.get(`/learning/lessons/${slug}/`);
}

export async function createLesson(data: any): Promise<Lesson> {
  return api.post('/learning/lessons/', data);
}

export async function updateLesson(slug: string, data: any): Promise<Lesson> {
  return api.put(`/learning/lessons/${slug}/`, data);
}

export async function deleteLesson(slug: string): Promise<void> {
  await api.delete(`/learning/lessons/${slug}/`);
}

// ==================== Enrollment API ====================

export async function getEnrollments(params?: {
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<{ results: Enrollment[] }> {
  return api.get('/learning/enrollments/', params);
}

export async function getEnrollment(id: number): Promise<Enrollment> {
  return api.get(`/learning/enrollments/${id}/`);
}

export async function updateEnrollment(id: number, data: any): Promise<Enrollment> {
  return api.put(`/learning/enrollments/${id}/`, data);
}

// ==================== Quiz API ====================

export async function getQuizzes(params?: {
  lesson_id?: number;
  page?: number;
  page_size?: number;
}): Promise<{ results: Quiz[] }> {
  return api.get('/learning/quizzes/', params);
}

export async function getQuiz(id: number): Promise<Quiz> {
  return api.get(`/learning/quizzes/${id}/`);
}

export async function createQuiz(data: any): Promise<Quiz> {
  return api.post('/learning/quizzes/', data);
}

export async function updateQuiz(id: number, data: any): Promise<Quiz> {
  return api.put(`/learning/quizzes/${id}/`, data);
}

export async function deleteQuiz(id: number): Promise<void> {
  await api.delete(`/learning/quizzes/${id}/`);
}

export async function takeQuiz(quizId: number): Promise<{
  id: number;
  title: string;
  description?: string;
  passing_score_percentage: number;
  total_questions: number;
  questions: QuizQuestion[];
}> {
  return api.get(`/learning/quizzes/${quizId}/take/`);
}

export async function resumeQuiz(quizId: number): Promise<{
  id: number;
  title: string;
  description?: string;
  passing_score_percentage: number;
  total_questions: number;
  questions: QuizQuestion[];
  draft_answers: any[];
  time_spent: number;
  draft_attempt_id: number;
}> {
  return api.get(`/learning/quizzes/${quizId}/resume/`);
}

export async function submitQuizAttempt(quizId: number, answers: any[], timeSpent?: number): Promise<QuizAttempt> {
  return api.post(`/learning/quizzes/${quizId}/attempt/`, { answers, time_spent: timeSpent || 0 });
}

export async function saveQuizDraft(quizId: number, answers: any[], timeSpent?: number): Promise<{ draft_attempt_id: number; saved: boolean; time_spent: number }> {
  return api.post(`/learning/quizzes/${quizId}/save_draft/`, { draft_answers: answers, time_spent: timeSpent || 0 });
}

export async function resumeQuizDraft(quizId: number): Promise<any> {
  return api.get(`/learning/quizzes/${quizId}/resume_draft/`);
}

export async function getQuizResult(quizId: number, attemptId: number): Promise<QuizAttempt> {
  return api.get(`/learning/quizzes/${quizId}/result/`, { attempt_id: attemptId });
}

export async function getMyQuizAttempts(quizId: number): Promise<QuizAttempt[]> {
  return api.get('/learning/quizzes/my_attempts/', { quiz_id: quizId });
}

export async function getQuizStats(quizId: number): Promise<{
  total_attempts: number;
  average_score: number;
  passed_count: number;
  passed_percentage: number;
}> {
  return api.get(`/learning/quizzes/${quizId}/stats/`);
}

// ==================== Quiz Question API ====================

export async function createQuizQuestion(data: any): Promise<QuizQuestion> {
  return api.post('/learning/quiz-questions/', data);
}

export async function updateQuizQuestion(id: number, data: any): Promise<QuizQuestion> {
  return api.put(`/learning/quiz-questions/${id}/`, data);
}

export async function deleteQuizQuestion(id: number): Promise<void> {
  await api.delete(`/learning/quiz-questions/${id}/`);
}

// ==================== Essay Grading API ====================

export async function getEssayAnswers(quizId: number): Promise<QuizAnswer[]> {
  return api.get(`/learning/quizzes/${quizId}/essay_answers/`);
}

export async function gradeEssay(quizId: number, data: {
  answer_id: number;
  is_correct: boolean;
  points_earned: number;
  grader_notes?: string;
}): Promise<QuizAnswer> {
  return api.post(`/learning/quizzes/${quizId}/grade_essay/`, data);
}

// ==================== Certificate API ====================

export async function getCertificates(params?: { course_slug?: string; is_active?: string }): Promise<{ results: Certificate[] }> {
  const query = new URLSearchParams();
  if (params?.course_slug) query.set('course_slug', params.course_slug);
  if (params?.is_active !== undefined) query.set('is_active', params.is_active);
  const qs = query.toString();
  return api.get(`/learning/certificates/${qs ? '?' + qs : ''}`);
}

export async function getCertificate(id: number): Promise<Certificate> {
  return api.get(`/learning/certificates/${id}/`);
}

export async function deleteCertificate(id: number): Promise<void> {
  return api.delete(`/learning/certificates/${id}/`);
}

export async function toggleCertificateActive(id: number): Promise<{ is_active: boolean }> {
  return api.post(`/learning/certificates/${id}/toggle_active/`);
}

export async function downloadCertificate(id: number): Promise<Blob> {
  return api.getBlob(`/learning/certificates/${id}/download/`);
}

export async function getCertificateSettings(): Promise<CertificateSetting> {
  return api.get('/learning/certificate-settings/');
}

export async function updateCertificateSettings(data: Partial<CertificateSetting> | FormData): Promise<CertificateSetting> {
  return api.put('/learning/certificate-settings/', data);
}

export async function generateTteCertificate(passphrase: string): Promise<any> {
  return api.post('/learning/certificate-settings/', { action: 'generate_tte', passphrase });
}

export async function generateCourseTteCertificate(courseId: number, passphrase: string): Promise<any> {
  return api.post('/learning/certificate-settings/', { action: 'generate_course_tte', course_id: courseId, passphrase });
}

// ==================== Rating API ====================

export async function getRatings(params?: {
  course_slug?: string;
  page?: number;
  page_size?: number;
}): Promise<{ results: CourseRating[] }> {
  return api.get('/learning/ratings/', params);
}

export async function createRating(data: any): Promise<CourseRating> {
  return api.post('/learning/ratings/', data);
}

export async function updateRating(id: number, data: any): Promise<CourseRating> {
  return api.put(`/learning/ratings/${id}/`, data);
}

export async function deleteRating(id: number): Promise<void> {
  await api.delete(`/learning/ratings/${id}/`);
}

export async function getMyRatings(): Promise<CourseRating[]> {
  return api.get('/learning/ratings/my_ratings/');
}

// ==================== Comment API ====================

export async function getComments(params?: {
  course_slug?: string;
  page?: number;
  page_size?: number;
}): Promise<{ results: CourseComment[] }> {
  return api.get('/learning/comments/', params);
}

export async function createComment(data: any): Promise<CourseComment> {
  return api.post('/learning/comments/', data);
}

export async function replyComment(commentId: number, reply: string): Promise<CourseComment> {
  return api.post(`/learning/comments/${commentId}/reply/`, { comment: reply });
}

export async function likeComment(commentId: number): Promise<{ is_like: boolean; created: boolean }> {
  return api.post(`/learning/comments/${commentId}/like/`);
}

export async function dislikeComment(commentId: number): Promise<{ is_like: boolean; deleted: boolean }> {
  return api.post(`/learning/comments/${commentId}/dislike/`);
}

export async function updateComment(id: number, data: any): Promise<CourseComment> {
  return api.put(`/learning/comments/${id}/`, data);
}

export async function deleteComment(id: number): Promise<void> {
  await api.delete(`/learning/comments/${id}/`);
}

export async function bypassTimer(slug: string): Promise<any> {
  return api.post(`/learning/lessons/${slug}/bypass_timer/`);
}

export async function bypassQuizCooldown(quizId: number): Promise<any> {
  return api.post(`/learning/quizzes/${quizId}/bypass_cooldown/`);
}
