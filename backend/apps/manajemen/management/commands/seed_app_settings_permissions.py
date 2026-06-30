"""
Seeder for App Settings Permissions
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from apps.manajemen.models import (
    PermissionModule,
    PermissionControl,
    PermissionFunction,
    PermissionRule,
    RoleRule
)


class Command(BaseCommand):
    help = 'Seed permissions for App Settings management'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding App Settings Permissions...')

        # 1. Get or create Module
        module, _ = PermissionModule.objects.get_or_create(
            nama_module='data_aplikasi',
            defaults={
                'label_module': 'Data Aplikasi',
                'deskripsi_module': 'Manajemen data dan pengaturan aplikasi',
                'icon': 'fas fa-database',
                'order': 100,
                'is_active': True,
            }
        )
        self.stdout.write(f'  ✅ Module: {module.label_module}')

        # 2. Get or create Control
        control, _ = PermissionControl.objects.get_or_create(
            nama_kontrol='app_settings',
            defaults={
                'label_kontrol': 'Pengaturan Aplikasi',
                'deskripsi_kontrol': 'Manajemen pengaturan aplikasi (nama, kontak, sosial media, dll)',
            }
        )
        self.stdout.write(f'  ✅ Control: {control.label_kontrol}')

        # 3. Get or create Functions
        functions_data = [
            ('view', 'Lihat'),
            ('create', 'Tambah'),
            ('edit', 'Ubah'),
            ('delete', 'Hapus'),
        ]

        functions = []
        for nama, label in functions_data:
            func, _ = PermissionFunction.objects.get_or_create(
                nama_fungsi=nama,
                defaults={
                    'label_fungsi': label,
                    'deskripsi_fungsi': f'{label} data',
                }
            )
            functions.append(func)
            self.stdout.write(f'  ✅ Function: {func.label_fungsi}')

        # 4. Create Permission Rules
        rules_created = 0
        for func in functions:
            rule, was_created = PermissionRule.objects.get_or_create(
                module=module,
                control=control,
                function=func,
                defaults={'is_active': True}
            )
            if was_created:
                rules_created += 1
                self.stdout.write(f'  ✅ Rule: {rule.permission_string}')

        # 5. Assign to Super Admin role
        try:
            super_admin_group = Group.objects.get(name='Super Admin')
            rules = PermissionRule.objects.filter(
                module=module,
                control=control
            )
            
            assigned = 0
            for rule in rules:
                role_rule, was_created = RoleRule.objects.get_or_create(
                    role=super_admin_group,
                    rule=rule
                )
                if was_created:
                    assigned += 1
            
            self.stdout.write(f'  ✅ Assigned {assigned} rules to Super Admin')
        
        except Group.DoesNotExist:
            self.stdout.write(self.style.WARNING('  ⚠️  Super Admin group not found'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('✅ App Settings permissions seeded successfully!'))
        self.stdout.write(f'   Module: data_aplikasi')
        self.stdout.write(f'   Control: app_settings')
        self.stdout.write(f'   Functions: {len(functions)}')
        self.stdout.write(f'   Rules created: {rules_created}')
