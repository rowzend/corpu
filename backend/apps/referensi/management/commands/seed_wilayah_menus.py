from django.core.management.base import BaseCommand
from apps.manajemen.models import MenuItem


class Command(BaseCommand):
    help = 'Seed Lokasi Daerah sidebar menu (under Data References in Management)'

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write('Seeding Lokasi Daerah Menu')
        self.stdout.write('=' * 70)

        # Deactivate old top-level item if exists
        old_ref = MenuItem.objects.filter(
            name='Lokasi Daerah', platform='frontend', parent__isnull=True, category=8
        ).first()
        if old_ref:
            old_ref.is_active = False
            old_ref.save(update_fields=['is_active'])
            self.stdout.write('  Deactivated old Lokasi Daerah (top-level, category 8)')

        # Find Data References parent under Management
        ref_parent = MenuItem.objects.filter(
            name='Data References',
            platform='frontend',
            parent__isnull=True,
            category=2,
        ).first()

        if not ref_parent:
            self.stdout.write(self.style.WARNING('Data References parent not found. Run seed_frontend_menus first.'))
            return

        items = [
            {
                'name': 'Lokasi Daerah',
                'permission_key': 'referensi.provinsi.list',
                'external_url': '/admin/referensi/lokasi-daerah',
                'icon': '🗺️',
                'order': 4,
            },
        ]

        for idata in items:
            item, created = MenuItem.objects.update_or_create(
                name=idata['name'],
                parent=ref_parent,
                platform='frontend',
                defaults={
                    'permission_key': idata['permission_key'],
                    'external_url': idata['external_url'],
                    'icon': idata['icon'],
                    'type': 'module',
                    'order': idata['order'],
                    'category': 2,
                    'is_active': True,
                }
            )
            self.stdout.write(f'  {"Created" if created else "Updated"}: {idata["name"]}')

        self.stdout.write(self.style.SUCCESS('Lokasi Daerah menu seeded!'))
