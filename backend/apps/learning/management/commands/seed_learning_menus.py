"""
Seed Learning Module Sidebar Menus
Creates sidebar menu structure for Learning Management System

Usage:
  python manage.py seed_learning_menus
  python manage.py seed_learning_menus --clear
"""
from django.core.management.base import BaseCommand
from apps.manajemen.models import MenuItem


class Command(BaseCommand):
    help = 'Seed Learning Module Sidebar Menus'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing Learning menus')

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS('\U0001f331 Seeding Learning Module Menus'))
        self.stdout.write('=' * 70)

        if options.get('clear'):
            count = MenuItem.objects.filter(name__icontains='Learning').count()
            MenuItem.objects.filter(name__icontains='Learning').delete()
            self.stdout.write(self.style.WARNING(f'  \U0001f5d1\ufe0f  Cleared {count} existing Learning menus'))

        # 1. Parent Menu
        parent_menu, created = MenuItem.objects.update_or_create(
            name='Learning',
            parent__isnull=True,
            defaults={
                'type': 'menuItem',
                'icon': 'fas fa-graduation-cap',
                'order': 15,
                'category': 5,
                'is_active': True,
                'permission_key': None,
                'url_name': None,
            }
        )
        if created:
            self.stdout.write('  \u2705 Created parent menu: Learning')
        else:
            self.stdout.write('  \u267b\ufe0f  Updated parent menu: Learning')

        child_menus_data = [
            {
                'name': 'Dashboard',
                'permission_key': 'learning.courses.view',
                'url_name': 'learning:dashboard',
                'icon': 'fas fa-chart-bar',
                'order': 1,
                'description': 'Dashboard pembelajaran'
            },
            {
                'name': 'Semua Kursus',
                'permission_key': 'learning.courses.view',
                'url_name': 'learning:course_list',
                'icon': 'fas fa-book',
                'order': 2,
                'description': 'Manajemen kursus'
            },
            {
                'name': 'Buat Kursus',
                'permission_key': 'learning.courses.create',
                'url_name': 'learning:course_create',
                'icon': 'fas fa-plus-circle',
                'order': 3,
                'description': 'Membuat kursus baru'
            },
            {
                'name': 'Enrollment',
                'permission_key': 'learning.enrollments.view',
                'url_name': 'learning:enrollment_list',
                'icon': 'fas fa-user-plus',
                'order': 4,
                'description': 'Manajemen pendaftaran peserta'
            },
            {
                'name': 'Progress',
                'permission_key': 'learning.enrollments.view',
                'url_name': 'learning:progress_list',
                'icon': 'fas fa-chart-line',
                'order': 5,
                'description': 'Progress pembelajaran peserta'
            },
            {
                'name': 'Kuis',
                'permission_key': 'learning.quizzes.view',
                'url_name': 'learning:quiz_list',
                'icon': 'fas fa-question-circle',
                'order': 6,
                'description': 'Manajemen kuis'
            },
            {
                'name': 'Sertifikat',
                'permission_key': 'learning.certificates.view',
                'url_name': 'learning:certificate_list',
                'icon': 'fas fa-certificate',
                'order': 7,
                'description': 'Manajemen sertifikat'
            },
        ]

        for child_data in child_menus_data:
            child, created = MenuItem.objects.update_or_create(
                name=child_data['name'],
                parent=parent_menu,
                defaults={
                    'type': 'menuItem',
                    'icon': child_data['icon'],
                    'order': child_data['order'],
                    'category': 5,
                    'is_active': True,
                    'permission_key': child_data['permission_key'],
                    'url_name': child_data['url_name'],
                }
            )
            if created:
                self.stdout.write(f'  \u2705 Created child menu: {child.name}')
            else:
                self.stdout.write(f'  \u267b\ufe0f  Updated child menu: {child.name}')

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('\u2705 Learning menus seeded successfully!'))
        self.stdout.write('')
        self.stdout.write('Next steps:')
        self.stdout.write('  1. Run: python manage.py seed_learning_courses')
        self.stdout.write('  2. Run: python manage.py seed_superadmin_full_access')
        self.stdout.write('')
