from django.db import models
from django.db.models import Q
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.text import slugify
from django.utils import timezone
from apps.accounts.models import User
from apps.knowledge.models import Category as KnowledgeCategory
from core.models import Notification


class Course(models.Model):
    LEVEL_CHOICES = [
        ('beginner', 'Pemula'),
        ('intermediate', 'Menengah'),
        ('advanced', 'Lanjutan'),
    ]
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Dipublikasikan'),
        ('archived', 'Diarsipkan'),
    ]

    id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=255, verbose_name='Judul Kursus')
    slug = models.SlugField(max_length=255, unique=True, verbose_name='Slug')
    description = models.TextField(verbose_name='Deskripsi')
    short_description = models.CharField(max_length=500, blank=True, null=True, verbose_name='Deskripsi Singkat')

    thumbnail = models.URLField(max_length=500, blank=True, null=True, verbose_name='URL Thumbnail')

    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner', verbose_name='Level')
    duration_minutes = models.IntegerField(default=0, validators=[MinValueValidator(0)], verbose_name='Durasi (Menit)')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='Status')
    is_featured = models.BooleanField(default=False, verbose_name='Featured')

    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='teaching_courses', verbose_name='Instruktur')
    category = models.ForeignKey(
        KnowledgeCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='courses',
        verbose_name='Kategori Learning'
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Diupdate Pada')
    published_at = models.DateTimeField(blank=True, null=True, verbose_name='Dipublikasi Pada')

    enrolled_count = models.IntegerField(default=0, verbose_name='Jumlah Pendaftar')
    lesson_count = models.IntegerField(default=0, verbose_name='Jumlah Pelajaran')
    certificate_background = models.ImageField(upload_to='certificates/', blank=True, null=True, verbose_name='Background Sertifikat')
    certificate_template = models.FileField(upload_to='certificates/templates/', blank=True, null=True, verbose_name='Template Sertifikat (HTML)')
    cert_institution_name = models.CharField(max_length=255, blank=True, default='', verbose_name='Nama Institusi (Override)')
    cert_logo = models.ImageField(upload_to='certificates/', blank=True, null=True, verbose_name='Logo (Override)')
    cert_signature_name = models.CharField(max_length=255, blank=True, default='', verbose_name='Nama Penandatangan (Override)')
    cert_signature_title = models.CharField(max_length=255, blank=True, default='', verbose_name='Jabatan Penandatangan (Override)')
    cert_signature_image = models.ImageField(upload_to='certificates/', blank=True, null=True, verbose_name='Tanda Tangan (Override)')
    cert_show_course_hours = models.BooleanField(null=True, blank=True, verbose_name='Tampilkan Durasi (Override)')
    cert_tte_enabled = models.BooleanField(default=False, verbose_name='TTE Khusus')
    cert_tte_certificate = models.FileField(upload_to='certificates/tte/', blank=True, null=True, verbose_name='Sertifikat TTE (Khusus)')
    cert_tte_private_key = models.FileField(upload_to='certificates/tte/', blank=True, null=True, verbose_name='Private Key TTE (Khusus)')
    cert_tte_passphrase = models.CharField(max_length=512, blank=True, default='', verbose_name='Passphrase TTE (Khusus)')
    cert_tte_created_at = models.DateTimeField(blank=True, null=True, verbose_name='TTE Dibuat (Khusus)')
    cert_number_prefix = models.CharField(max_length=50, blank=True, default='', verbose_name='Prefix Nomor (Override)')
    cert_number_format = models.CharField(max_length=100, blank=True, default='', verbose_name='Format Nomor (Override)')
    rating_avg = models.FloatField(default=0, validators=[MinValueValidator(0), MaxValueValidator(5)], verbose_name='Rating Rata-rata')
    rating_count = models.IntegerField(default=0, verbose_name='Jumlah Rating')

    class Meta:
        db_table = 'learning_courses'
        verbose_name = 'Kursus'
        verbose_name_plural = 'Kursus'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['status']),
            models.Index(fields=['instructor']),
            models.Index(fields=['is_featured']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        if not self.pk:
            original_slug = self.slug
            counter = 1
            while Course.objects.filter(slug=self.slug).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1
        super().save(*args, **kwargs)

    def publish(self):
        if self.status != 'draft':
            raise ValueError('Only draft courses can be published')
        self.status = 'published'
        self.published_at = timezone.now()
        self.save(update_fields=['status', 'published_at'])

    def archive(self):
        self.status = 'archived'
        self.save(update_fields=['status'])

    def update_enrolled_count(self):
        self.enrolled_count = self.enrollments.count()
        self.save(update_fields=['enrolled_count'])

    def update_lesson_count(self):
        self.lesson_count = Lesson.objects.filter(module__course=self).count()
        self.save(update_fields=['lesson_count'])

    def update_rating(self):
        ratings = self.ratings.all()
        if ratings.exists():
            from django.db.models import Avg
            self.rating_avg = ratings.aggregate(Avg('rating'))['rating__avg']
            self.rating_count = ratings.count()
        else:
            self.rating_avg = 0
            self.rating_count = 0
        self.save(update_fields=['rating_avg', 'rating_count'])

    def get_progress_for_user(self, user):
        try:
            enrollment = Enrollment.objects.get(course=self, user=user)
            return enrollment.progress_percentage
        except Enrollment.DoesNotExist:
            return 0


class Module(models.Model):
    id = models.BigAutoField(primary_key=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules', verbose_name='Kursus')
    title = models.CharField(max_length=255, verbose_name='Judul Modul')
    description = models.TextField(blank=True, null=True, verbose_name='Deskripsi')
    order_index = models.IntegerField(default=0, verbose_name='Urutan')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Diupdate Pada')

    class Meta:
        db_table = 'learning_modules'
        verbose_name = 'Modul'
        verbose_name_plural = 'Modul'
        ordering = ['order_index', 'created_at']
        unique_together = ['course', 'order_index']
        indexes = [
            models.Index(fields=['course']),
        ]

    def __str__(self):
        return f"{self.course.title} - {self.title}"

    def get_lesson_count(self):
        return self.lessons.count()


class Lesson(models.Model):
    CONTENT_TYPE_CHOICES = [
        ('article', 'Artikel'),
        ('video', 'Video'),
        ('document', 'Dokumen'),
        ('link', 'Link Eksternal'),
        ('quiz', 'Kuis'),
    ]

    id = models.BigAutoField(primary_key=True)
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='lessons', verbose_name='Modul')
    title = models.CharField(max_length=255, verbose_name='Judul Pelajaran')
    slug = models.SlugField(max_length=255, verbose_name='Slug')

    content = models.TextField(blank=True, null=True, verbose_name='Konten')
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES, default='article', verbose_name='Tipe Konten')

    video_url = models.URLField(blank=True, null=True, verbose_name='URL Video')
    video_embed_id = models.CharField(max_length=100, blank=True, null=True, verbose_name='Video Embed ID')
    file_url = models.FileField(upload_to='lessons/', blank=True, null=True, verbose_name='File')
    external_url = models.URLField(blank=True, null=True, verbose_name='URL Eksternal')

    duration_minutes = models.IntegerField(default=0, validators=[MinValueValidator(0)], verbose_name='Durasi (Menit)')
    order_index = models.IntegerField(default=0, verbose_name='Urutan')
    is_free = models.BooleanField(default=True, verbose_name='Gratis')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Diupdate Pada')

    class Meta:
        db_table = 'learning_lessons'
        verbose_name = 'Pelajaran'
        verbose_name_plural = 'Pelajaran'
        ordering = ['order_index', 'created_at']
        unique_together = ['module', 'slug']
        indexes = [
            models.Index(fields=['module']),
            models.Index(fields=['content_type']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        if not self.pk:
            original_slug = self.slug
            counter = 1
            while Lesson.objects.filter(module=self.module, slug=self.slug).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1
        super().save(*args, **kwargs)

    def get_next_lesson(self):
        return Lesson.objects.filter(
            module__course=self.module.course,
            order_index__gt=self.order_index
        ).order_by('order_index').first()

    def get_previous_lesson(self):
        return Lesson.objects.filter(
            module__course=self.module.course,
            order_index__lt=self.order_index
        ).order_by('-order_index').first()

    def are_all_previous_completed(self, enrollment):
        """Check if all lessons before this one (by module→lesson order) are completed."""
        course = self.module.course
        all_modules = course.modules.all().order_by('order_index', 'created_at')
        completed_ids = set(
            enrollment.lesson_progress.filter(is_completed=True).values_list('lesson_id', flat=True)
        )
        for mod in all_modules:
            for l in mod.lessons.all().order_by('order_index', 'created_at'):
                if l.id == self.id:
                    return True
                if l.id not in completed_ids:
                    return False
        return True

    def has_active_timed_quiz(self, enrollment):
        """
        Check if there is an active timed quiz attempt in this course that is
        still within time limit (started but not completed). If so, user
        must finish that quiz before accessing any other lesson.
        """
        from django.utils import timezone
        course = self.module.course
        active = QuizAttempt.objects.filter(
            enrollment=enrollment,
            status='draft',
            quiz__lesson__module__course=course,
            quiz__time_limit_minutes__gt=0,
        ).first()
        if not active:
            return False
        elapsed = (timezone.now() - active.started_at).total_seconds()
        if elapsed > active.quiz.time_limit_minutes * 60:
            active.completed_at = timezone.now()
            active.save(update_fields=['completed_at'])
            return False
        return True


class Enrollment(models.Model):
    STATUS_CHOICES = [
        ('active', 'Aktif'),
        ('completed', 'Selesai'),
        ('dropped', 'Berhenti'),
    ]

    id = models.BigAutoField(primary_key=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments', verbose_name='Kursus')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='course_enrollments', verbose_name='Pengguna')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name='Status')
    progress_percentage = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)], verbose_name='Progres (%)')
    has_certificate = models.BooleanField(default=False, verbose_name='Memiliki Sertifikat')

    enrolled_at = models.DateTimeField(auto_now_add=True, verbose_name='Mendaftar Pada')
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name='Selesai Pada')
    last_accessed_at = models.DateTimeField(auto_now=True, verbose_name='Terakhir Diakses')

    class Meta:
        db_table = 'learning_enrollments'
        verbose_name = 'Pendaftaran'
        verbose_name_plural = 'Pendaftaran'
        unique_together = ['course', 'user']
        ordering = ['-enrolled_at']
        indexes = [
            models.Index(fields=['course']),
            models.Index(fields=['user']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.user} - {self.course}"

    def update_progress(self):
        lessons = Lesson.objects.filter(module__course=self.course)
        total = lessons.count()
        if total == 0:
            self.progress_percentage = 0
        else:
            completed = LessonProgress.objects.filter(
                enrollment=self, is_completed=True
            ).count()
            self.progress_percentage = int((completed / total) * 100)

        # Check if all quizzes in course are passed
        all_quizzes_passed = True
        course_quizzes = Quiz.objects.filter(lesson__module__course=self.course)
        for quiz in course_quizzes:
            if not QuizAttempt.objects.filter(quiz=quiz, user=self.user, passed=True).exists():
                all_quizzes_passed = False
                break

        if self.progress_percentage >= 100 and all_quizzes_passed:
            self.status = 'completed'
            if not self.completed_at:
                self.completed_at = timezone.now()
            self.has_certificate = True
            certificate, created = Certificate.objects.get_or_create(
                enrollment=self,
                defaults={
                    'user_name': self.user.get_full_name() or self.user.username,
                    'course_title': self.course.title,
                }
            )
            if created:
                Notification.objects.create(
                    user=self.user,
                    notification_type='course_completed',
                    title=f'Kursus "{self.course.title}" Selesai!',
                    message=f'Selamat! Anda telah menyelesaikan seluruh materi. Sertifikat Anda telah diterbitkan.',
                    link='/courses/certificates',
                )
        elif self.progress_percentage >= 100 and not all_quizzes_passed:
            # Progress 100% but quizzes not all passed - keep as active, no certificate
            self.status = 'active'
            self.has_certificate = False

        self.save(update_fields=['progress_percentage', 'status', 'completed_at', 'has_certificate'])

    def mark_completed(self):
        # Check if all quizzes in course are passed
        all_quizzes_passed = True
        course_quizzes = Quiz.objects.filter(lesson__module__course=self.course)
        for quiz in course_quizzes:
            if not QuizAttempt.objects.filter(quiz=quiz, user=self.user, passed=True).exists():
                all_quizzes_passed = False
                break

        self.status = 'completed' if all_quizzes_passed else 'active'
        self.progress_percentage = 100
        self.completed_at = timezone.now()
        self.has_certificate = all_quizzes_passed
        if all_quizzes_passed:
            Certificate.objects.get_or_create(
                enrollment=self,
                defaults={
                    'user_name': self.user.get_full_name() or self.user.username,
                    'course_title': self.course.title,
                }
            )
        self.save(update_fields=['status', 'progress_percentage', 'completed_at', 'has_certificate'])


class LessonProgress(models.Model):
    id = models.BigAutoField(primary_key=True)
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='lesson_progress', verbose_name='Pendaftaran')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, verbose_name='Pelajaran')

    is_completed = models.BooleanField(default=False, verbose_name='Selesai')
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name='Selesai Pada')
    time_spent_minutes = models.FloatField(default=0, validators=[MinValueValidator(0)], verbose_name='Waktu (Menit)')

    class Meta:
        db_table = 'learning_lesson_progress'
        verbose_name = 'Progres Pelajaran'
        verbose_name_plural = 'Progres Pelajaran'
        unique_together = ['enrollment', 'lesson']
        indexes = [
            models.Index(fields=['enrollment']),
            models.Index(fields=['is_completed']),
        ]

    def __str__(self):
        return f"{self.enrollment.user} - {self.lesson.title}"

    def mark_completed(self):
        self.is_completed = True
        self.completed_at = timezone.now()
        self.save(update_fields=['is_completed', 'completed_at'])
        self.enrollment.update_progress()


