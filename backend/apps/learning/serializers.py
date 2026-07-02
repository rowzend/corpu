from rest_framework import serializers
from .models import (
    Course, Module, Lesson, Enrollment, LessonProgress,
    Quiz, QuizQuestion, QuizChoice, QuizAttempt, QuizAnswer, Certificate,
    CertificateSetting, CourseRating, CourseComment, CourseLike, CourseCommentLike
)
from apps.knowledge.models import Category as KnowledgeCategory


class CategorySimpleSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True, allow_null=True)
    
    class Meta:
        model = KnowledgeCategory
        fields = ['id', 'name', 'slug', 'parent', 'parent_name', 'order_index', 'is_active']
        read_only_fields = ['slug']


class CourseListSerializer(serializers.ModelSerializer):
    instructor = serializers.StringRelatedField()
    modules = serializers.SerializerMethodField()
    category = CategorySimpleSerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=KnowledgeCategory.objects.filter(is_active=True),
        source='category',
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'short_description', 'thumbnail',
            'level', 'duration_minutes', 'status', 'is_featured', 'instructor',
            'category', 'category_id',
            'enrolled_count', 'lesson_count', 'rating_avg', 'rating_count',
            'certificate_background', 'certificate_template',
            'cert_institution_name', 'cert_logo', 'cert_signature_name', 'cert_signature_title',
            'cert_signature_image', 'cert_show_course_hours',
            'cert_tte_enabled', 'cert_tte_certificate', 'cert_tte_private_key', 'cert_tte_passphrase',
            'cert_number_prefix', 'cert_number_format',
            'modules', 'created_at', 'published_at'
        ]
        read_only_fields = ['slug', 'created_at', 'published_at', 'enrolled_count', 'lesson_count']

    def get_modules(self, obj):
        modules = obj.modules.all()
        return ModuleListSerializer(modules, many=True).data


class ModuleListSerializer(serializers.ModelSerializer):
    lesson_count = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = ['id', 'course', 'title', 'description', 'order_index', 'lesson_count', 'created_at']

    def get_lesson_count(self, obj):
        return obj.lessons.count()


class ModuleSerializer(serializers.ModelSerializer):
    lessons = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = ['id', 'course', 'title', 'description', 'order_index', 'lessons', 'created_at', 'updated_at']

    def get_lessons(self, obj):
        lessons = obj.lessons.all().order_by('order_index')
        return LessonListSerializer(lessons, many=True).data


class LessonListSerializer(serializers.ModelSerializer):
    quiz_id = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            'id', 'module', 'title', 'slug', 'content_type', 'duration_minutes',
            'order_index', 'is_free', 'created_at', 'quiz_id',
            'content', 'video_url', 'video_embed_id', 'file_url', 'external_url'
        ]
        read_only_fields = ['slug']

    def get_quiz_id(self, obj):
        quiz = obj.quizzes.first()
        return quiz.id if quiz else None


