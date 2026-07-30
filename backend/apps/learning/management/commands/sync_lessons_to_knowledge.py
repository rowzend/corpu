"""
Sync all existing modules to Knowledge Base articles.
One module -> one article (compiled from all lessons within the module).

Usage:
  python manage.py sync_lessons_to_knowledge
  python manage.py sync_lessons_to_knowledge --dry-run
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.learning.models import Module
from apps.learning.signals import sync_module_to_article


class Command(BaseCommand):
    help = 'Sync existing LMS modules to Knowledge Base articles (one article per module)'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Show what would be synced without actually syncing')

    def handle(self, *args, **options):
        dry_run = options.get('dry-run', False)

        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS('🔄 Syncing Modules to Knowledge Base'))
        self.stdout.write('=' * 70)

        modules = Module.objects.select_related(
            'course__instructor'
        ).all()

        total = modules.count()
        synced = 0
        errors = 0

        self.stdout.write(f'Found {total} total modules\n')

        for module in modules:
            has_lessons = module.lessons.exclude(content_type='quiz').exists()
            if not has_lessons:
                self.stdout.write(self.style.WARNING(f'  ⏭  SKIP (no non-quiz lessons): {module.title}'))
                continue

            if dry_run:
                has_article = hasattr(module, 'synced_article') and module.synced_article
                status = '✅ EXISTS' if has_article else '🆕 WILL CREATE'
                lesson_count = module.lessons.exclude(content_type='quiz').count()
                self.stdout.write(f'  {status}: {module.title} ({lesson_count} lessons)')
                synced += 1
                continue

            try:
                with transaction.atomic():
                    sync_module_to_article(module)
                course_title = module.course.title
                lesson_count = module.lessons.exclude(content_type='quiz').count()
                self.stdout.write(self.style.SUCCESS(f'  ✅ Synced: {module.title} ({course_title}) - {lesson_count} lessons'))
                synced += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  ❌ Error: {module.title} - {str(e)}'))
                errors += 1

        self.stdout.write('\n' + '=' * 70)
        if dry_run:
            self.stdout.write(self.style.SUCCESS(f'Preview: {synced} modules will be synced'))
        else:
            self.stdout.write(self.style.SUCCESS(f'✅ Sync complete: {synced} synced'))
            if errors:
                self.stdout.write(self.style.ERROR(f'  {errors} errors'))
        self.stdout.write('=' * 70)
