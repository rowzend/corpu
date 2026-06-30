from django.core.management.base import BaseCommand
from apps.manajemen.models import MenuItem


class Command(BaseCommand):
    help = 'Seed Referensi sidebar menus'

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write('Seeding Referensi Menus')
        self.stdout.write('=' * 70)

        parent_menu, created = MenuItem.objects.update_or_create(
            name='Referensi Pendidikan',
            parent__isnull=True,
            defaults={
                'type': 'menuItem',
                'icon': 'fas fa-graduation-cap',
                'order': 9,
                'category': 5,
                'is_active': True,
                'permission_key': None,
                'url_name': None,
            }
        )
        self.stdout.write(f'  Parent: {"created" if created else "updated"} - Referensi Pendidikan')

        child_menus = [
            {
                'name': 'Perguruan Tinggi',
                'permission_key': 'referensi.perguruan_tinggi.list',
                'url_name': 'referensi:perguruan_tinggi_list',
                'icon': 'fas fa-university',
                'order': 1,
                'description': 'Daftar referensi perguruan tinggi',
            },
            {
                'name': 'Program Studi',
                'permission_key': 'referensi.program_studi.list',
                'url_name': 'referensi:program_studi_list',
                'icon': 'fas fa-book',
                'order': 2,
                'description': 'Daftar referensi program studi',
            },
        ]

        for menu_data in child_menus:
            child, created = MenuItem.objects.update_or_create(
                name=menu_data['name'],
                parent=parent_menu,
                defaults={
                    'permission_key': menu_data['permission_key'],
                    'url_name': menu_data['url_name'],
                    'icon': menu_data['icon'],
                    'type': 'module',
                    'order': menu_data['order'],
                    'category': 5,
                    'is_active': True,
                }
            )
            self.stdout.write(f'  Child: {"created" if created else "updated"} - {menu_data["name"]}')

        self.stdout.write(self.style.SUCCESS('Referensi menus seeded!'))