class Quiz(models.Model):
    id = models.BigAutoField(primary_key=True)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='quizzes', verbose_name='Pelajaran')

    title = models.CharField(max_length=255, verbose_name='Judul Kuis')
    description = models.TextField(blank=True, null=True, verbose_name='Deskripsi')
    passing_score_percentage = models.IntegerField(default=70, validators=[MinValueValidator(0), MaxValueValidator(100)], verbose_name='Nilai Lulus (%)')
    max_attempts = models.IntegerField(default=1, verbose_name='Maksimal Percobaan', help_text='-1 untuk tidak terbatas')
    is_randomized = models.BooleanField(default=False, verbose_name='Acak Pertanyaan')
    time_limit_minutes = models.IntegerField(default=0, validators=[MinValueValidator(0)], verbose_name='Batas Waktu (Menit)',
        help_text='0 = tanpa batas waktu')
    retry_cooldown_minutes = models.IntegerField(default=0, validators=[MinValueValidator(0)], verbose_name='Cooldown sebelum retry (menit)',
        help_text='0 = tidak ada cooldown. 1440 = 24 jam (jam yang sama besok)')

    total_questions = models.IntegerField(default=0, verbose_name='Jumlah Pertanyaan')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Diupdate Pada')

    class Meta:
        db_table = 'learning_quizzes'
        verbose_name = 'Kuis'
        verbose_name_plural = 'Kuis'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['lesson']),
        ]

    def __str__(self):
        return self.title

    def update_total_questions(self):
        self.total_questions = self.questions.count()
        self.save(update_fields=['total_questions'])

    def can_user_attempt(self, user):
        can, _ = self.can_user_attempt_detail(user)
        return can

    def get_cooldown_remaining_seconds(self, user):
        """Return remaining cooldown in seconds, 0 if no cooldown active"""
        if self.retry_cooldown_minutes <= 0:
            return 0
        from django.utils import timezone
        from datetime import timedelta
        attempts = QuizAttempt.objects.filter(quiz=self, user=user, status='completed', passed=False)
        last_failed = attempts.order_by('-completed_at').first()
        if last_failed and last_failed.completed_at:
            cooldown_end = last_failed.completed_at + timedelta(minutes=self.retry_cooldown_minutes)
            if timezone.now() < cooldown_end:
                return int((cooldown_end - timezone.now()).total_seconds())
        return 0

    def can_user_attempt_detail(self, user):
        """Return (can_attempt: bool, error_message: str)"""
        if self.max_attempts == -1:
            return True, ''
        # Only count completed attempts (drafts don't count toward limit)
        attempts = QuizAttempt.objects.filter(quiz=self, user=user, status='completed')
        attempts_count = attempts.count()
        if attempts_count >= self.max_attempts:
            return False, 'Batas percobaan telah habis'
        
        # Cek cooldown dari attempt terakhir yang GAGAL
        if self.retry_cooldown_minutes > 0:
            last_failed = attempts.filter(passed=False).order_by('-completed_at').first()
            if last_failed and last_failed.completed_at:
                from django.utils import timezone
                from datetime import timedelta
                cooldown_end = last_failed.completed_at + timedelta(minutes=self.retry_cooldown_minutes)
                if timezone.now() < cooldown_end:
                    remaining = cooldown_end - timezone.now()
                    hours = int(remaining.total_seconds() // 3600)
                    minutes = int((remaining.total_seconds() % 3600) // 60)
                    if hours > 0:
                        return False, f'Cooldown aktif. Tunggu {hours} jam {minutes} menit lagi.'
                    else:
                        return False, f'Cooldown aktif. Tunggu {minutes} menit lagi.'
        return True, ''

    def get_questions_ordered(self):
        if self.is_randomized:
            return self.questions.all().order_by('?')
        return self.questions.all().order_by('order_index')


class QuizQuestion(models.Model):
    QUESTION_TYPE_CHOICES = [
        ('multiple_choice', 'Pilihan Ganda'),
        ('true_false', 'Benar/Salah'),
        ('essay', 'Esai'),
    ]

    id = models.BigAutoField(primary_key=True)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions', verbose_name='Kuis')

    question_text = models.TextField(verbose_name='Teks Pertanyaan')
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, default='multiple_choice', verbose_name='Tipe Pertanyaan')
    order_index = models.IntegerField(default=0, verbose_name='Urutan')

    points = models.IntegerField(default=1, validators=[MinValueValidator(1)], verbose_name='Poin')

    essay_word_limit = models.IntegerField(blank=True, null=True, validators=[MinValueValidator(1)], verbose_name='Batas Kata')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Diupdate Pada')

    class Meta:
        db_table = 'learning_quiz_questions'
        verbose_name = 'Pertanyaan Kuis'
        verbose_name_plural = 'Pertanyaan Kuis'
        ordering = ['order_index', 'created_at']
        indexes = [
            models.Index(fields=['quiz']),
            models.Index(fields=['question_type']),
        ]

    def __str__(self):
        return self.question_text[:50]

    def get_correct_choices(self):
        return self.choices.filter(is_correct=True)


class QuizChoice(models.Model):
    id = models.BigAutoField(primary_key=True)
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE, related_name='choices', verbose_name='Pertanyaan')

    choice_text = models.TextField(verbose_name='Teks Pilihan')
    is_correct = models.BooleanField(default=False, verbose_name='Benar')
    order_index = models.IntegerField(default=0, verbose_name='Urutan')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')

    class Meta:
        db_table = 'learning_quiz_choices'
        verbose_name = 'Pilihan Jawaban'
        verbose_name_plural = 'Pilihan Jawaban'
        ordering = ['order_index', 'created_at']
        indexes = [
            models.Index(fields=['question']),
            models.Index(fields=['is_correct']),
        ]

    def __str__(self):
        return self.choice_text[:50]


