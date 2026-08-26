from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Pegawai(models.Model):
    id_pegawai = models.BigIntegerField(unique=True, verbose_name='ID Pegawai', db_index=True)
    nip_baru = models.CharField(max_length=50, null=True, blank=True, verbose_name='NIP Baru', db_index=True)
    nip_lama = models.CharField(max_length=50, null=True, blank=True, verbose_name='NIP Lama')
    nama_pegawai = models.CharField(max_length=255, verbose_name='Nama Pegawai', db_index=True)
    tempat_lahir = models.CharField(max_length=100, null=True, blank=True, verbose_name='Tempat Lahir')
    tanggal_lahir = models.CharField(max_length=50, null=True, blank=True, verbose_name='Tanggal Lahir')
    jenis_kelamin = models.IntegerField(null=True, blank=True, verbose_name='Jenis Kelamin')
    alamat_rumah = models.TextField(null=True, blank=True, verbose_name='Alamat')
    no_hp = models.CharField(max_length=50, null=True, blank=True, verbose_name='No HP')
    id_jabatan = models.BigIntegerField(null=True, blank=True, verbose_name='ID Jabatan')
    nama_jabatan = models.CharField(max_length=255, null=True, blank=True, verbose_name='Nama Jabatan')
    masa_kerja_jabatan = models.CharField(max_length=100, null=True, blank=True, verbose_name='Masa Kerja Jabatan')
    kode_eselon = models.BigIntegerField(null=True, blank=True, verbose_name='Kode Eselon', db_index=True)
    id_opd = models.BigIntegerField(null=True, blank=True, verbose_name='ID OPD', db_index=True)
    nm_opd = models.CharField(max_length=255, null=True, blank=True, verbose_name='Nama OPD')
    id_opd_urut = models.IntegerField(null=True, blank=True, verbose_name='Urutan OPD (A_12)', db_index=True)
    is_opd_induk = models.BooleanField(default=False, verbose_name='Is OPD Induk', db_index=True)
    id_sub_opd = models.BigIntegerField(null=True, blank=True, verbose_name='ID Sub OPD')
    nm_sub_opd = models.CharField(max_length=255, null=True, blank=True, verbose_name='Nama Sub OPD')
    id_golongan = models.BigIntegerField(null=True, blank=True, verbose_name='ID Golongan', db_index=True)
    nama_golongan = models.CharField(max_length=100, null=True, blank=True, verbose_name='Nama Golongan')
    nama_pangkat = models.CharField(max_length=100, null=True, blank=True, verbose_name='Nama Pangkat')
    kategori_pegawai = models.IntegerField(null=True, blank=True, verbose_name='Kategori Pegawai (1=CPNS, 2=PNS, 3=P3K)', db_index=True)
    nama_kategori_pegawai = models.CharField(max_length=100, null=True, blank=True, verbose_name='Nama Kategori Pegawai')
    tmt_cpns = models.CharField(max_length=50, null=True, blank=True, verbose_name='TMT CPNS')
    masa_kerja_tahun = models.IntegerField(null=True, blank=True, verbose_name='Masa Kerja (Tahun)')
    masa_kerja_bulan = models.IntegerField(null=True, blank=True, verbose_name='Masa Kerja (Bulan)')
    akhir_kerja_p3k = models.CharField(max_length=50, null=True, blank=True, verbose_name='Akhir Kerja P3K')
    pas_foto = models.TextField(null=True, blank=True, verbose_name='Path Foto (ASNCorpu MinIO)')
    raw_data = models.JSONField(verbose_name='Raw Data dari API', help_text='Full JSON response dari ESIMPEG API')
    synced_at = models.DateTimeField(auto_now=True, verbose_name='Terakhir Sync')
    synced_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Di-sync oleh')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat')

    class Meta:
        db_table = 'api_simpeg_pegawai'
        verbose_name = 'Data Pegawai ESIMPEG'
        verbose_name_plural = 'Data Pegawai ESIMPEG'
        ordering = ['nama_pegawai']
        indexes = [
            models.Index(fields=['nip_baru']),
            models.Index(fields=['id_pegawai']),
            models.Index(fields=['id_opd']),
            models.Index(fields=['nama_pegawai']),
            models.Index(fields=['synced_at']),
            models.Index(fields=['kode_eselon']),
            models.Index(fields=['id_golongan']),
            models.Index(fields=['id_opd_urut']),
            models.Index(fields=['is_opd_induk']),
            models.Index(fields=['kategori_pegawai']),
        ]

    def __str__(self):
        return f"{self.nip_baru or self.nip_lama} - {self.nama_pegawai}"

    @property
    def jenis_kelamin_display(self):
        if self.jenis_kelamin == 1:
            return 'Laki-laki'
        elif self.jenis_kelamin == 2:
            return 'Perempuan'
        return '-'


