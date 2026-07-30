from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from apps.manajemen.models import PermissionRule, RoleRule


class Command(BaseCommand):
    help = 'Seed Tester role with timer_bypass permission and assign to user 199411192019031001'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Remove Tester role and rules')

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS(' Seeding Tester Role'))
        self.stdout.write('=' * 70)

        if options.get('clear'):
            self._clear()
            return

        self._seed_role()
        self._assign_user()
        self._summary()

    def _clear(self):
        grp = Group.objects.filter(name='Tester').first()
        if grp:
            count, _ = RoleRule.objects.filter(role=grp).delete()
            grp.delete()
            self.stdout.write(self.style.WARNING(f'  Removed role "Tester" ({count} rules deleted)'))
        else:
            self.stdout.write('  Role "Tester" not found, skipping')

    def _seed_role(self):
        self.stdout.write('\n  Creating Tester role...')

        grp, created = Group.objects.get_or_create(name='Tester')
        if created:
            self.stdout.write(f'    Created group: Tester')
        else:
            self.stdout.write(f'    Found existing group: Tester')

        existing = RoleRule.objects.filter(role=grp).count()
        if existing > 0:
            self.stdout.write(f'    {existing} existing rules found, clearing...')
            RoleRule.objects.filter(role=grp).delete()

        permissions = [
            ('learning', 'courses', ['view', 'enroll']),
            ('learning', 'lessons', ['view', 'timer_bypass']),
            ('learning', 'quizzes', ['view', 'attempt']),
            ('learning', 'enrollments', ['view']),
            ('learning', 'certificates', ['view']),
            ('learning', 'ratings', ['view']),
            ('dashboard', 'dashboard_main', ['view']),
        ]

        assigned = 0
        skipped = 0

        for mod_name, ctrl_name, func_names in permissions:
            for func_name in func_names:
                try:
                    rule = PermissionRule.objects.get(
                        module__nama_module=mod_name,
                        control__nama_kontrol=ctrl_name,
                        function__nama_fungsi=func_name,
                        is_active=True
                    )
                    RoleRule.objects.get_or_create(role=grp, rule=rule)
                    assigned += 1
                except PermissionRule.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f'    Rule not found: {mod_name}.{ctrl_name}.{func_name}'))
                    skipped += 1

        self.stdout.write(self.style.SUCCESS(f'    Assigned: {assigned} rules'))
        if skipped:
            self.stdout.write(self.style.WARNING(f'    Skipped: {skipped} (not found)'))

    def _assign_user(self):
        self.stdout.write('\n  Assigning user to Tester role...')
        U = get_user_model()
        try:
            user = U.objects.get(username='199411192019031001')
            grp = Group.objects.get(name='Tester')
            user.groups.add(grp)
            self.stdout.write(self.style.SUCCESS(f'    User 199411192019031001 assigned to Tester role'))
        except U.DoesNotExist:
            self.stdout.write(self.style.WARNING('    User 199411192019031001 not found. Run seed_default_users first.'))
        except Group.DoesNotExist:
            self.stdout.write(self.style.ERROR('    Tester group not found, something went wrong.'))

    def _summary(self):
        self.stdout.write('\n' + '=' * 70)
        self.stdout.write(self.style.SUCCESS(' Summary'))
        self.stdout.write('=' * 70)
        grp = Group.objects.filter(name='Tester').first()
        if grp:
            count = RoleRule.objects.filter(role=grp).count()
            self.stdout.write(f'  Tester: {count} permissions')
            U = get_user_model()
            users_in_role = U.objects.filter(groups=grp)
            self.stdout.write(f'  Users in role: {users_in_role.count()}')
            for u in users_in_role:
                self.stdout.write(f'    - {u.username} ({u.name})')
        self.stdout.write('')
