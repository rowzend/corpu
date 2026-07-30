from django.db import models
from django.utils import timezone
from core.utils import clean_filename

def hero_image_upload_to(instance, filename):
    date_path = timezone.now().strftime('%Y/%m')
    return f'hero/images/{date_path}/{clean_filename(filename)}'

class HeroImage(models.Model):
    name = models.CharField(max_length=255, verbose_name='Nama')
    description = models.TextField(blank=True, null=True, verbose_name='Deskripsi')
    image = models.ImageField(
        upload_to=hero_image_upload_to,
        verbose_name='Gambar',
        help_text='Rekomendasi: ukuran 400x400 px (1:1 square)',
        blank=True, null=True
    )
    order = models.IntegerField(default=0, verbose_name='Urutan')
    is_active = models.BooleanField(default=True, verbose_name='Aktif')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hero_images'
        verbose_name = 'Hero Image'
        verbose_name_plural = 'Hero Images'
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.name

    @property
    def image_url(self):
        if self.image:
            return self.image.url
        return None
