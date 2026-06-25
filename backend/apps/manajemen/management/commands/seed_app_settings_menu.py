"""
Seeder for App Settings Menu
Creates "Data Aplikasi" category and menu items
"""

from django.core.management.base import BaseCommand
from apps.manajemen.models import MenuCategory, MenuItem


class Command(BaseCommand):
    help = 'Seed menu for App Settings'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding App Settings Menu...')

        # 1. Create Menu Category "Data Aplikasi"
        category, was_created = MenuCategory.objects.get_or_create(
            code=200,  # Using 200 for Data Aplikasi category
            defaults={
                'name': 'Data Aplikasi',
                'order': 200,
                'is_active': True,
            }
        )
        
        if was_created:
            self.stdout.write(self.style.SUCCESS(f'  ✅ Created category: {category.name}'))
        else:
            self.stdout.write(self.style.NOTICE(f'  ⏭️  Category already exists: {category.name}'))

        # 2. Create Parent Menu "Data Aplikasi"
        parent_menu, was_created = MenuItem.objects.get_or_create(
            name='Data Aplikasi',
            type='module',
            category=200,
            defaults={
                'permission_key': None,
                'url_name': None,
                'external_url': None,
                'icon': 'fas fa-database',
                'parent': None,
                'order': 1,
                'is_active': True,
            }
        )
        
        if was_created:
            self.stdout.write(self.style.SUCCESS(f'  ✅ Created parent menu: {parent_menu.name}'))
        else:
            self.stdout.write(self.style.NOTICE(f'  ⏭️  Parent menu already exists: {parent_menu.name}'))

        # 3. Create Child Menu "Pengaturan Aplikasi"
        child_menu, was_created = MenuItem.objects.get_or_create(
            name='Pengaturan Aplikasi',
            type='menu',
            category=200,
            parent=parent_menu,
            defaults={
                'permission_key': 'data_aplikasi.app_settings.view',
                'url_name': 'manajemen_aplikasi:app_settings_list',
                'external_url': None,
                'icon': 'fas fa-cog',
                'order': 1,
                'is_active': True,
            }
        )
        
        if was_created:
            self.stdout.write(self.style.SUCCESS(f'  ✅ Created child menu: {child_menu.name}'))
        else:
            # Update if exists
            child_menu.permission_key = 'data_aplikasi.app_settings.view'
            child_menu.url_name = 'manajemen_aplikasi:app_settings_list'
            child_menu.icon = 'fas fa-cog'
            child_menu.parent = parent_menu
            child_menu.save()
            self.stdout.write(self.style.WARNING(f'  🔄 Updated child menu: {child_menu.name}'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('✅ App Settings menu seeded successfully!'))
        self.stdout.write(f'   Category: Data Aplikasi (code: 200)')
        self.stdout.write(f'   Parent Menu: Data Aplikasi')
        self.stdout.write(f'   Child Menu: Pengaturan Aplikasi')
