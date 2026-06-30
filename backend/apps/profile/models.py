from django.db import models
from django.utils import timezone
from core.utils import clean_filename


def brand_upload_to(instance, filename):
    date_path = timezone.now().strftime('%Y/%m')
    return f'profile/brands/{date_path}/{clean_filename(filename)}'

def section_upload_to(instance, filename):
    date_path = timezone.now().strftime('%Y/%m')
    return f'profile/sections/{date_path}/{clean_filename(filename)}'

def personalia_upload_to(instance, filename):
    date_path = timezone.now().strftime('%Y/%m')
    return f'profile/personalia/{date_path}/{clean_filename(filename)}'


class ProfileSection(models.Model):
    SECTION_CHOICES = [
        ('sambutan', 'Sambutan'),
        ('visi_misi', 'Visi & Misi'),
        ('sejarah', 'Sejarah Corpu'),
        ('struktur_organisasi', 'Struktur Organisasi'),
    ]

    key = models.CharField(
        max_length=50, unique=True, choices=SECTION_CHOICES,
        verbose_name='Kunci'
    )
    title = models.CharField(max_length=255, verbose_name='Judul')
    content = models.TextField(verbose_name='Konten')
    image = models.ImageField(
        upload_to=section_upload_to, blank=True, null=True,
        verbose_name='Gambar'
    )
    is_active = models.BooleanField(default=True, verbose_name='Aktif')
    order = models.IntegerField(default=0, verbose_name='Urutan')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'profile_sections'
        verbose_name = 'Section Profile'
        verbose_name_plural = 'Section Profile'
        ordering = ['order', 'key']

    def __str__(self):
        return self.get_key_display()


class Personalia(models.Model):
    name = models.CharField(max_length=255, verbose_name='Nama')
    nip = models.CharField(
        max_length=30, blank=True, null=True,
        verbose_name='NIP'
    )
    position = models.CharField(max_length=255, verbose_name='Jabatan')
    description = models.TextField(blank=True, null=True, verbose_name='Deskripsi')
    photo = models.ImageField(
        upload_to=personalia_upload_to, blank=True, null=True,
        verbose_name='Foto'
    )
    email = models.EmailField(blank=True, null=True, verbose_name='Email')
    phone = models.CharField(
        max_length=20, blank=True, null=True,
        verbose_name='Telepon'
    )
    unit_kerja = models.CharField(
        max_length=255, blank=True, null=True,
        verbose_name='Unit Kerja / Bidang'
    )
    order = models.IntegerField(default=0, verbose_name='Urutan')
    is_active = models.BooleanField(default=True, verbose_name='Aktif')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'profile_personalia'
        verbose_name = 'Personalia'
        verbose_name_plural = 'Personalia'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class Brand(models.Model):
    """
    Model untuk menyimpan brand/logo institusi
    """
    name = models.CharField(
        max_length=255,
        verbose_name='Nama Brand',
        help_text='Nama brand atau deskripsi logo'
    )
    image = models.ImageField(
        upload_to=brand_upload_to,
        verbose_name='Gambar Brand',
        help_text='Upload gambar brand/logo (PNG, JPG, SVG)'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Deskripsi',
        help_text='Deskripsi atau keterangan brand'
    )
    is_primary = models.BooleanField(
        default=False,
        verbose_name='Brand Utama',
        help_text='Tandai sebagai brand utama institusi'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Aktif',
        help_text='Status aktif brand'
    )
    order = models.IntegerField(
        default=0,
        verbose_name='Urutan',
        help_text='Urutan tampilan brand'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Diupdate Pada')

    class Meta:
        db_table = 'profile_brands'
        verbose_name = 'Brand'
        verbose_name_plural = 'Brands'
        ordering = ['order', '-is_primary', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.is_primary:
            Brand.objects.filter(is_primary=True).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)

    @property
    def image_url(self):
        """Return full URL for image"""
        if self.image:
            return self.image.url
        return None
