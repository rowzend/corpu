from django.contrib import admin
from .models import HeroImage

@admin.register(HeroImage)
class HeroImageAdmin(admin.ModelAdmin):
    list_display = ('name', 'order', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    list_editable = ('order', 'is_active')
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'image', 'order', 'is_active')
        }),
    )
