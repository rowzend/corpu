"""
Seed Learning Module Permissions
Creates permissions for Learning Management System

Usage:
  python manage.py seed_learning_permissions
  python manage.py seed_learning_permissions --clear

Next steps:
  1. Run: python manage.py seed_learning_menus
  2. Run: python manage.py seed_superadmin_full_access
"""
from django.core.management.base import BaseCommand
from apps.manajemen.models import PermissionModule, PermissionControl, PermissionFunction, PermissionRule


class Command(BaseCommand):
    help = 'Seed Learning Module Permissions'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing Learning permissions')

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS('\U0001f331 Seeding Learning Module Permissions'))
        self.stdout.write('=' * 70)

        if options.get('clear'):
            module = PermissionModule.objects.filter(nama_module='learning').first()
            if module:
                count = PermissionRule.objects.filter(module=module).count()
                PermissionRule.objects.filter(module=module).delete()
                self.stdout.write(self.style.WARNING(f'  \U0001f5d1\ufe0f  Cleared {count} existing Learning permissions'))

        module, created = PermissionModule.objects.update_or_create(
            nama_module='learning',
            defaults={
                'label_module': 'Learning Management System',
                'deskripsi_module': 'Sistem pembelajaran online untuk kursus, kuis, dan sertifikasi',
                'icon': 'fas fa-graduation-cap',
                'order': 15,
                'is_active': True,
            }
        )
        if created:
            self.stdout.write('  \u2705 Created module: Learning Management System')
        else:
            self.stdout.write('  \u267b\ufe0f  Updated module: Learning Management System')

        functions_data = [
            {'nama_fungsi': 'view', 'label_fungsi': 'Lihat', 'deskripsi_fungsi': 'Melihat dan membaca konten'},
            {'nama_fungsi': 'create', 'label_fungsi': 'Buat', 'deskripsi_fungsi': 'Membuat konten baru'},
            {'nama_fungsi': 'edit', 'label_fungsi': 'Edit', 'deskripsi_fungsi': 'Mengedit konten yang sudah ada'},
            {'nama_fungsi': 'delete', 'label_fungsi': 'Hapus', 'deskripsi_fungsi': 'Menghapus konten'},
            {'nama_fungsi': 'enroll', 'label_fungsi': 'Daftar', 'deskripsi_fungsi': 'Mendaftarkan peserta ke kursus'},
            {'nama_fungsi': 'attempt', 'label_fungsi': 'Coba', 'deskripsi_fungsi': 'Mengerjakan kuis'},
            {'nama_fungsi': 'timer_bypass', 'label_fungsi': 'Bypass Timer', 'deskripsi_fungsi': 'Melewati batas waktu belajar minimum'},
        ]

        for func_data in functions_data:
            func, created = PermissionFunction.objects.update_or_create(
                nama_fungsi=func_data['nama_fungsi'],
                defaults={
                    'label_fungsi': func_data['label_fungsi'],
                    'deskripsi_fungsi': func_data['deskripsi_fungsi'],
                }
            )
            if created:
                self.stdout.write(f'    \u2705 Created function: {func.label_fungsi}')

        controls_data = [
            {
                'nama_kontrol': 'courses',
                'label_kontrol': 'Kursus',
                'deskripsi_kontrol': 'Manajemen kursus pembelajaran',
                'functions': ['view', 'create', 'edit', 'delete', 'enroll']
            },
            {
                'nama_kontrol': 'modules',
                'label_kontrol': 'Modul',
                'deskripsi_kontrol': 'Manajemen modul kursus',
                'functions': ['view', 'create', 'edit', 'delete']
            },
            {
                'nama_kontrol': 'lessons',
                'label_kontrol': 'Pelajaran',
                'deskripsi_kontrol': 'Manajemen pelajaran',
                'functions': ['view', 'create', 'edit', 'delete', 'timer_bypass']
            },
            {
                'nama_kontrol': 'enrollments',
                'label_kontrol': 'Pendaftaran',
                'deskripsi_kontrol': 'Manajemen pendaftaran kursus',
                'functions': ['view', 'create', 'edit', 'delete']
            },
            {
                'nama_kontrol': 'quizzes',
                'label_kontrol': 'Kuis',
                'deskripsi_kontrol': 'Manajemen kuis dan pertanyaan',
                'functions': ['view', 'create', 'edit', 'delete', 'attempt']
            },
            {
                'nama_kontrol': 'certificates',
                'label_kontrol': 'Sertifikat',
                'deskripsi_kontrol': 'Manajemen sertifikat kursus',
                'functions': ['view', 'create', 'edit', 'delete']
            },
            {
                'nama_kontrol': 'ratings',
                'label_kontrol': 'Rating',
                'deskripsi_kontrol': 'Manajemen rating kursus',
                'functions': ['view', 'create', 'edit', 'delete']
            },
        ]

        created_rules = 0
        updated_rules = 0

        for control_data in controls_data:
            control, created = PermissionControl.objects.update_or_create(
                nama_kontrol=control_data['nama_kontrol'],
                defaults={
                    'label_kontrol': control_data['label_kontrol'],
                    'deskripsi_kontrol': control_data['deskripsi_kontrol'],
                }
            )
            if created:
                self.stdout.write(f'  \u2705 Created control: {control.label_kontrol}')

            for func_name in control_data['functions']:
                try:
                    function = PermissionFunction.objects.get(nama_fungsi=func_name)
                    rule, created = PermissionRule.objects.update_or_create(
                        module=module,
                        control=control,
                        function=function,
                        defaults={'is_active': True}
                    )
                    if created:
                        self.stdout.write(f'    \u2705 Created rule: {rule.permission_string}')
                        created_rules += 1
                    else:
                        self.stdout.write(f'    \u267b\ufe0f  Updated rule: {rule.permission_string}')
                        updated_rules += 1
                except PermissionFunction.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f'    \u274c Function not found: {func_name}'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('\u2705 Learning permissions seeded successfully!'))
        self.stdout.write(f'Created: {created_rules} rules, Updated: {updated_rules} rules')
        self.stdout.write('')
        self.stdout.write('Permission structure:')
        self.stdout.write('  \U0001f4da Learning')
        for control_data in controls_data:
            control = PermissionControl.objects.get(nama_kontrol=control_data['nama_kontrol'])
            self.stdout.write(f'    \u2514\u2500 \U0001f4c1 {control.label_kontrol}')
            for func_name in control_data['functions']:
                try:
                    function = PermissionFunction.objects.get(nama_fungsi=func_name)
                    permission_string = f'learning.{control.nama_kontrol}.{function.nama_fungsi}'
                    self.stdout.write(f'        \u2514\u2500 \u26a1 {function.label_fungsi} ({permission_string})')
                except PermissionFunction.DoesNotExist:
                    pass

        self.stdout.write('')
        self.stdout.write('Next steps:')
        self.stdout.write('  1. Run: python manage.py seed_learning_menus')
        self.stdout.write('  2. Run: python manage.py seed_learning_courses')
        self.stdout.write('  3. Run: python manage.py seed_superadmin_full_access')
        self.stdout.write('')
