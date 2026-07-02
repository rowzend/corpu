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


class MsProvinsi(models.Model):
    id = models.BigAutoField(primary_key=True)
    kode = models.CharField(max_length=10, unique=True, verbose_name='Kode Provinsi')
    nama = models.CharField(max_length=255, verbose_name='Nama Provinsi')
    is_active = models.BooleanField(default=True, verbose_name='Aktif')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'Ms_provinsi'
        verbose_name = 'Provinsi'
        verbose_name_plural = 'Provinsi'
        ordering = ['kode']

    def __str__(self):
        return f'{self.kode} - {self.nama}'


class MsKabupaten(models.Model):
    id = models.BigAutoField(primary_key=True)
    kode = models.CharField(max_length=10, unique=True, verbose_name='Kode Kabupaten/Kota')
    nama = models.CharField(max_length=255, verbose_name='Nama Kabupaten/Kota')
    provinsi = models.ForeignKey(
        MsProvinsi, on_delete=models.CASCADE, related_name='kabupaten_set',
        verbose_name='Provinsi',
    )
    is_active = models.BooleanField(default=True, verbose_name='Aktif')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'Ms_kabupaten'
        verbose_name = 'Kabupaten/Kota'
        verbose_name_plural = 'Kabupaten/Kota'
        ordering = ['kode']

    def __str__(self):
        return f'{self.kode} - {self.nama}'


class MsKecamatan(models.Model):
    id = models.BigAutoField(primary_key=True)
    kode = models.CharField(max_length=10, unique=True, verbose_name='Kode Kecamatan')
    nama = models.CharField(max_length=255, verbose_name='Nama Kecamatan')
    kabupaten = models.ForeignKey(
        MsKabupaten, on_delete=models.CASCADE, related_name='kecamatan_set',
        verbose_name='Kabupaten/Kota',
    )
    is_active = models.BooleanField(default=True, verbose_name='Aktif')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'Ms_kecamatan'
        verbose_name = 'Kecamatan'
        verbose_name_plural = 'Kecamatan'
        ordering = ['kode']

    def __str__(self):
        return f'{self.kode} - {self.nama}'


class MsKelurahan(models.Model):
    id = models.BigAutoField(primary_key=True)
    kode = models.CharField(max_length=15, unique=True, verbose_name='Kode Kelurahan/Desa')
    nama = models.CharField(max_length=255, verbose_name='Nama Kelurahan/Desa')
    kecamatan = models.ForeignKey(
        MsKecamatan, on_delete=models.CASCADE, related_name='kelurahan_set',
        verbose_name='Kecamatan',
    )
    is_active = models.BooleanField(default=True, verbose_name='Aktif')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'Ms_kelurahan'
        verbose_name = 'Kelurahan/Desa'
        verbose_name_plural = 'Kelurahan/Desa'
        ordering = ['kode']

    def __str__(self):
        return f'{self.kode} - {self.nama}'


class MsInstansi(models.Model):
    id = models.BigAutoField(primary_key=True)
    id_bkn = models.CharField(
        max_length=36, null=True, blank=True,
        verbose_name='ID BKN',
        help_text='UUID dari referensi BKN',
    )
    kode_instansi = models.CharField(
        max_length=20, unique=True,
        verbose_name='Kode Instansi',
    )
    nama_instansi = models.CharField(
        max_length=255,
        verbose_name='Nama Instansi',
    )
    jenis_instansi = models.CharField(
        max_length=50, null=True, blank=True,
        verbose_name='Jenis Instansi',
        help_text='Kementerian Koordinator, Kementerian, LPNK, LNS, Provinsi, Kabupaten, Kota',
    )
    tingkat_instansi = models.CharField(
        max_length=10, null=True, blank=True,
        verbose_name='Tingkat Instansi',
        help_text='Pusat / Daerah',
    )
    alamat = models.TextField(null=True, blank=True, verbose_name='Alamat')
    telepon = models.CharField(max_length=100, null=True, blank=True, verbose_name='Telepon')
    website = models.URLField(max_length=255, null=True, blank=True, verbose_name='Website')
    email = models.EmailField(max_length=255, null=True, blank=True, verbose_name='Email')
    is_active = models.BooleanField(default=True, verbose_name='Aktif')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'Ms_instansi'
        verbose_name = 'Instansi'
        verbose_name_plural = 'Instansi'
        ordering = ['nama_instansi']

    def __str__(self):
        return f'{self.kode_instansi} - {self.nama_instansi}'


class MsKategoriUser(models.Model):
    id = models.BigAutoField(primary_key=True)
    kode = models.CharField(max_length=20, unique=True, verbose_name='Kode')
    nama = models.CharField(max_length=100, verbose_name='Nama Kategori')
    deskripsi = models.TextField(null=True, blank=True, verbose_name='Deskripsi')
    is_active = models.BooleanField(default=True, verbose_name='Aktif')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'Ms_kategori_user'
        verbose_name = 'Kategori User'
        verbose_name_plural = 'Kategori User'
        ordering = ['kode']

    def __str__(self):
        return f'{self.kode} - {self.nama}'
