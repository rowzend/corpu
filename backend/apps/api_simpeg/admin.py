from django.contrib import admin
from .models import Pegawai, SyncLog, SyncProgress


@admin.register(Pegawai)
class PegawaiAdmin(admin.ModelAdmin):
    list_display = ['id_pegawai', 'nip_baru', 'nama_pegawai', 'nm_opd', 'nama_jabatan', 'synced_at']
    list_filter = ['kategori_pegawai', 'kode_eselon', 'id_opd', 'synced_at']
    search_fields = ['nip_baru', 'nip_lama', 'nama_pegawai']
    readonly_fields = ['raw_data', 'synced_at', 'created_at']


@admin.register(SyncLog)
class SyncLogAdmin(admin.ModelAdmin):
    list_display = ['synced_at', 'synced_by', 'total_records', 'new_records', 'updated_records', 'status', 'duration_seconds']
    list_filter = ['status', 'synced_at']
    readonly_fields = ['synced_at', 'duration_seconds']


@admin.register(SyncProgress)
class SyncProgressAdmin(admin.ModelAdmin):
    list_display = ['sync_id', 'user', 'status', 'current_page', 'total_pages', 'progress_percentage', 'started_at']
    list_filter = ['status', 'started_at']
    readonly_fields = ['started_at']
