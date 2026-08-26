from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class JenisKompetensi(models.Model):
    """
    Master data jenis kompetensi untuk IDP (Teknis, Manajerial, Sosial Kultural, dll).
    """

    kode = models.CharField(
        max_length=20,
        blank=True,
        default='',
        verbose_name='Kode',
        help_text='Kode singkat jenis kompetensi'
    )

    nama = models.CharField(
        max_length=150,
        verbose_name='Nama Jenis Kompetensi',
        help_text='Nama jenis kompetensi'
    )

    deskripsi = models.TextField(
        blank=True,
        default='',
        verbose_name='Deskripsi',
        help_text='Deskripsi jenis kompetensi'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Aktif'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Tanggal Dibuat'
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Tanggal Diupdate'
    )

    class Meta:
        db_table = 'idp_jenis_kompetensi'
        verbose_name = 'Jenis Kompetensi'
        verbose_name_plural = 'Jenis Kompetensi'
        ordering = ['id']

    def __str__(self):
        return self.nama


class NamaKompetensi(models.Model):
    """
    Master data nama kompetensi untuk IDP.
    Berelasi ke JenisKompetensi (Teknis, Manajerial, Sosial Kultural, dll).
    """

    jenis_kompetensi = models.ForeignKey(
        JenisKompetensi,
        related_name='nama_kompetensi',
        on_delete=models.CASCADE,
        verbose_name='Jenis Kompetensi',
        help_text='Jenis kompetensi yang menaungi nama kompetensi ini'
    )

    kode = models.CharField(
        max_length=20,
        blank=True,
        default='',
        verbose_name='Kode',
        help_text='Kode singkat nama kompetensi'
    )

    nama = models.CharField(
        max_length=150,
        verbose_name='Nama Kompetensi',
        help_text='Nama kompetensi'
    )

    deskripsi = models.TextField(
        blank=True,
        default='',
        verbose_name='Deskripsi',
        help_text='Deskripsi nama kompetensi'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Aktif'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Tanggal Dibuat'
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Tanggal Diupdate'
    )

    class Meta:
        db_table = 'idp_nama_kompetensi'
        verbose_name = 'Nama Kompetensi'
        verbose_name_plural = 'Nama Kompetensi'
        ordering = ['jenis_kompetensi__id', 'id']

    def __str__(self):
        return self.nama


class IdpAsn(models.Model):
    """
    Model untuk menyimpan IDP (Individual Development Plan) ASN.
    """

    class StatusChoices(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SUBMITTED = 'submitted', 'Diajukan'
        APPROVED = 'approved', 'Disetujui'
        REJECTED = 'rejected', 'Ditolak'

    asn = models.ForeignKey(
        'api_simpeg.Pegawai',
        on_delete=models.PROTECT,
        related_name='idp_asn',
        verbose_name='ASN',
        help_text='ASN yang menjadi subjek IDP'
    )

    atasan_langsung = models.ForeignKey(
        'api_simpeg.Pegawai',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='idp_atasan',
        verbose_name='Atasan Langsung',
        help_text='Atasan langsung dari ASN yang bersangkutan'
    )

    periode_dari = models.DateField(
        verbose_name='Periode IDP (Dari)',
        help_text='Tanggal awal periode IDP'
    )

    periode_sampai = models.DateField(
        verbose_name='Periode IDP (Sampai)',
        help_text='Tanggal akhir periode IDP'
    )

    target_penugasan_idp = models.TextField(
        blank=True,
        default='',
        verbose_name='Target Penugasan IDP',
        help_text='Target penugasan yang ingin dicapai pada periode ini'
    )

    dasar_penyusunan_idp = models.TextField(
        blank=True,
        default='',
        verbose_name='Dasar Penyusunan IDP',
        help_text='Dasar/acuan dalam penyusunan IDP'
    )

    tanggal_pengajuan = models.DateField(
        null=True,
        blank=True,
        verbose_name='Tanggal Pengajuan IDP',
        help_text='Tanggal pengajuan IDP'
    )

    target_kompetensi = models.TextField(
        blank=True,
        default='',
        verbose_name='Target Kompetensi',
        help_text='Target kompetensi yang ingin dikembangkan'
    )

    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.DRAFT,
        verbose_name='Status',
        help_text='Status IDP'
    )

    catatan = models.TextField(
        blank=True,
        default='',
        verbose_name='Catatan',
        help_text='Catatan tambahan atau alasan penolakan'
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='idp_created',
        verbose_name='Dibuat Oleh'
    )

    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='idp_approved',
        verbose_name='Disetujui/Ditolak Oleh',
        help_text='User yang melakukan persetujuan atau penolakan'
    )

    approved_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Waktu Persetujuan',
        help_text='Waktu IDP disetujui atau ditolak'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Tanggal Dibuat'
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Tanggal Diupdate'
    )

    class Meta:
        db_table = 'idp_asn'
        verbose_name = 'IDP ASN'
        verbose_name_plural = 'IDP ASN'
        ordering = ['-created_at']

    def __str__(self):
        asn_name = self.asn.nama_pegawai if self.asn_id else '-'
        return f"IDP {asn_name} ({self.periode_dari} s/d {self.periode_sampai})"

    @property
    def periode_display(self):
        if not self.periode_dari or not self.periode_sampai:
            return '-'
        return f"{self.periode_dari.strftime('%d/%m/%Y')} - {self.periode_sampai.strftime('%d/%m/%Y')}"


