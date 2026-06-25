from rest_framework import serializers
from .models import News


class NewsListSerializer(serializers.ModelSerializer):
    author = serializers.CharField(source='author.get_full_name', read_only=True)

    class Meta:
        model = News
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content',
            'category', 'author', 'thumbnail',
            'status', 'views',
            'published_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['views', 'published_at', 'created_at', 'updated_at']


class NewsDetailSerializer(serializers.ModelSerializer):
    author = serializers.CharField(source='author.get_full_name', read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = News
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content',
            'category', 'author', 'author_username', 'thumbnail',
            'status', 'views',
            'published_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['views', 'published_at', 'created_at', 'updated_at']


class NewsWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = News
        fields = [
            'title', 'slug', 'excerpt', 'content',
            'category', 'thumbnail', 'status',
        ]

    def validate_slug(self, value):
        if value and News.objects.filter(slug=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError('Slug sudah digunakan.')
        return value