class QuizAttempt(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('completed', 'Completed'),
    ]

    id = models.BigAutoField(primary_key=True)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts', verbose_name='Kuis')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts', verbose_name='Pengguna')
    enrollment = models.ForeignKey(Enrollment, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Pendaftaran')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='Status')
    draft_answers = models.JSONField(blank=True, null=True, default=list, verbose_name='Jawaban Draft')

    score = models.IntegerField(default=0, verbose_name='Skor')
    total_questions = models.IntegerField(default=0, verbose_name='Jumlah Pertanyaan')
    correct_answers = models.IntegerField(default=0, verbose_name='Jawaban Benar')
    passed = models.BooleanField(default=False, verbose_name='Lulus')

    started_at = models.DateTimeField(auto_now_add=True, verbose_name='Mulai Pada')
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name='Selesai Pada')
    time_spent = models.IntegerField(default=0, verbose_name='Waktu (detik)')

    class Meta:
        db_table = 'learning_quiz_attempts'
        verbose_name = 'Percobaan Kuis'
        verbose_name_plural = 'Percobaan Kuis'
        ordering = ['-completed_at', '-started_at']
        indexes = [
            models.Index(fields=['quiz']),
            models.Index(fields=['user']),
            models.Index(fields=['passed']),
        ]

    def __str__(self):
        return f"{self.user} - {self.quiz.title}"

    def calculate_score(self):
        answers = self.answers.all()
        non_essay = answers.exclude(question__question_type='essay')
        self.total_questions = non_essay.count()
        self.correct_answers = non_essay.filter(is_correct=True).count()
        total_points = sum(a.question.points for a in non_essay)
        earned_points = sum(a.points_earned for a in non_essay)
        self.score = int((earned_points / total_points * 100)) if total_points > 0 else 0
        self.passed = self.score >= self.quiz.passing_score_percentage
        self.completed_at = timezone.now()
        self.save(update_fields=['score', 'total_questions', 'correct_answers', 'passed', 'completed_at'])
        
        # Trigger enrollment progress update if quiz passed (may generate certificate)
        if self.passed and self.enrollment:
            self.enrollment.update_progress()


