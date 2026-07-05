from rest_framework import serializers
from .models import Pegawai, Bupati, SyncProgress, SyncLog


class PegawaiListSerializer(serializers.ModelSerializer):
    jenis_kelamin_display = serializers.CharField(read_only=True)

    class Meta:
        model = Pegawai
        fields = [
            'id_pegawai', 'nip_baru', 'nip_lama', 'nama_pegawai',
            'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin',
            'jenis_kelamin_display', 'alamat_rumah', 'no_hp',
            'id_jabatan', 'nama_jabatan', 'masa_kerja_jabatan',
            'kode_eselon', 'id_opd', 'nm_opd', 'id_opd_urut',
            'is_opd_induk', 'id_sub_opd', 'nm_sub_opd',
            'id_golongan', 'nama_golongan', 'nama_pangkat',
            'kategori_pegawai', 'nama_kategori_pegawai',
            'tmt_cpns', 'masa_kerja_tahun', 'masa_kerja_bulan', 'akhir_kerja_p3k',
            'pas_foto', 'synced_at', 'created_at',
        ]


class PegawaiDetailSerializer(serializers.ModelSerializer):
    jenis_kelamin_display = serializers.CharField(read_only=True)
    synced_by_name = serializers.CharField(source='synced_by.username', read_only=True, default=None)

    class Meta:
        model = Pegawai
        fields = '__all__'


class SyncProgressSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.IntegerField(read_only=True)

    class Meta:
        model = SyncProgress
        fields = [
            'sync_id', 'status', 'current_page', 'total_pages',
            'processed_records', 'total_records', 'new_records',
            'updated_records', 'error_message', 'progress_percentage',
            'started_at', 'updated_at',
        ]


class BupatiListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bupati
        fields = [
            'id_bupati', 'nama', 'gelar_depan', 'gelar_belakang', 'nik',
            'foto', 'jabatan', 'nama_jabatan', 'status', 'nama_status',
            'jenis_penugasan', 'periode_awal', 'periode_akhir',
            'synced_at', 'created_at',
        ]


class SyncLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SyncLog
        fields = '__all__'
