from django.contrib import admin
from .models import News


@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'author', 'status', 'views', 'published_at', 'created_at']
    list_filter = ['status', 'category']
    search_fields = ['title', 'excerpt', 'content']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['views', 'created_at', 'updated_at']
    ordering = ['-published_at', '-created_at']

    fieldsets = (
        ('Informasi Berita', {
            'fields': ('title', 'slug', 'category', 'author', 'status')
        }),
        ('Konten', {
            'fields': ('excerpt', 'content', 'thumbnail')
        }),
        ('Statistik', {
            'fields': ('views',)
        }),
        ('Waktu', {
            'fields': ('published_at', 'created_at', 'updated_at')
        }),
    )
