"""
Seed Knowledge Base Ratings Permissions
Creates permissions for rating management

Usage:
  python manage.py seed_knowledge_ratings_permissions
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from apps.manajemen.models import (
    PermissionModule,
    PermissionControl,
    PermissionFunction,
    PermissionRule,
    RoleRule
)


class Command(BaseCommand):
    help = 'Seed Knowledge Base Ratings Permissions'

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS('🌱 Seeding Knowledge Base Ratings Permissions'))
        self.stdout.write('=' * 70)

        # 1. Get or create Knowledge module
        knowledge_module, created = PermissionModule.objects.get_or_create(
            nama_module='knowledge',
            defaults={
                'label_module': 'Knowledge Base',
                'deskripsi_module': 'Manajemen Knowledge Base',
                'icon': 'fas fa-book',
                'order': 5,
                'is_active': True,
            }
        )
        if created:
            self.stdout.write('  ✅ Created module: Knowledge Base')
        else:
            self.stdout.write('  ♻️  Using existing module: Knowledge Base')

        # 2. Create control for ratings
        rating_control, created = PermissionControl.objects.get_or_create(
            nama_kontrol='rating',
            defaults={
                'label_kontrol': 'Ratings',
                'deskripsi_kontrol': 'Manajemen rating artikel'
            }
        )
        
        if created:
            self.stdout.write(f'  ✅ Created control: {rating_control.label_kontrol}')
        else:
            self.stdout.write(f'  ♻️  Using existing control: {rating_control.label_kontrol}')

        # 3. Get functions (view, delete)
        functions = {}
        for func_name in ['view', 'delete']:
            try:
                func = PermissionFunction.objects.get(nama_fungsi=func_name)
                functions[func_name] = func
                self.stdout.write(f'  ♻️  Using existing function: {func.label_fungsi}')
            except PermissionFunction.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'  ❌ Function not found: {func_name}'))
                self.stdout.write(self.style.WARNING('     Please run: python manage.py seed_permission_functions'))
                return

        # 4. Create permission rules
        rules_created = 0
        rules_existing = 0

        for func_name, func in functions.items():
            rule, created = PermissionRule.objects.get_or_create(
                module=knowledge_module,
                control=rating_control,
                function=func,
                defaults={
                    'is_active': True
                }
            )
            
            if created:
                rules_created += 1
                self.stdout.write(f'  ✅ Created rule: knowledge.rating.{func_name}')
            else:
                rules_existing += 1
                self.stdout.write(f'  ♻️  Rule already exists: knowledge.rating.{func_name}')

        # 5. Assign to Super Admin group
        try:
            super_admin_group = Group.objects.get(name='Super Admin')
            
            # Get all rating rules
            rating_rules = PermissionRule.objects.filter(
                module=knowledge_module,
                control=rating_control
            )
            
            assigned_count = 0
            for rule in rating_rules:
                role_rule, created = RoleRule.objects.get_or_create(
                    role=super_admin_group,
                    rule=rule
                )
                if created:
                    assigned_count += 1
                    self.stdout.write(f'  ✅ Assigned to Super Admin: knowledge.rating.{rule.function.nama_fungsi}')
            
            if assigned_count == 0:
                self.stdout.write('  ♻️  All permissions already assigned to Super Admin')
                
        except Group.DoesNotExist:
            self.stdout.write(self.style.ERROR('  ❌ Super Admin group not found!'))
            self.stdout.write(self.style.WARNING('     Please run: python manage.py seed_groups'))

        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('✅ Knowledge Base Ratings permissions seeded successfully!'))
        self.stdout.write(f'   Rules created: {rules_created}')
        self.stdout.write(f'   Rules existing: {rules_existing}')
        self.stdout.write('')
        self.stdout.write('Next step:')
        self.stdout.write('  Run: python manage.py seed_knowledge_menus')
        self.stdout.write('')
