from django.contrib import admin
from .models import IdpAsn


@admin.register(IdpAsn)
class IdpAsnAdmin(admin.ModelAdmin):
    list_display = [
        'asn', 'atasan_langsung', 'periode_dari', 'periode_sampai',
        'status', 'created_at'
    ]
    list_filter = ['status', 'periode_dari']
    search_fields = ['asn__nama_pegawai', 'asn__nip_baru', 'target_kompetensi']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Pegawai', {
            'fields': ('asn', 'atasan_langsung')
        }),
        ('Periode IDP', {
            'fields': ('periode_dari', 'periode_sampai')
        }),
        ('Konten IDP', {
            'fields': ('target_penugasan_idp', 'dasar_penyusunan_idp', 'target_kompetensi')
        }),
        ('Status', {
            'fields': ('status', 'catatan')
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
