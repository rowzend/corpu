from rest_framework import serializers
from .models import ProfileSection, Position, Personalia, Brand


class ProfileSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileSection
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class PositionSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(
        source='parent.name', read_only=True, default=None
    )
    children = serializers.SerializerMethodField()

    class Meta:
        model = Position
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_children(self, obj):
        qs = obj.children.filter(is_active=True).order_by('order', 'name')
        return PositionSerializer(qs, many=True, context=self.context).data


class PersonaliaSerializer(serializers.ModelSerializer):
    position_name = serializers.CharField(
        source='position_fk.name', read_only=True, default=None
    )
    position_id = serializers.IntegerField(
        source='position_fk.id', read_only=True, default=None
    )

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