class PrioritasPengembangan(models.Model):
    """
    Master data prioritas pengembangan kompetensi untuk IDP.
    Hanya berisi tingkat prioritas (bebas), mis. Sangat Tinggi, Tinggi, Sedang, Rendah.
    """

    tingkat_prioritas = models.CharField(
        max_length=60,
        verbose_name='Tingkat Prioritas',
        help_text='Tingkat prioritas pengembangan kompetensi (bebas, contoh: Sangat Tinggi, Tinggi, Sedang, Rendah)'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Aktif'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Tanggal Dibuat'
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Tanggal Diupdate'
    )

    class Meta:
        db_table = 'idp_prioritas_pengembangan'
        verbose_name = 'Prioritas Pengembangan'
        verbose_name_plural = 'Prioritas Pengembangan'
        ordering = ['id']

    def __str__(self):
        return self.tingkat_prioritas


class PilarPengembangan(models.Model):
    """
    Master data metode pengembangan kompetensi untuk IDP (model 70-20-10).
    """

    nama = models.CharField(
        max_length=200,
        verbose_name='Nama Metode',
        help_text='Nama metode pengembangan kompetensi (mis. Pembelajaran Formal)'
    )

    persentase = models.PositiveIntegerField(
        default=0,
        verbose_name='Persentase (%)',
        help_text='Porsi/bobot metode dalam pengembangan kompetensi (mis. 70, 20, 10)'
    )

    deskripsi = models.TextField(
        blank=True,
        default='',
        verbose_name='Deskripsi',
        help_text='Penjelasan kegiatan pada metode pengembangan kompetensi ini'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Aktif'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Tanggal Dibuat'
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Tanggal Diupdate'
    )

    class Meta:
        db_table = 'idp_pilar_pengembangan'
        verbose_name = 'Metode Pengembangan Kompetensi'
        verbose_name_plural = 'Metode Pengembangan Kompetensi'
        ordering = ['id']

    def __str__(self):
        return f"{self.nama} ({self.persentase}%)"


class JenisKegiatanPengembangan(models.Model):
    """
    Master data bentuk pengembangan kompetensi untuk IDP.
    Berelasi ke PilarPengembangan (Metode Pengembangan Kompetensi 70-20-10),
    mis. Pelatihan Klasikal pada metode Pembelajaran Formal.
    """

    pilar_pengembangan = models.ForeignKey(
        PilarPengembangan,
        related_name='jenis_kegiatan',
        on_delete=models.CASCADE,
        verbose_name='Metode Pengembangan Kompetensi',
        help_text='Metode pengembangan kompetensi yang menaungi bentuk pengembangan ini'
    )

    nama = models.CharField(
        max_length=200,
        verbose_name='Bentuk Pengembangan',
        help_text='Nama bentuk pengembangan kompetensi'
    )

    deskripsi = models.TextField(
        blank=True,
        default='',
        verbose_name='Deskripsi',
        help_text='Deskripsi bentuk pengembangan kompetensi'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Aktif'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Tanggal Dibuat'
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Tanggal Diupdate'
    )

    class Meta:
        db_table = 'idp_jenis_kegiatan_pengembangan'
        verbose_name = 'Bentuk Pengembangan Kompetensi'
        verbose_name_plural = 'Bentuk Pengembangan Kompetensi'
        ordering = ['pilar_pengembangan__id', 'id']

    def __str__(self):
        return self.nama


class NamaKegiatanProgram(models.Model):
    """
    Master data nama kegiatan / program untuk IDP.
    Berelasi ke JenisKegiatanPengembangan (Bentuk Pengembangan Kompetensi).
    """

    bentuk_pengembangan = models.ForeignKey(
        JenisKegiatanPengembangan,
        related_name='nama_kegiatan',
        on_delete=models.CASCADE,
        verbose_name='Bentuk Pengembangan Kompetensi',
        help_text='Bentuk pengembangan kompetensi yang menaungi kegiatan/program ini'
    )

    nama = models.CharField(
        max_length=250,
        verbose_name='Nama Kegiatan / Program',
        help_text='Nama spesifik kegiatan atau program pengembangan kompetensi'
    )

    deskripsi = models.TextField(
        blank=True,
        default='',
        verbose_name='Deskripsi',
        help_text='Deskripsi kegiatan/program pengembangan kompetensi'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Aktif'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Tanggal Dibuat'
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Tanggal Diupdate'
    )

    class Meta:
        db_table = 'idp_nama_kegiatan_program'
        verbose_name = 'Nama Kegiatan / Program'
        verbose_name_plural = 'Nama Kegiatan / Program'
        ordering = ['bentuk_pengembangan__id', 'id']

    def __str__(self):
        return self.nama