class SyncProgress(models.Model):
    sync_id = models.CharField(max_length=50, unique=True, verbose_name='Sync ID')
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='User')
    status = models.CharField(max_length=20, choices=[
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed')
    ], default='running', verbose_name='Status')
    current_page = models.IntegerField(default=0, verbose_name='Current Page')
    total_pages = models.IntegerField(default=0, verbose_name='Total Pages')
    processed_records = models.IntegerField(default=0, verbose_name='Processed Records')
    total_records = models.IntegerField(default=0, verbose_name='Total Records')
    new_records = models.IntegerField(default=0, verbose_name='New Records')
    updated_records = models.IntegerField(default=0, verbose_name='Updated Records')
    error_message = models.TextField(null=True, blank=True, verbose_name='Error Message')
    started_at = models.DateTimeField(auto_now_add=True, verbose_name='Started At')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Updated At')

    class Meta:
        db_table = 'api_simpeg_sync_progress'
        verbose_name = 'Sync Progress'
        verbose_name_plural = 'Sync Progress'
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.sync_id} - {self.status}"

    @property
    def progress_percentage(self):
        if self.total_pages == 0:
            return 0
        return int((self.current_page / self.total_pages) * 100)


class SyncLog(models.Model):
    synced_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='Di-sync oleh')
    synced_at = models.DateTimeField(auto_now_add=True, verbose_name='Waktu Sync')
    total_records = models.IntegerField(default=0, verbose_name='Total Records')
    new_records = models.IntegerField(default=0, verbose_name='Records Baru')
    updated_records = models.IntegerField(default=0, verbose_name='Records Diupdate')
    status = models.CharField(max_length=20, choices=[
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('partial', 'Partial')
    ], default='success', verbose_name='Status')
    error_message = models.TextField(null=True, blank=True, verbose_name='Error Message')
    duration_seconds = models.FloatField(null=True, blank=True, verbose_name='Durasi (detik)')

    class Meta:
        db_table = 'api_simpeg_sync_log'
        verbose_name = 'Log Sinkronisasi'
        verbose_name_plural = 'Log Sinkronisasi'
        ordering = ['-synced_at']

    def __str__(self):
        return f"Sync {self.synced_at.strftime('%Y-%m-%d %H:%M')} - {self.total_records} records"


