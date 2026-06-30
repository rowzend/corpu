from rest_framework import serializers
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'user', 'bio', 'no_hp_pribadi', 'alamat_domisili',
            'nik', 'agama', 'pendidikan_terakhir',
            'media_sosial', 'preferensi', 'is_public',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']
