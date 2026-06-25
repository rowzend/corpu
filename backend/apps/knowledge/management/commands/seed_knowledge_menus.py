"""
Seed Knowledge Base Sidebar Menus
Creates sidebar menu structure for Knowledge Base

Usage:
  python manage.py seed_knowledge_menus
  python manage.py seed_knowledge_menus --clear

Next steps:
  Run: python manage.py seed_superadmin_full_access
"""
from django.core.management.base import BaseCommand
from apps.manajemen.models import MenuItem


class Command(BaseCommand):
    help = 'Seed Knowledge Base Sidebar Menus'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing Knowledge Base menus')

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS('🌱 Seeding Knowledge Base Menus'))
        self.stdout.write('=' * 70)

        if options.get('clear'):
            # Clear existing Knowledge Base menus
            count = MenuItem.objects.filter(name__icontains='Knowledge').count()
            MenuItem.objects.filter(name__icontains='Knowledge').delete()
            self.stdout.write(self.style.WARNING(f'  🗑️  Cleared {count} existing Knowledge Base menus'))

        # Hapus menu Analytics jika ada
        analytics_count = MenuItem.objects.filter(name='Analytics', parent__name='Knowledge Base').count()
        if analytics_count > 0:
            MenuItem.objects.filter(name='Analytics', parent__name='Knowledge Base').delete()
            self.stdout.write(self.style.WARNING(f'  🗑️  Removed {analytics_count} Analytics menu(s)'))

        # 1. Parent Menu: Knowledge Base
        parent_menu, created = MenuItem.objects.update_or_create(
            name='Knowledge Base',
            parent__isnull=True,
            defaults={
                'type': 'menuItem',
                'icon': 'fas fa-book',
                'order': 10,
                'category': 5,  # Category 5 = Master Data
                'is_active': True,
                'permission_key': None,  # Parent menu tidak perlu permission
                'url_name': None,  # Parent menu tidak perlu URL
            }
        )
        if created:
            self.stdout.write('  ✅ Created parent menu: Knowledge Base')
        else:
            self.stdout.write('  ♻️  Updated parent menu: Knowledge Base')

        # 2. Child Menus
        child_menus_data = [
            {
                'name': 'Kategori',
                'permission_key': 'knowledge.category.view',
                'url_name': 'knowledge:category_list',
                'icon': 'fas fa-folder',
                'order': 1,
                'description': 'Manajemen kategori artikel'
            },
            {
                'name': 'Tag',
                'permission_key': 'knowledge.tags.view',
                'url_name': 'knowledge:tag_manage_list',
                'icon': 'fas fa-tags',
                'order': 2,
                'description': 'Manajemen tag artikel'
            },
            {
                'name': 'Artikel',
                'permission_key': 'knowledge.articles.view',
                'url_name': 'knowledge:article_manage_list',
                'icon': 'fas fa-newspaper',
                'order': 3,
                'description': 'Manajemen artikel Knowledge Base'
            },
            {
                'name': 'Komentar',
                'permission_key': 'knowledge.comments.view',
                'url_name': 'knowledge:comment_manage_list',
                'icon': 'fas fa-comments',
                'order': 4,
                'description': 'Manajemen komentar artikel'
            },
            {
                'name': 'Suka Artikel',
                'permission_key': 'knowledge.article_like.view',
                'url_name': 'knowledge:article_like_manage_list',
                'icon': 'fas fa-thumbs-up',
                'order': 5,
                'description': 'Manajemen suka/tidak suka artikel'
            },
            {
                'name': 'Suka Komentar',
                'permission_key': 'knowledge.comment_like.view',
                'url_name': 'knowledge:comment_like_manage_list',
                'icon': 'fas fa-heart',
                'order': 6,
                'description': 'Manajemen suka/tidak suka komentar'
            },
            {
                'name': 'Rating',
                'permission_key': 'knowledge.rating.view',
                'url_name': 'knowledge:rating_manage_list',
                'icon': 'fas fa-star',
                'order': 7,
                'description': 'Manajemen rating artikel'
            },
            {
                'name': 'Views',
                'permission_key': 'knowledge.view.view',
                'url_name': 'knowledge:view_manage_list',
                'icon': 'fas fa-eye',
                'order': 8,
                'description': 'Analisis dan tracking view artikel'
            },
        ]

        created_count = 0
        updated_count = 0

        for menu_data in child_menus_data:
            child_menu, created = MenuItem.objects.update_or_create(
                name=menu_data['name'],
                parent=parent_menu,
                defaults={
                    'permission_key': menu_data['permission_key'],
                    'url_name': menu_data['url_name'],
                    'icon': menu_data['icon'],
                    'type': 'module',
                    'order': menu_data['order'],
                    'category': 5,  # Category 5 = Master Data
                    'is_active': True,
                }
            )
            
            if created:
                self.stdout.write(f'  ✅ Created child menu: {child_menu.name}')
                created_count += 1
            else:
                self.stdout.write(f'  ♻️  Updated child menu: {child_menu.name}')
                updated_count += 1

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'✅ Knowledge Base menus seeded successfully!'))
        self.stdout.write(f'Created: {created_count}, Updated: {updated_count}')
        self.stdout.write('')
        
        # Show menu structure
        self.stdout.write('Menu structure:')
        self.stdout.write('  📚 Knowledge Base')
        for menu_data in child_menus_data:
            self.stdout.write(f'    └─ {menu_data["icon"]} {menu_data["name"]} ({menu_data["permission_key"]})')
        
        self.stdout.write('')
        self.stdout.write('Next step:')
        self.stdout.write('  Run: python manage.py seed_superadmin_full_access')
        self.stdout.write('')