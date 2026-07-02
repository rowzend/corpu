import json
import urllib.request
import urllib.error
import openpyxl
import io
from django.core.management.base import BaseCommand
from django.db.models import Q
from apps.referensi.models import MsPerguruanTinggi, MsProgramStudi


PDDIKTI_PT_URL = 'https://api.dikti.go.id/ref/perguruan-tinggi'
PDDIKTI_PRODI_URL = 'https://api.dikti.go.id/ref/program-studi'
GITHUB_PT_URL = 'https://raw.githubusercontent.com/zakiego/daftar-perguruan-tinggi-indonesia/main/data/data.json'
XLSX_PRODI_URL = 'https://data.kemdiktisaintek.go.id/download/datasets/5'


class Command(BaseCommand):
    help = 'Seed referensi data from various sources'

    def add_arguments(self, parser):
        parser.add_argument('--source', type=str, default='github',
                            choices=['github', 'pddikti', 'sample', 'xlsx'],
                            help='Data source: github (default), pddikti, sample, or xlsx')

    def handle(self, *args, **options):
        source = options['source']
        self.stdout.write(f'Seeding referensi data from source: {source}')

        if source == 'sample':
            self._seed_sample()
        elif source == 'pddikti':
            pt_count = self._fetch_pddikti_pt()
            prodi_count = self._fetch_pddikti_prodi()
            self.stdout.write(self.style.SUCCESS(
                f'PD-DIKTI sync complete: {pt_count} PT, {prodi_count} prodi'
            ))
        elif source == 'xlsx':
            prodi_count = self._fetch_xlsx_prodi()
            self.stdout.write(self.style.SUCCESS(
                f'XLSX sync complete: {prodi_count} program studi'
            ))
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

    def _fetch_pddikti_pt(self):
        self.stdout.write(f'Fetching perguruan tinggi from PD-DIKTI...')
        page = 1
        total = 0
        while True:
            try:
                url = f'{PDDIKTI_PT_URL}?page={page}'
                req = urllib.request.Request(url, headers={'Accept': 'application/json'})
                with urllib.request.urlopen(req, timeout=30) as resp:
                    data = json.loads(resp.read().decode())
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'PD-DIKTI PT page {page} failed: {e}'))
                break

            items = data.get('data', []) if isinstance(data, dict) else data
            if not items:
                break

            for item in items:
                kode_pt = item.get('kode_perguruan_tinggi', '')
                if not kode_pt:
                    continue
                MsPerguruanTinggi.objects.update_or_create(
                    kode_pt=kode_pt,
                    defaults={
                        'id_pddikti': str(item.get('id', '')),
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
        return total

    def _fetch_pddikti_prodi(self):
        self.stdout.write(f'Fetching program studi from PD-DIKTI...')
        page = 1
        total = 0
        while True:
            try:
                url = f'{PDDIKTI_PRODI_URL}?page={page}'
                req = urllib.request.Request(url, headers={'Accept': 'application/json'})
                with urllib.request.urlopen(req, timeout=30) as resp:
                    data = json.loads(resp.read().decode())
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'PD-DIKTI Prodi page {page} failed: {e}'))
                break

            items = data.get('data', []) if isinstance(data, dict) else data
            if not items:
                break

            for item in items:
                kode_prodi = item.get('kode_program_studi', '')
                kode_pt = item.get('kode_perguruan_tinggi', '')
                if not kode_prodi and not kode_pt:
                    continue

                pt = None
                if kode_pt:
                    pt = MsPerguruanTinggi.objects.filter(kode_pt=kode_pt, deleted_at__isnull=True).first()

                if not pt:
                    continue

                id_pddikti_pt_str = str(item.get('id_perguruan_tinggi', ''))
                prodi_pt = MsPerguruanTinggi.objects.filter(
                    deleted_at__isnull=True
                ).filter(
                    Q(kode_pt=kode_pt) | Q(id_pddikti=id_pddikti_pt_str)
                ).first()
                if not prodi_pt:
                    continue

                defaults = {
                    'id_pddikti': str(item.get('id', '')),
                    'nama_prodi': item.get('nama_program_studi', ''),
                    'jenjang': item.get('nama_jenjang_didik', ''),
                    'akreditasi': item.get('akreditasi', ''),
                    'is_active': True,
                }

                if kode_prodi:
                    MsProgramStudi.objects.update_or_create(
                        kode_prodi=kode_prodi,
                        perguruan_tinggi=prodi_pt,
                        defaults=defaults,
                    )
                else:
                    defaults['kode_prodi'] = ''
                    MsProgramStudi.objects.update_or_create(
                        nama_prodi=item.get('nama_program_studi', ''),
                        perguruan_tinggi=prodi_pt,
                        jenjang=item.get('nama_jenjang_didik', ''),
                        defaults=defaults,
                    )
                total += 1

            page += 1

        self.stdout.write(f'  Synced {total} program studi from PD-DIKTI')
        return total

    def _fetch_xlsx_prodi(self):
        self.stdout.write(f'Downloading XLSX from Kemdiktisaintek...')
        try:
            req = urllib.request.Request(XLSX_PRODI_URL)
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = resp.read()
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Download XLSX failed: {e}'))
            return 0

        self.stdout.write(f'Parsing XLSX ({len(data)} bytes)...')
        wb = openpyxl.load_workbook(io.BytesIO(data), read_only=True)
        ws = wb.active

        total = 0
        skipped_no_pt = 0
        skipped_error = 0

        for i, row in enumerate(ws.iter_rows(min_row=2, values_only=True)):
            if len(row) < 12:
                continue

            npsn = str(row[3]).strip() if row[3] else ''
            kode_prodi = str(row[9]).strip() if row[9] else ''
            nm_prodi = str(row[10]).strip() if row[10] else ''
            jenjang = str(row[11]).strip() if row[11] else ''

            if not nm_prodi:
                continue

            pt = None
            if npsn:
                pt = MsPerguruanTinggi.objects.filter(
                    Q(kode_pt=npsn) | Q(kode_pt=npsn.lstrip('0')),
                    deleted_at__isnull=True
                ).first()

            if not pt:
                skipped_no_pt += 1
                continue

            try:
                defaults = {
                    'nama_prodi': nm_prodi,
                    'jenjang': jenjang,
                    'is_active': True,
                }
                if kode_prodi:
                    MsProgramStudi.objects.update_or_create(
                        kode_prodi=kode_prodi,
                        perguruan_tinggi=pt,
                        defaults=defaults,
                    )
                else:
                    MsProgramStudi.objects.update_or_create(
                        nama_prodi=nm_prodi,
                        perguruan_tinggi=pt,
                        jenjang=jenjang,
                        defaults=defaults,
                    )
                total += 1
            except Exception:
                skipped_error += 1

            if total > 0 and total % 5000 == 0:
                self.stdout.write(f'  Progress: {total} prodi synced...')

        self.stdout.write(f'  Synced {total} program studi from XLSX')
        if skipped_no_pt > 0:
            self.stdout.write(self.style.WARNING(f'  {skipped_no_pt} skipped (PT not found in DB)'))
        if skipped_error > 0:
            self.stdout.write(self.style.WARNING(f'  {skipped_error} skipped (errors)'))
        return total
