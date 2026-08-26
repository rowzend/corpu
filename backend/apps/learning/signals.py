import os
import threading
from contextlib import contextmanager
from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.core.files.base import ContentFile
from django.utils.text import slugify
from django.utils import timezone

from apps.knowledge.models import Article, ArticleDocument, Category
from .models import Course, Module, Lesson

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


def _append_lesson_media(parts, lesson):
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


def _course_lessons(course):
    return Lesson.objects.filter(
        module__course=course,
    ).exclude(content_type='quiz').select_related('module').order_by(
        'module__order_index', 'module__id', 'order_index', 'id'
    )


def _module_title_shown(module, course):
    return bool(module.title) and \
        module.title.strip().lower() != (course.title or '').strip().lower()


def _append_lesson(parts, lesson, lesson_idx):
    anchor = f'bab-{lesson_idx}'
    label = LESSON_CONTENT_TYPE_LABELS.get(lesson.content_type, lesson.content_type)
    parts.append(
        f'<h3 id="{anchor}" style="scroll-margin-top:90px">{lesson_idx}. {lesson.title}</h3>'
    )
    parts.append(
        f'<p style="margin:0"><em>{label} &middot; Durasi: {lesson.duration_minutes} menit</em></p>'
    )

    if lesson.content:
        parts.append(f'<div>{lesson.content}</div>')

    _append_lesson_media(parts, lesson)


def compile_course_content(course):
    """Compile all modules & lessons of a course into one article body."""
    parts = []
    if course.short_description:
        parts.append(f'<p><em>{course.short_description}</em></p>')
    elif course.description:
        parts.append(f'<p><em>{course.description[:300]}&hellip;</em></p>')

    lessons = _course_lessons(course)
    if not lessons:
        parts.append('<p>Belum ada materi untuk kursus ini.</p>')
        return '\n'.join(parts)

    parts.append('<hr>')
    lesson_idx = 0
    current_module_id = None
    for lesson in lessons:
        module = lesson.module
        if module.id != current_module_id:
            current_module_id = module.id
            if _module_title_shown(module, course):
                parts.append(
                    f'<h2 id="modul-{module.pk}" style="scroll-margin-top:90px">'
                    f'{module.order_index}. {module.title}</h2>'
                )
            elif module.description:
                parts.append(f'<p><em>{module.description}</em></p>')
        lesson_idx += 1
        _append_lesson(parts, lesson, lesson_idx)
    return '\n'.join(parts)


def article_excerpt_from_course(course):
    """Excerpt for the compiled course article: course description first."""
    from django.utils.html import strip_tags

    for field in ('short_description', 'description'):
        value = getattr(course, field, None)
        if not value:
            continue
        text = ' '.join(strip_tags(value).split())
        if text:
            return text[:200]
    return ''


def article_toc(course):
    """
    Build the table of contents for the compiled article.
    Returns a list of {'type': 'module'|'lesson', ...} grouped by module,
    so anchors always match the compiled content (bab-<n> / modul-<id>).
    """
    lessons = list(_course_lessons(course))
    toc, lesson_idx, last_module_id = [], 0, None
    for lesson in lessons:
        module = lesson.module
        if module.id != last_module_id:
            last_module_id = module.id
            toc.append({
                'type': 'module',
                'anchor': f'modul-{module.pk}',
                'module_title': module.title,
                'shown': _module_title_shown(module, course),
            })
        lesson_idx += 1
        toc.append({
            'type': 'lesson',
            'anchor': f'bab-{lesson_idx}',
            'module_title': module.title,
            'lesson_title': lesson.title,
        })
    return toc