class UnitKerja(models.Model):
    id_opd = models.BigIntegerField(unique=True, verbose_name='ID OPD', db_index=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, db_index=True, related_name='children', verbose_name='Parent OPD')
    nm_opd = models.CharField(max_length=255, verbose_name='Nama OPD', db_index=True)
    id_opd_urut = models.IntegerField(null=True, blank=True, verbose_name='Urutan OPD', db_index=True)
    level = models.PositiveIntegerField(default=0, verbose_name='Level Hierarki')
    is_opd_induk = models.BooleanField(default=False, verbose_name='Is OPD Induk', db_index=True)
    status = models.IntegerField(default=1, verbose_name='Status (1=Aktif, 0=Non Aktif)', db_index=True)
    id_jenis_organisasi = models.BigIntegerField(null=True, blank=True, verbose_name='ID Jenis Organisasi', db_index=True)
    nama_jenis_organisasi = models.CharField(max_length=191, null=True, blank=True, verbose_name='Nama Jenis Organisasi')
    path = models.JSONField(default=list, blank=True, verbose_name='Path Hierarki', help_text='[{id_opd, nama}, ...] dari root')
    raw_data = models.JSONField(verbose_name='Raw Data dari API')
    synced_at = models.DateTimeField(auto_now=True, verbose_name='Terakhir Sync')
    synced_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Di-sync oleh')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat')

    class Meta:
        db_table = 'api_simpeg_unit_kerja'
        verbose_name = 'Unit Kerja ESIMPEG'
        verbose_name_plural = 'Unit Kerja ESIMPEG'
        ordering = ['id_opd_urut', 'nm_opd', 'id_opd']
        indexes = [
            models.Index(fields=['id_opd']),
            models.Index(fields=['parent']),
            models.Index(fields=['id_opd_urut']),
            models.Index(fields=['is_opd_induk']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.nm_opd} (OPD #{self.id_opd})"

    def get_full_path_names(self):
        if self.path:
            return ' > '.join(p.get('nama', '') for p in self.path)
        names = []
        current = self
        seen = set()
        while current and current.pk not in seen:
            seen.add(current.pk)
            names.append(current.nm_opd)
            current = current.parent
        return ' > '.join(reversed(names))


class Bupati(models.Model):
    id_bupati = models.BigIntegerField(unique=True, verbose_name='ID Bupati', db_index=True)
    nama = models.CharField(max_length=255, verbose_name='Nama')
    gelar_depan = models.CharField(max_length=50, null=True, blank=True)
    gelar_belakang = models.CharField(max_length=100, null=True, blank=True)
    nik = models.CharField(max_length=16, null=True, blank=True)
    foto = models.TextField(null=True, blank=True)
    jabatan = models.IntegerField(null=True, blank=True, verbose_name='Jabatan (1=Bupati, 2=Wakil)')
    nama_jabatan = models.CharField(max_length=100, null=True, blank=True)
    status = models.PositiveSmallIntegerField(default=1, verbose_name='Status (1=Aktif, 0=Non Aktif)')
    nama_status = models.CharField(max_length=50, null=True, blank=True)
    jenis_penugasan = models.CharField(max_length=255, null=True, blank=True)
    periode_awal = models.DateField(null=True, blank=True)
    periode_akhir = models.DateField(null=True, blank=True)
    raw_data = models.JSONField(verbose_name='Raw Data dari API', null=True, blank=True)
    synced_at = models.DateTimeField(auto_now=True, verbose_name='Terakhir Sync')
    synced_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Di-sync oleh')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat')

    class Meta:
        db_table = 'api_simpeg_bupati'
        verbose_name = 'Bupati / Wakil Bupati'
        verbose_name_plural = 'Bupati / Wakil Bupati'
        ordering = ['-status', 'jabatan', 'nama']

    def __str__(self):
        return self.nama or f'Bupati #{self.id_bupati}'


class DesainPembelajaranUnit(models.Model):
    """
    Desain pembelajaran untuk satu unit kerja (1:1).

    Berisi daftar kompetensi teknis dan tujuan pembelajaran (masing-masing
    bisa lebih dari satu, disimpan per baris pada tabel anak).
    """

    unit_kerja = models.OneToOneField(
        UnitKerja,
        related_name='desain_pembelajaran',
        on_delete=models.CASCADE,
        verbose_name='Unit Kerja',
        help_text='Unit kerja pemilik desain pembelajaran ini'
    )

    keterangan = models.TextField(
        blank=True,
        default='',
        verbose_name='Keterangan',
        help_text='Catatan tambahan desain pembelajaran unit kerja'
    )

    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='desain_unit_dibuat', verbose_name='Dibuat oleh'
    )
    updated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='desain_unit_diubah', verbose_name='Diubah oleh'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Diubah')

    class Meta:
        db_table = 'api_simpeg_desain_pembelajaran_unit'
        verbose_name = 'Desain Pembelajaran Unit Kerja'
        verbose_name_plural = 'Desain Pembelajaran Unit Kerja'

    def __str__(self):
        return f'Desain Pembelajaran — {self.unit_kerja.nm_opd}'


class KompetensiTeknisUnit(models.Model):
    """
    Kompetensi teknis unit kerja (input bebas, bisa lebih dari satu)
    untuk desain pembelajaran sebuah unit kerja. Tiap kompetensi teknis
    memiliki daftar tujuan pembelajarannya sendiri.
    """

    desain = models.ForeignKey(
        DesainPembelajaranUnit,
        related_name='kompetensi_teknis',
        on_delete=models.CASCADE,
        verbose_name='Desain Pembelajaran'
    )

    uraian = models.TextField(verbose_name='Uraian Kompetensi Teknis')

    urutan = models.PositiveIntegerField(default=1, verbose_name='Urutan')

    class Meta:
        db_table = 'api_simpeg_kompetensi_teknis_unit'
        verbose_name = 'Kompetensi Teknis Unit Kerja'
        verbose_name_plural = 'Kompetensi Teknis Unit Kerja'
        ordering = ['urutan', 'id']

    def __str__(self):
        return f'{self.urutan}. {self.uraian[:60]}'


class TujuanPembelajaranUnit(models.Model):
    """
    Tujuan pembelajaran (bisa lebih dari satu) yang melekat pada SATU
    kompetensi teknis unit kerja. Tujuan milik kompetensi #1 tidak akan
    muncul pada kompetensi #2 karena relasinya per kompetensi.
    """

    kompetensi = models.ForeignKey(
        KompetensiTeknisUnit,
        related_name='tujuan',
        on_delete=models.CASCADE,
        verbose_name='Kompetensi Teknis',
        help_text='Kompetensi teknis pemilik tujuan pembelajaran ini'
    )

    uraian = models.TextField(verbose_name='Uraian Tujuan Pembelajaran')

    urutan = models.PositiveIntegerField(default=1, verbose_name='Urutan')

    class Meta:
        db_table = 'api_simpeg_tujuan_pembelajaran_unit'
        verbose_name = 'Tujuan Pembelajaran Unit Kerja'
        verbose_name_plural = 'Tujuan Pembelajaran Unit Kerja'
        ordering = ['urutan', 'id']

    def __str__(self):
        return f'{self.urutan}. {self.uraian[:60]}'
