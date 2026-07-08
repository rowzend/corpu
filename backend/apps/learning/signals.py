import threading
from contextlib import contextmanager
from django.db.models.signals import post_save, pre_save, pre_delete
from django.dispatch import receiver
from django.utils.text import slugify
from django.utils import timezone

from apps.knowledge.models import Article, Category
from .models import Course, Module, Lesson

_sync_in_progress = threading.local()
_module_deleting = threading.local()


def is_syncing():
    return getattr(_sync_in_progress, 'active', False)


def is_module_deleting():
    return getattr(_module_deleting, 'active', False)


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


LESSON_CONTENT_TYPE_LABELS = {
    'article': 'Artikel',
    'video': 'Video',
    'document': 'Dokumen',
    'link': 'Link Eksternal',
    'quiz': 'Kuis',
}


def is_google_drive_url(url):
    return 'drive.google.com' in url or 'docs.google.com' in url


def get_google_drive_embed(url):
    """Convert Google Drive view URL to embed/preview URL."""
    import re
    match = re.search(r'/d/([a-zA-Z0-9_-]+)', url)
    if match:
        return f'https://drive.google.com/file/d/{match.group(1)}/preview'
    return None


def compile_module_content(module):
    """Compile all lessons in a module into a single formatted content string."""
    lessons = module.lessons.all().order_by('order_index')
    parts = []

    if module.description:
        parts.append(f'<p><em>{module.description}</em></p>')
        parts.append('<hr>')

    for lesson in lessons:
        if lesson.content_type == 'quiz':
            continue

        label = LESSON_CONTENT_TYPE_LABELS.get(lesson.content_type, lesson.content_type)
        parts.append(f'<h3>{lesson.order_index}. {lesson.title}</h3>')
        parts.append(f'<p><strong>Tipe:</strong> {label} | <strong>Durasi:</strong> {lesson.duration_minutes} menit</p>')

        if lesson.content:
            parts.append(f'<div>{lesson.content}</div>')

        if lesson.video_url:
            if is_google_drive_url(lesson.video_url):
                embed = get_google_drive_embed(lesson.video_url)
                if embed:
                    parts.append(f'<div class="aspect-video" style="margin:16px 0"><iframe src="{embed}" style="width:100%;height:400px;border:none;border-radius:8px" allowfullscreen></iframe></div>')
            else:
                parts.append(f'<p><a href="{lesson.video_url}" target="_blank">Link Video: {lesson.video_url}</a></p>')

        if lesson.external_url:
            if is_google_drive_url(lesson.external_url):
                embed = get_google_drive_embed(lesson.external_url)
                if embed:
                    parts.append(f'<div class="aspect-video" style="margin:16px 0"><iframe src="{embed}" style="width:100%;height:400px;border:none;border-radius:8px" allowfullscreen></iframe></div>')
            parts.append(f'<p><a href="{lesson.external_url}" target="_blank">Buka Link: {lesson.external_url}</a></p>')

        parts.append('<hr>')

    if not parts:
        parts.append('<p>Belum ada materi pelajaran di modul ini.</p>')

    return '\n'.join(parts)


def compile_module_excerpt(module):
    """Generate a short excerpt from module description or first non-quiz lesson."""
    if module.description:
        return module.description[:200]
    first = module.lessons.exclude(content_type='quiz').order_by('order_index').first()
    if first:
        return first.title
    return ''


def sync_module_to_article(module):
    course = module.course
    instructor = course.instructor
    category = course.category or get_or_create_lms_category()

    content = compile_module_content(module)
    excerpt = compile_module_excerpt(module)

    article_data = {
        'title': module.title,
        'content': content,
        'excerpt': excerpt,
        'content_type': 'article',
        'category': category,
        'author': instructor,
        'status': 'published',
        'is_featured': course.is_featured,
        'published_at': timezone.now(),
    }

    article, created = Article.objects.update_or_create(
        source_module=module,
        defaults=article_data,
    )

    if created:
        base_slug = slugify(f"{course.slug}-{module.title}")[:180]
        original_slug = base_slug
        counter = 1
        while Article.objects.filter(slug=article.slug).exclude(pk=article.pk).exists():
            article.slug = f"{original_slug}-{counter}"
            counter += 1
        article.save(update_fields=['slug'])


def sync_article_to_module(article):
    if not article.source_module:
        return

    module = article.source_module
    module.title = article.title

    if article.excerpt:
        module.description = article.excerpt

    module.save()


@receiver(post_save, sender=Module)
def module_post_save(sender, instance, **kwargs):
    if is_syncing():
        return
    with sync_context():
        sync_module_to_article(instance)


@receiver(post_save, sender=Lesson)
def lesson_post_save(sender, instance, **kwargs):
    if is_syncing():
        return
    if instance.content_type == 'quiz':
        return
    with sync_context():
        sync_module_to_article(instance.module)


@receiver(pre_delete, sender=Lesson)
def lesson_pre_delete(sender, instance, **kwargs):
    if is_syncing() or is_module_deleting():
        return
    module = instance.module
    with sync_context():
        sync_module_to_article(module)


@receiver(pre_delete, sender=Module)
def module_pre_delete(sender, instance, **kwargs):
    _module_deleting.active = True
    try:
        article = Article.objects.get(source_module=instance)
        article.status = 'archived'
        article.source_module = None
        article.save(update_fields=['status', 'source_module'])
    except Article.DoesNotExist:
        pass
    finally:
        _module_deleting.active = False


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
    modules = Module.objects.filter(course=instance)
    Article.objects.filter(source_module__in=modules).update(category=category)


@receiver(post_save, sender=Article)
def article_post_save(sender, instance, **kwargs):
    if is_syncing():
        return
    if not instance.source_module_id:
        return
    with sync_context():
        sync_article_to_module(instance)
