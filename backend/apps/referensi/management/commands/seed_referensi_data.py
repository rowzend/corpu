import json
import urllib.request
import urllib.error
from django.core.management.base import BaseCommand
from apps.referensi.models import MsPerguruanTinggi, MsProgramStudi


PDDIKTI_PT_URL = 'https://api.dikti.go.id/ref/perguruan-tinggi'
GITHUB_PT_URL = 'https://raw.githubusercontent.com/zakiego/daftar-perguruan-tinggi-indonesia/main/data/data.json'


class Command(BaseCommand):
    help = 'Seed referensi data from PD-DIKTI API or GitHub dataset'

    def add_arguments(self, parser):
        parser.add_argument('--source', type=str, default='github',
                            choices=['github', 'pddikti', 'sample'],
                            help='Data source: github (default), pddikti, or sample')

    def handle(self, *args, **options):
        source = options['source']
        self.stdout.write(f'Seeding referensi data from source: {source}')

        if source == 'sample':
            self._seed_sample()
        elif source == 'pddikti':
            self._fetch_pddikti()
        else:
            self._fetch_github()

        count_pt = MsPerguruanTinggi.objects.filter(deleted_at__isnull=True).count()
        count_prodi = MsProgramStudi.objects.filter(deleted_at__isnull=True).count()
        self.stdout.write(self.style.SUCCESS(
            f'Done! {count_pt} perguruan tinggi, {count_prodi} program studi'
        ))

    def _seed_sample(self):
        self.stdout.write('Seeding sample data...')
        pts = [
            {'kode_pt': '001001', 'nama_pt': 'Universitas Indonesia', 'bentuk_pt': 'Universitas', 'status_pt': 'Negeri', 'kota': 'Depok', 'provinsi': 'Jawa Barat'},
            {'kode_pt': '002001', 'nama_pt': 'Institut Teknologi Bandung', 'bentuk_pt': 'Institut', 'status_pt': 'Negeri', 'kota': 'Bandung', 'provinsi': 'Jawa Barat'},
            {'kode_pt': '003001', 'nama_pt': 'Universitas Gadjah Mada', 'bentuk_pt': 'Universitas', 'status_pt': 'Negeri', 'kota': 'Yogyakarta', 'provinsi': 'DI Yogyakarta'},
            {'kode_pt': '004001', 'nama_pt': 'Institut Pertanian Bogor', 'bentuk_pt': 'Institut', 'status_pt': 'Negeri', 'kota': 'Bogor', 'provinsi': 'Jawa Barat'},
            {'kode_pt': '005001', 'nama_pt': 'Universitas Airlangga', 'bentuk_pt': 'Universitas', 'status_pt': 'Negeri', 'kota': 'Surabaya', 'provinsi': 'Jawa Timur'},
        ]
        for data in pts:
            MsPerguruanTinggi.objects.update_or_create(
                kode_pt=data['kode_pt'],
                defaults={**data, 'is_active': True},
            )
        self.stdout.write(f'  Created {len(pts)} sample perguruan tinggi')

        prodis = [
            {'kode_prodi': '57201', 'nama_prodi': 'Ilmu Komputer', 'jenjang': 'S1', 'pt_kode': '001001'},
            {'kode_prodi': '55201', 'nama_prodi': 'Teknik Informatika', 'jenjang': 'S1', 'pt_kode': '001001'},
            {'kode_prodi': '54231', 'nama_prodi': 'Teknik Elektro', 'jenjang': 'S1', 'pt_kode': '002001'},
            {'kode_prodi': '55202', 'nama_prodi': 'Teknik Informatika', 'jenjang': 'S1', 'pt_kode': '002001'},
            {'kode_prodi': '61201', 'nama_prodi': 'Manajemen', 'jenjang': 'S1', 'pt_kode': '003001'},
            {'kode_prodi': '62201', 'nama_prodi': 'Akuntansi', 'jenjang': 'S1', 'pt_kode': '003001'},
            {'kode_prodi': '54231', 'nama_prodi': 'Agribisnis', 'jenjang': 'S1', 'pt_kode': '004001'},
            {'kode_prodi': '54241', 'nama_prodi': 'Ilmu Tanah', 'jenjang': 'S1', 'pt_kode': '004001'},
            {'kode_prodi': '48201', 'nama_prodi': 'Farmasi', 'jenjang': 'S1', 'pt_kode': '005001'},
            {'kode_prodi': '13201', 'nama_prodi': 'Kedokteran', 'jenjang': 'S1', 'pt_kode': '005001'},
        ]
        for data in prodis:
            pt = MsPerguruanTinggi.objects.filter(kode_pt=data.pop('pt_kode')).first()
            if pt:
                MsProgramStudi.objects.update_or_create(
                    kode_prodi=data['kode_prodi'], perguruan_tinggi=pt,
                    defaults={**data, 'is_active': True},
                )
        self.stdout.write(f'  Created {len(prodis)} sample program studi')

    def _fetch_github(self):
        self.stdout.write(f'Fetching from GitHub dataset...')
        try:
            req = urllib.request.Request(GITHUB_PT_URL)
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode())
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'GitHub fetch failed: {e}. Falling back to sample.'))
            return self._seed_sample()

        for item in data:
            MsPerguruanTinggi.objects.update_or_create(
                kode_pt=item.get('kode_pt', ''),
                defaults={
                    'id_pddikti': item.get('id_sp', ''),
                    'nama_pt': item.get('nama_pt', ''),
                    'bentuk_pt': item.get('bentuk', ''),
                    'status_pt': 'Negeri' if item.get('status', '') == 'Negeri' else 'Swasta',
                    'is_active': True,
                }
            )
        self.stdout.write(f'  Synced {len(data)} perguruan tinggi from GitHub')

    def _fetch_pddikti(self):
        self.stdout.write(f'Fetching from PD-DIKTI API...')
        page = 1
        total = 0
        while True:
            try:
                url = f'{PDDIKTI_PT_URL}?page={page}'
                req = urllib.request.Request(url, headers={'Accept': 'application/json'})
                with urllib.request.urlopen(req, timeout=30) as resp:
                    data = json.loads(resp.read().decode())
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'PD-DIKTI page {page} failed: {e}'))
                break

            items = data.get('data', []) if isinstance(data, dict) else data
            if not items:
                break

            for item in items:
                MsPerguruanTinggi.objects.update_or_create(
                    kode_pt=item.get('kode_perguruan_tinggi', ''),
                    defaults={
                        'id_pddikti': item.get('id', ''),
                        'nama_pt': item.get('nama_perguruan_tinggi', ''),
                        'bentuk_pt': item.get('bentuk_perguruan_tinggi', ''),
                        'status_pt': item.get('status_perguruan_tinggi', ''),
                        'alamat': item.get('alamat', ''),
                        'telepon': item.get('telepon', ''),
                        'website': item.get('website', ''),
                        'email': item.get('email', ''),
                        'akreditasi': item.get('akreditasi', ''),
                        'is_active': True,
                    }
                )
                total += 1

            page += 1

        self.stdout.write(f'  Synced {total} perguruan tinggi from PD-DIKTI')
