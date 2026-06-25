"""
Seed Knowledge Base Permissions
Creates permissions for Knowledge Base module

Usage:
  python manage.py seed_knowledge_permissions
  python manage.py seed_knowledge_permissions --clear

Next steps:
  1. Run: python manage.py seed_knowledge_menus
  2. Run: python manage.py seed_superadmin_full_access
"""
from django.core.management.base import BaseCommand
from apps.manajemen.models import PermissionModule, PermissionControl, PermissionFunction, PermissionRule


class Command(BaseCommand):
    help = 'Seed Knowledge Base Permissions'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing Knowledge Base permissions')

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS('🌱 Seeding Knowledge Base Permissions'))
        self.stdout.write('=' * 70)

        if options.get('clear'):
            # Clear existing Knowledge Base permissions
            module = PermissionModule.objects.filter(nama_module='knowledge').first()
            if module:
                count = PermissionRule.objects.filter(module=module).count()
                PermissionRule.objects.filter(module=module).delete()
                self.stdout.write(self.style.WARNING(f'  🗑️  Cleared {count} existing Knowledge Base permissions'))

        # 1. Create/Update Module
        module, created = PermissionModule.objects.update_or_create(
            nama_module='knowledge',
            defaults={
                'label_module': 'Knowledge Base',
                'deskripsi_module': 'Sistem Knowledge Base untuk artikel, tutorial, dan dokumentasi',
                'icon': 'fas fa-book',
                'order': 10,
                'is_active': True,
            }
        )
        if created:
            self.stdout.write('  ✅ Created module: Knowledge Base')
        else:
            self.stdout.write('  ♻️  Updated module: Knowledge Base')

        # 2. Create/Update Functions
        functions_data = [
            {
                'nama_fungsi': 'view',
                'label_fungsi': 'Lihat',
                'deskripsi_fungsi': 'Melihat dan membaca konten'
            },
            {
                'nama_fungsi': 'create',
                'label_fungsi': 'Buat',
                'deskripsi_fungsi': 'Membuat konten baru'
            },
            {
                'nama_fungsi': 'edit',
                'label_fungsi': 'Edit',
                'deskripsi_fungsi': 'Mengedit konten yang sudah ada'
            },
            {
                'nama_fungsi': 'delete',
                'label_fungsi': 'Hapus',
                'deskripsi_fungsi': 'Menghapus konten'
            },
            {
                'nama_fungsi': 'approve',
                'label_fungsi': 'Approve',
                'deskripsi_fungsi': 'Menyetujui konten untuk dipublikasi'
            },
            {
                'nama_fungsi': 'reject',
                'label_fungsi': 'Reject',
                'deskripsi_fungsi': 'Menolak konten'
            },
            {
                'nama_fungsi': 'publish',
                'label_fungsi': 'Publish',
                'deskripsi_fungsi': 'Mempublikasikan konten'
            },
            {
                'nama_fungsi': 'export',
                'label_fungsi': 'Export',
                'deskripsi_fungsi': 'Export data dan laporan'
            },
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
                self.stdout.write(f'    ✅ Created function: {func.label_fungsi}')

        # 3. Create/Update Controls & Rules
        controls_data = [
            {
                'nama_kontrol': 'articles',
                'label_kontrol': 'Artikel',
                'deskripsi_kontrol': 'Manajemen artikel Knowledge Base',
                'functions': ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'publish']
            },
            {
                'nama_kontrol': 'category',
                'label_kontrol': 'Kategori',
                'deskripsi_kontrol': 'Manajemen kategori artikel',
                'functions': ['view', 'create', 'edit', 'delete']
            },
            {
                'nama_kontrol': 'tags',
                'label_kontrol': 'Tags',
                'deskripsi_kontrol': 'Manajemen tags artikel',
                'functions': ['view', 'create', 'edit', 'delete']
            },
            {
                'nama_kontrol': 'comments',
                'label_kontrol': 'Komentar',
                'deskripsi_kontrol': 'Manajemen komentar artikel',
                'functions': ['view', 'create', 'edit', 'delete']
            },
            {
                'nama_kontrol': 'ratings',
                'label_kontrol': 'Rating',
                'deskripsi_kontrol': 'Manajemen rating artikel',
                'functions': ['view', 'create', 'edit', 'delete']
            },
        ]

        created_rules = 0
        updated_rules = 0

        for control_data in controls_data:
            # Create/Update Control
            control, created = PermissionControl.objects.update_or_create(
                nama_kontrol=control_data['nama_kontrol'],
                defaults={
                    'label_kontrol': control_data['label_kontrol'],
                    'deskripsi_kontrol': control_data['deskripsi_kontrol'],
                }
            )
            if created:
                self.stdout.write(f'  ✅ Created control: {control.label_kontrol}')

            # Create Rules for this Control
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
                        self.stdout.write(f'    ✅ Created rule: {rule.permission_string}')
                        created_rules += 1
                    else:
                        self.stdout.write(f'    ♻️  Updated rule: {rule.permission_string}')
                        updated_rules += 1
                        
                except PermissionFunction.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f'    ❌ Function not found: {func_name}'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'✅ Knowledge Base permissions seeded successfully!'))
        self.stdout.write(f'Created: {created_rules} rules, Updated: {updated_rules} rules')
        self.stdout.write('')
        
        # Show permission structure
        self.stdout.write('Permission structure:')
        self.stdout.write('  📚 Knowledge Base')
        for control_data in controls_data:
            control = PermissionControl.objects.get(nama_kontrol=control_data['nama_kontrol'])
            self.stdout.write(f'    └─ 📁 {control.label_kontrol}')
            for func_name in control_data['functions']:
                function = PermissionFunction.objects.get(nama_fungsi=func_name)
                permission_string = f"knowledge.{control.nama_kontrol}.{function.nama_fungsi}"
                self.stdout.write(f'        └─ ⚡ {function.label_fungsi} ({permission_string})')
        
        self.stdout.write('')
        self.stdout.write('Next steps:')
        self.stdout.write('  1. Run: python manage.py seed_knowledge_menus')
        self.stdout.write('  2. Run: python manage.py seed_superadmin_full_access')
        self.stdout.write('')