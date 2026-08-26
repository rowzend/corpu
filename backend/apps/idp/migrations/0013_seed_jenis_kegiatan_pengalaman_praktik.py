from django.db import migrations


def seed_jenis_kegiatan_pengalaman_praktik(apps, schema_editor):
    PilarPengembangan = apps.get_model('idp', 'PilarPengembangan')
    JenisKegiatanPengembangan = apps.get_model('idp', 'JenisKegiatanPengembangan')
    pilar = PilarPengembangan.objects.filter(nama='Pengalaman dan Praktik Kerja').first()
    if not pilar:
        return
    defaults = [
        'Detasering/Magang',
        'Penugasan Khusus',
        'Praktek Mandiri',
        'Shadowing',
    ]
    for nama in defaults:
        JenisKegiatanPengembangan.objects.get_or_create(
            pilar_pengembangan=pilar,
            nama=nama,
            defaults={'pilar_pengembangan': pilar, 'nama': nama},
        )


def reverse_seed_jenis_kegiatan_pengalaman_praktik(apps, schema_editor):
    JenisKegiatanPengembangan = apps.get_model('idp', 'JenisKegiatanPengembangan')
    JenisKegiatanPengembangan.objects.filter(nama__in=[
        'Detasering/Magang', 'Penugasan Khusus', 'Praktek Mandiri', 'Shadowing',
    ]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('idp', '0012_jeniskegiatanpengembangan'),
    ]

    operations = [
        migrations.RunPython(
            seed_jenis_kegiatan_pengalaman_praktik,
            reverse_seed_jenis_kegiatan_pengalaman_praktik,
        ),
    ]