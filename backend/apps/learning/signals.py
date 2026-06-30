import threading
from contextlib import contextmanager
from django.db.models.signals import post_save, pre_save, pre_delete
from django.dispatch import receiver
from django.utils.text import slugify
from django.utils import timezone

from apps.knowledge.models import Article, Category
from .models import Course, Lesson

_sync_in_progress = threading.local()


def is_syncing():
    return getattr(_sync_in_progress, 'active', False)


@contextmanager
def sync_context():
    old = is_syncing()
    _sync_in_progress.active = True
    try:
        yield
    finally:
        _sync_in_progress.active = old


def get_or_create_lms_category():
    category, _ = Category.objects.get_or_create(
        name='Materi LMS',
        defaults={
            'slug': 'materi-lms',
            'description': 'Artikel yang disinkronisasi otomatis dari materi kursus LMS',
            'is_active': True,
        }
    )
    return category


def sync_lesson_to_article(lesson):
    if lesson.content_type == 'quiz':
        return

    course = lesson.module.course
    instructor = course.instructor
    category = course.category or get_or_create_lms_category()

    article_data = {
        'title': f"{lesson.title}",
        'content': lesson.content or '',
        'content_type': lesson.content_type,
        'youtube_url': lesson.video_url or '',
        'external_url': lesson.external_url or '',
        'file_url': lesson.file_url.url if lesson.file_url else '',
        'category': category,
        'author': instructor,
        'status': 'published',
        'is_featured': course.is_featured,
        'published_at': timezone.now(),
    }

    article, created = Article.objects.update_or_create(
        source_lesson=lesson,
        defaults=article_data,
    )

    if created:
        slug = slugify(lesson.title)
        original_slug = slug
        counter = 1
        while Article.objects.filter(slug=article.slug).exclude(pk=article.pk).exists():
            article.slug = f"{original_slug}-{counter}"
            counter += 1
        article.save(update_fields=['slug'])


def sync_article_to_lesson(article):
    if not article.source_lesson:
        return

    lesson = article.source_lesson

    lesson.title = article.title
    lesson.slug = slugify(article.title)
    lesson.content = article.content or ''
    lesson.content_type = article.content_type
    lesson.video_url = article.youtube_url or ''
    lesson.external_url = article.external_url or ''

    lesson.save()


@receiver(post_save, sender=Lesson)
def lesson_post_save(sender, instance, **kwargs):
    if is_syncing():
        return
    with sync_context():
        sync_lesson_to_article(instance)


@receiver(pre_save, sender=Course)
def course_pre_save(sender, instance, **kwargs):
    if not instance.pk:
        instance._old_category_id = None
    else:
        try:
            instance._old_category_id = sender.objects.get(pk=instance.pk).category_id
        except sender.DoesNotExist:
            instance._old_category_id = None


@receiver(post_save, sender=Course)
def course_post_save(sender, instance, **kwargs):
    if is_syncing():
        return
    old_category_id = getattr(instance, '_old_category_id', None)
    if old_category_id == instance.category_id:
        return
    category = instance.category or get_or_create_lms_category()
    lessons = Lesson.objects.filter(module__course=instance)
    Article.objects.filter(source_lesson__in=lessons).update(category=category)


@receiver(post_save, sender=Article)
def article_post_save(sender, instance, **kwargs):
    if is_syncing():
        return
    if not instance.source_lesson_id:
        return
    with sync_context():
        sync_article_to_lesson(instance)


@receiver(pre_delete, sender=Lesson)
def lesson_pre_delete(sender, instance, **kwargs):
    try:
        article = Article.objects.get(source_lesson=instance)
        article.status = 'archived'
        article.save(update_fields=['status'])
    except Article.DoesNotExist:
        pass
