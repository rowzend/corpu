from django.contrib import admin
from .models import (
    Course, Module, Lesson, Enrollment, LessonProgress,
    Quiz, QuizQuestion, QuizChoice, QuizAttempt, QuizAnswer, Certificate,
    CertificateSetting, CourseRating, CourseComment, CourseCommentLike, CourseLike
)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'instructor', 'level', 'status', 'is_featured', 'enrolled_count', 'created_at')
    list_filter = ('status', 'level', 'is_featured', 'created_at')
    search_fields = ('title', 'description', 'instructor__username')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('slug', 'enrolled_count', 'lesson_count', 'rating_avg', 'rating_count', 'created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {'fields': ('title', 'slug', 'description', 'short_description')}),
        ('Media', {'fields': ('thumbnail',)}),
        ('Settings', {'fields': ('level', 'duration_minutes', 'status', 'is_featured', 'instructor')}),
        ('Statistics', {'fields': ('enrolled_count', 'lesson_count', 'rating_avg', 'rating_count')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at', 'published_at')}),
    )


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order_index', 'created_at')
    list_filter = ('course', 'created_at')
    search_fields = ('title', 'course__title')


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'module', 'content_type', 'duration_minutes', 'order_index', 'is_free')
    list_filter = ('content_type', 'is_free', 'created_at')
    search_fields = ('title', 'module__title')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('slug', 'created_at', 'updated_at')


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'status', 'progress_percentage', 'enrolled_at')
    list_filter = ('status', 'enrolled_at')
    search_fields = ('user__username', 'course__title')
    readonly_fields = ('enrolled_at', 'completed_at', 'last_accessed_at')


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ('enrollment', 'lesson', 'is_completed', 'time_spent_minutes')
    list_filter = ('is_completed', 'completed_at')
    search_fields = ('enrollment__user__username', 'lesson__title')
    readonly_fields = ('completed_at',)


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'lesson', 'passing_score_percentage', 'max_attempts', 'total_questions')
    list_filter = ('is_randomized', 'created_at')
    search_fields = ('title', 'lesson__title')
    readonly_fields = ('total_questions', 'created_at', 'updated_at')


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ('question_text', 'quiz', 'question_type', 'order_index', 'points')
    list_filter = ('question_type', 'quiz')
    search_fields = ('question_text', 'quiz__title')


@admin.register(QuizChoice)
class QuizChoiceAdmin(admin.ModelAdmin):
    list_display = ('choice_text', 'question', 'is_correct', 'order_index')
    list_filter = ('is_correct', 'created_at')
    search_fields = ('choice_text', 'question__question_text')


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'quiz', 'score', 'passed', 'completed_at')
    list_filter = ('passed', 'completed_at')
    search_fields = ('user__username', 'quiz__title')
    readonly_fields = ('started_at', 'completed_at')


@admin.register(QuizAnswer)
class QuizAnswerAdmin(admin.ModelAdmin):
    list_display = ('attempt', 'question', 'is_correct', 'points_earned')
    list_filter = ('is_correct',)
    search_fields = ('attempt__user__username', 'question__question_text')


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('certificate_number', 'user_name', 'course_title', 'issued_at')
    list_filter = ('issued_at',)
    search_fields = ('user_name', 'certificate_number', 'course_title')
    readonly_fields = ('certificate_number', 'issued_at')


@admin.register(CertificateSetting)
class CertificateSettingAdmin(admin.ModelAdmin):
    list_display = ('institution_name', 'signature_name', 'updated_at')


@admin.register(CourseRating)
class CourseRatingAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('user__username', 'course__title')


@admin.register(CourseComment)
class CourseCommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'comment', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'course__title', 'comment')


@admin.register(CourseCommentLike)
class CourseCommentLikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'comment', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'comment__comment')


@admin.register(CourseLike)
class CourseLikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'course__title')
