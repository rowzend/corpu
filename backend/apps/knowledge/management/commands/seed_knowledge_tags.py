"""
Seed Knowledge Base Tags
Run: python manage.py seed_knowledge_tags
"""
from django.core.management.base import BaseCommand
from apps.knowledge.models import Tag


class Command(BaseCommand):
    help = 'Seed Knowledge Base Tags'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing tags before seeding')

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS('🌱 Seeding Knowledge Base Tags'))
        self.stdout.write('=' * 70)

        if options.get('clear'):
            count = Tag.objects.all().count()
            Tag.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'  🗑️  Cleared {count} existing tags'))

        tags_data = [
            # Technology Tags
            {'name': 'Python', 'slug': 'python'},
            {'name': 'Django', 'slug': 'django'},
            {'name': 'JavaScript', 'slug': 'javascript'},
            {'name': 'React', 'slug': 'react'},
            {'name': 'Vue.js', 'slug': 'vuejs'},
            {'name': 'Docker', 'slug': 'docker'},
            {'name': 'Kubernetes', 'slug': 'kubernetes'},
            {'name': 'PostgreSQL', 'slug': 'postgresql'},
            {'name': 'MySQL', 'slug': 'mysql'},
            {'name': 'Redis', 'slug': 'redis'},
            {'name': 'API', 'slug': 'api'},
            {'name': 'REST', 'slug': 'rest'},
            {'name': 'GraphQL', 'slug': 'graphql'},
            
            # General Tags
            {'name': 'Tutorial', 'slug': 'tutorial'},
            {'name': 'Panduan', 'slug': 'panduan'},
            {'name': 'Tips', 'slug': 'tips'},
            {'name': 'Best Practice', 'slug': 'best-practice'},
            {'name': 'Troubleshooting', 'slug': 'troubleshooting'},
            
            # ASN/Kepegawaian Tags
            {'name': 'ASN', 'slug': 'asn'},
            {'name': 'Kepegawaian', 'slug': 'kepegawaian'},
            {'name': 'Peraturan', 'slug': 'peraturan'},
            {'name': 'Tunjangan', 'slug': 'tunjangan'},
            {'name': 'Promosi', 'slug': 'promosi'},
            {'name': 'Diklat', 'slug': 'diklat'},
            
            # System Tags
            {'name': 'SIMPEG', 'slug': 'simpeg'},
            {'name': 'E-Office', 'slug': 'e-office'},
            {'name': 'Sistem Informasi', 'slug': 'sistem-informasi'},
        ]

        created_count = 0
        updated_count = 0

        for tag_data in tags_data:
            tag, created = Tag.objects.update_or_create(
                slug=tag_data['slug'],
                defaults={'name': tag_data['name']}
            )
            
            if created:
                self.stdout.write(f'  ✅ Created: {tag.name}')
                created_count += 1
            else:
                self.stdout.write(f'  ♻️  Updated: {tag.name}')
                updated_count += 1

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'✅ Seeding complete! Created: {created_count}, Updated: {updated_count}'))
        self.stdout.write(f'Total tags: {Tag.objects.count()}')
