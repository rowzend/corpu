from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from apps.manajemen.models import PermissionModule, PermissionControl, PermissionFunction, PermissionRule


class Command(BaseCommand):
    help = 'Seed Referensi permissions (module: referensi)'

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write('Seeding Referensi Permissions')
        self.stdout.write('=' * 70)

        module, _ = PermissionModule.objects.update_or_create(
            nama_module='referensi',
            defaults={
                'label_module': 'Referensi Pendidikan',
                'deskripsi_module': 'Referensi data pendidikan (perguruan tinggi, program studi)',
                'icon': 'fas fa-book',
                'order': 15,
                'is_active': True,
            }
        )
        self.stdout.write(f'  Module: {"created" if _ else "updated"} - Referensi Pendidikan')

        controls_data = {
            'perguruan_tinggi': {
                'label': 'Perguruan Tinggi',
                'deskripsi': 'Manajemen data perguruan tinggi',
                'functions': ['list', 'create', 'edit', 'delete'],
            },
            'program_studi': {
                'label': 'Program Studi',
                'deskripsi': 'Manajemen data program studi',
                'functions': ['list', 'create', 'edit', 'delete'],
            },
            'instansi': {
                'label': 'Instansi',
                'deskripsi': 'Manajemen data instansi',
                'functions': ['list', 'create', 'edit', 'delete'],
            },
        }

        for ctrl_name, ctrl_data in controls_data.items():
            control, _ = PermissionControl.objects.update_or_create(
                nama_kontrol=ctrl_name,
                defaults={
                    'label_kontrol': ctrl_data['label'],
                    'deskripsi_kontrol': ctrl_data['deskripsi'],
                }
            )
            self.stdout.write(f'  Control: {"created" if _ else "updated"} - {ctrl_data["label"]}')

            for func_name in ctrl_data['functions']:
                func, _ = PermissionFunction.objects.update_or_create(
                    nama_fungsi=func_name,
                    defaults={
                        'label_fungsi': func_name.capitalize(),
                        'deskripsi_fungsi': f'{func_name.capitalize()} {ctrl_data["label"].lower()}',
                    }
                )
                rule, _ = PermissionRule.objects.update_or_create(
                    module=module, control=control, function=func,
                    defaults={'is_active': True}
                )
                self.stdout.write(f'    Rule: {rule.permission_string}')

        super_admin = Group.objects.filter(name='Super Admin').first()
        if super_admin:
            rules = PermissionRule.objects.filter(module=module, is_active=True)
            for rule in rules:
                from apps.manajemen.models import RoleRule
                RoleRule.objects.get_or_create(role=super_admin, rule=rule)
            self.stdout.write(f'  Assigned {rules.count()} rules to Super Admin')

        self.stdout.write(self.style.SUCCESS('Referensi permissions seeded!'))