class QuizAnswer(models.Model):
    id = models.BigAutoField(primary_key=True)
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='answers', verbose_name='Percobaan')
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE, verbose_name='Pertanyaan')

    selected_choice = models.ForeignKey(QuizChoice, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Pilihan Dipilih')
    is_correct_bool = models.BooleanField(null=True, blank=True, verbose_name='Benar/Salah')
    essay_answer = models.TextField(blank=True, null=True, verbose_name='Jawaban Esai')

    is_correct = models.BooleanField(default=False, verbose_name='Benar')
    points_earned = models.IntegerField(default=0, verbose_name='Poin Diperoleh')

    is_graded = models.BooleanField(default=False, verbose_name='Dinilai')
    grader_notes = models.TextField(blank=True, null=True, verbose_name='Catatan Penilai')
    graded_at = models.DateTimeField(blank=True, null=True, verbose_name='Dinilai Pada')

    class Meta:
        db_table = 'learning_quiz_answers'
        verbose_name = 'Jawaban Kuis'
        verbose_name_plural = 'Jawaban Kuis'
        unique_together = ['attempt', 'question']
        indexes = [
            models.Index(fields=['attempt']),
            models.Index(fields=['is_correct']),
        ]

    def __str__(self):
        return f"Jawaban: {self.question.question_text[:30]}"


class Certificate(models.Model):
    id = models.BigAutoField(primary_key=True)
    enrollment = models.OneToOneField(Enrollment, on_delete=models.CASCADE, related_name='certificate', verbose_name='Pendaftaran')

    certificate_number = models.CharField(max_length=100, unique=True, verbose_name='Nomor Sertifikat')
    user_name = models.CharField(max_length=255, verbose_name='Nama Pengguna')
    course_title = models.CharField(max_length=255, verbose_name='Judul Kursus')

    issued_at = models.DateTimeField(auto_now_add=True, verbose_name='Diterbitkan Pada')
    pdf_url = models.URLField(blank=True, null=True, verbose_name='URL PDF')
    is_active = models.BooleanField(default=True, verbose_name='Aktif')

    class Meta:
        db_table = 'learning_certificates'
        verbose_name = 'Sertifikat'
        verbose_name_plural = 'Sertifikat'
        ordering = ['-issued_at']
        indexes = [
            models.Index(fields=['enrollment']),
            models.Index(fields=['certificate_number']),
        ]

    def __str__(self):
        return f"Sertifikat - {self.user_name}"

    def generate_number(self):
        import secrets
        settings = CertificateSetting.get_settings()
        course = getattr(self.enrollment, 'course', None) if hasattr(self, 'enrollment') and self.enrollment else None

        prefix = (course.cert_number_prefix or settings.cert_number_prefix or 'CERT') if course else (settings.cert_number_prefix or 'CERT')
        fmt = (course.cert_number_format or settings.cert_number_format or '{PREFIX}-{DATE}-{RANDOM}') if course else (settings.cert_number_format or '{PREFIX}-{DATE}-{RANDOM}')

        date_part = timezone.now().strftime('%Y%m%d')
        year = timezone.now().strftime('%Y')
        month = timezone.now().strftime('%m')
        day = timezone.now().strftime('%d')
        random_part = secrets.token_hex(3).upper()
        course_id = str(course.id) if course else ''
        user_id = str(getattr(self.enrollment.user, 'id', '')) if hasattr(self, 'enrollment') and self.enrollment else ''
        self.certificate_number = fmt.replace('{PREFIX}', prefix).replace('{DATE}', date_part).replace('{RANDOM}', random_part).replace('{YEAR}', year).replace('{MONTH}', month).replace('{DAY}', day).replace('{COURSE_ID}', course_id).replace('{USER_ID}', user_id)
        while Certificate.objects.filter(certificate_number=self.certificate_number).exists():
            random_part = secrets.token_hex(3).upper()
            self.certificate_number = fmt.replace('{PREFIX}', prefix).replace('{DATE}', date_part).replace('{RANDOM}', random_part).replace('{YEAR}', year).replace('{MONTH}', month).replace('{DAY}', day).replace('{COURSE_ID}', course_id).replace('{USER_ID}', user_id)

    def save(self, *args, **kwargs):
        if not self.certificate_number:
            self.generate_number()
        super().save(*args, **kwargs)


class CertificateSetting(models.Model):
    id = models.BigAutoField(primary_key=True)
    institution_name = models.CharField(max_length=255, default='ASN CorpU', verbose_name='Nama Institusi')
    signature_name = models.CharField(max_length=255, blank=True, default='', verbose_name='Nama Penandatangan')
    signature_title = models.CharField(max_length=255, blank=True, default='', verbose_name='Jabatan Penandatangan')
    logo = models.ImageField(upload_to='certificates/', blank=True, null=True, verbose_name='Logo')
    background = models.ImageField(upload_to='certificates/', blank=True, null=True, verbose_name='Background')
    signature_image = models.ImageField(upload_to='certificates/', blank=True, null=True, verbose_name='Gambar Tanda Tangan')
    show_course_hours = models.BooleanField(default=True, verbose_name='Tampilkan Durasi Kursus')

    # TTE (Tanda Tangan Elektronik)
    tte_enabled = models.BooleanField(default=False, verbose_name='Aktifkan TTE')
    tte_certificate = models.FileField(upload_to='certificates/tte/', blank=True, null=True, verbose_name='Sertifikat TTE')
    tte_private_key = models.FileField(upload_to='certificates/tte/', blank=True, null=True, verbose_name='Private Key TTE')
    tte_passphrase = models.CharField(max_length=512, blank=True, default='', verbose_name='Passphrase TTE')
    tte_created_at = models.DateTimeField(blank=True, null=True, verbose_name='TTE Dibuat Pada')
    cert_number_prefix = models.CharField(max_length=50, blank=True, default='CERT', verbose_name='Prefix Nomor Sertifikat')
    cert_number_format = models.CharField(max_length=50, blank=True, default='{PREFIX}-{DATE}-{RANDOM}', verbose_name='Format Nomor Sertifikat',
        help_text='Variable: {PREFIX}, {DATE}, {RANDOM}, {YEAR}, {MONTH}, {DAY}, {COURSE_ID}, {USER_ID}')

    updated_at = models.DateTimeField(auto_now=True, verbose_name='Diperbarui Pada')

    class Meta:
        db_table = 'learning_certificate_settings'
        verbose_name = 'Pengaturan Sertifikat'
        verbose_name_plural = 'Pengaturan Sertifikat'

    def __str__(self):
        return f'Pengaturan Sertifikat - {self.institution_name}'

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class CourseRating(models.Model):
    id = models.BigAutoField(primary_key=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='ratings', verbose_name='Kursus')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='course_ratings', verbose_name='Pengguna')

    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], verbose_name='Rating')
    comment = models.TextField(blank=True, null=True, verbose_name='Komentar')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Diupdate Pada')

    class Meta:
        db_table = 'learning_course_ratings'
        verbose_name = 'Rating Kursus'
        verbose_name_plural = 'Rating Kursus'
        unique_together = ['course', 'user']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['course']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.user} - {self.course.title} ({self.rating}★)"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.course.update_rating()