def sync_course_to_article(course):
    """Sync one course into ONE compiled KMS article (1 course = 1 article)."""
    category = course.category or get_or_create_lms_category()

    article, created = Article.objects.update_or_create(
        source_course=course,
        defaults={
            'title': course.title,
            'content': compile_course_content(course),
            'excerpt': article_excerpt_from_course(course),
            'content_type': 'article',
            'category': category,
            'author': course.instructor,
            'status': 'published',
            'is_featured': course.is_featured,
            'order': 1,
            'source_module': None,
            'source_lesson': None,
        },
    )

    if created:
        article.published_at = timezone.now()
        base_slug = slugify(course.title)[:180] or 'course'
        original_slug = base_slug
        counter = 1
        while Article.objects.filter(slug=article.slug).exclude(pk=article.pk).exists():
            article.slug = f'{original_slug}-{counter}'
            counter += 1
        article.save(update_fields=['slug', 'published_at'])

    sync_course_thumbnail(article, course)

    # Pull every non-quiz lesson file as a document attachment
    for lesson in _course_lessons(course):
        sync_lesson_documents(article, lesson)

    # Archive leftover articles mapped to this course that are no longer the
    # single compiled one (e.g. legacy per-lesson articles).
    Article.objects.filter(source_course=course).exclude(pk=article.pk).update(
        status='archived', source_module=None, source_course=None, source_lesson=None
    )

    return article


def sync_course_thumbnail(article, course):
    """
    Copy the course thumbnail to the article (pull-only).
    Only applied when the article has no thumbnail yet, so manual KMS edits are kept.
    """
    if not course.thumbnail or article.thumbnail:
        return
    try:
        course_thumb = course.thumbnail
        filename = os.path.basename(course_thumb.name) or 'thumbnail'
        article.thumbnail.save(filename, ContentFile(course_thumb.read()), save=True)
    except Exception:
        pass


def sync_lesson_documents(article, lesson):
    """
    Pull the lesson file into the article as an ArticleDocument attachment
    (pull-only: the file is COPIED so KMS and LMS stay independent).
    Documents manually added in KMS (source_lesson is null) are left untouched.
    """
    if lesson.content_type == 'quiz':
        return

    if lesson.file_url:
        doc, created = ArticleDocument.objects.get_or_create(
            article=article,
            source_lesson=lesson,
        )
        if created and lesson.file_url:
            # Copy the file (not referenced) so KMS and LMS stay independent
            lesson_file = lesson.file_url
            filename = os.path.basename(lesson_file.name) or 'attachment'
            doc.file.save(filename, ContentFile(lesson_file.read()), save=False)
            doc.file_name = filename
            doc.save()
    else:
        # Source lesson no longer has a file -> remove the pulled document
        ArticleDocument.objects.filter(
            article=article,
            source_lesson=lesson,
        ).delete()


def sync_article_to_course(article):
    if not article.source_course_id:
        return

    course = article.source_course
    if article.title != course.title:
        course.title = article.title
        course.save(update_fields=['title'])


@receiver(post_save, sender=Course)
def course_post_save(sender, instance, **kwargs):
    if is_syncing():
        return
    with sync_context():
        sync_course_to_article(instance)


@receiver(post_save, sender=Module)
def module_post_save(sender, instance, **kwargs):
    if is_syncing():
        return
    with sync_context():
        sync_course_to_article(instance.course)


@receiver(post_save, sender=Lesson)
def lesson_post_save(sender, instance, **kwargs):
    if is_syncing():
        return
    if instance.content_type == 'quiz':
        return
    with sync_context():
        sync_course_to_article(instance.module.course)


@receiver(post_save, sender=Article)
def article_post_save(sender, instance, **kwargs):
    if is_syncing():
        return
    if not instance.source_course_id:
        return
    with sync_context():
        sync_article_to_course(instance)


@receiver(post_delete, sender=Lesson)
def lesson_post_delete(sender, instance, **kwargs):
    if is_syncing():
        return
    try:
        course = instance.module.course
    except (Module.DoesNotExist, Course.DoesNotExist):
        return
    # Skip sync if the parent course is being deleted (course row already gone
    # or about to be removed) to avoid writing a dangling source_course FK.
    if not Course.objects.filter(pk=course.pk).exists():
        return
    with sync_context():
        sync_course_to_article(course)


@receiver(post_delete, sender=Module)
def module_post_delete(sender, instance, **kwargs):
    if is_syncing():
        return
    try:
        course = instance.course
    except Course.DoesNotExist:
        return
    # Skip sync if the parent course is being deleted (course row already gone
    # or about to be removed) to avoid writing a dangling source_course FK.
    if not Course.objects.filter(pk=course.pk).exists():
        return
    with sync_context():
        sync_course_to_article(course)
