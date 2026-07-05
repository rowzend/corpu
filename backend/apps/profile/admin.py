from django.contrib import admin
from .models import ProfileSection, Position, Personalia, Brand


@admin.register(ProfileSection)
class ProfileSectionAdmin(admin.ModelAdmin):
    list_display = ['key', 'title', 'is_active', 'order', 'updated_at']
    list_filter = ['is_active', 'key']
    search_fields = ['title', 'content']
    list_editable = ['is_active', 'order']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Informasi Section', {
            'fields': ('key', 'title', 'content', 'image')
        }),
        ('Pengaturan', {
            'fields': ('is_active', 'order')
        }),
        ('Timestamp', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'order', 'is_active', 'updated_at']
    list_filter = ['is_active', 'parent']
    search_fields = ['name']
    list_editable = ['is_active', 'order']


@admin.register(Personalia)
class PersonaliaAdmin(admin.ModelAdmin):
    list_display = ['name', 'nip', 'position', 'position_fk', 'unit_kerja', 'is_active', 'order']
    list_filter = ['is_active', 'unit_kerja', 'position_fk']
    search_fields = ['name', 'nip', 'position']
    list_editable = ['is_active', 'order']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Informasi Personalia', {
            'fields': ('name', 'nip', 'position', 'position_fk', 'description')
        }),
        ('Kontak', {
            'fields': ('email', 'phone')
        }),
        ('Unit Kerja', {
            'fields': ('unit_kerja',)
        }),
        ('Media', {
            'fields': ('photo',)
        }),
        ('Pengaturan', {
            'fields': ('is_active', 'order')
        }),
        ('Timestamp', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_primary', 'is_active', 'order', 'updated_at']
    list_filter = ['is_active', 'is_primary']
    search_fields = ['name', 'description']
    list_editable = ['is_active', 'order']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Informasi Brand', {
            'fields': ('name', 'description', 'image')
        }),
        ('Pengaturan', {
            'fields': ('is_primary', 'is_active', 'order')
        }),
        ('Timestamp', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        """Override save to handle primary brand logic"""
        super().save_model(request, obj, form, change)
