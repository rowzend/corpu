from django.db import migrations, models


def metode_nama_baru(persentase):
    return {
        10: 'Pembelajaran Formal (Klasikal / Fasilitasi oleh BKPSDM)',
        20: 'Pembelajaran Sosial (Belajar dari orang lain)',
        70: 'Pembelajaran berbasis Pengalaman (Learning by doing)',
    }.get(persentase)


BENTUK_PER_METODE = {
    10: [
        'Pelatihan Klasikal (Teknis / Fungsional)',
        'Bimtek / Workshop / Kursus',
        'Seminar / Sosialisasi',
        'Pelatihan Daring (E-Learning)',
        'E-Learning melalui Platform Corpu',
        'Pendidikan Formal / Tugas Belajar',
    ],
    20: [
        'Coaching',
        'Mentoring',
        'Komunitas Belajar berdasarkan kepakaran',
        'Pelatihan Kantor Sendiri (PKS)',
    ],
    70: [
        'Magang',
        'Bimbingan di tempat kerja',
        'Detasering / Penugasan khusus dari atasan',
        'Squad Team',
        'Patok Banding / Benchmarking',
        'Pembelajaran alam terbuka (outbound)',
    ],
}

METODE_LAMA = {
    10: 'Pembelajaran Formal',
    20: 'Pembelajaran Sosial',
    70: 'Pengalaman dan Praktik Kerja',
}

BENTUK_LAMA = {
    10: ['Bimtek/Diklat eksternal', 'E-Learning (ELMU)', 'GORVU (KMS & Kursus)', 'Tugas Belajar', 'Webinar/Seminar'],
    20: ['Benchmarking', 'Coaching', 'Community of Practice', 'Mentoring'],
    70: ['Detasering/Magang', 'Penugasan Khusus', 'Praktek Mandiri', 'Shadowing'],
}


def rename_metode_ganti_bentuk(apps, schema_editor):
    PilarPengembangan = apps.get_model('idp', 'PilarPengembangan')
    JenisKegiatanPengembangan = apps.get_model('idp', 'JenisKegiatanPengembangan')

    by_pct = {p.persentase: p for p in PilarPengembangan.objects.all()}

    # Rename metode (pilar) sesuai 70-20-10.
    for pct, nama in METODE_LAMA.items():
        p = by_pct.get(pct)
        if p:
            p.nama = metode_nama_baru(pct)
            p.save()

    # Ganti seluruh bentuk (jenis kegiatan) dengan daftar baru.
    JenisKegiatanPengembangan.objects.all().delete()

    for pct, names in BENTUK_PER_METODE.items():
        mk = by_pct.get(pct)
        if not mk:
            continue
        for nama in names:
            JenisKegiatanPengembangan.objects.create(
                pilar_pengembangan_id=mk.id,
                nama=nama,
                is_active=True,
            )


def restore_metode_ganti_bentuk(apps, schema_editor):
    PilarPengembangan = apps.get_model('idp', 'PilarPengembangan')
    JenisKegiatanPengembangan = apps.get_model('idp', 'JenisKegiatanPengembangan')

    by_pct = {p.persentase: p for p in PilarPengembangan.objects.all()}

    for pct, nama in METODE_LAMA.items():
        p = by_pct.get(pct)
        if p:
            p.nama = nama
            p.save()

    JenisKegiatanPengembangan.objects.all().delete()

    for pct, names in BENTUK_LAMA.items():
        mk = by_pct.get(pct)
        if not mk:
            continue
        for nama in names:
            JenisKegiatanPengembangan.objects.create(
                pilar_pengembangan_id=mk.id,
                nama=nama,
                is_active=True,
            )


class Migration(migrations.Migration):

    dependencies = [
        ('idp', '0014_seed_nama_kompetensi_revisi'),
    ]

    operations = [
        migrations.AlterField(
            model_name='pilarpengembangan',
            name='nama',
            field=models.CharField(max_length=200, verbose_name='Nama Metode', help_text='Nama metode pengembangan kompetensi (mis. Pembelajaran Formal)'),
        ),
        migrations.AlterField(
            model_name='pilarpengembangan',
            name='deskripsi',
            field=models.TextField(blank=True, default='', verbose_name='Deskripsi', help_text='Penjelasan kegiatan pada metode pengembangan kompetensi ini'),
        ),
        migrations.AlterModelOptions(
            name='pilarpengembangan',
            options={'ordering': ['id'], 'verbose_name': 'Metode Pengembangan Kompetensi', 'verbose_name_plural': 'Metode Pengembangan Kompetensi'},
        ),
        migrations.AlterField(
            model_name='jeniskegiatanpengembangan',
            name='pilar_pengembangan',
            field=models.ForeignKey(on_delete=models.CASCADE, related_name='jenis_kegiatan', to='idp.pilarpengembangan', verbose_name='Metode Pengembangan Kompetensi', help_text='Metode pengembangan kompetensi yang menaungi bentuk pengembangan ini'),
        ),
        migrations.AlterField(
            model_name='jeniskegiatanpengembangan',
            name='nama',
            field=models.CharField(max_length=200, verbose_name='Bentuk Pengembangan', help_text='Nama bentuk pengembangan kompetensi'),
        ),
        migrations.AlterField(
            model_name='jeniskegiatanpengembangan',
            name='deskripsi',
            field=models.TextField(blank=True, default='', verbose_name='Deskripsi', help_text='Deskripsi bentuk pengembangan kompetensi'),
        ),
        migrations.AlterModelOptions(
            name='jeniskegiatanpengembangan',
            options={'ordering': ['pilar_pengembangan__id', 'id'], 'verbose_name': 'Bentuk Pengembangan Kompetensi', 'verbose_name_plural': 'Bentuk Pengembangan Kompetensi'},
        ),
        migrations.RunPython(
            rename_metode_ganti_bentuk,
            restore_metode_ganti_bentuk,
        ),
    ]