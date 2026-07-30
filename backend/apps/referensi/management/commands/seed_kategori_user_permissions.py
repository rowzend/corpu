from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from apps.manajemen.models import PermissionModule, PermissionControl, PermissionFunction, PermissionRule, RoleRule


class Command(BaseCommand):
    help = 'Seed Kategori User permissions (under referensi module)'

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write('Seeding Kategori User Permissions')
        self.stdout.write('=' * 70)

        module = PermissionModule.objects.filter(nama_module='referensi').first()
        if not module:
            self.stdout.write(self.style.ERROR('Module "referensi" not found. Run seed_referensi_permissions first.'))
            return
        self.stdout.write(f'  Using module: {module.label_module}')

        controls_data = {
            'kategori_user': {
                'label': 'Kategori User',
                'deskripsi': 'Manajemen kategori pengguna',
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
            rules = PermissionRule.objects.filter(
                module=module,
                control__nama_kontrol__in=controls_data.keys(),
                is_active=True,
            )
            for rule in rules:
                RoleRule.objects.get_or_create(role=super_admin, rule=rule)
            self.stdout.write(f'  Assigned {rules.count()} rules to Super Admin')

        self.stdout.write(self.style.SUCCESS('Kategori User permissions seeded!'))
