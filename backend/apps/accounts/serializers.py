from rest_framework import serializers
from .models import UserProfile, User


class UserProfileSerializer(serializers.ModelSerializer):
    # User-related fields (read-only)
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_image = serializers.CharField(source='user.image', read_only=True)

    # Kategori User (writable langsung dari UserProfile)
    kategori_user_nama = serializers.CharField(
        source='kategori_user.nama',
        read_only=True
    )
    kategori_user_kode = serializers.CharField(
        source='kategori_user.kode',
        read_only=True
    )

    # Referensi fields - read-only nama display
    provinsi_nama = serializers.CharField(source='provinsi.nama', read_only=True)
    kabupaten_nama = serializers.CharField(source='kabupaten.nama', read_only=True)
    kecamatan_nama = serializers.CharField(source='kecamatan.nama', read_only=True)
    kelurahan_nama = serializers.CharField(source='kelurahan.nama', read_only=True)
    perguruan_tinggi_nama = serializers.CharField(source='perguruan_tinggi.nama_pt', read_only=True)
    program_studi_nama = serializers.CharField(source='program_studi.nama_prodi', read_only=True)
    instansi_nama = serializers.CharField(source='instansi.nama_instansi', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'user', 'user_name', 'user_email', 'user_username', 'user_image',
            'kategori_user', 'kategori_user_nama', 'kategori_user_kode',

            'nik', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin',
            'agama', 'no_hp_pribadi', 'bio',

            'provinsi', 'provinsi_nama',
            'kabupaten', 'kabupaten_nama',
            'kecamatan', 'kecamatan_nama',
            'kelurahan', 'kelurahan_nama',
            'alamat_domisili',

            'perguruan_tinggi', 'perguruan_tinggi_nama',
            'program_studi', 'program_studi_nama',
            'pendidikan_terakhir',

            'instansi', 'instansi_nama',

            'media_sosial', 'preferensi', 'is_public',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']
