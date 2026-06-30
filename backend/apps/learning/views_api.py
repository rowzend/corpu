from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count, Q, Avg, Sum
from django.utils import timezone
from django.http import HttpResponse
from django.template.loader import render_to_string
from io import BytesIO
import textwrap

from core.models import Notification

from .models import (
    Course, Module, Lesson, Enrollment, LessonProgress,
    Quiz, QuizQuestion, QuizChoice, QuizAttempt, QuizAnswer, Certificate, CertificateSetting,
    CourseRating, CourseComment, CourseCommentLike, CourseLike
)
from .serializers import (
    CourseListSerializer, CourseDetailSerializer,
    ModuleSerializer,
    LessonSerializer, LessonListSerializer,
    EnrollmentSerializer, EnrollmentDetailSerializer,
    LessonProgressSerializer,
    QuizSerializer, QuizDetailSerializer,
    QuizAnswerSerializer, QuizAnswerGradeSerializer,
    QuizAttemptSerializer, QuizAttemptDetailSerializer,
    QuizQuestionSerializer, QuizQuestionWriteSerializer, QuizQuestionPublicSerializer,
    CertificateSerializer, CertificateSettingSerializer,
    CourseRatingSerializer, CourseLikeSerializer,
    CourseCommentSerializer, CourseCommentLikeSerializer
)
from .permissions import LearningPermission, IsEnrolled, IsInstructor


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.select_related('instructor').prefetch_related('modules__lessons')
    permission_classes = [LearningPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'short_description']
    ordering_fields = ['created_at', '-rating_avg', '-enrolled_count', 'title']
    ordering = ['-created_at']
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == 'list':
            status_filter = self.request.query_params.get('status')
            if status_filter and self.request.user.is_authenticated:
                qs = qs.filter(status=status_filter)
            elif self.request.user.is_staff:
                pass
            else:
                qs = qs.filter(status='published')
        level = self.request.query_params.get('level')
        if level:
            qs = qs.filter(level=level)
        return qs

    def perform_create(self, serializer):
        course = serializer.save(instructor=self.request.user)
        course.update_lesson_count()

    def perform_update(self, serializer):
        course = serializer.save()
        course.update_lesson_count()

    @action(detail=False, methods=['get'])
    def featured(self, request):
        courses = self.get_queryset().filter(is_featured=True)[:6]
        serializer = CourseListSerializer(courses, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        courses = self.get_queryset().order_by('-enrolled_count')[:6]
        serializer = CourseListSerializer(courses, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_courses(self, request):
        enrollments = Enrollment.objects.filter(user=request.user).select_related('course')
        courses = [e.course for e in enrollments]
        serializer = CourseDetailSerializer(courses, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_teaching(self, request):
        courses = Course.objects.filter(instructor=request.user)
        serializer = CourseListSerializer(courses, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def enroll(self, request, slug=None):
        course = self.get_object()
        enrollment, created = Enrollment.objects.get_or_create(
            course=course, user=request.user,
            defaults={'status': 'active'}
        )
        if created:
            course.update_enrolled_count()
        serializer = EnrollmentSerializer(enrollment, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def progress(self, request, slug=None):
        course = self.get_object()
        try:
            enrollment = Enrollment.objects.get(course=course, user=request.user)
            all_lessons = Lesson.objects.filter(module__course=course).order_by('module__order_index', 'order_index')
            completed_ids = LessonProgress.objects.filter(
                enrollment=enrollment, is_completed=True
            ).values_list('lesson_id', flat=True)

            lessons_data = []
            all_prev_completed = True
            for lesson in all_lessons:
                is_completed = lesson.id in completed_ids
                ser = LessonSerializer(lesson, context={'request': request})
                lesson_dict = ser.data
                lesson_dict['is_completed'] = is_completed
                lesson_dict['is_unlocked'] = all_prev_completed
                lesson_dict['module_title'] = lesson.module.title
                lesson_dict['module_id'] = lesson.module.id

                quiz_attempt = QuizAttempt.objects.filter(
                    quiz__lesson=lesson, user=request.user
                ).order_by('-completed_at').first()
                lesson_dict['quiz_score'] = quiz_attempt.score if quiz_attempt else None
                lesson_dict['quiz_passed'] = quiz_attempt.passed if quiz_attempt else None
                lesson_dict['quiz_attempt_id'] = quiz_attempt.id if quiz_attempt else None

                lessons_data.append(lesson_dict)
                if not is_completed:
                    all_prev_completed = False

            certificate = Certificate.objects.filter(enrollment=enrollment).first()
            return Response({
                'enrollment_id': enrollment.id,
                'enrollment_status': enrollment.status,
                'progress_percentage': enrollment.progress_percentage,
                'completed_lessons': len([l for l in lessons_data if l['is_completed']]),
                'total_lessons': len(lessons_data),
                'lessons': lessons_data,
                'certificate': {
                    'id': certificate.id,
                    'certificate_number': certificate.certificate_number,
                    'issued_at': certificate.issued_at,
                } if certificate else None,
            })
        except Enrollment.DoesNotExist:
            return Response({'detail': 'Anda belum mendaftar kursus ini'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, slug=None):
        course = self.get_object()
        like, created = CourseLike.objects.get_or_create(course=course, user=request.user)
        return Response({'is_liked': True, 'created': created})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def dislike(self, request, slug=None):
        course = self.get_object()
        deleted, _ = CourseLike.objects.filter(course=course, user=request.user).delete()
        return Response({'is_liked': False, 'deleted': deleted > 0})


class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.select_related('course').prefetch_related('lessons')
    permission_classes = [LearningPermission]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['order_index', 'created_at']
    ordering = ['order_index']

    def get_serializer_class(self):
        return ModuleSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        course_slug = self.request.query_params.get('course_slug')
        if course_slug:
            qs = qs.filter(course__slug=course_slug)
        return qs


class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.select_related('module__course')
    permission_classes = [LearningPermission]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['order_index', 'created_at']
    ordering = ['order_index']
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'list':
            return LessonListSerializer
        return LessonSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        module_id = self.request.query_params.get('module_id')
        if module_id:
            qs = qs.filter(module_id=module_id)
        course_slug = self.request.query_params.get('course_slug')
        if course_slug:
            qs = qs.filter(module__course__slug=course_slug)
        return qs

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_complete(self, request, slug=None):
        lesson = self.get_object()
        try:
            enrollment = Enrollment.objects.get(
                course=lesson.module.course,
                user=request.user,
                status='active'
            )
            if not lesson.are_all_previous_completed(enrollment):
                return Response(
                    {'detail': 'Selesaikan materi sebelumnya terlebih dahulu'},
                    status=status.HTTP_403_FORBIDDEN
                )
            progress, created = LessonProgress.objects.update_or_create(
                enrollment=enrollment,
                lesson=lesson,
                defaults={'is_completed': True, 'time_spent_minutes': request.data.get('time_spent_minutes', 0)}
            )
            if not progress.completed_at:
                from django.utils import timezone
                progress.completed_at = timezone.now()
                progress.save(update_fields=['completed_at'])
            enrollment.update_progress()
            return Response({'is_completed': True, 'progress': enrollment.progress_percentage})
        except Enrollment.DoesNotExist:
            return Response({'detail': 'Anda belum mendaftar kursus ini'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def save_timer(self, request, slug=None):
        lesson = self.get_object()
        try:
            enrollment = Enrollment.objects.get(
                course=lesson.module.course,
                user=request.user,
                status='active'
            )
            time_spent = request.data.get('time_spent_minutes', 0)
            LessonProgress.objects.update_or_create(
                enrollment=enrollment,
                lesson=lesson,
                defaults={'time_spent_minutes': time_spent}
            )
            return Response({'time_spent_minutes': time_spent})
        except Enrollment.DoesNotExist:
            return Response({'detail': 'Anda belum mendaftar kursus ini'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def bypass_timer(self, request, slug=None):
        from apps.manajemen.helpers import check_permission
        lesson = self.get_object()
        if not check_permission(request.user, 'learning', 'lessons', 'timer_bypass'):
            return Response({'detail': 'Anda tidak memiliki izin bypass timer'}, status=status.HTTP_403_FORBIDDEN)
        try:
            enrollment = Enrollment.objects.get(
                course=lesson.module.course,
                user=request.user,
                status='active'
            )
            min_duration = lesson.duration_minutes or 0
            time_spent = max(min_duration, 1)
            LessonProgress.objects.update_or_create(
                enrollment=enrollment,
                lesson=lesson,
                defaults={'time_spent_minutes': time_spent}
            )
            return Response({'time_spent_minutes': time_spent, 'bypassed': True})
        except Enrollment.DoesNotExist:
            return Response({'detail': 'Anda belum mendaftar kursus ini'}, status=status.HTTP_404_NOT_FOUND)


class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.select_related('course', 'user')
    permission_classes = [LearningPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'user__email', 'course__title']
    ordering_fields = ['-enrolled_at', 'status']
    ordering = ['-enrolled_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EnrollmentDetailSerializer
        return EnrollmentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        course_slug = self.request.query_params.get('course_slug')
        if course_slug:
            qs = qs.filter(course__slug=course_slug)
        return qs.distinct()

    def perform_create(self, serializer):
        enrollment = serializer.save()
        enrollment.course.update_enrolled_count()


class LessonProgressViewSet(viewsets.ModelViewSet):
    queryset = LessonProgress.objects.select_related('enrollment', 'lesson')
    serializer_class = LessonProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LessonProgress.objects.filter(enrollment__user=self.request.user)

    def _get_ordered_lessons(self, course):
        """Return all lessons ordered by module order_index then lesson order_index."""
        from django.db.models import Prefetch
        modules = course.modules.all().order_by('order_index', 'created_at')
        lessons = []
        for mod in modules:
            mod_lessons = mod.lessons.all().order_by('order_index', 'created_at')
            for l in mod_lessons:
                lessons.append(l)
        return lessons

    @action(detail=False, methods=['get'])
    def course_progress(self, request):
        course_slug = request.query_params.get('course_slug')
        if not course_slug:
            return Response({'detail': 'course_slug diperlukan'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            enrollment = Enrollment.objects.get(course__slug=course_slug, user=request.user)
        except Enrollment.DoesNotExist:
            return Response({'detail': 'Belum terdaftar di kursus ini'}, status=status.HTTP_404_NOT_FOUND)

        completed_ids = set(
            LessonProgress.objects.filter(
                enrollment=enrollment, is_completed=True
            ).values_list('lesson_id', flat=True)
        )

        all_lessons = self._get_ordered_lessons(enrollment.course)
        lessons_data = []
        all_prev_completed = True

        for i, lesson in enumerate(all_lessons):
            is_completed = lesson.id in completed_ids
            is_unlocked = all_prev_completed
            module_title = lesson.module.title
            module_id = lesson.module.id

            ser = LessonSerializer(lesson, context={'request': request})
            lesson_dict = ser.data
            lesson_dict['is_completed'] = is_completed
            lesson_dict['is_unlocked'] = is_unlocked
            lesson_dict['module_title'] = module_title
            lesson_dict['module_id'] = module_id
            lessons_data.append(lesson_dict)

            if not is_completed:
                all_prev_completed = False

        return Response({
            'enrollment_id': enrollment.id,
            'progress_percentage': enrollment.progress_percentage,
            'completed_lessons': len([l for l in lessons_data if l['is_completed']]),
            'total_lessons': len(lessons_data),
            'lessons': lessons_data
        })


class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.select_related('lesson__module__course').prefetch_related(
        'questions__choices'
    )
    permission_classes = [LearningPermission]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['-created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['retrieve', 'create', 'update', 'partial_update']:
            return QuizDetailSerializer
        return QuizSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        lesson_id = self.request.query_params.get('lesson_id')
        if lesson_id:
            qs = qs.filter(lesson_id=lesson_id)
        course_slug = self.request.query_params.get('course_slug')
        if course_slug:
            qs = qs.filter(lesson__module__course__slug=course_slug)
        return qs

    def perform_create(self, serializer):
        quiz = serializer.save()
        quiz.update_total_questions()

    def perform_update(self, serializer):
        quiz = serializer.save()
        quiz.update_total_questions()

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_attempts(self, request):
        attempts = QuizAttempt.objects.filter(user=request.user).select_related('quiz', 'quiz__lesson')
        serializer = QuizAttemptSerializer(attempts, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def take(self, request, pk=None):
        quiz = self.get_object()
        if not quiz.can_user_attempt(request.user):
            return Response({'detail': 'Batas percobaan telah habis'}, status=status.HTTP_403_FORBIDDEN)
        if not request.user.is_staff:
            try:
                course = quiz.lesson.module.course
                enrollment = Enrollment.objects.get(
                    course=course,
                    user=request.user,
                    status='active'
                )
                if quiz.lesson.has_active_timed_quiz(enrollment):
                    return Response(
                        {'detail': 'Anda masih memiliki kuis dengan timer yang aktif. Selesaikan kuis terlebih dahulu sebelum mengakses materi lain.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                if not quiz.lesson.are_all_previous_completed(enrollment):
                    return Response(
                        {'detail': 'Selesaikan semua materi sebelum mengikuti kuis'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Enrollment.DoesNotExist:
                return Response({'detail': 'Anda belum terdaftar di kursus ini'}, status=status.HTTP_403_FORBIDDEN)
        questions = quiz.get_questions_ordered()
        serializer = QuizQuestionPublicSerializer(questions, many=True)
        return Response({
            'id': quiz.id,
            'title': quiz.title,
            'description': quiz.description,
            'passing_score_percentage': quiz.passing_score_percentage,
            'time_limit_minutes': quiz.time_limit_minutes,
            'total_questions': quiz.total_questions,
            'questions': serializer.data
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def attempt(self, request, pk=None):
        quiz = self.get_object()
        answers_data = request.data.get('answers', [])

        if not quiz.can_user_attempt(request.user):
            return Response({'detail': 'Batas percobaan telah habis'}, status=status.HTTP_403_FORBIDDEN)

        enrollment = None
        try:
            course = quiz.lesson.module.course
            enrollment = Enrollment.objects.get(
                course=course,
                user=request.user,
                status='active'
            )
        except Enrollment.DoesNotExist:
            pass

        attempt = QuizAttempt.objects.create(
            quiz=quiz, user=request.user, enrollment=enrollment,
            total_questions=quiz.questions.count()
        )

        correct_count = 0
        total_score = 0

        for answer_data in answers_data:
            question_id = answer_data.get('question_id')
            try:
                question = QuizQuestion.objects.get(id=question_id, quiz=quiz)
                is_correct = False
                points_earned = 0

                if question.question_type == 'multiple_choice':
                    choice_id = answer_data.get('choice_id')
                    try:
                        choice = QuizChoice.objects.get(id=choice_id, question=question)
                        is_correct = choice.is_correct
                        points_earned = question.points if is_correct else 0
                        QuizAnswer.objects.create(
                            attempt=attempt, question=question,
                            selected_choice=choice, is_correct=is_correct,
                            points_earned=points_earned
                        )
                    except QuizChoice.DoesNotExist:
                        continue

                elif question.question_type == 'true_false':
                    answer_bool = answer_data.get('answer')
                    correct_choice = question.choices.filter(is_correct=True).first()
                    is_correct = answer_bool == bool(correct_choice.choice_text.lower() == 'true' if correct_choice else False)
                    points_earned = question.points if is_correct else 0
                    QuizAnswer.objects.create(
                        attempt=attempt, question=question,
                        is_correct_bool=answer_bool, is_correct=is_correct,
                        points_earned=points_earned
                    )

                elif question.question_type == 'essay':
                    essay_text = answer_data.get('essay', '')
                    QuizAnswer.objects.create(
                        attempt=attempt, question=question,
                        essay_answer=essay_text, is_correct=False,
                        points_earned=0
                    )

                if is_correct:
                    correct_count += 1
                total_score += points_earned

            except QuizQuestion.DoesNotExist:
                continue

        non_essay_questions = quiz.questions.exclude(question_type='essay')
        max_score = sum(q.points for q in non_essay_questions)
        score_percentage = int((total_score / max_score * 100)) if max_score > 0 else 0
        passed = score_percentage >= quiz.passing_score_percentage

        time_spent = request.data.get('time_spent', 0)

        if quiz.time_limit_minutes > 0:
            limit_seconds = quiz.time_limit_minutes * 60
            if int(time_spent) > limit_seconds:
                return Response({'detail': 'Waktu pengerjaan telah habis'}, status=status.HTTP_403_FORBIDDEN)

        attempt.score = score_percentage
        attempt.correct_answers = correct_count
        attempt.passed = passed
        attempt.completed_at = timezone.now()
        attempt.time_spent = int(time_spent)
        attempt.save()

        if enrollment:
            LessonProgress.objects.update_or_create(
                enrollment=enrollment,
                lesson=quiz.lesson,
                defaults={'is_completed': True, 'completed_at': timezone.now()}
            )
            enrollment.update_progress()

        serializer = QuizAttemptDetailSerializer(attempt, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def result(self, request, pk=None):
        attempt_id = request.query_params.get('attempt_id')
        if not attempt_id:
            return Response({'detail': 'attempt_id diperlukan'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            attempt = QuizAttempt.objects.get(
                id=attempt_id, quiz_id=pk, user=request.user
            )
            serializer = QuizAttemptDetailSerializer(attempt, context={'request': request})
            return Response(serializer.data)
        except QuizAttempt.DoesNotExist:
            return Response({'detail': 'Percobaan tidak ditemukan'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        quiz = self.get_object()
        attempts = QuizAttempt.objects.filter(quiz=quiz)
        avg_score = attempts.aggregate(Avg('score'))['score__avg'] or 0

        return Response({
            'total_attempts': attempts.count(),
            'average_score': int(avg_score),
            'highest_score': attempts.order_by('-score').first().score if attempts.exists() else 0,
            'lowest_score': attempts.order_by('score').first().score if attempts.exists() else 0,
            'passed_count': attempts.filter(passed=True).count(),
            'passed_percentage': int(
                (attempts.filter(passed=True).count() / attempts.count() * 100)
                if attempts.count() > 0 else 0
            )
        })

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def essay_answers(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'detail': 'Hanya admin yang bisa mengakses'}, status=status.HTTP_403_FORBIDDEN)
        quiz = self.get_object()
        essay_questions = quiz.questions.filter(question_type='essay')
        answers = QuizAnswer.objects.filter(
            question__in=essay_questions
        ).select_related('attempt__user', 'question').order_by('-attempt__completed_at')
        serializer = QuizAnswerSerializer(answers, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def grade_essay(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'detail': 'Hanya admin yang bisa mengakses'}, status=status.HTTP_403_FORBIDDEN)
        serializer = QuizAnswerGradeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            answer = QuizAnswer.objects.get(
                id=serializer.validated_data['answer_id'],
                question__quiz_id=pk,
                question__question_type='essay'
            )
            answer.is_correct = serializer.validated_data['is_correct']
            answer.points_earned = serializer.validated_data['points_earned']
            answer.grader_notes = serializer.validated_data.get('grader_notes', '')
            answer.is_graded = True
            answer.graded_at = timezone.now()
            answer.save()
            answer.attempt.calculate_score()
            Notification.objects.create(
                user=answer.attempt.user,
                notification_type='essay_graded',
                title=f'Jawaban esai telah dinilai',
                message=f'Nilai untuk soal "{answer.question.question_text[:50]}" sudah tersedia.',
                link=f'/courses/{answer.attempt.quiz.lesson.module.course.slug}/lessons/{answer.attempt.quiz.lesson.id}/quiz',
            )
            return Response(QuizAnswerSerializer(answer, context={'request': request}).data)
        except QuizAnswer.DoesNotExist:
            return Response({'detail': 'Jawaban tidak ditemukan'}, status=status.HTTP_404_NOT_FOUND)


class QuizQuestionViewSet(viewsets.ModelViewSet):
    queryset = QuizQuestion.objects.select_related('quiz').prefetch_related('choices')
    permission_classes = [LearningPermission]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['order_index', 'created_at']
    ordering = ['order_index']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return QuizQuestionWriteSerializer
        return QuizQuestionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        quiz_id = self.request.query_params.get('quiz_id')
        if quiz_id:
            qs = qs.filter(quiz_id=quiz_id)
        return qs

    def perform_create(self, serializer):
        question = serializer.save()
        question.quiz.update_total_questions()

    def perform_update(self, serializer):
        question = serializer.save()
        question.quiz.update_total_questions()

    def perform_destroy(self, instance):
        quiz = instance.quiz
        instance.delete()
        quiz.update_total_questions()


class CertificateViewSet(viewsets.ModelViewSet):
    queryset = Certificate.objects.select_related('enrollment__course', 'enrollment__user')
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        from apps.manajemen.helpers import check_permission
        if not check_permission(user, 'learning', 'certificates', 'view'):
            qs = qs.filter(enrollment__user=user)
        course_slug = self.request.query_params.get('course_slug')
        if course_slug:
            qs = qs.filter(enrollment__course__slug=course_slug)
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        return qs

    @action(detail=False, methods=['get'])
    def my_certificates(self, request):
        certs = Certificate.objects.filter(enrollment__user=request.user)
        serializer = CertificateSerializer(certs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        cert = self.get_object()
        cert.is_active = not cert.is_active
        cert.save(update_fields=['is_active'])
        return Response({'is_active': cert.is_active})

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        cert = self.get_object()
        settings = CertificateSetting.get_settings()
        course = cert.enrollment.course

        def _tte_for(settings, course):
            if course.cert_tte_enabled and course.cert_tte_certificate and course.cert_tte_certificate.name and course.cert_tte_passphrase:
                return {
                    'certificate': course.cert_tte_certificate,
                    'private_key': course.cert_tte_private_key,
                    'passphrase': course.cert_tte_passphrase,
                }
            return None

        per_course_tte = _tte_for(settings, course)
        use_tte = per_course_tte or (settings.tte_enabled and settings.tte_certificate and settings.tte_certificate.name and settings.tte_passphrase)

        try:
            from django.template import Template, Context
            from django.conf import settings as django_settings
            import os

            template_html = None
            if course.certificate_template and course.certificate_template.name:
                tmpl_path = os.path.join(django_settings.MEDIA_ROOT, course.certificate_template.name)
                if os.path.exists(tmpl_path):
                    with open(tmpl_path, 'r') as f:
                        template_html = f.read()

            if template_html:
                return self._render_html_certificate(cert, settings, course, use_tte, per_course_tte)
            else:
                return self._render_reportlab_certificate(cert, settings, course, use_tte, per_course_tte)

        except Exception as e:
            return Response({'detail': f'Gagal generate PDF: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _cert_vals(self, course, settings):
        """Return effective certificate values: course override > global setting"""
        def img_b64(field):
            from django.conf import settings as django_settings
            import os, base64
            if not field or not getattr(field, 'name', None):
                return ''
            path = os.path.join(django_settings.MEDIA_ROOT, field.name)
            if not os.path.exists(path):
                return ''
            with open(path, 'rb') as f:
                data = f.read()
            ext = os.path.splitext(field.name)[1].lower().lstrip('.')
            mime = {'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'gif': 'image/gif', 'svg': 'image/svg+xml'}.get(ext, 'image/png')
            return f'data:{mime};base64,{base64.b64encode(data).decode()}'
        def img_field(field):
            from django.conf import settings as django_settings
            import os
            if not field or not getattr(field, 'name', None):
                return None
            path = os.path.join(django_settings.MEDIA_ROOT, field.name)
            if os.path.exists(path):
                return path
            return None

        return {
            'institution_name': course.cert_institution_name or settings.institution_name,
            'logo': course.cert_logo if course.cert_logo and course.cert_logo.name else settings.logo,
            'signature_name': course.cert_signature_name or settings.signature_name,
            'signature_title': course.cert_signature_title or settings.signature_title,
            'signature_image': course.cert_signature_image if course.cert_signature_image and course.cert_signature_image.name else settings.signature_image,
            'show_course_hours': course.cert_show_course_hours if course.cert_show_course_hours is not None else settings.show_course_hours,
            'img_b64': img_b64,
            'img_field': img_field,
        }

    def _render_html_certificate(self, cert, settings, course, use_tte, per_course_tte=None):
        from weasyprint import HTML
        from django.template import Template, Context

        vals = self._cert_vals(course, settings)

        issued = cert.issued_at.strftime('%d %B %Y') if cert.issued_at else '-'
        total_hours = getattr(course, 'duration_hours', 0)

        ctx = Context({
            'institution_name': vals['institution_name'],
            'user_name': cert.user_name,
            'course_title': cert.course_title,
            'certificate_number': cert.certificate_number,
            'issued_at': issued,
            'course_hours': str(total_hours) if total_hours else '',
            'show_course_hours': str(vals['show_course_hours']).lower(),
            'signature_name': vals['signature_name'],
            'signature_title': vals['signature_title'],
            'logo': vals['img_b64'](vals['logo']),
            'signature_image': vals['img_b64'](vals['signature_image']),
        })

        t = Template(template_html)
        html_str = t.render(ctx)
        pdf_bytes = HTML(string=html_str).write_pdf()

        if use_tte:
            try:
                pdf_bytes = self._sign_pdf_tte(pdf_bytes, per_course_tte or settings, is_course=bool(per_course_tte))
            except Exception:
                pass

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="sertifikat-{cert.certificate_number}.pdf"'
        return response

    def _render_reportlab_certificate(self, cert, settings, course, use_tte, per_course_tte=None):
        from reportlab.lib.pagesizes import landscape, A4
        from reportlab.lib.units import mm
        from reportlab.lib.colors import HexColor
        from reportlab.pdfgen import canvas
        from django.conf import settings as django_settings
        import os

        vals = self._cert_vals(course, settings)

        buf = BytesIO()
        w, h = landscape(A4)
        c = canvas.Canvas(buf, pagesize=landscape(A4))

        margin = 15 * mm

        bg_path = None
        if course.certificate_background and course.certificate_background.name:
            p = os.path.join(django_settings.MEDIA_ROOT, course.certificate_background.name)
            if os.path.exists(p):
                bg_path = p
        if not bg_path and settings.background and settings.background.name:
            p = os.path.join(django_settings.MEDIA_ROOT, settings.background.name)
            if os.path.exists(p):
                bg_path = p
        if bg_path:
            try:
                c.drawImage(bg_path, 0, 0, w, h, preserveAspectRatio=True, anchor='n')
            except Exception:
                pass

        c.setStrokeColor(HexColor('#1a365d'))
        c.setLineWidth(3)
        c.roundRect(margin, margin, w - 2*margin, h - 2*margin, 10, stroke=1, fill=0)

        c.setStrokeColor(HexColor('#2b6cb0'))
        c.setLineWidth(1)
        c.roundRect(margin + 5*mm, margin + 5*mm, w - 2*margin - 10*mm, h - 2*margin - 10*mm, 8, stroke=1, fill=0)

        c.setFillColor(HexColor('#1a365d'))
        c.setFont('Helvetica-Bold', 14)
        c.drawCentredString(w / 2, h - 35*mm, vals['institution_name'].upper())

        c.setFillColor(HexColor('#2b6cb0'))
        c.setFont('Helvetica-Bold', 28)
        c.drawCentredString(w / 2, h - 55*mm, 'SERTIFIKAT')

        c.setFillColor(HexColor('#4a5568'))
        c.setFont('Helvetica', 12)
        c.drawCentredString(w / 2, h - 68*mm, 'PENYELESAIAN KURSUS')

        c.setFillColor(HexColor('#2d3748'))
        c.setFont('Helvetica', 11)
        c.drawCentredString(w / 2, h - 85*mm, 'Diberikan kepada:')

        c.setFillColor(HexColor('#1a365d'))
        c.setFont('Helvetica-Bold', 22)
        c.drawCentredString(w / 2, h - 100*mm, cert.user_name)

        c.setFillColor(HexColor('#4a5568'))
        c.setFont('Helvetica', 11)
        c.drawCentredString(w / 2, h - 115*mm, 'Telah menyelesaikan kursus')

        c.setFillColor(HexColor('#2b6cb0'))
        c.setFont('Helvetica-Bold', 16)
        c.drawCentredString(w / 2, h - 130*mm, cert.course_title)

        y = h - 155*mm
        c.setFillColor(HexColor('#4a5568'))
        c.setFont('Helvetica', 10)

        issued = cert.issued_at.strftime('%d %B %Y') if cert.issued_at else '-'
        c.drawCentredString(w / 2, y, f'Diterbitkan: {issued}')
        y -= 6*mm
        c.drawCentredString(w / 2, y, f'No. {cert.certificate_number}')
        y -= 6*mm

        total_hours = getattr(course, 'duration_hours', 0)
        if total_hours and vals['show_course_hours']:
            c.drawCentredString(w / 2, y, f'Durasi: {total_hours} Jam Pelajaran')

        sig_y = 45*mm
        sig_found = False

        sig_field = vals['signature_image']
        if sig_field and getattr(sig_field, 'name', None):
            sig_path = vals['img_field'](sig_field)
            if sig_path:
                try:
                    sig_w = 50*mm
                    sig_h = 20*mm
                    c.drawImage(sig_path, w/2 - sig_w/2, sig_y + 12*mm - sig_h, sig_w, sig_h, preserveAspectRatio=True, anchor='n')
                    sig_found = True
                except Exception:
                    pass

        if not sig_found and vals['signature_name']:
            c.setStrokeColor(HexColor('#718096'))
            c.setLineWidth(0.5)
            line_w = 80*mm
            c.line(w/2 - line_w/2, sig_y + 12*mm, w/2 + line_w/2, sig_y + 12*mm)

        if vals['signature_name']:
            c.setFillColor(HexColor('#1a365d'))
            c.setFont('Helvetica-Bold', 11)
            c.drawCentredString(w / 2, sig_y + 8*mm, vals['signature_name'])
            c.setFont('Helvetica', 10)
            c.setFillColor(HexColor('#4a5568'))
            c.drawCentredString(w / 2, sig_y, vals['signature_title'] or '')

        logo_field = vals['logo']
        if logo_field and getattr(logo_field, 'name', None):
            logo_path = vals['img_field'](logo_field)
            if logo_path:
                try:
                    logo_w = 30*mm
                    logo_h = 30*mm
                    c.drawImage(logo_path, 25*mm, h - 42*mm - logo_h, logo_w, logo_h, preserveAspectRatio=True, anchor='n')
                except Exception:
                    pass

        c.showPage()
        c.save()

        buf.seek(0)

        if use_tte:
            try:
                pdf_data = self._sign_pdf_tte(buf.getvalue(), per_course_tte or settings, is_course=bool(per_course_tte))
                buf = BytesIO(pdf_data)
            except Exception:
                buf.seek(0)

        response = HttpResponse(buf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="sertifikat-{cert.certificate_number}.pdf"'
        return response

    def _sign_pdf_tte(self, pdf_bytes, tte_source, is_course=False):
        from django.conf import settings as django_settings
        from pyhanko.sign import signers, fields
        from pyhanko.pdf_utils.reader import PdfFileReader
        from pyhanko.pdf_utils.writer import PdfFileWriter
        import os

        if is_course:
            cert_path = os.path.join(django_settings.MEDIA_ROOT, tte_source['certificate'].name) if hasattr(tte_source['certificate'], 'name') else tte_source.get('certificate', '')
            key_path = os.path.join(django_settings.MEDIA_ROOT, tte_source['private_key'].name) if hasattr(tte_source.get('private_key'), 'name') else tte_source.get('private_key', '')
            passphrase = tte_source.get('passphrase', '').encode()
        else:
            cert_path = os.path.join(django_settings.MEDIA_ROOT, tte_source.tte_certificate.name) if hasattr(tte_source.tte_certificate, 'name') else ''
            key_path = os.path.join(django_settings.MEDIA_ROOT, tte_source.tte_private_key.name) if hasattr(tte_source.tte_private_key, 'name') else ''
            passphrase = tte_source.tte_passphrase.encode()

        if not os.path.exists(cert_path) or not os.path.exists(key_path):
            return pdf_bytes

        signer = signers.SimpleSigner.load(
            key_file=key_path,
            cert_file=cert_path,
            key_passphrase=passphrase,
        )

        input_buf = BytesIO(pdf_bytes)
        reader = PdfFileReader(input_buf)
        writer = PdfFileWriter(reader)

        out_buf = BytesIO()
        signers.sign_pdf(
            writer,
            signature_meta=signers.PdfSignatureMetadata(
                field_name='TTESignature',
                reason='Tanda Tangan Elektronik Sertifikat',
                location='ASN CorpU',
            ),
            signer=signer,
            output=out_buf,
        )

        return out_buf.getvalue()


@api_view(['GET', 'PUT', 'POST'])
@permission_classes([IsAuthenticated])
def certificate_settings(request):
    from apps.manajemen.helpers import check_permission
    if not check_permission(request.user, 'learning', 'certificates', 'edit'):
        return Response({'detail': 'Hanya admin'}, status=status.HTTP_403_FORBIDDEN)

    settings = CertificateSetting.get_settings()

    if request.method == 'GET':
        serializer = CertificateSettingSerializer(settings)
        return Response(serializer.data)

    if request.method == 'POST':
        action = request.data.get('action')
        if action == 'generate_tte':
            return _generate_tte_certificate(request, settings)
        if action == 'generate_course_tte':
            return _generate_course_tte(request)
        return Response({'detail': 'Aksi tidak dikenal'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = CertificateSettingSerializer(settings, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(CertificateSettingSerializer(settings).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def _generate_tte_certificate(request, settings):
    from cryptography import x509
    from cryptography.x509.oid import NameOID
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    import datetime
    import os
    from django.conf import settings as django_settings

    passphrase = request.data.get('passphrase', '').strip()
    if not passphrase:
        return Response({'detail': 'Passphrase wajib diisi'}, status=status.HTTP_400_BAD_REQUEST)

    org_name = settings.institution_name or 'ASN CorpU'

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, 'ID'),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, org_name),
        x509.NameAttribute(NameOID.COMMON_NAME, f'{org_name} - TTE'),
    ])

    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.datetime.now(datetime.timezone.utc))
        .not_valid_after(datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365*5))
        .add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True)
        .sign(key, hashes.SHA256())
    )

    tte_dir = os.path.join(django_settings.MEDIA_ROOT, 'certificates', 'tte')
    os.makedirs(tte_dir, exist_ok=True)

    pem_path = os.path.join(tte_dir, 'certificate.pem')
    key_path = os.path.join(tte_dir, 'private_key.pem')

    with open(pem_path, 'wb') as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))

    enc_key = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.BestAvailableEncryption(passphrase.encode()),
    )
    with open(key_path, 'wb') as f:
        f.write(enc_key)

    settings.tte_enabled = True
    settings.tte_passphrase = passphrase
    settings.tte_created_at = datetime.datetime.now(datetime.timezone.utc)
    settings.save(update_fields=['tte_enabled', 'tte_passphrase', 'tte_created_at'])

    return Response({
        'detail': 'Sertifikat TTE berhasil dibuat',
        'tte_enabled': True,
        'tte_created_at': settings.tte_created_at.isoformat(),
    })


def _generate_course_tte(request):
    from cryptography import x509
    from cryptography.x509.oid import NameOID
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from apps.learning.models import Course
    import datetime, os
    from django.conf import settings as django_settings
    from apps.manajemen.helpers import check_permission
    if not check_permission(request.user, 'learning', 'certificates', 'edit'):
        return Response({'detail': 'Hanya admin'}, status=status.HTTP_403_FORBIDDEN)

    course_id = request.data.get('course_id')
    passphrase = request.data.get('passphrase', '').strip()
    if not course_id or not passphrase:
        return Response({'detail': 'course_id dan passphrase wajib diisi'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        return Response({'detail': 'Course tidak ditemukan'}, status=status.HTTP_404_NOT_FOUND)

    org_name = course.cert_institution_name or course.title or 'Course'

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, 'ID'),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, org_name),
        x509.NameAttribute(NameOID.COMMON_NAME, f'{org_name} - TTE'),
    ])
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject).issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.datetime.now(datetime.timezone.utc))
        .not_valid_after(datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365*5))
        .add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True)
        .sign(key, hashes.SHA256())
    )

    tte_dir = os.path.join(django_settings.MEDIA_ROOT, 'certificates', 'tte', f'course_{course.id}')
    os.makedirs(tte_dir, exist_ok=True)
    pem_path = os.path.join(tte_dir, 'certificate.pem')
    key_path = os.path.join(tte_dir, 'private_key.pem')

    with open(pem_path, 'wb') as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))
    enc_key = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.BestAvailableEncryption(passphrase.encode()),
    )
    with open(key_path, 'wb') as f:
        f.write(enc_key)

    course.cert_tte_enabled = True
    course.cert_tte_passphrase = passphrase
    course.cert_tte_created_at = datetime.datetime.now(datetime.timezone.utc)
    course.save(update_fields=['cert_tte_enabled', 'cert_tte_passphrase', 'cert_tte_created_at'])

    return Response({
        'detail': f'Sertifikat TTE untuk {course.title} berhasil dibuat',
        'cert_tte_enabled': True,
        'cert_tte_created_at': course.cert_tte_created_at.isoformat(),
    })


class CourseRatingViewSet(viewsets.ModelViewSet):
    queryset = CourseRating.objects.select_related('course', 'user')
    serializer_class = CourseRatingSerializer
    permission_classes = [LearningPermission]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['-created_at', '-rating']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        course_slug = self.request.query_params.get('course_slug')
        if course_slug:
            qs = qs.filter(course__slug=course_slug)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_ratings(self, request):
        ratings = self.get_queryset().filter(user=request.user)
        serializer = CourseRatingSerializer(ratings, many=True, context={'request': request})
        return Response(serializer.data)


class CourseCommentViewSet(viewsets.ModelViewSet):
    queryset = CourseComment.objects.select_related('course', 'user').prefetch_related('replies')
    serializer_class = CourseCommentSerializer
    permission_classes = [LearningPermission]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['-created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        course_slug = self.request.query_params.get('course_slug')
        if course_slug:
            qs = qs.filter(course__slug=course_slug)
        only_top_level = self.request.query_params.get('only_top_level', 'true')
        if only_top_level.lower() == 'true':
            qs = qs.filter(parent_comment__isnull=True)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reply(self, request, pk=None):
        parent_comment = self.get_object()
        reply_text = request.data.get('comment')
        if not reply_text:
            return Response({'detail': 'Komentar tidak boleh kosong'}, status=status.HTTP_400_BAD_REQUEST)
        reply = CourseComment.objects.create(
            course=parent_comment.course,
            user=request.user,
            comment=reply_text,
            parent_comment=parent_comment
        )
        serializer = CourseCommentSerializer(reply)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        comment = self.get_object()
        like, created = CourseCommentLike.objects.get_or_create(comment=comment, user=request.user)
        return Response({'is_liked': True, 'created': created})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def dislike(self, request, pk=None):
        comment = self.get_object()
        deleted, _ = CourseCommentLike.objects.filter(comment=comment, user=request.user).delete()
        return Response({'is_liked': False, 'deleted': deleted > 0})
