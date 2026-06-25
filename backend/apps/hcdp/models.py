from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from core.utils import clean_filename


def hcdp_upload_to(instance, filename):
    date_path = timezone.now().strftime('%Y/%m')
    return f'hcdp/{date_path}/{clean_filename(filename)}'


User = get_user_model()


class HcdpProgram(models.Model):
    """
    Model untuk menyimpan program HCDP (Human Capital Development Program)
    """

    class KategoriChoices(models.TextChoices):
        LEADERSHIP = 'Leadership', 'Leadership'
        TECHNOLOGY = 'Technology', 'Technology'
        COMMUNICATION = 'Communication', 'Communication'
        MANAGEMENT = 'Management', 'Management'
        TECHNICAL = 'Technical', 'Technical'

    class StatusChoices(models.TextChoices):
        UPCOMING = 'upcoming', 'Upcoming'
        ONGOING = 'ongoing', 'Ongoing'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    class LevelChoices(models.TextChoices):
        BEGINNER = 'beginner', 'Beginner'
        INTERMEDIATE = 'intermediate', 'Intermediate'
        ADVANCED = 'advanced', 'Advanced'

    judul = models.CharField(
        max_length=255,
        verbose_name='Judul Program',
        help_text='Judul program HCDP'
    )
    
    deskripsi = models.TextField(
        verbose_name='Deskripsi',
        help_text='Deskripsi lengkap program HCDP'
    )
    
    gambar = models.ImageField(
        upload_to=hcdp_upload_to,
        blank=True,
        null=True,
        verbose_name='Gambar',
        help_text='Gambar ilustrasi program (optional)'
    )
    
    kategori = models.CharField(
        max_length=50,
        choices=KategoriChoices.choices,
        default=KategoriChoices.LEADERSHIP,
        verbose_name='Kategori',
        help_text='Kategori program HCDP'
    )
    
    instruktur = models.CharField(
        max_length=255,
        blank=True,
        default='',
        verbose_name='Instruktur',
        help_text='Nama instruktur program'
    )

    tanggal_mulai = models.DateField(
        blank=True,
        null=True,
        verbose_name='Tanggal Mulai',
        help_text='Tanggal mulai program'
    )

    tanggal_selesai = models.DateField(
        blank=True,
        null=True,
        verbose_name='Tanggal Selesai',
        help_text='Tanggal selesai program'
    )

    durasi = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name='Durasi',
        help_text='Contoh: 3 hari, 2 minggu'
    )

    lokasi = models.CharField(
        max_length=255,
        blank=True,
        default='',
        verbose_name='Lokasi',
        help_text='Lokasi pelaksanaan program'
    )

    maks_peserta = models.PositiveIntegerField(
        default=0,
        verbose_name='Maksimal Peserta',
        help_text='Jumlah maksimal peserta'
    )

    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.UPCOMING,
        verbose_name='Status',
        help_text='Status program'
    )

    level = models.CharField(
        max_length=20,
        choices=LevelChoices.choices,
        default=LevelChoices.BEGINNER,
        verbose_name='Level',
        help_text='Level kesulitan program'
    )

    tags = models.TextField(
        blank=True,
        default='',
        verbose_name='Tags',
        help_text='Tags dipisahkan dengan koma'
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name='Aktif',
        help_text='Status aktif program'
    )
    
    is_published = models.BooleanField(
        default=False,
        verbose_name='Dipublikasikan',
        help_text='Apakah program ditampilkan di halaman public'
    )
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='hcdp_programs_created',
        verbose_name='Dibuat Oleh'
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
        db_table = 'hcdp_programs'
        verbose_name = 'Program HCDP'
        verbose_name_plural = 'Program HCDP'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.judul
    
    @property
    def gambar_url(self):
        if self.gambar:
            return self.gambar.url
        return None
    
    @property
    def tags_list(self):
        if self.tags:
            return [t.strip() for t in self.tags.split(',') if t.strip()]
        return []
