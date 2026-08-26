"""
Seed ASN CORPU Permission Data
Creates permissions for ASN CORPU modules: Dashboard, HCDP, Knowledge, Settings
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from apps.manajemen.models import (
    PermissionFunction,
    PermissionControl,
    PermissionModule,
    PermissionRule,
    RoleRule
)


class Command(BaseCommand):
    help = 'Seed ASN CORPU permission data (dashboard, hcdp, knowledge, settings)'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing permissions before seeding',
        )
    
    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS('🌱 Seeding ASN CORPU Permission Data'))
        self.stdout.write('=' * 70)
        
        if options.get('clear'):
            self.clear_permissions()
        
        # Seed Functions
        self.seed_functions()
        
        # Seed Controls
        self.seed_controls()
        
        # Seed Modules
        self.seed_modules()
        
        # Create rules
        self.create_rules()
        
        # Assign to Super Admin
        self.assign_to_super_admin()
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('✅ ASN CORPU Permission seeding completed!'))
        self.stdout.write('')
    
    def clear_permissions(self):
        """Clear existing permissions"""
        self.stdout.write('\n🗑️  Clearing existing permissions...')
        
        rule_count = PermissionRule.objects.count()
        module_count = PermissionModule.objects.count()
        control_count = PermissionControl.objects.count()
        
        PermissionRule.objects.all().delete()
        PermissionModule.objects.all().delete()
        PermissionControl.objects.all().delete()
        
        self.stdout.write(f'  ✓ Deleted {rule_count} rules')
        self.stdout.write(f'  ✓ Deleted {module_count} modules')
        self.stdout.write(f'  ✓ Deleted {control_count} controls')
        
        # Remove unused functions
        unused = ['bulk_delete', 'import', 'reject', 'print']
        deleted = PermissionFunction.objects.filter(nama_fungsi__in=unused).delete()[0]
        self.stdout.write(f'  ✓ Removed {deleted} unused functions')
    
    def seed_functions(self):
        """Seed common functions/actions"""
        self.stdout.write('\n📋 Seeding Functions...')
        
        functions = [
            ('view', 'Lihat', 'Melihat/menampilkan data'),
            ('create', 'Tambah', 'Menambah data baru'),
            ('edit', 'Edit', 'Mengubah data yang ada'),
            ('delete', 'Hapus', 'Menghapus data'),
            ('export', 'Export', 'Export data ke file (Excel/PDF)'),
            ('publish', 'Publish', 'Mempublikasikan konten'),
            ('unpublish', 'Unpublish', 'Membatalkan publikasi konten'),
            ('manage', 'Kelola', 'Mengelola data/pengaturan'),
            ('approve', 'Setujui', 'Menyetujui data'),
        ]
        
        for nama, label, desk in functions:
            func, created = PermissionFunction.objects.get_or_create(
                nama_fungsi=nama,
                defaults={
                    'label_fungsi': label,
                    'deskripsi_fungsi': desk
                }
            )
            if created:
                self.stdout.write(f'  ✓ Created function: {label} ({nama})')
        
        self.stdout.write(self.style.SUCCESS(f'  ✅ Total functions: {PermissionFunction.objects.count()}'))
    
    def seed_controls(self):
        """Seed controls/resources for ASN CORPU"""
        self.stdout.write('\n📋 Seeding Controls...')
        
        controls = [
            # Dashboard
            ('dashboard_main', 'Dashboard Utama', 'Halaman dashboard utama'),
            ('dashboard_stats', 'Dashboard Statistik', 'Statistik dan analytics'),
            
            # HCDP (Human Capital Development Program)
            ('hcdp_program', 'Program HCDP', 'Manajemen program pengembangan SDM'),
            ('hcdp_participant', 'Peserta HCDP', 'Manajemen peserta program'),
            ('hcdp_assessment', 'Assessment HCDP', 'Penilaian dan evaluasi'),
            ('hcdp_report', 'Laporan HCDP', 'Laporan program HCDP'),

            # IDP ASN (Individual Development Plan)
            ('idp_asn', 'IDP ASN', 'Manajemen Individual Development Plan ASN'),
            ('idp_report', 'Laporan IDP', 'Laporan dan rekap IDP ASN'),
            ('idp_approval', 'Approval IDP', 'Persetujuan IDP ASN oleh atasan'),
            
            # Knowledge Management
            ('knowledge_article', 'Artikel Knowledge', 'Manajemen artikel knowledge base'),
            ('knowledge_category', 'Kategori Knowledge', 'Manajemen kategori artikel'),
            ('knowledge_tag', 'Tag Knowledge', 'Manajemen tag artikel'),
            ('knowledge_comment', 'Komentar Knowledge', 'Manajemen komentar artikel'),
            ('knowledge_rating', 'Rating Knowledge', 'Manajemen rating artikel'),
            
            # User Management
            ('user_management', 'Manajemen User', 'Manajemen pengguna sistem'),
            ('role_management', 'Manajemen Role', 'Manajemen role dan permission'),
            ('permission_management', 'Manajemen Permission', 'Manajemen permission'),
            
            # Settings
            ('app_settings', 'Pengaturan Aplikasi', 'Pengaturan umum aplikasi'),
            ('menu_settings', 'Pengaturan Menu', 'Manajemen menu sidebar'),
        ]
        
        for nama, label, desk in controls:
            ctrl, created = PermissionControl.objects.get_or_create(
                nama_kontrol=nama,
                defaults={
                    'label_kontrol': label,
                    'deskripsi_kontrol': desk
                }
            )
            if created:
                self.stdout.write(f'  ✓ Created control: {label} ({nama})')
        
        self.stdout.write(self.style.SUCCESS(f'  ✅ Total controls: {PermissionControl.objects.count()}'))
    
    def seed_modules(self):
        """Seed sidebar modules for ASN CORPU"""
        self.stdout.write('\n📋 Seeding Modules...')
        
        modules = [
            ('dashboard', 'Dashboard', 'Dashboard utama sistem', 'fas fa-tachometer-alt', 1),
            ('hcdp', 'HCDP', 'Human Capital Development Program', 'fas fa-graduation-cap', 2),
            ('idp', 'IDP ASN', 'Individual Development Plan ASN', 'fas fa-clipboard-list', 3),
            ('knowledge', 'Knowledge Base', 'Knowledge Management System', 'fas fa-book', 4),
            ('settings', 'Pengaturan', 'Pengaturan sistem', 'fas fa-cogs', 5),
        ]
        
        for nama, label, desk, icon, order in modules:
            mod, created = PermissionModule.objects.get_or_create(
                nama_module=nama,
                defaults={
                    'label_module': label,
                    'deskripsi_module': desk,
                    'icon': icon,
                    'order': order
                }
            )
            if created:
                self.stdout.write(f'  ✓ Created module: {label} ({nama})')
            else:
                # Update existing module
                mod.label_module = label
                mod.deskripsi_module = desk
                mod.icon = icon
                mod.order = order
                mod.save()
                self.stdout.write(f'  ↻ Updated module: {label} ({nama})')
        
        self.stdout.write(self.style.SUCCESS(f'  ✅ Total modules: {PermissionModule.objects.count()}'))
    
    def create_rules(self):
        """Create permission rules"""
        self.stdout.write('\n📋 Creating Permission Rules...')
        
        # Get functions
        view = PermissionFunction.objects.get(nama_fungsi='view')
        create = PermissionFunction.objects.get(nama_fungsi='create')
        edit = PermissionFunction.objects.get(nama_fungsi='edit')
        delete = PermissionFunction.objects.get(nama_fungsi='delete')
        export = PermissionFunction.objects.get(nama_fungsi='export')
        publish = PermissionFunction.objects.get(nama_fungsi='publish')
        unpublish = PermissionFunction.objects.get(nama_fungsi='unpublish')
        manage = PermissionFunction.objects.get(nama_fungsi='manage')
        approve = PermissionFunction.objects.get(nama_fungsi='approve')
        
        # Get modules
        dashboard_mod = PermissionModule.objects.get(nama_module='dashboard')
        hcdp_mod = PermissionModule.objects.get(nama_module='hcdp')
        idp_mod = PermissionModule.objects.get(nama_module='idp')
        knowledge_mod = PermissionModule.objects.get(nama_module='knowledge')
        settings_mod = PermissionModule.objects.get(nama_module='settings')
        
        # Get controls
        dashboard_main = PermissionControl.objects.get(nama_kontrol='dashboard_main')
        dashboard_stats = PermissionControl.objects.get(nama_kontrol='dashboard_stats')
        
        hcdp_program = PermissionControl.objects.get(nama_kontrol='hcdp_program')
        hcdp_participant = PermissionControl.objects.get(nama_kontrol='hcdp_participant')
        hcdp_assessment = PermissionControl.objects.get(nama_kontrol='hcdp_assessment')
        hcdp_report = PermissionControl.objects.get(nama_kontrol='hcdp_report')

        idp_asn = PermissionControl.objects.get(nama_kontrol='idp_asn')
        idp_report = PermissionControl.objects.get(nama_kontrol='idp_report')
        idp_approval = PermissionControl.objects.get(nama_kontrol='idp_approval')
        
        knowledge_article = PermissionControl.objects.get(nama_kontrol='knowledge_article')
        knowledge_category = PermissionControl.objects.get(nama_kontrol='knowledge_category')
        knowledge_tag = PermissionControl.objects.get(nama_kontrol='knowledge_tag')
        knowledge_comment = PermissionControl.objects.get(nama_kontrol='knowledge_comment')
        knowledge_rating = PermissionControl.objects.get(nama_kontrol='knowledge_rating')
        
        user_mgmt = PermissionControl.objects.get(nama_kontrol='user_management')
        role_mgmt = PermissionControl.objects.get(nama_kontrol='role_management')
        perm_mgmt = PermissionControl.objects.get(nama_kontrol='permission_management')
        app_settings = PermissionControl.objects.get(nama_kontrol='app_settings')
        menu_settings = PermissionControl.objects.get(nama_kontrol='menu_settings')
        
        # Define rules
        rules = [
            # Dashboard
            (dashboard_mod, dashboard_main, view),
            (dashboard_mod, dashboard_stats, view),
            
            # HCDP
            (hcdp_mod, hcdp_program, view),
            (hcdp_mod, hcdp_program, create),
            (hcdp_mod, hcdp_program, edit),
            (hcdp_mod, hcdp_program, delete),
            (hcdp_mod, hcdp_participant, view),
            (hcdp_mod, hcdp_participant, create),
            (hcdp_mod, hcdp_participant, edit),
            (hcdp_mod, hcdp_participant, delete),
            (hcdp_mod, hcdp_assessment, view),
            (hcdp_mod, hcdp_assessment, create),
            (hcdp_mod, hcdp_assessment, edit),
            (hcdp_mod, hcdp_report, view),
            (hcdp_mod, hcdp_report, export),
            
            # IDP ASN
            (idp_mod, idp_asn, view),
            (idp_mod, idp_asn, create),
            (idp_mod, idp_asn, edit),
            (idp_mod, idp_asn, delete),
            (idp_mod, idp_report, view),
            (idp_mod, idp_report, export),
            (idp_mod, idp_approval, view),
            (idp_mod, idp_approval, approve),
            
            # Knowledge
            (knowledge_mod, knowledge_article, view),
            (knowledge_mod, knowledge_article, create),
            (knowledge_mod, knowledge_article, edit),
            (knowledge_mod, knowledge_article, delete),
            (knowledge_mod, knowledge_article, publish),
            (knowledge_mod, knowledge_article, unpublish),
            (knowledge_mod, knowledge_category, view),
            (knowledge_mod, knowledge_category, create),
            (knowledge_mod, knowledge_category, edit),
            (knowledge_mod, knowledge_category, delete),
            (knowledge_mod, knowledge_tag, view),
            (knowledge_mod, knowledge_tag, create),
            (knowledge_mod, knowledge_tag, edit),
            (knowledge_mod, knowledge_tag, delete),
            (knowledge_mod, knowledge_comment, view),
            (knowledge_mod, knowledge_comment, delete),
            (knowledge_mod, knowledge_rating, view),
            
            # Settings - User Management
            (settings_mod, user_mgmt, view),
            (settings_mod, user_mgmt, create),
            (settings_mod, user_mgmt, edit),
            (settings_mod, user_mgmt, delete),
            
            # Settings - Role Management
            (settings_mod, role_mgmt, view),
            (settings_mod, role_mgmt, create),
            (settings_mod, role_mgmt, edit),
            (settings_mod, role_mgmt, delete),
            (settings_mod, role_mgmt, manage),
            
            # Settings - Permission Management
            (settings_mod, perm_mgmt, view),
            (settings_mod, perm_mgmt, manage),
            
            # Settings - App Settings
            (settings_mod, app_settings, view),
            (settings_mod, app_settings, edit),
            
            # Settings - Menu Settings
            (settings_mod, menu_settings, view),
            (settings_mod, menu_settings, edit),
        ]
        
        created_count = 0
        for module, control, function in rules:
            rule, created = PermissionRule.objects.get_or_create(
                module=module,
                control=control,
                function=function
            )
            if created:
                created_count += 1
                self.stdout.write(f'  ✓ Created rule: {module.label_module} → {control.label_kontrol} → {function.label_fungsi}')
        
        self.stdout.write(self.style.SUCCESS(f'  ✅ Total rules: {PermissionRule.objects.count()} ({created_count} new)'))
    
    def assign_to_super_admin(self):
        """Assign all permissions to Super Admin role"""
        self.stdout.write('\n📋 Assigning permissions to Super Admin...')
        
        try:
            super_admin = Group.objects.get(name='Super Admin')
        except Group.DoesNotExist:
            self.stdout.write(self.style.WARNING('  ⚠️  Super Admin role not found, skipping assignment'))
            return
        
        # Clear existing assignments
        RoleRule.objects.filter(role=super_admin).delete()
        
        # Assign all rules
        all_rules = PermissionRule.objects.filter(is_active=True)
        assigned_count = 0
        
        for rule in all_rules:
            RoleRule.objects.get_or_create(
                role=super_admin,
                rule=rule
            )
            assigned_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'  ✅ Assigned {assigned_count} permissions to Super Admin'))
