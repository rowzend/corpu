"""
Seed Knowledge Base Categories
Run: python manage.py seed_knowledge_categories
"""
from django.core.management.base import BaseCommand
from apps.knowledge.models import Category


class Command(BaseCommand):
    help = 'Seed Knowledge Base Categories'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing categories before seeding')

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS('🌱 Seeding Knowledge Base Categories'))
        self.stdout.write('=' * 70)

        if options.get('clear'):
            count = Category.objects.all().count()
            Category.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'  🗑️  Cleared {count} existing categories'))

        # Parent Categories
        categories_data = [
            {
                'name': 'Teknologi',
                'slug': 'teknologi',
                'description': 'Artikel tentang teknologi dan IT',
                'order_index': 1,
                'children': [
                    {'name': 'Programming', 'slug': 'programming', 'description': 'Tutorial programming dan coding', 'order_index': 1},
                    {'name': 'Database', 'slug': 'database', 'description': 'Database management dan SQL', 'order_index': 2},
                    {'name': 'DevOps', 'slug': 'devops', 'description': 'DevOps, CI/CD, dan deployment', 'order_index': 3},
                ]
            },
            {
                'name': 'Kepegawaian',
                'slug': 'kepegawaian',
                'description': 'Informasi seputar kepegawaian ASN',
                'order_index': 2,
                'children': [
                    {'name': 'Peraturan', 'slug': 'peraturan', 'description': 'Peraturan dan kebijakan kepegawaian', 'order_index': 1},
                    {'name': 'Tunjangan', 'slug': 'tunjangan', 'description': 'Informasi tunjangan pegawai', 'order_index': 2},
                    {'name': 'Pengembangan Karir', 'slug': 'pengembangan-karir', 'description': 'Pengembangan karir dan promosi', 'order_index': 3},
                ]
            },
            {
                'name': 'Tutorial',
                'slug': 'tutorial',
                'description': 'Tutorial dan panduan penggunaan sistem',
                'order_index': 3,
                'children': [
                    {'name': 'Sistem Informasi', 'slug': 'sistem-informasi', 'description': 'Tutorial penggunaan sistem informasi', 'order_index': 1},
                    {'name': 'Aplikasi', 'slug': 'aplikasi', 'description': 'Tutorial aplikasi dan tools', 'order_index': 2},
                ]
            },
            {
                'name': 'Berita',
                'slug': 'berita',
                'description': 'Berita dan informasi terkini',
                'order_index': 4,
                'children': []
            },
            {
                'name': 'FAQ',
                'slug': 'faq',
                'description': 'Frequently Asked Questions',
                'order_index': 5,
                'children': []
            },
        ]

        created_count = 0
        updated_count = 0

        for cat_data in categories_data:
            children = cat_data.pop('children', [])
            
            # Create/Update parent category
            parent, created = Category.objects.update_or_create(
                slug=cat_data['slug'],
                defaults={
                    'name': cat_data['name'],
                    'description': cat_data['description'],
                    'order_index': cat_data['order_index'],
                    'is_active': True,
                }
            )
            
            if created:
                self.stdout.write(f'  ✅ Created: {parent.name}')
                created_count += 1
            else:
                self.stdout.write(f'  ♻️  Updated: {parent.name}')
                updated_count += 1
            
            # Create/Update child categories
            for child_data in children:
                child, created = Category.objects.update_or_create(
                    slug=child_data['slug'],
                    defaults={
                        'name': child_data['name'],
                        'description': child_data['description'],
                        'parent': parent,
                        'order_index': child_data['order_index'],
                        'is_active': True,
                    }
                )
                
                if created:
                    self.stdout.write(f'    ✅ Created: {parent.name} > {child.name}')
                    created_count += 1
                else:
                    self.stdout.write(f'    ♻️  Updated: {parent.name} > {child.name}')
                    updated_count += 1

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'✅ Seeding complete! Created: {created_count}, Updated: {updated_count}'))
        self.stdout.write('')
        self.stdout.write('Category structure:')
        for cat in Category.objects.filter(parent__isnull=True).order_by('order_index'):
            self.stdout.write(f'  📁 {cat.name}')
            for child in cat.children.all().order_by('order_index'):
                self.stdout.write(f'    └─ {child.name}')
