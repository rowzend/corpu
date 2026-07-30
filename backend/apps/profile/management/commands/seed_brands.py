from django.core.management.base import BaseCommand
from apps.profile.models import Brand


class Command(BaseCommand):
    help = 'Seed sample brand data'

    def handle(self, *args, **options):
        # Clear existing brands
        Brand.objects.all().delete()
        
        # Create sample brands
        brands_data = [
            {
                'name': 'Logo Utama Kabupaten Pesisir Selatan',
                'description': 'Logo resmi Pemerintah Kabupaten Pesisir Selatan',
                'is_primary': True,
                'is_active': True,
                'order': 1,
            },
            {
                'name': 'Logo ASN Corporate University',
                'description': 'Logo khusus untuk ASN Corporate University',
                'is_primary': False,
                'is_active': True,
                'order': 2,
            },
            {
                'name': 'Logo Garuda Pancasila',
                'description': 'Logo Garuda Pancasila sebagai simbol negara',
                'is_primary': False,
                'is_active': True,
                'order': 3,
            },
        ]
        
        created_count = 0
        for brand_data in brands_data:
            brand, created = Brand.objects.get_or_create(
                name=brand_data['name'],
                defaults=brand_data
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Created brand: {brand.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  Brand already exists: {brand.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\n🎉 Successfully created {created_count} brands!')
        )
        self.stdout.write(
            self.style.SUCCESS(f'📊 Total brands in database: {Brand.objects.count()}')
        )