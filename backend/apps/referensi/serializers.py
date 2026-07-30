from rest_framework import serializers
from .models import MsPerguruanTinggi, MsProgramStudi, MsInstansi
from .models import MsProvinsi, MsKabupaten, MsKecamatan, MsKelurahan, MsKategoriUser


class PerguruanTinggiSerializer(serializers.ModelSerializer):
    program_studi_count = serializers.SerializerMethodField()

    class Meta:
        model = MsPerguruanTinggi
        fields = [
            'id', 'id_pddikti', 'kode_pt', 'nama_pt', 'bentuk_pt',
            'status_pt', 'alamat', 'kota', 'provinsi', 'telepon',
            'website', 'email', 'akreditasi', 'is_active',
            'program_studi_count', 'created_at', 'updated_at',
        ]

    def get_program_studi_count(self, obj):
        return obj.program_studi_set.filter(deleted_at__isnull=True).count()


class InstansiSerializer(serializers.ModelSerializer):
    class Meta:
        model = MsInstansi
        fields = [
            'id', 'id_bkn', 'kode_instansi', 'nama_instansi',
            'jenis_instansi', 'tingkat_instansi',
            'alamat', 'telepon', 'website', 'email', 'is_active',
            'created_at', 'updated_at',
        ]


class ProgramStudiSerializer(serializers.ModelSerializer):
    perguruan_tinggi_nama = serializers.CharField(source='perguruan_tinggi.nama_pt', read_only=True)
    perguruan_tinggi_kode = serializers.CharField(source='perguruan_tinggi.kode_pt', read_only=True)

    class Meta:
        model = MsProgramStudi
        fields = [
            'id', 'id_pddikti', 'kode_prodi', 'nama_prodi', 'jenjang',
            'perguruan_tinggi', 'perguruan_tinggi_nama', 'perguruan_tinggi_kode',
            'akreditasi', 'is_active', 'created_at', 'updated_at',
        ]


class ProvinsiSerializer(serializers.ModelSerializer):
    class Meta:
        model = MsProvinsi
        fields = '__all__'


class KabupatenSerializer(serializers.ModelSerializer):
    provinsi_nama = serializers.CharField(source='provinsi.nama', read_only=True)

    class Meta:
        model = MsKabupaten
        fields = '__all__'


class KecamatanSerializer(serializers.ModelSerializer):
    kabupaten_nama = serializers.CharField(source='kabupaten.nama', read_only=True)

    class Meta:
        model = MsKecamatan
        fields = '__all__'


class KelurahanSerializer(serializers.ModelSerializer):
    kecamatan_nama = serializers.CharField(source='kecamatan.nama', read_only=True)

    class Meta:
        model = MsKelurahan
        fields = '__all__'


class KategoriUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = MsKategoriUser
        fields = '__all__'
