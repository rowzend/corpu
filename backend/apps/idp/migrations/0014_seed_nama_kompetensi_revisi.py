from django.db import migrations


def seed_nama_kompetensi_revisi(apps, schema_editor):
    JenisKompetensi = apps.get_model('idp', 'JenisKompetensi')
    NamaKompetensi = apps.get_model('idp', 'NamaKompetensi')

    by_nama = {j.nama: j for j in JenisKompetensi.objects.all()}

    data = {
        'Manajerial': [
            'Integritas',
            'Kerjasama',
            'Komunikasi',
            'Orientasi pada Hasil',
            'Pelayanan Publik',
            'Pengembangan Diri dan Orang Lain',
            'Mengelola Perubahan',
            'Pengambilan Keputusan',
        ],
        'Sosial Kultural': [
            'Perekat Bangsa',
        ],
        'Teknis': [
            'Sesuai OPD dan Tupoksi Jabatan (File Lampiran HCDP)',
        ],
    }

    revisi_nama = {n for names in data.values() for n in names}
    # Hapus seluruh nama kompetensi lama yang bukan bagian dari daftar revisi.
    NamaKompetensi.objects.exclude(nama__in=revisi_nama).delete()

    for jenis_nama, names in data.items():
        jenis = by_nama.get(jenis_nama)
        if not jenis:
            continue
        for nama in names:
            NamaKompetensi.objects.get_or_create(
                jenis_kompetensi=jenis,
                nama=nama,
                defaults={'jenis_kompetensi': jenis, 'nama': nama},
            )


def reverse_seed_nama_kompetensi_revisi(apps, schema_editor):
    NamaKompetensi = apps.get_model('idp', 'NamaKompetensi')
    NamaKompetensi.objects.filter(nama__in=[
        'Integritas', 'Kerjasama', 'Komunikasi', 'Orientasi pada Hasil',
        'Pelayanan Publik', 'Pengembangan Diri dan Orang Lain',
        'Mengelola Perubahan', 'Pengambilan Keputusan', 'Perekat Bangsa',
        'Sesuai OPD dan Tupoksi Jabatan (File Lampiran HCDP)',
    ]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('idp', '0013_seed_jenis_kegiatan_pengalaman_praktik'),
    ]

    operations = [
        migrations.RunPython(
            seed_nama_kompetensi_revisi,
            reverse_seed_nama_kompetensi_revisi,
        ),
    ]