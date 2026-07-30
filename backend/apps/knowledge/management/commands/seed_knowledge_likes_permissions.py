"""
Seed Knowledge Base Likes Permissions
Creates permissions for article_like and comment_like management

Usage:
  python manage.py seed_knowledge_likes_permissions
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
    help = 'Seed Knowledge Base Likes Permissions'

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS('🌱 Seeding Knowledge Base Likes Permissions'))
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

        # 2. Create controls for likes
        controls_data = [
            {
                'nama_kontrol': 'article_like',
                'label_kontrol': 'Article Likes',
                'deskripsi_kontrol': 'Manajemen likes/dislikes artikel'
            },
            {
                'nama_kontrol': 'comment_like',
                'label_kontrol': 'Comment Likes',
                'deskripsi_kontrol': 'Manajemen likes/dislikes komentar'
            },
        ]

        controls = {}
        for control_data in controls_data:
            control, created = PermissionControl.objects.get_or_create(
                nama_kontrol=control_data['nama_kontrol'],
                defaults={
                    'label_kontrol': control_data['label_kontrol'],
                    'deskripsi_kontrol': control_data['deskripsi_kontrol'],
                }
            )
            controls[control_data['nama_kontrol']] = control
            
            if created:
                self.stdout.write(f'  ✅ Created control: {control.label_kontrol}')
            else:
                self.stdout.write(f'  ♻️  Using existing control: {control.label_kontrol}')

        # 3. Get functions (view, delete)
        functions = {}
        for func_name in ['view', 'delete']:
            try:
                func = PermissionFunction.objects.get(nama_fungsi=func_name)
                functions[func_name] = func
                self.stdout.write(f'  ♻️  Using existing function: {func.label_fungsi}')
            except PermissionFunction.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'  ❌ Function "{func_name}" not found!'))
                self.stdout.write('     Run: python manage.py seed_permission_functions')
                return

        # 4. Create permission rules
        rules_created = 0
        rules_existing = 0

        for control_name, control in controls.items():
            for func_name, function in functions.items():
                rule, created = PermissionRule.objects.get_or_create(
                    module=knowledge_module,
                    control=control,
                    function=function,
                    defaults={'is_active': True}
                )
                
                if created:
                    rules_created += 1
                    self.stdout.write(f'  ✅ Created rule: knowledge.{control_name}.{func_name}')
                else:
                    rules_existing += 1

        self.stdout.write('')
        self.stdout.write(f'Rules: Created {rules_created}, Existing {rules_existing}')

        # 5. Assign to Super Admin role
        try:
            super_admin = Group.objects.get(name='Super Admin')
            
            # Get all likes rules
            likes_rules = PermissionRule.objects.filter(
                module=knowledge_module,
                control__nama_kontrol__in=['article_like', 'comment_like']
            )
            
            assigned_count = 0
            for rule in likes_rules:
                role_rule, created = RoleRule.objects.get_or_create(
                    role=super_admin,
                    rule=rule
                )
                if created:
                    assigned_count += 1
            
            self.stdout.write('')
            self.stdout.write(f'✅ Assigned {assigned_count} new permissions to Super Admin')
            
        except Group.DoesNotExist:
            self.stdout.write(self.style.WARNING('⚠️  Super Admin group not found'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('✅ Likes permissions seeded successfully!'))
        self.stdout.write('')
        
        # Show created permissions
        self.stdout.write('Created permissions:')
        self.stdout.write('  knowledge.article_like.view')
        self.stdout.write('  knowledge.article_like.delete')
        self.stdout.write('  knowledge.comment_like.view')
        self.stdout.write('  knowledge.comment_like.delete')
        self.stdout.write('')
