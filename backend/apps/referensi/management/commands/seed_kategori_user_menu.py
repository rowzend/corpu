from django.core.management.base import BaseCommand
from apps.manajemen.models import MenuItem


class Command(BaseCommand):
    help = 'Seed Kategori User sidebar menu'

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write('Seeding Kategori User Menu')
        self.stdout.write('=' * 70)

        items = [
            {
                'name': 'Kategori User',
                'permission_key': 'referensi.kategori_user.list',
                'external_url': '/admin/referensi/kategori-user',
                'icon': '👥',
                'order': 1,
            },
        ]

        for idata in items:
            item, created = MenuItem.objects.update_or_create(
                name=idata['name'],
                parent__isnull=True,
                platform='frontend',
                defaults={
                    'permission_key': idata['permission_key'],
                    'external_url': idata['external_url'],
                    'icon': idata['icon'],
                    'type': 'module',
                    'order': idata['order'],
                    'category': 3,
                    'is_active': True,
                }
            )
            self.stdout.write(f'  {"Created" if created else "Updated"}: {idata["name"]}')

        self.stdout.write(self.style.SUCCESS('Kategori User menu seeded!'))
