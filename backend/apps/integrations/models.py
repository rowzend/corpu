"""
Password Sync Pipeline Models
Compatible with ESIMPEG webhook system
"""
from django.db import models
from django.utils import timezone


class WebhookRegistration(models.Model):
    """
    Register aplikasi eksternal untuk terima webhook
    Compatible dengan ESIMPEG WebhookRegistration
    """
    app_name = models.CharField(max_length=100, unique=True, help_text="Nama aplikasi (contoh: esimpeg)")
    webhook_url = models.URLField(help_text="URL endpoint untuk terima webhook")
    secret_key = models.CharField(max_length=255, help_text="Secret key untuk validasi webhook")
    
    # Event types
    EVENT_CHOICES = [
        ('password_changed', 'Password Changed'),
        ('user_disabled', 'User Disabled'),
        ('user_enabled', 'User Enabled'),
        ('permission_changed', 'Permission Changed'),
    ]
    event_type = models.CharField(max_length=50, choices=EVENT_CHOICES, default='password_changed')
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Stats
    total_sent = models.IntegerField(default=0, help_text="Total webhook sent")
    total_success = models.IntegerField(default=0, help_text="Total success")
    total_failed = models.IntegerField(default=0, help_text="Total failed")
    last_sent_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'webhook_registrations'
        verbose_name = 'Webhook Registration'
        verbose_name_plural = 'Webhook Registrations'
        indexes = [
            models.Index(fields=['app_name']),
            models.Index(fields=['event_type', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.app_name} - {self.event_type}"


class PasswordChangeEvent(models.Model):
    """
    Cache untuk password change events
    Compatible dengan ESIMPEG PasswordChangeEvent
    """
    username = models.CharField(max_length=150, db_index=True)
    password_hash = models.CharField(max_length=255, help_text="Password hash (Django format)")
    
    # Metadata
    changed_at = models.DateTimeField(default=timezone.now, db_index=True)
    changed_by = models.CharField(max_length=150, help_text="User yang ganti password")
    
    # Sync status
    is_synced = models.BooleanField(default=False, db_index=True, help_text="Sudah di-sync ke aplikasi lain?")
    synced_at = models.DateTimeField(null=True, blank=True)
    sync_attempts = models.IntegerField(default=0)
    last_sync_error = models.TextField(null=True, blank=True)
    
    class Meta:
        db_table = 'password_change_events'
        verbose_name = 'Password Change Event'
        verbose_name_plural = 'Password Change Events'
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['username', 'is_synced']),
            models.Index(fields=['changed_at']),
            models.Index(fields=['is_synced', 'changed_at']),
        ]
    
    def __str__(self):
        return f"{self.username} - {self.changed_at}"


class WebhookLog(models.Model):
    """
    Log untuk webhook delivery
    Compatible dengan ESIMPEG WebhookLog
    """
    registration = models.ForeignKey(WebhookRegistration, on_delete=models.CASCADE, related_name='logs')
    event = models.ForeignKey(PasswordChangeEvent, on_delete=models.CASCADE, related_name='webhook_logs', null=True, blank=True)
    
    # Request
    payload = models.JSONField(help_text="Webhook payload")
    
    # Response
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('timeout', 'Timeout'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    response_code = models.IntegerField(null=True, blank=True)
    response_body = models.TextField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    
    # Timing
    sent_at = models.DateTimeField(auto_now_add=True)
    duration_ms = models.IntegerField(null=True, blank=True, help_text="Response time in milliseconds")
    
    class Meta:
        db_table = 'webhook_logs'
        verbose_name = 'Webhook Log'
        verbose_name_plural = 'Webhook Logs'
        ordering = ['-sent_at']
        indexes = [
            models.Index(fields=['status', 'sent_at']),
            models.Index(fields=['registration', 'status']),
        ]
    
    def __str__(self):
        return f"{self.registration.app_name} - {self.status} - {self.sent_at}"