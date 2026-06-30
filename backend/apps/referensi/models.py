from django.db import models


class MsPerguruanTinggi(models.Model):
    id = models.BigAutoField(primary_key=True)
    id_pddikti = models.CharField(
        max_length=36, unique=True, null=True, blank=True,
        verbose_name='ID PDDIKTI',
    )
    kode_pt = models.CharField(
        max_length=10, unique=True,
        verbose_name='Kode PT',
    )
    nama_pt = models.CharField(
        max_length=255,
        verbose_name='Nama Perguruan Tinggi',
    )
    bentuk_pt = models.CharField(
        max_length=50, null=True, blank=True,
        verbose_name='Bentuk PT',
        help_text='Universitas, Institut, Politeknik, Sekolah Tinggi, Akademi',
    )
    status_pt = models.CharField(
        max_length=10, null=True, blank=True,
        verbose_name='Status',
        help_text='Negeri / Swasta',
    )
    alamat = models.TextField(null=True, blank=True, verbose_name='Alamat')
    kota = models.CharField(max_length=100, null=True, blank=True, verbose_name='Kota')
    provinsi = models.CharField(max_length=100, null=True, blank=True, verbose_name='Provinsi')
    telepon = models.CharField(max_length=50, null=True, blank=True, verbose_name='Telepon')
    website = models.URLField(max_length=255, null=True, blank=True, verbose_name='Website')
    email = models.EmailField(max_length=255, null=True, blank=True, verbose_name='Email')
    akreditasi = models.CharField(max_length=20, null=True, blank=True, verbose_name='Akreditasi')
    is_active = models.BooleanField(default=True, verbose_name='Aktif')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'Ms_perguruan_tinggi'
        verbose_name = 'Perguruan Tinggi'
        verbose_name_plural = 'Perguruan Tinggi'
        ordering = ['nama_pt']

    def __str__(self):
        return f'{self.kode_pt} - {self.nama_pt}'


class MsProgramStudi(models.Model):
    id = models.BigAutoField(primary_key=True)
    id_pddikti = models.CharField(
        max_length=36, unique=True, null=True, blank=True,
        verbose_name='ID PDDIKTI',
    )
    kode_prodi = models.CharField(
        max_length=20, null=True, blank=True,
        verbose_name='Kode Prodi',
    )
    nama_prodi = models.CharField(
        max_length=255,
        verbose_name='Nama Program Studi',
    )
    jenjang = models.CharField(
        max_length=10, null=True, blank=True,
        verbose_name='Jenjang',
        help_text='S1, S2, S3, D3, D4, Profesi, Spesialis',
    )
    perguruan_tinggi = models.ForeignKey(
        MsPerguruanTinggi,
        on_delete=models.CASCADE,
        related_name='program_studi_set',
        verbose_name='Perguruan Tinggi',
    )
    akreditasi = models.CharField(max_length=20, null=True, blank=True, verbose_name='Akreditasi')
    is_active = models.BooleanField(default=True, verbose_name='Aktif')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'Ms_program_studi'
        verbose_name = 'Program Studi'
        verbose_name_plural = 'Program Studi'
        ordering = ['perguruan_tinggi__nama_pt', 'jenjang', 'nama_prodi']

    def __str__(self):
        return f'{self.nama_prodi} ({self.jenjang}) - {self.perguruan_tinggi.nama_pt}'
