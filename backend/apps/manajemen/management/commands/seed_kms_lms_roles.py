"""
Seed roles: Admin KMS, Admin LMS, Personil, User Luar, User Pemerintah

Creates roles (Groups) with appropriate permissions for:
- Admin KMS    : Full access to Knowledge Base module
- Admin LMS    : Full access to Learning Management System module
- Personil      : Pegawai internal (profil, learning, knowledge read)
- User Luar     : Publik/eksternal (learning enroll, knowledge read)
- User Pemerintah : ASN internal + akses SIASN & API docs

Usage:
  python manage.py seed_kms_lms_roles
  python manage.py seed_kms_lms_roles --clear
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from apps.manajemen.models import PermissionRule, RoleRule, PermissionModule, PermissionControl, PermissionFunction


ROLES = {
    'Admin KMS': {
        'label': 'Admin Knowledge Management System',
        'permissions': [
            ('knowledge', 'knowledge_article', ['view', 'create', 'edit', 'delete', 'publish', 'unpublish']),
            ('knowledge', 'knowledge_category', ['view', 'create', 'edit', 'delete']),
            ('knowledge', 'knowledge_tag', ['view', 'create', 'edit', 'delete']),
            ('knowledge', 'knowledge_comment', ['view', 'delete']),
            ('knowledge', 'knowledge_rating', ['view']),
            ('dashboard', 'dashboard_main', ['view']),
            ('dashboard', 'dashboard_stats', ['view']),
        ]
    },
    'Admin LMS': {
        'label': 'Admin Learning Management System',
        'permissions': [
            ('learning', 'courses', ['view', 'create', 'edit', 'delete', 'enroll', 'export']),
            ('learning', 'modules', ['view', 'create', 'edit', 'delete', 'export']),
            ('learning', 'lessons', ['view', 'create', 'edit', 'delete', 'timer_bypass', 'export']),
            ('learning', 'enrollments', ['view', 'create', 'edit', 'delete', 'export']),
            ('learning', 'quizzes', ['view', 'create', 'edit', 'delete', 'attempt', 'export']),
            ('learning', 'certificates', ['view', 'create', 'edit', 'delete', 'export']),
            ('learning', 'ratings', ['view', 'create', 'edit', 'delete', 'export']),
            ('learning', 'comments', ['view', 'create', 'edit', 'delete', 'export']),
            ('learning', 'lesson_progress', ['view', 'create', 'edit', 'delete', 'export']),
            ('dashboard', 'dashboard_main', ['view']),
            ('dashboard', 'dashboard_stats', ['view']),
        ]
    },
    'Personil': {
        'label': 'Pegawai Internal',
        'permissions': [
            ('dashboard', 'dashboard_main', ['view']),
            ('learning', 'courses', ['view', 'enroll']),
            ('learning', 'lessons', ['view']),
            ('learning', 'quizzes', ['view', 'attempt']),
            ('learning', 'enrollments', ['view']),
            ('learning', 'certificates', ['view']),
            ('learning', 'ratings', ['view']),
            ('knowledge', 'knowledge_article', ['view']),
            ('knowledge', 'knowledge_category', ['view']),
            ('knowledge', 'knowledge_tag', ['view']),
            ('profile', 'profile_personalia', ['view', 'edit']),
        ]
    },
    'User Luar': {
        'label': 'User Eksternal / Publik',
        'permissions': [
            ('dashboard', 'dashboard_main', ['view']),
            ('learning', 'courses', ['view', 'enroll']),
            ('learning', 'lessons', ['view']),
            ('learning', 'quizzes', ['view', 'attempt']),
            ('learning', 'certificates', ['view']),
            ('knowledge', 'knowledge_article', ['view']),
            ('knowledge', 'knowledge_category', ['view']),
            ('knowledge', 'knowledge_tag', ['view']),
            ('profile', 'profile_personalia', ['view', 'edit']),
        ]
    },
    'User Pemerintah': {
        'label': 'User ASN Internal + API',
        'permissions': [
            ('dashboard', 'dashboard_main', ['view']),
            ('dashboard', 'dashboard_stats', ['view']),
            ('learning', 'courses', ['view', 'enroll']),
            ('learning', 'lessons', ['view']),
            ('learning', 'quizzes', ['view', 'attempt']),
            ('learning', 'enrollments', ['view']),
            ('learning', 'certificates', ['view']),
            ('learning', 'ratings', ['view']),
            ('learning', 'lesson_progress', ['view']),
            ('knowledge', 'knowledge_article', ['view']),
            ('knowledge', 'knowledge_category', ['view']),
            ('knowledge', 'knowledge_tag', ['view']),
            ('profile', 'profile_personalia', ['view', 'edit']),
            ('pegawai', 'ms_pegawai', ['view']),
            ('siasn', 'siasn_dashboard', ['view']),
            ('pengaturan', 'api_documentation', ['view']),
        ]
    }
}


class Command(BaseCommand):
    help = 'Seed roles: Admin KMS, Admin LMS, Personil, User Luar, User Pemerintah'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Remove all seeded roles and their rules')

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS(' Seeding Roles'))
        self.stdout.write('=' * 70)

        if options.get('clear'):
            self._clear_roles()
            return

        self._seed_roles()
        self._summary()

    def _clear_roles(self):
        for role_name in ROLES:
            grp = Group.objects.filter(name=role_name).first()
            if grp:
                count, _ = RoleRule.objects.filter(role=grp).delete()
                grp.delete()
                self.stdout.write(self.style.WARNING(f'  Removed role "{role_name}" ({count} rules deleted)'))
            else:
                self.stdout.write(f'  Role "{role_name}" not found, skipping')

    def _seed_roles(self):
        for role_name, config in ROLES.items():
            self.stdout.write(f'\n  Role: {role_name} ({config["label"]})')
            self.stdout.write('  ' + '-' * 50)

            grp, created = Group.objects.get_or_create(name=role_name)
            if created:
                self.stdout.write(f'    Created group: {role_name}')
            else:
                self.stdout.write(f'    Found existing group: {role_name}')

            existing = RoleRule.objects.filter(role=grp).count()
            if existing > 0:
                self.stdout.write(f'    {existing} existing rules found, clearing...')
                RoleRule.objects.filter(role=grp).delete()

            assigned = 0
            skipped = 0

            for mod_name, ctrl_name, func_names in config['permissions']:
                for func_name in func_names:
                    try:
                        module = PermissionModule.objects.get(nama_module=mod_name)
                        control = PermissionControl.objects.get(nama_kontrol=ctrl_name)
                        function = PermissionFunction.objects.get(nama_fungsi=func_name)
                        rule = PermissionRule.objects.get(
                            module=module,
                            control=control,
                            function=function,
                            is_active=True
                        )
                        RoleRule.objects.get_or_create(role=grp, rule=rule)
                        assigned += 1
                    except PermissionModule.DoesNotExist:
                        self.stdout.write(self.style.WARNING(f'    Module not found: {mod_name}'))
                        skipped += 1
                    except PermissionControl.DoesNotExist:
                        self.stdout.write(self.style.WARNING(f'    Control not found: {mod_name}.{ctrl_name}'))
                        skipped += 1
                    except PermissionFunction.DoesNotExist:
                        self.stdout.write(self.style.WARNING(f'    Function not found: {func_name}'))
                        skipped += 1
                    except PermissionRule.DoesNotExist:
                        self.stdout.write(self.style.WARNING(f'    Rule not found: {mod_name}.{ctrl_name}.{func_name}'))
                        skipped += 1

            self.stdout.write(self.style.SUCCESS(f'    Assigned: {assigned} rules'))
            if skipped:
                self.stdout.write(self.style.WARNING(f'    Skipped: {skipped} (not found)'))

    def _summary(self):
        self.stdout.write('\n' + '=' * 70)
        self.stdout.write(self.style.SUCCESS(' Summary'))
        self.stdout.write('=' * 70)

        for role_name in ROLES:
            grp = Group.objects.filter(name=role_name).first()
            if grp:
                count = RoleRule.objects.filter(role=grp).count()
                self.stdout.write(f'  {role_name}: {count} permissions')

        self.stdout.write('')
        self.stdout.write('Next step: Assign users to the role via admin panel.')
        self.stdout.write('')
