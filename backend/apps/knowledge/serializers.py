"""
Serializers for Knowledge Base API
"""
from rest_framework import serializers
from .models import Category, Article, Tag, ArticleTag, Rating, ArticleView, ArticleLike, Comment, CommentLike, ApprovalHistory


# Simple author serializer for article list
class SimpleAuthorSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    name = serializers.SerializerMethodField()
    
    def get_name(self, obj):
        return obj.get_full_name() if hasattr(obj, 'get_full_name') else obj.username


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model"""
    article_count = serializers.IntegerField(source='get_article_count', read_only=True)
    course_count = serializers.IntegerField(source='get_course_count', read_only=True)
    full_path = serializers.CharField(source='get_full_path', read_only=True)
    slug = serializers.SlugField(required=False)  # Make slug optional, will be auto-generated
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'parent',
            'order_index', 'is_active', 'article_count', 'course_count', 'full_path',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag model"""
    article_count = serializers.IntegerField(source='get_article_count', read_only=True)
    slug = serializers.SlugField(required=False)  # Make slug optional, will be auto-generated
    
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug', 'description', 'color', 'is_active', 'article_count', 'created_at']
        read_only_fields = ['created_at']


class ArticleListSerializer(serializers.ModelSerializer):
    """Serializer for Article list (lightweight)"""
    author = SimpleAuthorSerializer(read_only=True)  # Add full author object
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    category = CategorySerializer(read_only=True)  # Add full category object
    category_name = serializers.CharField(source='category.name', read_only=True)
    like_percentage = serializers.FloatField(source='get_like_percentage', read_only=True)
    comment_count = serializers.IntegerField(source='get_comment_count', read_only=True)

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'excerpt', 'thumbnail',
            'content_type', 'author', 'author_name', 'category', 'category_name',
            'is_featured', 'view_count', 'like_count', 'dislike_count',
            'like_percentage', 'rating_avg', 'rating_count', 'comment_count',
            'published_at', 'created_at', 'status'
        ]


