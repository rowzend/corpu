from rest_framework import serializers
from .models import ProfileSection, Personalia, Brand


class ProfileSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileSection
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class PersonaliaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Personalia
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class BrandSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Brand
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_image_url(self, obj):
        """Get full URL for image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
