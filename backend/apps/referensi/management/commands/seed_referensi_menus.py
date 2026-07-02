from django.core.management.base import BaseCommand
from apps.manajemen.models import MenuItem


class Command(BaseCommand):
    help = 'Seed Referensi sidebar menus'

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write('Seeding Referensi Menus')
        self.stdout.write('=' * 70)

        # Deactivate old parent menu if exists (superseded by seed_frontend_menus.py)
        old_parent = MenuItem.objects.filter(name='Referensi Pendidikan', parent__isnull=True).first()
        if old_parent:
            old_parent.is_active = False
            old_parent.save(update_fields=['is_active'])
            self.stdout.write('  Deactivated old parent: Referensi Pendidikan')

        # Create/update menu items directly under Referensi category
        items = [
            {
                'name': 'Perguruan Tinggi',
                'permission_key': 'referensi.perguruan_tinggi.list',
                'external_url': '/admin/referensi/perguruan-tinggi',
                'icon': '🏛️',
                'order': 1,
            },
            {
                'name': 'Program Studi',
                'permission_key': 'referensi.program_studi.list',
                'external_url': '/admin/referensi/program-studi',
                'icon': '📚',
                'order': 2,
            },
            {
                'name': 'Instansi',
                'permission_key': 'referensi.instansi.list',
                'external_url': '/admin/referensi/instansi',
                'icon': '🏢',
                'order': 3,
            },
        ]

        for data in items:
            item, created = MenuItem.objects.update_or_create(
                name=data['name'],
                parent__isnull=True,
                platform='frontend',
                defaults={
                    'permission_key': data['permission_key'],
                    'external_url': data['external_url'],
                    'icon': data['icon'],
                    'type': 'module',
                    'order': data['order'],
                    'category': 8,
                    'is_active': True,
                }
            )
            self.stdout.write(f'  {"Created" if created else "Updated"}: {data["name"]}')

        self.stdout.write(self.style.SUCCESS('Referensi menus seeded!'))
