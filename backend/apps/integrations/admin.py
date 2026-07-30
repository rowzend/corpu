"""
Admin interface for webhook management
"""
from django.contrib import admin
from .models import WebhookRegistration, PasswordChangeEvent, WebhookLog


@admin.register(WebhookRegistration)
class WebhookRegistrationAdmin(admin.ModelAdmin):
    list_display = ['app_name', 'event_type', 'is_active', 'total_sent', 'total_success', 'total_failed', 'success_rate', 'last_sent_at']
    list_filter = ['event_type', 'is_active', 'created_at']
    search_fields = ['app_name', 'webhook_url']
    readonly_fields = ['total_sent', 'total_success', 'total_failed', 'last_sent_at', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('app_name', 'webhook_url', 'event_type', 'is_active')
        }),
        ('Security', {
            'fields': ('secret_key',),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': ('total_sent', 'total_success', 'total_failed', 'last_sent_at'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def success_rate(self, obj):
        if obj.total_sent > 0:
            rate = (obj.total_success / obj.total_sent) * 100
            return f"{rate:.1f}%"
        return "0%"
    success_rate.short_description = 'Success Rate'


@admin.register(PasswordChangeEvent)
class PasswordChangeEventAdmin(admin.ModelAdmin):
    list_display = ['username', 'changed_by', 'changed_at', 'is_synced', 'sync_attempts', 'synced_at']
    list_filter = ['is_synced', 'changed_at', 'synced_at']
    search_fields = ['username', 'changed_by']
    readonly_fields = ['password_hash', 'changed_at', 'synced_at']
    
    fieldsets = (
        ('Event Info', {
            'fields': ('username', 'changed_by', 'changed_at')
        }),
        ('Password', {
            'fields': ('password_hash',),
            'classes': ('collapse',)
        }),
        ('Sync Status', {
            'fields': ('is_synced', 'synced_at', 'sync_attempts', 'last_sync_error')
        }),
    )


@admin.register(WebhookLog)
class WebhookLogAdmin(admin.ModelAdmin):
    list_display = ['registration', 'event', 'status', 'response_code', 'duration_ms', 'sent_at']
    list_filter = ['status', 'response_code', 'sent_at']
    search_fields = ['registration__app_name', 'event__username']
    readonly_fields = ['sent_at', 'duration_ms', 'payload', 'response_body']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('registration', 'event', 'status', 'sent_at')
        }),
        ('Request', {
            'fields': ('payload',),
            'classes': ('collapse',)
        }),
        ('Response', {
            'fields': ('response_code', 'response_body', 'duration_ms', 'error_message')
        }),
    )
    
    def has_add_permission(self, request):
        return False  # Logs are created automatically