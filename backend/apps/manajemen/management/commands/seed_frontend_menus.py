"""
Seed MenuItem records for ASNCORPU Next.js frontend sidebar.
These menus are fetched by FrontendSidebarAPIView and rendered dynamically.
Run: python manage.py seed_frontend_menus
"""
from django.core.management.base import BaseCommand
from apps.manajemen.models import MenuItem, MenuCategory


class Command(BaseCommand):
    help = 'Seed MenuItem records for Next.js frontend sidebar'

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS('Seeding Frontend Menu Items'))
        self.stdout.write('=' * 70)

        PLATFORM = 'frontend'
        created_count = 0

        def upsert(name, defaults):
            nonlocal created_count
            obj = MenuItem.objects.filter(
                name=name,
                platform=PLATFORM,
                parent__isnull=True,
            ).first()
            if obj:
                changed = False
                for key, val in defaults.items():
                    if getattr(obj, key) != val:
                        setattr(obj, key, val)
                        changed = True
                if changed:
                    obj.save()
                return obj, False
            obj = MenuItem.objects.create(name=name, platform=PLATFORM, **defaults)
            created_count += 1
            return obj, True

        def upsert_child(parent, name, defaults):
            nonlocal created_count
            obj = MenuItem.objects.filter(
                name=name,
                platform=PLATFORM,
                parent=parent,
            ).first()
            if obj:
                changed = False
                for key, val in defaults.items():
                    if getattr(obj, key) != val:
                        setattr(obj, key, val)
                        changed = True
                if changed:
                    obj.save()
                return obj, False
            obj = MenuItem.objects.create(name=name, platform=PLATFORM, parent=parent, **defaults)
            created_count += 1
            return obj, True

        # ================================================================
        # MENU CATEGORIES
        # ================================================================
        cat_map = {}
        categories = [
            (1, 'Utama', 1),
            (2, 'Manajemen', 2),
            (3, 'Manajemen Data', 3),
            (4, 'Integrasi', 4),
            (5, 'Konten & Informasi', 5),
            (6, 'Pembelajaran', 6),
            (7, 'Kursus Saya', 7),
            (8, 'Referensi', 8),
            (9, 'Pengaturan', 9),
        ]
        for code, name, order in categories:
            cat, _ = MenuCategory.objects.get_or_create(
                code=code,
                defaults={'name': name, 'order': order, 'is_active': True},
            )
            if cat.name != name or cat.order != order:
                cat.name = name
                cat.order = order
                cat.save()
            cat_map[code] = name
            self.stdout.write(f'  Category: {name}')

        # ================================================================
        # 1. UTAMA (category 1)
        # ================================================================
        dashboard, _ = upsert('Dashboard', {
            'icon': '📊',
            'type': 'module',
            'external_url': '/dashboard',
            'order': 1,
            'category': 1,
            'is_active': True,
            'permission_key': 'dashboard.dashboard_main.view',
        })
        if _:
            self.stdout.write('  Created: Dashboard')

        # ================================================================
        # 2. MANAJEMEN (category 2)
        # ================================================================
        user_mgmt, _ = upsert('User Management', {
            'icon': '👥',
            'type': 'menuItem',
            'order': 1,
            'category': 2,
            'is_active': True,
        })
        if _:
            self.stdout.write('  Created: User Management (group)')

        upsert_child(user_mgmt, 'Users', {
            'icon': '👤',
            'type': 'module',
            'external_url': '/users',
            'order': 1,
            'category': 2,
            'is_active': True,
            'permission_key': 'pengaturan.manajemen_user.view',
        })
        self.stdout.write('  Created/Updated: Users')

        upsert_child(user_mgmt, 'Roles', {
            'icon': '🔑',
            'type': 'module',
            'external_url': '/roles',
            'order': 2,
            'category': 2,
            'is_active': True,
            'permission_key': 'pengaturan.manajemen_role.view',
        })
        self.stdout.write('  Created/Updated: Roles')

        # ================================================================
        # 3. MANAJEMEN DATA (category 3)
        # ================================================================
        upsert('Kategori Learning', {
            'icon': '📁',
            'type': 'module',
            'external_url': '/manajemen-data/kategori-learning',
            'order': 1,
            'category': 3,
            'is_active': True,
            'permission_key': 'knowledge.knowledge_category.view',
        })
        self.stdout.write('  Created/Updated: Kategori Learning')

        upsert('Tags', {
            'icon': '🏷️',
            'type': 'module',
            'external_url': '/manajemen-data/tags',
            'order': 2,
            'category': 3,
            'is_active': True,
            'permission_key': 'knowledge.knowledge_tag.view',
        })
        self.stdout.write('  Created/Updated: Tags')

        # ================================================================
        # 4. INTEGRASI (category 4)
        # ================================================================
        simpeg, _ = upsert('ESIMPEG', {
            'icon': '🔌',
            'type': 'menuItem',
            'order': 1,
            'category': 4,
            'is_active': True,
            'permission_key': 'api_simpeg.pegawai.view',
        })
        if _:
            self.stdout.write('  Created: ESIMPEG (group)')

        upsert_child(simpeg, 'Pegawai', {
            'icon': '👤',
            'type': 'module',
            'external_url': '/simpeg',
            'order': 1,
            'category': 4,
            'is_active': True,
            'permission_key': 'api_simpeg.pegawai.view',
        })
        self.stdout.write('  Created/Updated: Pegawai')

        # ================================================================
        # 5. KONTEN & INFORMASI (category 5)
        # ================================================================
        profile, _ = upsert('Profile Instansi', {
            'icon': '🏛️',
            'type': 'menuItem',
            'order': 1,
            'category': 5,
            'is_active': True,
            'permission_key': 'profile.profile_main.view',
        })
        if _:
            self.stdout.write('  Created: Profile Instansi (group)')

        upsert_child(profile, 'Sambutan & Visi Misi', {
            'icon': '📋', 'type': 'module', 'external_url': '/profile/sambutan-visi-misi', 'order': 1, 'category': 5, 'is_active': True,
        })
        upsert_child(profile, 'Sejarah Corpu', {
            'icon': '📜', 'type': 'module', 'external_url': '/profile/sejarah', 'order': 2, 'category': 5, 'is_active': True,
        })
        upsert_child(profile, 'Struktur Organisasi', {
            'icon': '🏗️', 'type': 'module', 'external_url': '/profile/struktur', 'order': 3, 'category': 5, 'is_active': True,
        })
        upsert_child(profile, 'Personalia', {
            'icon': '👥', 'type': 'module', 'external_url': '/profile/personalia', 'order': 4, 'category': 5, 'is_active': True,
        })
        upsert_child(profile, 'Brand', {
            'icon': '🏷️', 'type': 'module', 'external_url': '/profile/brand', 'order': 5, 'category': 5, 'is_active': True,
        })
        self.stdout.write('  Created/Updated: Profile children')

        upsert('Knowledge Base', {
            'icon': '📚', 'type': 'module', 'external_url': '/knowledge', 'order': 2, 'category': 5, 'is_active': True,
            'permission_key': 'knowledge.knowledge_article.view',
        })
        self.stdout.write('  Created/Updated: Knowledge Base')

        upsert('Berita', {
            'icon': '📰', 'type': 'module', 'external_url': '/dashboard/berita', 'order': 3, 'category': 5, 'is_active': True,
            'permission_key': 'berita.news_article.view',
        })
        self.stdout.write('  Created/Updated: Berita')

        # ================================================================
        # 6. PEMBELAJARAN (category 6)
        # ================================================================
        learning, _ = upsert('Learning', {
            'icon': '📚', 'type': 'menuItem', 'order': 1, 'category': 6, 'is_active': True,
            'permission_key': 'learning.courses.view',
        })
        if _:
            self.stdout.write('  Created: Learning (group)')

        upsert_child(learning, 'Semua Kursus', {
            'icon': '📚', 'type': 'module', 'external_url': '/learning/courses', 'order': 1, 'category': 6, 'is_active': True,
        })
        upsert_child(learning, 'Modul & Pelajaran', {
            'icon': '📖', 'type': 'module', 'external_url': '/learning/modules', 'order': 2, 'category': 6, 'is_active': True,
        })
        upsert_child(learning, 'Enrollment', {
            'icon': '📝', 'type': 'module', 'external_url': '/learning/enrollments', 'order': 3, 'category': 6, 'is_active': True,
        })
        upsert_child(learning, 'Progress', {
            'icon': '📊', 'type': 'module', 'external_url': '/learning/progress', 'order': 4, 'category': 6, 'is_active': True,
        })
        upsert_child(learning, 'Quiz', {
            'icon': '❓', 'type': 'module', 'external_url': '/learning/quizzes', 'order': 5, 'category': 6, 'is_active': True,
        })
        upsert_child(learning, 'Sertifikat User', {
            'icon': '👤', 'type': 'module', 'external_url': '/learning/certificates/user', 'order': 6, 'category': 6, 'is_active': True,
        })
        upsert_child(learning, 'Template Sertifikat', {
            'icon': '🏆', 'type': 'module', 'external_url': '/learning/certificates/template', 'order': 7, 'category': 6, 'is_active': True,
        })
        self.stdout.write('  Created/Updated: Learning children')

        upsert('HCDP', {
            'icon': '🎓', 'type': 'module', 'external_url': '/dashboard/hcdp', 'order': 2, 'category': 6, 'is_active': True,
            'permission_key': 'hcdp.hcdp_program.view',
        })
        self.stdout.write('  Created/Updated: HCDP')

        # ================================================================
        # 7. KURSUS SAYA (category 7)
        # ================================================================
        upsert('Kursus Saya', {
            'icon': '📖', 'type': 'module', 'external_url': '/courses/my-courses', 'order': 1, 'category': 7, 'is_active': True,
        })
        self.stdout.write('  Created/Updated: Kursus Saya')

        upsert('Progress Saya', {
            'icon': '📊', 'type': 'module', 'external_url': '/courses/my-progress', 'order': 2, 'category': 7, 'is_active': True,
        })
        self.stdout.write('  Created/Updated: Progress Saya')

        upsert('Sertifikat Saya', {
            'icon': '🏆', 'type': 'module', 'external_url': '/courses/certificates', 'order': 3, 'category': 7, 'is_active': True,
        })
        self.stdout.write('  Created/Updated: Sertifikat Saya')

        # ================================================================
        # 8. REFERENSI (category 8)
        # ================================================================
        upsert('Perguruan Tinggi', {
            'icon': '🏛️', 'type': 'module', 'external_url': '/referensi/perguruan-tinggi', 'order': 1, 'category': 8, 'is_active': True,
            'permission_key': 'referensi.perguruan_tinggi.list',
        })
        self.stdout.write('  Created/Updated: Perguruan Tinggi')

        upsert('Program Studi', {
            'icon': '📚', 'type': 'module', 'external_url': '/referensi/program-studi', 'order': 2, 'category': 8, 'is_active': True,
            'permission_key': 'referensi.program_studi.list',
        })
        self.stdout.write('  Created/Updated: Program Studi')

        # ================================================================
        # 9. PENGATURAN (category 9)
        # ================================================================
        upsert('Settings', {
            'icon': '⚙️', 'type': 'module', 'external_url': '/settings', 'order': 1, 'category': 9, 'is_active': True,
            'permission_key': 'settings.app_settings.view',
        })
        self.stdout.write('  Created/Updated: Settings')

        self.stdout.write(self.style.SUCCESS(f'\nDone! Created/updated {created_count} menu items'))
