from django.contrib import admin
from .models import HcdpProgram


@admin.register(HcdpProgram)
class HcdpProgramAdmin(admin.ModelAdmin):
    list_display = [
        'judul', 'kategori', 'status', 'level', 'instruktur',
        'is_active', 'is_published', 'created_at'
    ]
    list_filter = ['kategori', 'status', 'level', 'is_active', 'is_published']
    search_fields = ['judul', 'deskripsi', 'instruktur', 'lokasi']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Informasi Program', {
            'fields': ('judul', 'deskripsi', 'gambar', 'kategori')
        }),
        ('Detail Program', {
            'fields': ('instruktur', 'level', 'status', 'durasi', 'lokasi')
        }),
        ('Waktu & Peserta', {
            'fields': ('tanggal_mulai', 'tanggal_selesai', 'maks_peserta')
        }),
        ('Tags & Status', {
            'fields': ('tags', 'is_active', 'is_published')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