class ArticleDetailSerializer(serializers.ModelSerializer):
    """Serializer for Article detail (full data) - KMS Style"""
    # Author info
    author_name = serializers.CharField(source='get_author_full_name', read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_initial = serializers.CharField(source='get_author_initial', read_only=True)
    author_role = serializers.CharField(source='get_author_role', read_only=True)
    
    # Category - nested read, ID for write
    category = CategorySerializer(read_only=True)
    
    # Tags - method field for read, list of IDs for write
    tags = serializers.SerializerMethodField()
    
    # Media
    youtube_embed_url = serializers.CharField(source='get_youtube_embed_url', read_only=True)
    youtube_thumbnail = serializers.CharField(source='get_youtube_thumbnail', read_only=True)
    file_icon = serializers.CharField(source='get_file_icon', read_only=True)
    file_size_display = serializers.CharField(source='get_file_size_display', read_only=True)
    
    # Stats
    like_percentage = serializers.FloatField(source='get_like_percentage', read_only=True)
    comment_count = serializers.IntegerField(source='get_comment_count', read_only=True)
    time_since_published = serializers.CharField(source='get_time_since_published', read_only=True)
    
    # Approval info
    approved_by_name = serializers.SerializerMethodField()
    can_submit = serializers.BooleanField(source='can_submit_for_approval', read_only=True)
    can_approve = serializers.BooleanField(read_only=True)
    can_reject = serializers.BooleanField(read_only=True)
    can_publish = serializers.BooleanField(read_only=True)
    
    # Make slug optional (auto-generated from title)
    slug = serializers.SlugField(required=False)
    
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'content', 'excerpt',
            'thumbnail', 'content_type',
            'file_url', 'file_upload', 'file_size', 'file_type',
            'file_size_display', 'file_icon',
            'youtube_url', 'youtube_embed_id', 'youtube_embed_url',
            'youtube_thumbnail', 'video_duration',
            'external_url',
            # Author
            'author', 'author_name', 'author_username', 'author_initial', 'author_role',
            # Category & Tags
            'category', 'tags',
            # Status
            'status', 'is_featured',
            # Stats
            'view_count', 'like_count', 'dislike_count', 'like_percentage', 'share_count',
            'rating_avg', 'rating_count', 'comment_count',
            'time_since_published',
            # Approval
            'submitted_at', 'approved_by', 'approved_by_name', 'approved_at',
            'rejection_reason', 'rejection_count',
            'can_submit', 'can_approve', 'can_reject', 'can_publish',
            # Dates
            'published_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'author', 'slug',
            'view_count', 'like_count', 'dislike_count', 'share_count',
            'rating_avg', 'rating_count', 'rejection_count',
            'submitted_at', 'approved_by', 'approved_at',
            'created_at', 'updated_at'
        ]
    
    def get_tags(self, obj):
        """Get article tags"""
        tags = obj.article_tags.all().select_related('tag')
        return [{'id': at.tag.id, 'name': at.tag.name, 'slug': at.tag.slug} for at in tags]
    
    def get_approved_by_name(self, obj):
        """Get approver name"""
        if obj.approved_by:
            return obj.approved_by.get_full_name() or obj.approved_by.username
        return None
    
    def _handle_tags(self, article, tags_data):
        """Handle tag relationships from list of tag IDs"""
        if tags_data is not None and isinstance(tags_data, list):
            ArticleTag.objects.filter(article=article).delete()
            for tag_id in tags_data:
                try:
                    tag = Tag.objects.get(id=tag_id)
                    ArticleTag.objects.get_or_create(article=article, tag=tag)
                except Tag.DoesNotExist:
                    pass
    
    def create(self, validated_data):
        """Create article with category and tags support"""
        tags_data = self.initial_data.get('tags', None)
        article = Article.objects.create(**validated_data)
        category_val = self.initial_data.get('category')
        if category_val is not None and category_val != '':
            try:
                article.category = Category.objects.get(id=int(category_val))
                article.save(update_fields=['category'])
            except (ValueError, TypeError, Category.DoesNotExist):
                pass
        self._handle_tags(article, tags_data)
        return article
    
    def update(self, instance, validated_data):
        """Update article with category and tags support"""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"=== UPDATE ARTICLE START ===")
        logger.info(f"Initial data: {self.initial_data}")
        logger.info(f"Validated data: {validated_data}")
        
        tags_data = self.initial_data.get('tags', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if 'category' in self.initial_data:
            category_val = self.initial_data.get('category')
            if category_val is not None and category_val != '':
                try:
                    instance.category = Category.objects.get(id=int(category_val))
                except (ValueError, TypeError, Category.DoesNotExist) as e:
                    logger.error(f"Category error: {e}")
                    pass
            else:
                instance.category = None
        instance.save()
        self._handle_tags(instance, tags_data)
        logger.info(f"=== UPDATE ARTICLE END ===")
        return instance


class RatingSerializer(serializers.ModelSerializer):
    """Serializer for Rating model"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    article_title = serializers.CharField(source='article.title', read_only=True)
    
    class Meta:
        model = Rating
        fields = [
            'id', 'article', 'article_title',
            'user', 'user_name', 'user_username',
            'rating', 'feedback', 'created_at'
        ]
        read_only_fields = ['user', 'created_at']
    
    def validate_rating(self, value):
        """Validate rating is between 1-5"""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    
    def create(self, validated_data):
        """Create or update rating (1 user = 1 rating per article)"""
        user = self.context['request'].user
        article = validated_data['article']
        
        # Update if exists, create if not
        rating, created = Rating.objects.update_or_create(
            article=article,
            user=user,
            defaults={
                'rating': validated_data['rating'],
                'feedback': validated_data.get('feedback', '')
            }
        )
        return rating


class ArticleViewSerializer(serializers.ModelSerializer):
    """Serializer for ArticleView model"""
    article_title = serializers.CharField(source='article.title', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = ArticleView
        fields = [
            'id', 'article', 'article_title',
            'ip_address', 'user', 'user_name',
            'user_agent', 'viewed_at'
        ]
        read_only_fields = ['viewed_at']


class ArticleViewStatsSerializer(serializers.Serializer):
    """Serializer for article view statistics"""
    article_id = serializers.IntegerField()
    article_title = serializers.CharField()
    total_views = serializers.IntegerField()
    logged_in_views = serializers.IntegerField()
    anonymous_views = serializers.IntegerField()
    recent_views_7days = serializers.IntegerField()
    recent_views_30days = serializers.IntegerField()


class ArticleLikeSerializer(serializers.ModelSerializer):
    """Serializer for ArticleLike model"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    article_title = serializers.CharField(source='article.title', read_only=True)
    action = serializers.SerializerMethodField()
    
    class Meta:
        model = ArticleLike
        fields = [
            'id', 'article', 'article_title',
            'user', 'user_name', 'user_username',
            'is_like', 'action',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def get_action(self, obj):
        """Get human-readable action"""
        return "like" if obj.is_like else "dislike"
    
    def create(self, validated_data):
        """Create or update like/dislike (1 user = 1 action per article)"""
        user = self.context['request'].user
        article = validated_data['article']
        is_like = validated_data['is_like']
        
        # Update if exists, create if not
        like, created = ArticleLike.objects.update_or_create(
            article=article,
            user=user,
            defaults={'is_like': is_like}
        )
        return like


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for Comment model (recursive for nested replies)"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    article_title = serializers.CharField(source='article.title', read_only=True)
    reply_count = serializers.IntegerField(source='get_reply_count', read_only=True)
    like_percentage = serializers.FloatField(source='get_like_percentage', read_only=True)
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'article', 'article_title',
            'user', 'user_name', 'user_username',
            'parent', 'content',
            'like_count', 'dislike_count', 'like_percentage',
            'reply_count', 'replies',
            'is_edited', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'article', 'like_count', 'dislike_count', 'is_edited', 'created_at', 'updated_at']
    
    def get_replies(self, obj):
        """Get nested replies (recursive)"""
        if obj.parent is None:  # Only load replies for top-level comments
            replies = obj.get_replies()
            return CommentSerializer(replies, many=True, context=self.context).data
        return []


class CommentLikeSerializer(serializers.ModelSerializer):
    """Serializer for CommentLike model"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    comment_preview = serializers.SerializerMethodField()
    action = serializers.SerializerMethodField()
    
    class Meta:
        model = CommentLike
        fields = [
            'id', 'comment', 'comment_preview',
            'user', 'user_name', 'user_username',
            'is_like', 'action', 'created_at'
        ]
        read_only_fields = ['user', 'created_at']
    
    def get_comment_preview(self, obj):
        """Get comment preview (first 50 chars)"""
        content = obj.comment.content
        return content[:50] + '...' if len(content) > 50 else content
    
    def get_action(self, obj):
        """Get human-readable action"""
        return "like" if obj.is_like else "dislike"
    
    def create(self, validated_data):
        """Create or update like/dislike (1 user = 1 action per comment)"""
        user = self.context['request'].user
        comment = validated_data['comment']
        is_like = validated_data['is_like']
        
        # Update if exists, create if not
        like, created = CommentLike.objects.update_or_create(
            comment=comment,
            user=user,
            defaults={'is_like': is_like}
        )
        return like



class ApprovalHistorySerializer(serializers.ModelSerializer):
    """Serializer for ApprovalHistory model"""
    article_title = serializers.CharField(source='article.title', read_only=True)
    actor_name = serializers.CharField(source='actor.get_full_name', read_only=True)
    actor_username = serializers.CharField(source='actor.username', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = ApprovalHistory
        fields = [
            'id', 'article', 'article_title',
            'action', 'action_display',
            'actor', 'actor_name', 'actor_username',
            'reason', 'created_at'
        ]
        read_only_fields = ['created_at']