class LessonSerializer(serializers.ModelSerializer):
    quiz_id = serializers.SerializerMethodField()
    time_spent_minutes = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            'id', 'module', 'title', 'slug', 'content', 'content_type',
            'video_url', 'video_embed_id', 'file_url', 'external_url',
            'duration_minutes', 'order_index', 'is_free', 'created_at', 'updated_at',
            'quiz_id', 'time_spent_minutes'
        ]
        read_only_fields = ['slug']

    def get_quiz_id(self, obj):
        quiz = obj.quizzes.first()
        return quiz.id if quiz else None

    def get_time_spent_minutes(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = LessonProgress.objects.filter(
                enrollment__user=request.user,
                lesson=obj
            ).first()
            if progress:
                return progress.time_spent_minutes
        return 0

    def validate_duration_minutes(self, value):
        if value < 0:
            raise serializers.ValidationError('Durasi tidak boleh negatif')
        return value
    
    def validate(self, data):
        """Validate required fields based on content_type"""
        content_type = data.get('content_type')
        
        # Untuk update, ambil content_type dari instance jika tidak ada di data
        if not content_type and self.instance:
            content_type = self.instance.content_type
        
        if content_type == 'link':
            external_url = data.get('external_url')
            if not external_url or not external_url.strip():
                raise serializers.ValidationError({
                    'external_url': 'URL eksternal harus diisi untuk tipe konten link'
                })
            if not (external_url.startswith('http://') or external_url.startswith('https://')):
                raise serializers.ValidationError({
                    'external_url': 'URL harus dimulai dengan http:// atau https://'
                })
        
        elif content_type == 'document':
            # Document menggunakan external_url untuk URL string
            external_url = data.get('external_url')
            if external_url and not (external_url.startswith('http://') or external_url.startswith('https://')):
                raise serializers.ValidationError({
                    'external_url': 'URL dokumen harus dimulai dengan http:// atau https://'
                })
        
        elif content_type == 'video':
            video_url = data.get('video_url')
            if video_url and not (video_url.startswith('http://') or video_url.startswith('https://')):
                raise serializers.ValidationError({
                    'video_url': 'URL video harus dimulai dengan http:// atau https://'
                })
        
        return data


class CourseDetailSerializer(serializers.ModelSerializer):
    instructor = serializers.StringRelatedField()
    modules = ModuleSerializer(many=True, read_only=True)
    is_enrolled = serializers.SerializerMethodField()
    category = CategorySimpleSerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=KnowledgeCategory.objects.filter(is_active=True),
        source='category',
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'short_description', 'thumbnail',
            'level', 'duration_minutes', 'status', 'is_featured', 'instructor',
            'category', 'category_id',
            'enrolled_count', 'lesson_count', 'rating_avg', 'rating_count',
            'certificate_background', 'certificate_template',
            'cert_institution_name', 'cert_logo', 'cert_signature_name', 'cert_signature_title',
            'cert_signature_image', 'cert_show_course_hours',
            'modules', 'is_enrolled', 'created_at', 'updated_at', 'published_at'
        ]
        read_only_fields = ['slug', 'created_at', 'updated_at', 'published_at', 'enrolled_count', 'lesson_count']

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Enrollment.objects.filter(course=obj, user=request.user).exists()
        return False


class EnrollmentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_slug = serializers.CharField(source='course.slug', read_only=True)
    course_thumbnail = serializers.ImageField(source='course.thumbnail', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    course_duration_minutes = serializers.SerializerMethodField()
    completed_duration_minutes = serializers.SerializerMethodField()
    remaining_duration_minutes = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            'id', 'course', 'course_title', 'course_slug', 'course_thumbnail',
            'user', 'user_name', 'user_username',
            'status', 'progress_percentage', 'has_certificate',
            'course_duration_minutes', 'completed_duration_minutes', 'remaining_duration_minutes',
            'enrolled_at', 'completed_at', 'last_accessed_at'
        ]
        read_only_fields = ['enrolled_at', 'completed_at', 'last_accessed_at', 'progress_percentage']

    def get_course_duration_minutes(self, obj):
        return obj.course.duration_minutes or 0

    def get_completed_duration_minutes(self, obj):
        completed_ids = LessonProgress.objects.filter(
            enrollment=obj, is_completed=True
        ).values_list('lesson_id', flat=True)
        lessons = Lesson.objects.filter(module__course=obj.course, id__in=completed_ids)
        return sum(l.duration_minutes or 0 for l in lessons)

    def get_remaining_duration_minutes(self, obj):
        return max(0, self.get_course_duration_minutes(obj) - self.get_completed_duration_minutes(obj))

    def validate_status(self, value):
        valid_statuses = ['active', 'completed', 'dropped']
        if value not in valid_statuses:
            raise serializers.ValidationError(f'Status harus salah satu dari: {", ".join(valid_statuses)}')
        return value


class EnrollmentDetailSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            'id', 'course', 'user', 'user_name', 'user_username',
            'status', 'progress_percentage', 'has_certificate',
            'progress', 'enrolled_at', 'completed_at', 'last_accessed_at'
        ]

    def get_progress(self, obj):
        lessons = Lesson.objects.filter(module__course=obj.course)
        total = lessons.count()
        completed = LessonProgress.objects.filter(
            enrollment=obj, is_completed=True
        ).count()
        return {
            'completed_lessons': completed,
            'total_lessons': total,
            'percentage': int((completed / total * 100)) if total > 0 else 0
        }


class LessonProgressSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    lesson_slug = serializers.CharField(source='lesson.slug', read_only=True)

    class Meta:
        model = LessonProgress
        fields = [
            'id', 'enrollment', 'lesson', 'lesson_title', 'lesson_slug',
            'is_completed', 'completed_at', 'time_spent_minutes'
        ]
        read_only_fields = ['completed_at']

    def create(self, validated_data):
        enrollment = validated_data['enrollment']
        lesson = validated_data['lesson']
        progress, created = LessonProgress.objects.update_or_create(
            enrollment=enrollment,
            lesson=lesson,
            defaults={
                'is_completed': validated_data.get('is_completed', True),
                'time_spent_minutes': validated_data.get('time_spent_minutes', 0),
            }
        )
        if progress.is_completed and not progress.completed_at:
            from django.utils import timezone
            progress.completed_at = timezone.now()
            progress.save(update_fields=['completed_at'])
        return progress


class QuizChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizChoice
        fields = ['id', 'choice_text', 'is_correct', 'order_index']


class QuizChoicePublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizChoice
        fields = ['id', 'choice_text', 'order_index']


class QuizQuestionSerializer(serializers.ModelSerializer):
    choices = serializers.SerializerMethodField()

    class Meta:
        model = QuizQuestion
        fields = [
            'id', 'quiz', 'question_text', 'question_type', 'order_index',
            'points', 'essay_word_limit', 'choices', 'created_at'
        ]
        read_only_fields = ['created_at']

    def get_choices(self, obj):
        # Admin view: always ordered by order_index for correct answer visibility
        choices = obj.choices.all().order_by('order_index')
        return QuizChoiceSerializer(choices, many=True).data


class QuizQuestionWriteSerializer(serializers.ModelSerializer):
    choices = QuizChoiceSerializer(many=True, required=False)

    class Meta:
        model = QuizQuestion
        fields = [
            'id', 'quiz', 'question_text', 'question_type', 'order_index',
            'points', 'essay_word_limit', 'choices'
        ]

    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])
        question = QuizQuestion.objects.create(**validated_data)
        for choice_data in choices_data:
            QuizChoice.objects.create(question=question, **choice_data)
        return question

    def update(self, instance, validated_data):
        choices_data = validated_data.pop('choices', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if choices_data is not None:
            instance.choices.all().delete()
            for choice_data in choices_data:
                QuizChoice.objects.create(question=instance, **choice_data)
        return instance


class QuizQuestionPublicSerializer(serializers.ModelSerializer):
    choices = serializers.SerializerMethodField()

    class Meta:
        model = QuizQuestion
        fields = [
            'id', 'question_text', 'question_type', 'order_index',
            'points', 'essay_word_limit', 'choices'
        ]

    def get_choices(self, obj):
        if obj.quiz and obj.quiz.is_randomized and not self.context.get('no_randomize', False):
            choices = obj.choices.all().order_by('?')
        else:
            choices = obj.choices.all().order_by('order_index')
        return QuizChoicePublicSerializer(choices, many=True).data


class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = [
            'id', 'lesson', 'title', 'description', 'passing_score_percentage',
            'max_attempts', 'is_randomized', 'time_limit_minutes', 'retry_cooldown_minutes', 'total_questions',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['total_questions', 'created_at', 'updated_at']


class QuizDetailSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)

    class Meta:
        model = Quiz
        fields = [
            'id', 'lesson', 'lesson_title', 'title', 'description',
            'passing_score_percentage', 'max_attempts', 'is_randomized',
            'time_limit_minutes', 'retry_cooldown_minutes', 'total_questions', 'questions', 'created_at', 'updated_at'
        ]
        read_only_fields = ['total_questions']

    def validate_lesson(self, value):
        if value.content_type != 'quiz':
            raise serializers.ValidationError('Quiz hanya bisa dikaitkan dengan pelajaran bertipe "Kuis"')
        return value

    def validate_passing_score_percentage(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError('Nilai lulus harus antara 0-100')
        return value


class QuizAttemptSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz', 'quiz_title', 'user', 'user_name', 'user_username',
            'score', 'total_questions', 'correct_answers', 'passed',
            'status', 'draft_answers',
            'started_at', 'completed_at', 'time_spent'
        ]
        read_only_fields = ['started_at', 'completed_at', 'score', 'total_questions', 'correct_answers', 'passed']


class QuizAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    question_type = serializers.CharField(source='question.question_type', read_only=True)
    selected_choice_text = serializers.CharField(source='selected_choice.choice_text', read_only=True, allow_null=True)
    attempt_user_name = serializers.CharField(source='attempt.user.get_full_name', read_only=True, default='')
    attempt_user_username = serializers.CharField(source='attempt.user.username', read_only=True, default='')

    class Meta:
        model = QuizAnswer
        fields = [
            'id', 'attempt', 'question', 'question_text', 'question_type',
            'selected_choice', 'selected_choice_text', 'is_correct_bool', 'essay_answer',
            'is_correct', 'points_earned', 'is_graded', 'grader_notes', 'graded_at',
            'attempt_user_name', 'attempt_user_username'
        ]


class QuizSaveDraftSerializer(serializers.Serializer):
    draft_answers = serializers.ListField(child=serializers.DictField(), required=False, default=list)
    time_spent = serializers.IntegerField(default=0, required=False)


class QuizAnswerGradeSerializer(serializers.Serializer):
    answer_id = serializers.IntegerField()
    is_correct = serializers.BooleanField()
    points_earned = serializers.IntegerField(min_value=0)
    grader_notes = serializers.CharField(required=False, allow_blank=True)


class QuizAttemptDetailSerializer(serializers.ModelSerializer):
    answers = QuizAnswerSerializer(many=True, read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)

    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz', 'quiz_title', 'user',
            'score', 'total_questions', 'correct_answers', 'passed',
            'status', 'draft_answers',
            'started_at', 'completed_at', 'answers'
        ]


class CertificateSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='enrollment.course.title', read_only=True)
    course_slug = serializers.CharField(source='enrollment.course.slug', read_only=True)
    user_name = serializers.CharField(source='enrollment.user.get_full_name', read_only=True)
    user_username = serializers.CharField(source='enrollment.user.username', read_only=True)

    class Meta:
        model = Certificate
        fields = [
            'id', 'enrollment', 'certificate_number', 'user_name', 'user_username',
            'course_title', 'course_slug', 'issued_at', 'pdf_url', 'is_active'
        ]
        read_only_fields = ['certificate_number', 'issued_at']

    def create(self, validated_data):
        enrollment = validated_data['enrollment']
        validated_data['user_name'] = enrollment.user.get_full_name() or enrollment.user.username
        validated_data['course_title'] = enrollment.course.title
        return super().create(validated_data)


class CertificateSettingSerializer(serializers.ModelSerializer):
    tte_passphrase = serializers.CharField(write_only=True, required=False, allow_blank=True)
    tte_has_certificate = serializers.SerializerMethodField(read_only=True)
    cert_number_prefix = serializers.CharField(required=False, allow_blank=True)
    cert_number_format = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = CertificateSetting
        fields = '__all__'
        read_only_fields = ['id', 'updated_at', 'tte_certificate', 'tte_private_key', 'tte_created_at']

    def get_tte_has_certificate(self, obj):
        return bool(obj.tte_certificate and obj.tte_certificate.name)


class CourseRatingSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = CourseRating
        fields = [
            'id', 'course', 'user', 'user_name', 'user_username',
            'rating', 'comment', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating harus antara 1-5')
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        course = validated_data['course']
        rating, created = CourseRating.objects.update_or_create(
            course=course, user=user,
            defaults={
                'rating': validated_data['rating'],
                'comment': validated_data.get('comment', ''),
            }
        )
        return rating


class CourseCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    reply_count = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = CourseComment
        fields = [
            'id', 'course', 'user', 'user_name', 'user_username',
            'comment', 'parent_comment', 'reply_count', 'replies',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']

    def get_reply_count(self, obj):
        return obj.replies.count()

    def get_replies(self, obj):
        if obj.parent_comment is None:
            replies = obj.get_replies()
            return CourseCommentSerializer(replies, many=True).data
        return []

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


class CourseLikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseLike
        fields = ['id', 'course', 'user', 'created_at']
        read_only_fields = ['user', 'created_at']


class CourseCommentLikeSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = CourseCommentLike
        fields = ['id', 'comment', 'user', 'user_name', 'created_at']
        read_only_fields = ['user', 'created_at']
