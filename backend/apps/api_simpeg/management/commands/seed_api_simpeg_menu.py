from django.core.management.base import BaseCommand
from apps.manajemen.models import MenuItem


class Command(BaseCommand):
    help = 'Seed menu untuk API SIMPEG (Pegawai) under Integration in Management'

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write('Seeding API SIMPEG Menu')
        self.stdout.write('=' * 70)

        # Deactivate old top-level ESIMPEG if exists
        old_esimpeg = MenuItem.objects.filter(
            name='ESIMPEG', platform='frontend', parent__isnull=True, category=4
        ).first()
        if old_esimpeg:
            old_esimpeg.is_active = False
            old_esimpeg.save(update_fields=['is_active'])
            self.stdout.write('  Deactivated old ESIMPEG (top-level, category 4)')

        # Find or create Integration parent under Management
        integration, _ = MenuItem.objects.get_or_create(
            name='Integration',
            platform='frontend',
            parent__isnull=True,
            defaults={
                'icon': '🔌',
                'type': 'menuItem',
                'order': 2,
                'category': 2,
                'is_active': True,
            }
        )
        if _:
            self.stdout.write(self.style.SUCCESS('Created Integration (parent)'))

        parent_menu, created = MenuItem.objects.get_or_create(
            name='ESIMPEG',
            parent=integration,
            platform='frontend',
            defaults={
                'icon': '🔌',
                'type': 'menuItem',
                'order': 1,
                'category': 2,
                'is_active': True,
                'permission_key': 'api_simpeg.pegawai.view',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created: ESIMPEG (under Integration)'))

        child_menu, created = MenuItem.objects.get_or_create(
            name='Pegawai',
            parent=parent_menu,
            platform='frontend',
            defaults={
                'icon': '👤',
                'type': 'module',
                'external_url': '/admin/simpeg',
                'order': 1,
                'category': 2,
                'is_active': True,
                'permission_key': 'api_simpeg.pegawai.view',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created: Pegawai'))

        unit_kerja_menu, created = MenuItem.objects.get_or_create(
            name='Unit Kerja',
            parent=parent_menu,
            platform='frontend',
            defaults={
                'icon': '🏢',
                'type': 'module',
                'external_url': '/admin/simpeg/unit-kerja',
                'order': 3,
                'category': 2,
                'is_active': True,
                'permission_key': 'api_simpeg.unit_kerja.view',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created: Unit Kerja'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('API SIMPEG Menu Seeding Complete'))