class CourseComment(models.Model):
    id = models.BigAutoField(primary_key=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='comments', verbose_name='Kursus')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='course_comments', verbose_name='Pengguna')

    comment = models.TextField(verbose_name='Komentar')
    parent_comment = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies', verbose_name='Komentar Induk')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Diupdate Pada')

    class Meta:
        db_table = 'learning_course_comments'
        verbose_name = 'Komentar Kursus'
        verbose_name_plural = 'Komentar Kursus'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['course']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.user} - {self.comment[:50]}"

    def get_replies(self):
        return self.replies.all().order_by('created_at')


class CourseLike(models.Model):
    id = models.BigAutoField(primary_key=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='likes', verbose_name='Kursus')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='liked_courses', verbose_name='Pengguna')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')

    class Meta:
        db_table = 'learning_course_likes'
        verbose_name = 'Suka Kursus'
        verbose_name_plural = 'Suka Kursus'
        unique_together = ['course', 'user']
        indexes = [
            models.Index(fields=['course']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.user} menyukai {self.course.title}"


class CourseCommentLike(models.Model):
    id = models.BigAutoField(primary_key=True)
    comment = models.ForeignKey(CourseComment, on_delete=models.CASCADE, related_name='likes', verbose_name='Komentar')
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Pengguna')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')

    class Meta:
        db_table = 'learning_comment_likes'
        verbose_name = 'Suka Komentar'
        verbose_name_plural = 'Suka Komentar'
        unique_together = ['comment', 'user']
        indexes = [
            models.Index(fields=['comment']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.user} menyukai komentar oleh {self.comment.user}"
