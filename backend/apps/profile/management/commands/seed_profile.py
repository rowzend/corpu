from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from apps.manajemen.models import (
    PermissionFunction,
    PermissionControl,
    PermissionModule,
    PermissionRule,
    RoleRule
)
from apps.profile.models import ProfileSection, Personalia


class Command(BaseCommand):
    help = 'Seed profile instansi data and permissions'

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS('🌱 Seeding Profile Instansi'))
        self.stdout.write('=' * 70)

        self.seed_permissions()
        self.seed_sections()
        self.seed_personalia()

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('✅ Profile Instansi seeding completed!'))

    def seed_permissions(self):
        self.stdout.write('\n📋 Seeding Permissions...')

        module, _ = PermissionModule.objects.get_or_create(
            nama_module='profile',
            defaults={
                'label_module': 'Profile Instansi',
                'deskripsi_module': 'Profil dan informasi instansi',
                'icon': 'fas fa-building',
                'order': 5,
                'is_active': True,
            }
        )

        controls = [
            ('profile_section', 'Section Profile', 'Mengelola section profile (sambutan, visi misi, sejarah, struktur)'),
            ('profile_personalia', 'Personalia', 'Mengelola data personalia/pegawai'),
        ]

        control_objs = {}
        for nama, label, desk in controls:
            ctrl, _ = PermissionControl.objects.get_or_create(
                nama_kontrol=nama,
                defaults={'label_kontrol': label, 'deskripsi_kontrol': desk}
            )
            control_objs[nama] = ctrl

        view = PermissionFunction.objects.get_or_create(
            nama_fungsi='view',
            defaults={'label_fungsi': 'Lihat', 'deskripsi_fungsi': 'Melihat data'}
        )[0]
        create = PermissionFunction.objects.get_or_create(
            nama_fungsi='create',
            defaults={'label_fungsi': 'Tambah', 'deskripsi_fungsi': 'Menambah data'}
        )[0]
        edit = PermissionFunction.objects.get_or_create(
            nama_fungsi='edit',
            defaults={'label_fungsi': 'Edit', 'deskripsi_fungsi': 'Mengubah data'}
        )[0]
        delete = PermissionFunction.objects.get_or_create(
            nama_fungsi='delete',
            defaults={'label_fungsi': 'Hapus', 'deskripsi_fungsi': 'Menghapus data'}
        )[0]

        rules_config = [
            (module, control_objs['profile_section'], view),
            (module, control_objs['profile_section'], create),
            (module, control_objs['profile_section'], edit),
            (module, control_objs['profile_section'], delete),
            (module, control_objs['profile_personalia'], view),
            (module, control_objs['profile_personalia'], create),
            (module, control_objs['profile_personalia'], edit),
            (module, control_objs['profile_personalia'], delete),
        ]

        for mod, ctrl, func in rules_config:
            PermissionRule.objects.get_or_create(
                module=mod, control=ctrl, function=func,
                defaults={'is_active': True}
            )

        # Assign to Super Admin group
        try:
            super_admin = Group.objects.get(name='Super Admin')
            rules = PermissionRule.objects.filter(module=module, is_active=True)
            for rule in rules:
                RoleRule.objects.get_or_create(role=super_admin, rule=rule)
            self.stdout.write(f'  ✓ Assigned {rules.count()} rules to Super Admin')
        except Group.DoesNotExist:
            self.stdout.write(self.style.WARNING('  ⚠ Super Admin group not found'))

        self.stdout.write(self.style.SUCCESS('  ✅ Permissions seeded'))

    def seed_sections(self):
        self.stdout.write('\n📋 Seeding Profile Sections...')

        sections = [
            {
                'key': 'sambutan',
                'title': 'Sambutan Kepala Badan',
                'content': 'Selamat datang di website resmi Badan Pengembangan Sumber Daya Manusia (BPSDM) ...',
                'order': 1,
            },
            {
                'key': 'visi_misi',
                'title': 'Visi & Misi',
                'content': '**Visi:**\nMenjadi lembaga pengembangan SDM yang unggul dan profesional.\n\n**Misi:**\n1. Menyelenggarakan pengembangan kompetensi SDM aparatur\n2. Meningkatkan kualitas pelayanan publik\n3. Mengembangkan sistem manajemen SDM berbasis teknologi',
                'order': 2,
            },
            {
                'key': 'sejarah',
                'title': 'Sejarah CORPU',
                'content': 'CORPU (Corporate University) didirikan sebagai bagian dari upaya pengembangan SDM aparatur secara berkelanjutan ...',
                'order': 3,
            },
            {
                'key': 'struktur_organisasi',
                'title': 'Struktur Organisasi',
                'content': 'Struktur organisasi BPSDM terdiri dari:\n1. Kepala Badan\n2. Sekretaris\n3. Bidang Pengembangan Kompetensi\n4. Bidang Sertifikasi\n5. Sub Bagian Tata Usaha',
                'order': 4,
            },
        ]

        for data in sections:
            section, created = ProfileSection.objects.update_or_create(
                key=data['key'],
                defaults={
                    'title': data['title'],
                    'content': data['content'],
                    'order': data['order'],
                    'is_active': True,
                }
            )
            if created:
                self.stdout.write(f'  ✓ Created section: {data["title"]}')
            else:
                self.stdout.write(f'  ↻ Updated section: {data["title"]}')

        self.stdout.write(self.style.SUCCESS(f'  ✅ Total sections: {ProfileSection.objects.count()}'))

    def seed_personalia(self):
        self.stdout.write('\n📋 Seeding Personalia...')

        personalia = [
            {
                'name': 'Dr. Ahmad Syahputra, M.Si',
                'nip': '197503142005011002',
                'position': 'Kepala Badan',
                'description': 'Memimpin dan mengkoordinasikan seluruh kegiatan BPSDM',
                'order': 1,
            },
            {
                'name': 'Ir. Siti Nurhaliza, MM',
                'nip': '197812102006042001',
                'position': 'Sekretaris Badan',
                'description': 'Mengelola administrasi dan tata usaha badan',
                'order': 2,
            },
            {
                'name': 'Drs. Bambang Suprapto, M.Pd',
                'nip': '197601152005011003',
                'position': 'Kepala Bidang Pengembangan Kompetensi',
                'description': 'Mengelola program pengembangan kompetensi SDM',
                'order': 3,
            },
        ]

        for data in personalia:
            person, created = Personalia.objects.update_or_create(
                name=data['name'],
                defaults={
                    'nip': data.get('nip'),
                    'position': data['position'],
                    'description': data.get('description', ''),
                    'order': data.get('order', 0),
                    'is_active': True,
                }
            )
            if created:
                self.stdout.write(f'  ✓ Created personalia: {data["name"]}')
            else:
                self.stdout.write(f'  ↻ Updated personalia: {data["name"]}')

        self.stdout.write(self.style.SUCCESS(f'  ✅ Total personalia: {Personalia.objects.count()}'))
