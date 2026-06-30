from django.core.management.base import BaseCommand
from apps.manajemen.models import MenuCategory, MenuItem


class Command(BaseCommand):
    help = 'Seed menu untuk API SIMPEG (Pegawai)'

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write('Seeding API SIMPEG Menu')
        self.stdout.write('=' * 70)

        category, created = MenuCategory.objects.get_or_create(
            code=4,
            defaults={
                'name': 'Manajemen Integrasi',
                'icon': 'fa-solid fa-plug',
                'order': 4,
                'is_active': True
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created category: {category.name}'))

        parent_menu, created = MenuItem.objects.get_or_create(
            category=category.code,
            name='ESIMPEG',
            parent=None,
            defaults={
                'external_url': '#',
                'icon': 'fa-solid fa-users',
                'order': 1,
                'is_active': True,
                'type': 'module'
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created parent menu: {parent_menu.name}'))

        child_menu, created = MenuItem.objects.get_or_create(
            category=category.code,
            name='Pegawai',
            parent=parent_menu,
            defaults={
                'external_url': '/admin/simpeg',
                'icon': 'fa-solid fa-user-tie',
                'order': 1,
                'is_active': True,
                'type': 'menu'
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created child menu: {child_menu.name}'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('API SIMPEG Menu Seeding Complete'))
