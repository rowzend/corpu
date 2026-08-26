from django.core.management.base import BaseCommand
from apps.manajemen.models import PermissionModule, PermissionControl, PermissionFunction, PermissionRule, RoleRule


class Command(BaseCommand):
    help = 'Seed permissions untuk API SIMPEG (Pegawai)'

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write('Seeding API SIMPEG Permissions')
        self.stdout.write('=' * 70)

        module, created = PermissionModule.objects.get_or_create(
            nama_module='api_simpeg',
            defaults={
                'label_module': 'API SIMPEG',
                'deskripsi_module': 'Integrasi dengan API ESIMPEG untuk data pegawai',
                'icon': 'fa-solid fa-plug',
                'order': 4,
                'is_active': True
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created module: {module.label_module}'))
        else:
            self.stdout.write(f'  Module already exists: {module.label_module}')

        controls_data = [
            {
                'nama': 'pegawai',
                'label': 'Pegawai',
                'deskripsi': 'Manajemen data pegawai dari ESIMPEG',
                'functions': [
                    {'nama': 'view', 'label': 'View', 'deskripsi': 'Lihat daftar pegawai'},
                    {'nama': 'sync', 'label': 'Sync', 'deskripsi': 'Sinkronisasi data pegawai dari ESIMPEG'},
                    {'nama': 'export', 'label': 'Export', 'deskripsi': 'Export data pegawai'},
                ]
            },
            {
                'nama': 'bupati',
                'label': 'Bupati',
                'deskripsi': 'Manajemen data bupati/wakil bupati dari ESIMPEG',
                'functions': [
                    {'nama': 'view', 'label': 'View', 'deskripsi': 'Lihat daftar bupati'},
                    {'nama': 'sync', 'label': 'Sync', 'deskripsi': 'Sinkronisasi data bupati dari ESIMPEG'},
                ]
            },
            {
                'nama': 'unit_kerja',
                'label': 'Unit Kerja',
                'deskripsi': 'Manajemen data unit kerja beserta hierarki dari ESIMPEG',
                'functions': [
                    {'nama': 'view', 'label': 'View', 'deskripsi': 'Lihat daftar unit kerja'},
                    {'nama': 'sync', 'label': 'Sync', 'deskripsi': 'Sinkronisasi data unit kerja dari ESIMPEG'},
                    {'nama': 'change', 'label': 'Kelola Desain', 'deskripsi': 'Kelola desain pembelajaran unit kerja (kompetensi teknis & tujuan pembelajaran)'},
                ]
            },
        ]

        total_rules = 0
        for cd in controls_data:
            control, created = PermissionControl.objects.get_or_create(
                nama_kontrol=cd['nama'],
                defaults={
                    'label_kontrol': cd['label'],
                    'deskripsi_kontrol': cd['deskripsi'],
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created control: {control.label_kontrol}'))
            else:
                self.stdout.write(f'  Control already exists: {control.label_kontrol}')

            functions = []
            for func_data in cd['functions']:
                func, created = PermissionFunction.objects.get_or_create(
                    nama_fungsi=func_data['nama'],
                    defaults={
                        'label_fungsi': func_data['label'],
                        'deskripsi_fungsi': func_data['deskripsi'],
                    }
                )
                functions.append(func)
                if created:
                    self.stdout.write(self.style.SUCCESS(f'  Created function: {func.label_fungsi}'))

            for func in functions:
                rule, created = PermissionRule.objects.get_or_create(
                    module=module,
                    control=control,
                    function=func,
                    defaults={'is_active': True}
                )
                if created:
                    total_rules += 1

        # Berikan akses 'change' (kelola desain pembelajaran) ke role-role yang
        # sudah memiliki 'sync' pada unit_kerja (Super Admin, User Pemerintaha, dst)
        try:
            uk_change_rule = PermissionRule.objects.filter(
                module=module,
                control__nama_kontrol='unit_kerja',
                function__nama_fungsi='change',
                is_active=True,
            ).first()
            sync_rule = PermissionRule.objects.filter(
                module=module,
                control__nama_kontrol='unit_kerja',
                function__nama_fungsi='sync',
                is_active=True,
            ).first()
            if uk_change_rule and sync_rule:
                synced_roles = RoleRule.objects.filter(rule=sync_rule).values_list('role_id', flat=True)
                for role_id in synced_roles:
                    _, created = RoleRule.objects.get_or_create(
                        role_id=role_id,
                        rule=uk_change_rule,
                        defaults={},
                    )
                    if created:
                        total_rules += 1
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'  Skip RoleRule change: {e}'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('API SIMPEG Permissions Seeding Complete'))
        self.stdout.write(f'  Module: {module.label_module}')
        self.stdout.write(f'  Total rules created: {total_rules}')
