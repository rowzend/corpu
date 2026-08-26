from django.db import migrations, models


def seed_default_pilar(apps, schema_editor):
    PilarPengembangan = apps.get_model('idp', 'PilarPengembangan')
    defaults = [
        {
            'nama': 'Pembelajaran Formal',
            'persentase': 10,
            'deskripsi': 'Pembelajaran Formal (Klasikal/Usulan ke BKPSDM)',
        },
        {
            'nama': 'Pembelajaran Sosial',
            'persentase': 20,
            'deskripsi': 'Pembelajaran Sosial (Coaching, Mentoring, CoP di SKPD)',
        },
        {
            'nama': 'Pengalaman dan Praktik Kerja',
            'persentase': 70,
            'deskripsi': 'Pengalaman dan Praktik Kerja (On-the-job)',
        },
    ]
    for item in defaults:
        PilarPengembangan.objects.get_or_create(
            nama=item['nama'],
            defaults=item
        )


def reverse_seed_default_pilar(apps, schema_editor):
    PilarPengembangan = apps.get_model('idp', 'PilarPengembangan')
    PilarPengembangan.objects.filter(
        nama__in=['Pembelajaran Formal', 'Pembelajaran Sosial', 'Pengalaman dan Praktik Kerja']
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('idp', '0010_prioritas_free_text_no_justifikasi'),
    ]

    operations = [
        migrations.CreateModel(
            name='PilarPengembangan',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nama', models.CharField(max_length=150, verbose_name='Nama Pilar', help_text='Nama pilar pengembangan (mis. Pembelajaran Formal)')),
                ('persentase', models.PositiveIntegerField(default=0, verbose_name='Persentase (%)', help_text='Porsi/bobot pilar dalam pengembangan kompetensi (mis. 70, 20, 10)')),
                ('deskripsi', models.TextField(blank=True, default='', verbose_name='Deskripsi', help_text='Penjelasan kegiatan pada pilar pengembangan ini')),
                ('is_active', models.BooleanField(default=True, verbose_name='Aktif')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Tanggal Dibuat')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Tanggal Diupdate')),
            ],
            options={
                'verbose_name': 'Pilar Pengembangan',
                'verbose_name_plural': 'Pilar Pengembangan',
                'db_table': 'idp_pilar_pengembangan',
                'ordering': ['id'],
            },
        ),
        migrations.RunPython(
            seed_default_pilar,
            reverse_seed_default_pilar,
        ),
    ]
