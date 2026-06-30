from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.utils import timezone


class News(models.Model):
    CATEGORY_CHOICES = [
        ('Program', 'Program'),
        ('Kerjasama', 'Kerjasama'),
        ('Event', 'Event'),
        ('Pengumuman', 'Pengumuman'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ]

    title = models.CharField(max_length=255, verbose_name='Judul')
    slug = models.SlugField(max_length=255, unique=True, verbose_name='Slug')
    excerpt = models.TextField(blank=True, null=True, verbose_name='Ringkasan')
    content = models.TextField(verbose_name='Konten')
    category = models.CharField(
        max_length=50, choices=CATEGORY_CHOICES,
        default='Program', verbose_name='Kategori'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='news_articles',
        verbose_name='Penulis'
    )
    thumbnail = models.ImageField(
        upload_to='news/thumbnails/%Y/%m/',
        blank=True, null=True,
        verbose_name='Thumbnail'
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES,
        default='draft', verbose_name='Status'
    )
    views = models.PositiveIntegerField(default=0, verbose_name='Dilihat')
    published_at = models.DateTimeField(
        blank=True, null=True, verbose_name='Dipublikasikan Pada'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Diupdate Pada')

    class Meta:
        db_table = 'news'
        verbose_name = 'Berita'
        verbose_name_plural = 'Berita'
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['status']),
            models.Index(fields=['category']),
            models.Index(fields=['published_at']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)
