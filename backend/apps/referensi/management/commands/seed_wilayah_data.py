import json
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.core.management.base import BaseCommand
from apps.referensi.models import MsProvinsi, MsKabupaten, MsKecamatan, MsKelurahan

RAW_BASE = 'https://raw.githubusercontent.com/emsifa/api-wilayah-indonesia/master/static/api'
API_BASE = 'https://emsifa.github.io/api-wilayah-indonesia/api'


class Command(BaseCommand):
    help = 'Seed wilayah data (provinsi, kabupaten, kecamatan, kelurahan)'

    def add_arguments(self, parser):
        parser.add_argument('--include-villages', action='store_true', default=True)
        parser.add_argument('--max-workers', type=int, default=20)

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write('Seeding Wilayah Data')
        self.stdout.write('=' * 70)

        provinsi_count = self._fetch_provinsi()
        kabupaten_count = self._fetch_kabupaten()
        kecamatan_count = self._fetch_kecamatan()

        kelurahan_count = 0
        if options.get('include_villages', True):
            kelurahan_count = self._fetch_kelurahan(max_workers=options['max_workers'])

        self.stdout.write('-' * 70)
        self.stdout.write(self.style.SUCCESS(
            f'Sync complete: {provinsi_count} provinsi, {kabupaten_count} kabupaten, '
            f'{kecamatan_count} kecamatan, {kelurahan_count} kelurahan'
        ))
        for model, label in [(MsProvinsi, 'provinsi'), (MsKabupaten, 'kabupaten'),
                             (MsKecamatan, 'kecamatan'), (MsKelurahan, 'kelurahan')]:
            total = model.objects.filter(deleted_at__isnull=True).count()
            self.stdout.write(f'  {label}: {total}')

    def _fetch_json(self, url, timeout=15):
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0')
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())

    def _fetch_provinsi(self):
        self.stdout.write('  Fetching provinsi...')
        try:
            data = self._fetch_json(f'{RAW_BASE}/provinces.json')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed: {e}'))
            return 0
        for item in data:
            kode = str(item.get('id', ''))
            nama = str(item.get('name', ''))
            if kode and nama:
                MsProvinsi.objects.update_or_create(
                    kode=kode, defaults={'nama': nama, 'is_active': True})
        self.stdout.write(f'  Synced {len(data)} provinsi')
        return len(data)

    def _fetch_kabupaten(self):
        provinsi_list = list(MsProvinsi.objects.filter(deleted_at__isnull=True))
        self.stdout.write(f'  Fetching kabupaten from {len(provinsi_list)} provinces...')
        results = []
        with ThreadPoolExecutor(max_workers=10) as ex:
            fut_map = {ex.submit(self._fetch_kabupaten_single, p): p for p in provinsi_list}
            for fut in as_completed(fut_map):
                results.extend(fut.result() or [])
        self.stdout.write(f'  Synced {len(results)} kabupaten')
        return len(results)

    def _fetch_kabupaten_single(self, provinsi):
        try:
            data = self._fetch_json(f'{RAW_BASE}/regencies/{provinsi.kode}.json', timeout=10)
        except Exception:
            return []
        items = []
        for item in data:
            kode = str(item.get('id', ''))
            nama = str(item.get('name', ''))
            if kode and nama:
                MsKabupaten.objects.update_or_create(
                    kode=kode,
                    defaults={'nama': nama, 'provinsi': provinsi, 'is_active': True},
                )
                items.append(kode)
        return items

    def _fetch_kecamatan(self):
        kab_list = list(MsKabupaten.objects.filter(deleted_at__isnull=True))
        self.stdout.write(f'  Fetching kecamatan from {len(kab_list)} regencies...')
        results = 0
        done = 0
        with ThreadPoolExecutor(max_workers=15) as ex:
            fut_map = {ex.submit(self._fetch_kecamatan_single, k): k for k in kab_list}
            for fut in as_completed(fut_map):
                r = fut.result()
                results += r
                done += 1
                if done % 100 == 0:
                    self.stdout.write(f'    Progress: {done}/{len(kab_list)} ({done*100//len(kab_list)}%)')
        self.stdout.write(f'  Synced {results} kecamatan')
        return results

    def _fetch_kecamatan_single(self, kabupaten):
        try:
            data = self._fetch_json(f'{RAW_BASE}/districts/{kabupaten.kode}.json', timeout=10)
        except Exception:
            return 0
        for item in data:
            kode = str(item.get('id', ''))
            nama = str(item.get('name', ''))
            if kode and nama:
                MsKecamatan.objects.update_or_create(
                    kode=kode,
                    defaults={'nama': nama, 'kabupaten': kabupaten, 'is_active': True},
                )
        return len(data)

    def _fetch_kelurahan(self, max_workers=20):
        kec_list = list(MsKecamatan.objects.filter(deleted_at__isnull=True))
        self.stdout.write(f'  Fetching kelurahan from {len(kec_list)} districts ({max_workers} workers)...')
        results = 0
        done = 0
        with ThreadPoolExecutor(max_workers=max_workers) as ex:
            fut_map = {ex.submit(self._fetch_kelurahan_single, k): k for k in kec_list}
            for fut in as_completed(fut_map):
                r = fut.result()
                results += r
                done += 1
                if done % 500 == 0:
                    pct = done * 100 // len(kec_list)
                    self.stdout.write(f'    Progress: {done}/{len(kec_list)} ({pct}%)')
        self.stdout.write(f'  Synced {results} kelurahan')
        return results

    def _fetch_kelurahan_single(self, kecamatan):
        try:
            data = self._fetch_json(f'{API_BASE}/villages/{kecamatan.kode}.json', timeout=10)
        except Exception:
            return 0
        for item in data:
            kode = str(item.get('id', ''))
            nama = str(item.get('name', ''))
            if kode and nama:
                MsKelurahan.objects.update_or_create(
                    kode=kode,
                    defaults={'nama': nama, 'kecamatan': kecamatan, 'is_active': True},
                )
        return len(data)
