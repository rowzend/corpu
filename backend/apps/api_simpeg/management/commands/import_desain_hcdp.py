import os
import re
import zipfile
from xml.etree import ElementTree as ET

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.contrib.auth import get_user_model

from apps.api_simpeg.models import (
    UnitKerja,
    DesainPembelajaranUnit,
    KompetensiTeknisUnit,
    TujuanPembelajaranUnit,
)

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
USER = get_user_model()

# Awalan jabatan yang HARUS dibuang (sisanya adalah nama unit)
ROLE_PREFIXES = [
    'KEPALA ',
    'SELURUH ASN PADA ',
    'CAMAT',
]

# Awalan jabatan yang diubah menjadi bagian nama unit (Sekretaris -> Sekretariat)
ROLE_REPLACES = [
    ('SEKRETARIS ', 'SEKRETARIAT '),
]

# Frasa di Word yang harus disamakan dengan bentuk di DB
SYNONYMS = [
    ('DEWAN PERWAKILAN RAKYAT DAERAH', 'DPRD'),
    ('DEWAN PERWAKILAN RAKYAT', 'DPR'),
    ('KERJASAMA', 'KERJA SAMA'),
    ('KETRANSMIGRASIAN', 'KETENAGAKERJAAN TRANSMIGRASI'),
]

AMBIG_MARKER = '[AMBIG-HCDP]'


def _cell_text(tc):
    # Pertahankan pemisah baris antar paragraf (<w:p>) agar tiap baris
    # di dalam satu sel Word tidak tercampur jadi satu string.
    paras = []
    for p in tc.iter(f'{{{W}}}p'):
        txt = ''.join(t.text or '' for t in p.iter(f'{{{W}}}t'))
        paras.append(txt)
    return '\n'.join(paras).strip()


def read_docx_tables(path):
    z = zipfile.ZipFile(path)
    xml = z.read('word/document.xml')
    root = ET.fromstring(xml)
    tables = []
    for tbl in root.iter(f'{{{W}}}tbl'):
        rows = []
        for tr in tbl.findall(f'.//{{{W}}}tr'):
            cells = [_cell_text(tc) for tc in tr.findall(f'.//{{{W}}}tc')]
            rows.append(cells)
        tables.append(rows)
    return tables


def compact(s):
    return re.sub(r'[^A-Z0-9]', '', (s or '').upper())


def normalize_unit_name(name):
    s = (name or '').strip().upper()
    for p in ROLE_PREFIXES:
        if s.startswith(p):
            s = s[len(p):].strip()
            break
    s = ' '.join(s.split())
    # Sekretaris -> Sekretariat (jabatan vs nama unit, kata dipertahankan)
    for a, b in ROLE_REPLACES:
        s = s.replace(a, b)
    # Singkatan / variasi ejaan
    for a, b in SYNONYMS:
        s = s.replace(a, b)
    return s


def _prefer(matches):
    """Prefer: active > induk > largest id_opd. Return (unit, flag, candidate_ids)."""
    if not matches:
        return None, 'UNMATCHED', []
    cands = [u.id_opd for u in matches]
    if len(matches) == 1:
        return matches[0], None, cands
    active = [u for u in matches if u.status == 1]
    pool = active if active else matches
    induk = [u for u in pool if u.is_opd_induk]
    if len(induk) == 1:
        return induk[0], None, cands
    if len(pool) == 1:
        return pool[0], None, cands
    chosen = max(pool, key=lambda u: u.id_opd)
    return chosen, 'AMBIGUOUS', cands


def match_unit(norm, by_compact):
    if not norm:
        return None, 'UNMATCHED', []
    c = compact(norm)
    if not c:
        return None, 'UNMATCHED', []
    matches = by_compact.get(c)
    if matches:
        return _prefer(matches)
    return None, 'UNMATCHED', []


