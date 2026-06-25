"""
Sync all existing lessons to Knowledge Base articles.

Usage:
  python manage.py sync_lessons_to_knowledge
  python manage.py sync_lessons_to_knowledge --dry-run
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.learning.models import Lesson
from apps.learning.signals import sync_lesson_to_article


class Command(BaseCommand):
    help = 'Sync existing LMS lessons to Knowledge Base articles'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Show what would be synced without actually syncing')

    def handle(self, *args, **options):
        dry_run = options.get('dry-run', False)

        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS('🔄 Syncing Lessons to Knowledge Base'))
        self.stdout.write('=' * 70)

        lessons = Lesson.objects.select_related(
            'module__course__instructor'
        ).all()

        total = lessons.count()
        synced = 0
        skipped = 0
        errors = 0

        self.stdout.write(f'Found {total} total lessons\n')

        for lesson in lessons:
            if lesson.content_type == 'quiz':
                self.stdout.write(self.style.WARNING(f'  ⏭  SKIP (quiz): {lesson.title}'))
                skipped += 1
                continue

            if dry_run:
                has_article = hasattr(lesson, 'synced_article') and lesson.synced_article
                status = '✅ EXISTS' if has_article else '🆕 WILL CREATE'
                self.stdout.write(f'  {status}: {lesson.title} ({lesson.content_type})')
                synced += 1
                continue

            try:
                with transaction.atomic():
                    sync_lesson_to_article(lesson)
                course_title = lesson.module.course.title
                self.stdout.write(self.style.SUCCESS(f'  ✅ Synced: {lesson.title} ({course_title})'))
                synced += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  ❌ Error: {lesson.title} - {str(e)}'))
                errors += 1

        self.stdout.write('\n' + '=' * 70)
        if dry_run:
            self.stdout.write(self.style.SUCCESS(f'Preview: {synced} lessons will be synced'))
            self.stdout.write(self.style.WARNING(f'  {skipped} quizzes skipped'))
        else:
            self.stdout.write(self.style.SUCCESS(f'✅ Sync complete: {synced} synced'))
            self.stdout.write(self.style.WARNING(f'  {skipped} quizzes skipped'))
            if errors:
                self.stdout.write(self.style.ERROR(f'  {errors} errors'))
        self.stdout.write('=' * 70)
