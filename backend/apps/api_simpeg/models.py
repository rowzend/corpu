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
