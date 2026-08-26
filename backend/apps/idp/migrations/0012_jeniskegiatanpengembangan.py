from django.db import migrations, models


def seed_default_jenis_kegiatan(apps, schema_editor):
    PilarPengembangan = apps.get_model('idp', 'PilarPengembangan')
    JenisKegiatanPengembangan = apps.get_model('idp', 'JenisKegiatanPengembangan')
    by_nama = {p.nama: p for p in PilarPengembangan.objects.all()}
    defaults = [
        # Pilar Pembelajaran Formal (10%)
        ('Pembelajaran Formal', 'Bimtek/Diklat eksternal'),
        ('Pembelajaran Formal', 'E-Learning (ELMU)'),
        ('Pembelajaran Formal', 'GORVU (KMS & Kursus)'),
        ('Pembelajaran Formal', 'Tugas Belajar'),
        ('Pembelajaran Formal', 'Webinar/Seminar'),
        # Pilar Pembelajaran Sosial (20%)
        ('Pembelajaran Sosial', 'Benchmarking'),
        ('Pembelajaran Sosial', 'Coaching'),
        ('Pembelajaran Sosial', 'Community of Practice'),
        ('Pembelajaran Sosial', 'Mentoring'),
    ]
    for pilar_nama, jenis in defaults:
        pilar = by_nama.get(pilar_nama)
        if not pilar:
            continue
        JenisKegiatanPengembangan.objects.get_or_create(
            pilar_pengembangan=pilar,
            nama=jenis,
            defaults={'pilar_pengembangan': pilar, 'nama': jenis}
        )


def reverse_seed_default_jenis_kegiatan(apps, schema_editor):
    JenisKegiatanPengembangan = apps.get_model('idp', 'JenisKegiatanPengembangan')
    JenisKegiatanPengembangan.objects.filter(nama__in=[
        'Bimtek/Diklat eksternal', 'E-Learning (ELMU)', 'GORVU (KMS & Kursus)',
        'Tugas Belajar', 'Webinar/Seminar', 'Benchmarking', 'Coaching',
        'Community of Practice', 'Mentoring',
    ]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('idp', '0011_pilarpengembangan'),
    ]

    operations = [
        migrations.CreateModel(
            name='JenisKegiatanPengembangan',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nama', models.CharField(max_length=150, verbose_name='Jenis Kegiatan', help_text='Nama jenis kegiatan pengembangan')),
                ('deskripsi', models.TextField(blank=True, default='', verbose_name='Deskripsi', help_text='Deskripsi jenis kegiatan pengembangan')),
                ('is_active', models.BooleanField(default=True, verbose_name='Aktif')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Tanggal Dibuat')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Tanggal Diupdate')),
                ('pilar_pengembangan', models.ForeignKey(on_delete=models.CASCADE, related_name='jenis_kegiatan', to='idp.pilarpengembangan', verbose_name='Pilar Pengembangan', help_text='Pilar pengembangan yang menaungi jenis kegiatan ini')),
            ],
            options={
                'verbose_name': 'Jenis Kegiatan Pengembangan',
                'verbose_name_plural': 'Jenis Kegiatan Pengembangan',
                'db_table': 'idp_jenis_kegiatan_pengembangan',
                'ordering': ['pilar_pengembangan__id', 'id'],
            },
        ),
        migrations.RunPython(
            seed_default_jenis_kegiatan,
            reverse_seed_default_jenis_kegiatan,
        ),
    ]
