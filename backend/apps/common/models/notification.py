from django.db import models
from django.conf import settings


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('course_completed', 'Kursus Selesai'),
        ('essay_graded', 'Esai Dinilai'),
        ('certificate_issued', 'Sertifikat Diterbitkan'),
    ]

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='notifications', verbose_name='Pengguna'
    )
    notification_type = models.CharField(
        max_length=50, choices=NOTIFICATION_TYPES, verbose_name='Tipe'
    )
    title = models.CharField(max_length=255, verbose_name='Judul')
    message = models.TextField(blank=True, verbose_name='Pesan')
    link = models.CharField(max_length=500, blank=True, verbose_name='Tautan')
    is_read = models.BooleanField(default=False, verbose_name='Dibaca')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')

    class Meta:
        db_table = 'common_notifications'
        verbose_name = 'Notifikasi'
        verbose_name_plural = 'Notifikasi'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['is_read']),
        ]

    def __str__(self):
        return f"{self.user} - {self.title}"
