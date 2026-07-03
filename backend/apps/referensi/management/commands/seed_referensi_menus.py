from django.core.management.base import BaseCommand
from apps.manajemen.models import MenuItem


class Command(BaseCommand):
    help = 'Seed Referensi sidebar menus (under Data References in Management)'

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write('Seeding Referensi Menus')
        self.stdout.write('=' * 70)

        # Deactivate old parent menu if exists
        old_parent = MenuItem.objects.filter(name='Referensi Pendidikan', parent__isnull=True).first()
        if old_parent:
            old_parent.is_active = False
            old_parent.save(update_fields=['is_active'])
            self.stdout.write('  Deactivated old parent: Referensi Pendidikan')

        # Deactivate old top-level referensi items (superseded by seed_frontend_menus.py)
        for ref_name in ['Perguruan Tinggi', 'Program Studi', 'Instansi']:
            old_ref = MenuItem.objects.filter(
                name=ref_name, platform='frontend', parent__isnull=True, category=8
            ).first()
            if old_ref:
                old_ref.is_active = False
                old_ref.save(update_fields=['is_active'])
                self.stdout.write(f'  Deactivated old {ref_name} (top-level, category 8)')

        # Find or create Data References parent under Management
        ref_parent, _ = MenuItem.objects.get_or_create(
            name='Data References',
            platform='frontend',
            parent__isnull=True,
            defaults={
                'icon': '📚',
                'type': 'menuItem',
                'order': 3,
                'category': 2,
                'is_active': True,
            }
        )
        if _:
            self.stdout.write('  Created: Data References (parent)')

        # Create/update menu items as children of Data References
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
                parent=ref_parent,
                platform='frontend',
                defaults={
                    'permission_key': data['permission_key'],
                    'external_url': data['external_url'],
                    'icon': data['icon'],
                    'type': 'module',
                    'order': data['order'],
                    'category': 2,
                    'is_active': True,
                }
            )
            self.stdout.write(f'  {"Created" if created else "Updated"}: {data["name"]}')

        self.stdout.write(self.style.SUCCESS('Referensi menus seeded!'))
