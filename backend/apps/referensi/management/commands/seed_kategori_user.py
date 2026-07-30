from django.core.management.base import BaseCommand
from apps.referensi.models import MsKategoriUser


class Command(BaseCommand):
    help = 'Seed default Kategori User'

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write('Seeding Kategori User')
        self.stdout.write('=' * 70)

        items = [
            {'kode': 'MAHASISWA', 'nama': 'Mahasiswa', 'deskripsi': 'Mahasiswa aktif dari berbagai perguruan tinggi'},
            {'kode': 'DOSEN', 'nama': 'Dosen', 'deskripsi': 'Tenaga pengajar/dosen dari perguruan tinggi'},
            {'kode': 'WIDYAISWARA', 'nama': 'Widyaiswara', 'deskripsi': 'Tenaga pengajar/pelatih di lingkungan pemerintah'},
            {'kode': 'ASN', 'nama': 'ASN', 'deskripsi': 'Aparatur Sipil Negara (PNS/CPNS/P3K)'},
            {'kode': 'SWASTA', 'nama': 'Pekerja Swasta', 'deskripsi': 'Karyawan perusahaan swasta'},
            {'kode': 'PENSIUN', 'nama': 'Pensiun', 'deskripsi': 'Pensiunan ASN atau pegawai'},
            {'kode': 'UMUM', 'nama': 'Umum', 'deskripsi': 'Masyarakat umum/pengguna lain'},
        ]

        for data in items:
            item, created = MsKategoriUser.objects.update_or_create(
                kode=data['kode'],
                defaults={
                    'nama': data['nama'],
                    'deskripsi': data['deskripsi'],
                    'is_active': True,
                }
            )
            self.stdout.write(f'  {"Created" if created else "Updated"}: {item.kode} - {item.nama}')

        self.stdout.write(self.style.SUCCESS('Kategori User seeded!'))