class Command(BaseCommand):
    help = (
        'Import desain pembelajaran unit kerja dari file Word (.docx) '
        'Draft Lampiran HCDP. Kolom: Nama Unit Kerja | Kompetensi Teknis | Tujuan Pembelajaran.'
    )

    def add_arguments(self, parser):
        parser.add_argument('docx_path', help='Path ke file .docx')
        parser.add_argument('--dry-run', action='store_true',
                            help='Hanya tampilkan ringkasan match tanpa menulis ke database')
        parser.add_argument('--created-by', default=None,
                            help='Email user pembuat (default: superuser pertama)')
        parser.add_argument('--report', default='/app/import_hcdp_report.log',
                            help='Path file log detail hasil import')
        parser.add_argument('--truncate', action='store_true',
                            help='Hapus semua DesainPembelajaranUnit (+cascade) sebelum import')
        parser.add_argument('--skip-ambiguous', action='store_true',
                            help='Abaikan unit yang nama ganda di DB (hanya import match pasti)')

    def handle(self, *args, **options):
        docx_path = options['docx_path']
        dry_run = options['dry_run']
        report_path = options['report']
        if not os.path.isfile(docx_path):
            raise CommandError(f'File tidak ditemukan: {docx_path}')

        creator = None
        if options['created_by']:
            creator = USER.objects.filter(email__iexact=options['created_by']).first()
        if creator is None:
            creator = USER.objects.filter(email__iexact='Prakom@admin2025.com').first()
        if creator is None:
            creator = USER.objects.order_by('id').first()

        # Preload units untuk matching cepat (compact-name index)
        units = list(UnitKerja.objects.only('id_opd', 'nm_opd', 'status', 'is_opd_induk'))
        by_compact = {}
        for u in units:
            by_compact.setdefault(compact(u.nm_opd), []).append(u)

        tables = read_docx_tables(docx_path)

        if options['truncate']:
            if dry_run:
                self.stdout.write(self.style.WARNING('(dry-run) akan truncate semua DesainPembelajaranUnit'))
            else:
                n = DesainPembelajaranUnit.objects.count()
                DesainPembelajaranUnit.objects.all().delete()
                self.stdout.write(self.style.WARNING(f'TRUNCATE: {n} desain dihapus (+ cascade kompetensi/tujuan)'))

        stats = {
            'tables_processed': 0,
            'rows_read': 0,
            'units_matched': 0,
            'desain_created': 0,
            'kompetensi_created': 0,
            'tujuan_created': 0,
            'skipped_no_data': 0,
            'unmatched': [],
            'ambiguous': [],
            'ambiguous_skipped': 0,
        }
        report_lines = []

        for ti, rows in enumerate(tables):
            if not rows:
                continue
            header = rows[0]
            header_up = [h.upper() for h in header]
            if 'KOMPETENSI TEKNIS' not in header_up and 'KOMPETENSI TEKNIS UNIT' not in ' '.join(header_up):
                continue
            try:
                idx_unit = next(i for i, h in enumerate(header_up) if 'UNIT KERJA' in h or h == 'NAMA OPD' or 'JABATAN' in h)
                idx_komp = next(i for i, h in enumerate(header_up) if 'KOMPETENSI TEKNIS' in h)
                idx_tuj = next(i for i, h in enumerate(header_up) if 'TUJUAN PEMBELAJARAN' in h)
            except StopIteration:
                continue

            stats['tables_processed'] += 1
            last_unit_raw = ''
            for ri, row in enumerate(rows[1:], start=1):
                unit_raw = row[idx_unit] if idx_unit < len(row) else ''
                komp = row[idx_komp] if idx_komp < len(row) else ''
                tuj = row[idx_tuj] if idx_tuj < len(row) else ''
                if unit_raw.strip():
                    last_unit_raw = unit_raw.strip()
                if not komp.strip() and not tuj.strip():
                    stats['skipped_no_data'] += 1
                    continue
                stats['rows_read'] += 1

                # Tiap segmen ';' / baris baru dalam sel tujuan -> record terpisah
                tuj_parts = [p.strip() for p in re.split(r'[;\n]+', tuj) if p.strip()]
                tuj_parts = [' '.join(p.split()) for p in tuj_parts]

                norm = normalize_unit_name(last_unit_raw)
                unit, status, cands = match_unit(norm, by_compact)
                if unit is None:
                    stats['unmatched'].append(last_unit_raw)
                    report_lines.append(f"UNMATCHED | {last_unit_raw}")
                    continue

                if status == 'AMBIGUOUS' and options['skip_ambiguous']:
                    stats['ambiguous_skipped'] += 1
                    stats['unmatched'].append(f'{last_unit_raw} [AMBIG]')
                    report_lines.append(f"AMBIG-SKIP | {last_unit_raw} -> kandidat={cands}")
                    continue

                if dry_run:
                    stats['units_matched'] += 1
                    stats['kompetensi_created'] += 1
                    stats['tujuan_created'] += len(tuj_parts)
                    if status == 'AMBIGUOUS':
                        stats['ambiguous'].append(f'{last_unit_raw} -> {unit.nm_opd} (#{unit.id_opd}) kandidat={cands}')
                    continue

                with transaction.atomic():
                    desain_defaults = {'created_by': creator, 'updated_by': creator}
                    if status == 'AMBIGUOUS':
                        desain_defaults['keterangan'] = (
                            f"{AMBIG_MARKER} match ganda, dipilih id_opd={unit.id_opd} "
                            f"dari kandidat={cands}"
                        )
                    desain, d_created = DesainPembelajaranUnit.objects.get_or_create(
                        unit_kerja=unit,
                        defaults=desain_defaults,
                    )
                    if d_created:
                        stats['desain_created'] += 1
                        if status == 'AMBIGUOUS' and not desain.keterangan:
                            desain.keterangan = desain_defaults['keterangan']
                            desain.save(update_fields=['keterangan'])
                    komp_text = ' '.join(komp.split())
                    kt, k_created = KompetensiTeknisUnit.objects.get_or_create(
                        desain=desain,
                        uraian__iexact=komp_text,
                        defaults={'uraian': komp_text, 'urutan': desain.kompetensi_teknis.count() + 1},
                    )
                    if k_created:
                        stats['kompetensi_created'] += 1
                    # Tiap segmen ';' / baris baru dalam sel tujuan -> 1 record terpisah
                    for idx, tpart in enumerate(tuj_parts, start=1):
                        tp, t_created = TujuanPembelajaranUnit.objects.get_or_create(
                            kompetensi=kt,
                            uraian__iexact=tpart,
                            defaults={'uraian': tpart, 'urutan': idx},
                        )
                        if t_created:
                            stats['tujuan_created'] += 1

                stats['units_matched'] += 1
                if status == 'AMBIGUOUS':
                    stats['ambiguous'].append(f'{last_unit_raw} -> {unit.nm_opd} (#{unit.id_opd}) kandidat={cands}')
                report_lines.append(
                    f"OK{'|AMBIG' if status == 'AMBIGUOUS' else ''} | {last_unit_raw} -> "
                    f"{unit.nm_opd} (#{unit.id_opd}) | K: {komp_text[:60]} | T({len(tuj_parts)}): {' | '.join(tuj_parts)[:80]}"
                )

        if not dry_run and report_path:
            try:
                with open(report_path, 'w', encoding='utf-8') as f:
                    f.write('\n'.join(report_lines) + '\n')
            except Exception as e:  # pragma: no cover
                self.stdout.write(self.style.WARNING(f'Tidak bisa tulis report: {e}'))

        self.stdout.write('=' * 70)
        self.stdout.write('IMPORT DESAIN PEMBELAJARAN — HCDP')
        self.stdout.write('=' * 70)
        if dry_run:
            self.stdout.write(self.style.WARNING('MODE: DRY-RUN (tidak menulis ke DB)'))
        self.stdout.write(f"Tabel diproses : {stats['tables_processed']}")
        self.stdout.write(f"Baris data     : {stats['rows_read']}")
        self.stdout.write(f"Unit cocok     : {stats['units_matched']}")
        self.stdout.write(f"Desain baru    : {stats['desain_created']}")
        self.stdout.write(f"Kompetensi baru: {stats['kompetensi_created']}")
        self.stdout.write(f"Tujuan baru    : {stats['tujuan_created']}")
        self.stdout.write(f"Baris kosong   : {stats['skipped_no_data']}")
        if stats['ambiguous_skipped']:
            self.stdout.write(f"Ganda dilewati : {stats['ambiguous_skipped']} (--skip-ambiguous)")
        if stats['ambiguous']:
            self.stdout.write(self.style.WARNING(
                f"\nAMBIGU (ditandai {AMBIG_MARKER}, {len(stats['ambiguous'])} baris):"))
            for a in stats['ambiguous'][:30]:
                self.stdout.write(f"  - {a}")
        if stats['unmatched']:
            self.stdout.write(self.style.ERROR(f"\nTIDAK COCOK / dilewati ({len(stats['unmatched'])}):"))
            for u in stats['unmatched'][:60]:
                self.stdout.write(f"  - {u}")
        self.stdout.write('')
        if dry_run:
            self.stdout.write(self.style.SUCCESS('Jalankan tanpa --dry-run untuk menulis ke database.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'SELESAI. Log detail: {report_path}'))
            n_amb = len(stats['ambiguous'])
            if n_amb:
                self.stdout.write(self.style.WARNING(
                    f'{n_amb} baris ambigu ditandai "{AMBIG_MARKER}" — cari via: '
                    f'DesainPembelajaranUnit.objects.filter(keterangan__startswith="{AMBIG_MARKER}")'))
