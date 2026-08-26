"""
Sync all existing courses to Knowledge Base articles.
One course -> one article (compiled from its modules & lessons).

Usage:
  python manage.py sync_lessons_to_knowledge
  python manage.py sync_lessons_to_knowledge --dry-run
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.learning.models import Course, Lesson
from apps.learning.signals import sync_course_to_article, sync_context


class Command(BaseCommand):
    help = 'Sync existing LMS courses to Knowledge Base articles (one article per course)'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Show what would be synced without actually syncing')

    def handle(self, *args, **options):
        dry_run = options.get('dry-run', False)

        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS('🔄 Syncing Courses to Knowledge Base'))
        self.stdout.write('=' * 70)

        courses = Course.objects.select_related(
            'instructor', 'category'
        ).all()

        total = courses.count()
        synced = 0
        errors = 0

        self.stdout.write(f'Found {total} total courses\n')

        for course in courses:
            has_lessons = Lesson.objects.filter(
                module__course=course,
            ).exclude(content_type='quiz').exists()
            if not has_lessons:
                self.stdout.write(self.style.WARNING(f'  ⏭  SKIP (no non-quiz lessons): {course.title}'))
                continue

            if dry_run:
                has_article = hasattr(course, 'knowledge_article') and course.knowledge_article_id
                status = '✅ EXISTS' if has_article else '🆕 WILL CREATE'
                lesson_count = Lesson.objects.filter(module__course=course).exclude(content_type='quiz').count()
                self.stdout.write(f'  {status}: {course.title} ({lesson_count} lessons)')
                synced += 1
                continue

            try:
                with transaction.atomic(), sync_context():
                    sync_course_to_article(course)
                lesson_count = Lesson.objects.filter(module__course=course).exclude(content_type='quiz').count()
                self.stdout.write(self.style.SUCCESS(f'  ✅ Synced: {course.title} - {lesson_count} lessons'))
                synced += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  ❌ Error: {course.title} - {str(e)}'))
                errors += 1

        self.stdout.write('\n' + '=' * 70)
        if dry_run:
            self.stdout.write(self.style.SUCCESS(f'Preview: {synced} courses will be synced'))
        else:
            self.stdout.write(self.style.SUCCESS(f'✅ Sync complete: {synced} synced'))
            if errors:
                self.stdout.write(self.style.ERROR(f'  {errors} errors'))
        self.stdout.write('=' * 70)
