"""
API Views for Knowledge Base
Django REST Framework ViewSets with Granular Permissions
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from django.utils import timezone
from django.db.models import Q, Count
from datetime import timedelta

from .models import Category, Article, ArticleDocument, Tag, Rating, ArticleView, ArticleLike, Comment, CommentLike, ApprovalHistory
from .serializers import (
    CategorySerializer,
    ArticleListSerializer,
    ArticleDetailSerializer,
    ArticleDocumentSerializer,
    TagSerializer,
    RatingSerializer,
    ArticleViewSerializer,
    ArticleViewStatsSerializer,
    ArticleLikeSerializer,
    CommentSerializer,
    CommentLikeSerializer,
    ApprovalHistorySerializer
)
from .utils import get_client_ip, get_user_agent
from .permissions import KnowledgeBasePermission, IsOwnerOrReadOnly, ApprovalPermission


@api_view(['GET'])
@permission_classes([AllowAny])
def knowledge_stats(request):
    """
    Get knowledge base statistics
    
    GET /apicorpu/public/1.0/knowledge/stats/
    
    Returns:
    - total_articles: Total articles (all statuses for authenticated users, published only for public)
    - published_articles: Published articles only
    - draft_articles: Draft articles (only for authenticated users)
    - pending_articles: Pending approval articles (only for authenticated users)
    - total_categories: Total active categories
    - total_tags: Total active tags
    - total_views: Total article views
    - total_likes: Total article likes
    - recent_articles: Articles created in last 7 days
    - popular_articles: Top 5 most viewed articles
    """
    user = request.user
    
    # Simple logic: authenticated users see all articles, public users see only published
    if user.is_authenticated:
        # Authenticated users can see all articles
        all_articles = Article.objects.all()
        total_articles = all_articles.count()
        draft_articles = Article.objects.filter(status='draft').count()
        pending_articles = Article.objects.filter(status='pending').count()
    else:
        # Public users only see published
        all_articles = Article.objects.filter(status='published')
        total_articles = all_articles.count()
        draft_articles = 0
        pending_articles = 0
    
    # Stats that are always visible
    published_articles = Article.objects.filter(status='published').count()
    total_categories = Category.objects.filter(is_active=True).count()
    total_tags = Tag.objects.filter(is_active=True).count()
    total_views = ArticleView.objects.count()
    total_likes = ArticleLike.objects.filter(is_like=True).count()
    
    # Recent articles (last 7 days)
    seven_days_ago = timezone.now() - timedelta(days=7)
    recent_articles = all_articles.filter(
        created_at__gte=seven_days_ago
    ).count()
    
    # Popular articles (top 5) - only from articles user can see
    popular_articles = all_articles.order_by('-view_count')[:5]
    
    popular_articles_data = [{
        'id': article.id,
        'title': article.title,
        'slug': article.slug,
        'view_count': article.view_count,
        'like_count': article.like_count
    } for article in popular_articles]
    
    return Response({
        'total_articles': total_articles,
        'published_articles': published_articles,
        'draft_articles': draft_articles,
        'pending_articles': pending_articles,
        'total_categories': total_categories,
        'total_tags': total_tags,
        'total_views': total_views,
        'total_likes': total_likes,
        'recent_articles': recent_articles,
        'popular_articles': popular_articles_data,
        'generated_at': timezone.now()
    })


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Category
    Full CRUD operations (list, retrieve, create, update, delete)
    Permissions: knowledge.categories.view/create/edit/delete
    """
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = 'pk'  # Use primary key (ID) for lookup
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'order_index', 'created_at']
    ordering = ['order_index', 'name']
    permission_classes = [KnowledgeBasePermission]
    
    def get_queryset(self):
        """Allow users with permission to see all categories including inactive"""
        from apps.manajemen.helpers import check_permission
        if self.request.user.is_authenticated and check_permission(self.request.user, 'knowledge', 'knowledge_category', 'view'):
            return Category.objects.all()
        return Category.objects.filter(is_active=True)
    
    def get_permissions(self):
        """
        Override to allow unauthenticated read access
        """
        if self.action in ['list', 'retrieve']:
            # Public read access
            return []
        return super().get_permissions()
    
    def perform_destroy(self, instance):
        """
        Delete category with permission check
        Check if category has articles before deleting
        """
        from apps.manajemen.helpers import check_permission
        user = self.request.user
        
        # Check permission
        if not check_permission(user, 'knowledge', 'knowledge_category', 'delete'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have permission to delete categories')
        
        # Check if category has articles
        if instance.articles.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Cannot delete category with existing articles. Please reassign or delete articles first.')
        
        # Delete the category
        instance.delete()


class TagViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Tag
    Full CRUD operations (list, retrieve, create, update, delete)
    Permissions: knowledge.tags.view/create/edit/delete
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    lookup_field = 'pk'  # Use primary key (ID) for lookup
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    permission_classes = [KnowledgeBasePermission]
    
    def create(self, request, *args, **kwargs):
        """Override create to add logging and better error handling"""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Tag create request data: {request.data}")
        logger.info(f"Content-Type: {request.content_type}")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Tag validation errors: {serializer.errors}")
        
        return super().create(request, *args, **kwargs)
    
    def get_queryset(self):
        """Allow users with permission to see all tags including inactive"""
        from apps.manajemen.helpers import check_permission
        if self.request.user.is_authenticated and check_permission(self.request.user, 'knowledge', 'knowledge_tag', 'view'):
            return Tag.objects.all()
        return Tag.objects.filter(is_active=True)
    
    def get_permissions(self):
        """
        Override to allow unauthenticated read access
        """
        if self.action in ['list', 'retrieve']:
            # Public read access
            return []
        return super().get_permissions()
    
    def perform_destroy(self, instance):
        """
        Delete tag with permission check
        """
        from apps.manajemen.helpers import check_permission
        user = self.request.user
        
        # Check permission
        if not check_permission(user, 'knowledge', 'knowledge_tag', 'delete'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have permission to delete tags')
        
        # Delete the tag (ArticleTag relationships will be deleted automatically via CASCADE)
        instance.delete()


class ArticleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Article with IP-based view tracking and Granular Permissions
    
    Permissions:
    - List/Retrieve: Public access (no auth required)
    - Create: knowledge.articles.create
    - Update: knowledge.articles.edit (author only) 
    - Delete: knowledge.articles.delete (author only)
    - Approve/Reject: knowledge.articles.approve (staff only)
    - Publish: knowledge.articles.publish (staff/author)
    - Analytics: knowledge.analytics.view
    """
    serializer_class = ArticleDetailSerializer
    lookup_field = 'slug'
    lookup_value_regex = '[^/]+'  # Allow both slug and numeric id
    permission_classes = [KnowledgeBasePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content', 'excerpt']
    ordering_fields = ['created_at', 'published_at', 'view_count', 'rating_avg']
    ordering = ['-published_at']
    
    def get_object(self):
        """
        Override to support both slug and id lookup
        """
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs[lookup_url_kwarg]
        
        # Try to get by id first (if lookup_value is numeric)
        if lookup_value.isdigit():
            try:
                obj = self.get_queryset().get(id=int(lookup_value))
                self.check_object_permissions(self.request, obj)
                return obj
            except Article.DoesNotExist:
                pass
        
        # Fall back to slug lookup
        try:
            obj = self.get_queryset().get(slug=lookup_value)
            self.check_object_permissions(self.request, obj)
            return obj
        except Article.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Article not found')
    
    def get_queryset(self):
        """Filter articles based on user permissions"""
        from apps.manajemen.helpers import check_permission
        user = self.request.user
        
        if user.is_authenticated and check_permission(user, 'knowledge', 'knowledge_article', 'view'):
            # Users with permission can see all articles
            return Article.objects.all()
        elif user.is_authenticated:
            # Authenticated users can see published + their own drafts
            return Article.objects.filter(
                Q(status='published') | Q(author=user)
            )
        else:
            # Anonymous users can only see published articles
            return Article.objects.filter(status='published')
    
    def get_serializer_class(self):
        """Use different serializers for list vs detail"""
        if self.action == 'list':
            return ArticleListSerializer
        return ArticleDetailSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """
        Get article detail and track view with IP address
        Returns article data + is_new_view flag
        """
        article = self.get_object()
        
        # Track view dengan IP address
        ip_address = get_client_ip(request)
        user = request.user if request.user.is_authenticated else None
        
        is_new_view = article.increment_view_count(
            ip_address=ip_address,
            user=user
        )
        
        # Update user agent jika view baru
        if is_new_view:
            view = article.views.filter(ip_address=ip_address).first()
            if view:
                view.user_agent = get_user_agent(request)
                view.save(update_fields=['user_agent'])
        
        # Serialize article data
        serializer = self.get_serializer(article)
        data = serializer.data
        data['is_new_view'] = is_new_view
        
        return Response(data)
    
    def perform_create(self, serializer):
        """Set author to current user when creating article"""
        article = serializer.save(author=self.request.user)
        # Manual thumbnail upload disables auto-sync from the LMS course.
        if 'thumbnail' in self.request.data and getattr(article, 'source_course', None) and article.sync_thumbnail:
            article.sync_thumbnail = False
            article.save(update_fields=['sync_thumbnail'])
        return article
    
    def update(self, request, *args, **kwargs):
        """Override update to add detailed error logging"""
        import logging
        logger = logging.getLogger(__name__)

        logger.info("=== ARTICLE UPDATE REQUEST ===")
        logger.info(f"Request data: {request.data}")
        logger.info(f"Request user: {request.user}")

        try:
            response = super().update(request, *args, **kwargs)
            logger.info("=== UPDATE SUCCESS ===")
            return response
        except Exception as e:
            logger.error(f"=== UPDATE ERROR: {type(e).__name__}: {str(e)} ===")
            logger.exception("Full traceback:")

    def perform_update(self, serializer):
        """Persist update; a manual thumbnail change disables LMS thumbnail sync."""
        thumbnail_changed = 'thumbnail' in self.request.data
        article = serializer.save()
        if thumbnail_changed and getattr(article, 'source_course', None) and article.sync_thumbnail:
            article.sync_thumbnail = False
            article.save(update_fields=['sync_thumbnail'])
        return article
    
    def perform_destroy(self, instance):
        """
        Delete article with permission check
        Only author or staff can delete articles
        """
        from apps.manajemen.helpers import check_permission
        user = self.request.user
        
        # Check if user is the author or has delete permission
        if instance.author != user and not check_permission(user, 'knowledge', 'knowledge_article', 'delete'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have permission to delete this article')
        
        # Delete the article
        instance.delete()

    @action(detail=True, methods=['delete'], url_path='documents/(?P<doc_id>[0-9]+)', permission_classes=[IsAuthenticated])
    def delete_document(self, request, slug=None, doc_id=None):
        """
        Delete a single document attachment from an article

        DELETE /api/articles/{slug}/documents/{doc_id}/
        """
        from rest_framework.exceptions import PermissionDenied
        from apps.manajemen.helpers import check_permission
        article = self.get_object()

        try:
            doc = ArticleDocument.objects.get(id=doc_id, article=article)
        except ArticleDocument.DoesNotExist:
            return Response(
                {'error': 'Document not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if article.author != request.user and not check_permission(request.user, 'knowledge', 'knowledge_article', 'edit'):
            raise PermissionDenied('You do not have permission to delete this document')

        doc.delete()

        return Response({
            'message': 'Document deleted successfully',
            'documents': ArticleDocumentSerializer(article.documents.all(), many=True).data
        })
    
    @action(detail=True, methods=['get'])
    def view_stats(self, request, slug=None):
        """
        Get view statistics for an article
        
        GET /api/articles/{slug}/view_stats/
        
        Returns:
        - total_views: Total unique views
        - logged_in_views: Views from logged-in users
        - anonymous_views: Views from anonymous users
        - recent_views_7days: Views in last 7 days
        - recent_views_30days: Views in last 30 days
        """
        article = self.get_object()
        
        # Total unique views
        total_views = article.view_count
        
        # Views by logged-in users
        logged_in_views = article.views.filter(user__isnull=False).count()
        
        # Views by anonymous users
        anonymous_views = article.views.filter(user__isnull=True).count()
        
        # Recent views
        seven_days_ago = timezone.now() - timedelta(days=7)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        recent_views_7days = article.views.filter(viewed_at__gte=seven_days_ago).count()
        recent_views_30days = article.views.filter(viewed_at__gte=thirty_days_ago).count()
        
        data = {
            'article_id': article.id,
            'article_title': article.title,
            'total_views': total_views,
            'logged_in_views': logged_in_views,
            'anonymous_views': anonymous_views,
            'recent_views_7days': recent_views_7days,
            'recent_views_30days': recent_views_30days,
        }
        
        serializer = ArticleViewStatsSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """
        Get most viewed articles
        
        GET /api/articles/popular/?limit=10
        
        Query params:
        - limit: Number of articles to return (default: 10)
        """
        limit = int(request.query_params.get('limit', 10))
        
        articles = self.get_queryset().filter(
            status='published'
        ).order_by('-view_count')[:limit]
        
        serializer = ArticleListSerializer(articles, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """
        Get featured articles
        
        GET /api/articles/featured/?limit=5
        """
        limit = int(request.query_params.get('limit', 5))
        
        articles = self.get_queryset().filter(
            status='published',
            is_featured=True
        ).order_by('-published_at')[:limit]
        
        serializer = ArticleListSerializer(articles, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def trending(self, request):
        """
        Get trending articles (most viewed in last 7 days)
        
        GET /api/articles/trending/?limit=10
        """
        limit = int(request.query_params.get('limit', 10))
        seven_days_ago = timezone.now() - timedelta(days=7)
        
        # Get articles with most views in last 7 days
        trending_article_ids = ArticleView.objects.filter(
            viewed_at__gte=seven_days_ago
        ).values('article').annotate(
            view_count=Count('id')
        ).order_by('-view_count').values_list('article', flat=True)[:limit]
        
        # Get article objects in same order
        articles = Article.objects.filter(
            id__in=trending_article_ids,
            status='published'
        )
        
        # Sort by trending order
        articles = sorted(articles, key=lambda x: list(trending_article_ids).index(x.id))
        
        serializer = ArticleListSerializer(articles, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, slug=None):
        """
        Like an article (REQUIRES AUTHENTICATION)
        
        POST /api/articles/{slug}/like/
        
        Returns:
        - message: Success message
        - like_count: Updated like count
        - dislike_count: Updated dislike count
        - user_action: Current user's action (like/dislike/none)
        """
        article = self.get_object()
        user = request.user
        
        # Create or update like
        like_obj, created = ArticleLike.objects.update_or_create(
            article=article,
            user=user,
            defaults={'is_like': True}
        )
        
        # Refresh article to get updated counts
        article.refresh_from_db()
        
        return Response({
            'message': 'Article liked successfully',
            'like_count': article.like_count,
            'dislike_count': article.dislike_count,
            'like_percentage': article.get_like_percentage(),
            'user_action': 'like'
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def dislike(self, request, slug=None):
        """
        Dislike an article (REQUIRES AUTHENTICATION)
        
        POST /api/articles/{slug}/dislike/
        
        Returns:
        - message: Success message
        - like_count: Updated like count
        - dislike_count: Updated dislike count
        - user_action: Current user's action (like/dislike/none)
        """
        article = self.get_object()
        user = request.user
        
        # Create or update dislike
        like_obj, created = ArticleLike.objects.update_or_create(
            article=article,
            user=user,
            defaults={'is_like': False}
        )
        
        # Refresh article to get updated counts
        article.refresh_from_db()
        
        return Response({
            'message': 'Article disliked successfully',
            'like_count': article.like_count,
            'dislike_count': article.dislike_count,
            'like_percentage': article.get_like_percentage(),
            'user_action': 'dislike'
        })
    
    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated])
    def unlike(self, request, slug=None):
        """
        Remove like/dislike from an article
        
        DELETE /api/articles/{slug}/unlike/
        
        Returns:
        - message: Success message
        - like_count: Updated like count
        - dislike_count: Updated dislike count
        - user_action: none
        """
        article = self.get_object()
        user = request.user
        
        # Delete like/dislike if exists
        deleted_count = ArticleLike.objects.filter(
            article=article,
            user=user
        ).delete()[0]
        
        # Refresh article to get updated counts
        article.refresh_from_db()
        
        if deleted_count > 0:
            message = 'Like/dislike removed successfully'
        else:
            message = 'No like/dislike found to remove'
        
        return Response({
            'message': message,
            'like_count': article.like_count,
            'dislike_count': article.dislike_count,
            'like_percentage': article.get_like_percentage(),
            'user_action': 'none'
        })
    
    @action(detail=True, methods=['get'])
    def user_action(self, request, slug=None):
        """
        Get current user's action on this article
        
        GET /api/articles/{slug}/user_action/
        
        Returns:
        - user_action: like/dislike/none
        - like_count: Current like count
        - dislike_count: Current dislike count
        """
        article = self.get_object()
        
        if not request.user.is_authenticated:
            return Response({
                'user_action': 'none',
                'like_count': article.like_count,
                'dislike_count': article.dislike_count,
                'like_percentage': article.get_like_percentage()
            })
        
        try:
            like_obj = ArticleLike.objects.get(article=article, user=request.user)
            user_action = 'like' if like_obj.is_like else 'dislike'
        except ArticleLike.DoesNotExist:
            user_action = 'none'
        
        return Response({
            'user_action': user_action,
            'like_count': article.like_count,
            'dislike_count': article.dislike_count,
            'like_percentage': article.get_like_percentage()
        })
    
    @action(detail=False, methods=['get'])
    def most_liked(self, request):
        """
        Get most liked articles
        
        GET /api/articles/most_liked/?limit=10
        """
        limit = int(request.query_params.get('limit', 10))
        
        articles = self.get_queryset().filter(
            status='published'
        ).order_by('-like_count')[:limit]
        
        serializer = ArticleListSerializer(articles, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def who_liked(self, request, slug=None):
        """
        Get list of users who liked this article
        
        GET /api/articles/{slug}/who_liked/
        
        Returns list of users with their info
        """
        article = self.get_object()
        
        likes = ArticleLike.objects.filter(
            article=article,
            is_like=True
        ).select_related('user')
        
        users = [{
            'id': like.user.id,
            'username': like.user.username,
            'full_name': like.user.get_full_name(),
            'liked_at': like.created_at
        } for like in likes]
        
        return Response({
            'article_id': article.id,
            'article_title': article.title,
            'total_likes': len(users),
            'users': users
        })
    
    @action(detail=True, methods=['get'])
    def who_disliked(self, request, slug=None):
        """
        Get list of users who disliked this article
        
        GET /api/articles/{slug}/who_disliked/
        
        Returns list of users with their info
        """
        article = self.get_object()
        
        dislikes = ArticleLike.objects.filter(
            article=article,
            is_like=False
        ).select_related('user')
        
        users = [{
            'id': dislike.user.id,
            'username': dislike.user.username,
            'full_name': dislike.user.get_full_name(),
            'disliked_at': dislike.created_at
        } for dislike in dislikes]
        
        return Response({
            'article_id': article.id,
            'article_title': article.title,
            'total_dislikes': len(users),
            'users': users
        })
    
    @action(detail=True, methods=['post'])
    def share(self, request, slug=None):
        """
        Track article share
        
        POST /api/articles/{slug}/share/
        
        Body (optional):
        {
          "platform": "facebook|twitter|whatsapp|linkedin|email|copy"
        }
        
        Returns updated share count
        """
        article = self.get_object()
        platform = request.data.get('platform', 'unknown')
        
        # Increment share count
        article.increment_share_count()
        
        # Optional: Track share by platform (could create ShareTracking model)
        # For now, just increment counter
        
        return Response({
            'message': 'Share tracked successfully',
            'share_count': article.share_count,
            'platform': platform
        })
    
    @action(detail=True, methods=['post'])
    def submit_for_approval(self, request, slug=None):
        """
        Submit article for approval
        
        POST /api/articles/{slug}/submit_for_approval/
        
        Only author can submit their own article
        """
        article = self.get_object()
        
        # Check if user is the author
        if article.author != request.user:
            return Response(
                {'error': 'Only the author can submit their article for approval'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            article.submit_for_approval(request.user)
            return Response({
                'message': 'Article submitted for approval successfully',
                'status': article.status,
                'submitted_at': article.submitted_at
            })
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, slug=None):
        """
        Approve article
        
        POST /api/articles/{slug}/approve/
        
        Body (optional):
        {
          "reason": "Approval notes"
        }
        
        Permission: knowledge.articles.approve (staff only)
        """
        article = self.get_object()
        
        # Check if user has permission to approve (staff or specific role)
        if not request.user.is_staff:
            return Response(
                {'error': 'Only staff members can approve articles'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reason = request.data.get('reason', 'Article approved')
        
        try:
            article.approve(request.user, reason)
            return Response({
                'message': 'Article approved successfully',
                'status': article.status,
                'approved_by': article.approved_by.get_full_name(),
                'approved_at': article.approved_at
            })
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, slug=None):
        """
        Reject article
        
        POST /api/articles/{slug}/reject/
        
        Body (required):
        {
          "reason": "Rejection reason (required)"
        }
        
        Permission: knowledge.articles.approve (staff only)
        """
        article = self.get_object()
        
        # Check if user has permission to reject (staff or specific role)
        if not request.user.is_staff:
            return Response(
                {'error': 'Only staff members can reject articles'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reason = request.data.get('reason')
        if not reason:
            return Response(
                {'error': 'Rejection reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            article.reject(request.user, reason)
            return Response({
                'message': 'Article rejected',
                'status': article.status,
                'rejection_reason': article.rejection_reason,
                'rejection_count': article.rejection_count
            })
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def publish(self, request, slug=None):
        """
        Publish article (must be approved first)
        
        POST /api/articles/{slug}/publish/
        
        Only staff or author can publish approved article
        """
        article = self.get_object()
        
        # Check permission
        if not (request.user.is_staff or article.author == request.user):
            return Response(
                {'error': 'Only staff or author can publish articles'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            article.publish(request.user)
            return Response({
                'message': 'Article published successfully',
                'status': article.status,
                'published_at': article.published_at
            })
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def approval_history(self, request, slug=None):
        """
        Get approval history for article
        
        GET /api/articles/{slug}/approval_history/
        
        Returns all approval/rejection history
        """
        article = self.get_object()
        history = article.get_approval_history()
        serializer = ApprovalHistorySerializer(history, many=True)
        
        return Response({
            'article_id': article.id,
            'article_title': article.title,
            'current_status': article.status,
            'rejection_count': article.rejection_count,
            'history': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def pending_approval(self, request):
        """
        Get articles pending approval
        
        GET /api/articles/pending_approval/
        
        Only staff can see pending articles
        """
        if not request.user.is_staff:
            return Response(
                {'error': 'Only staff can view pending articles'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        articles = Article.objects.filter(status='pending').order_by('-submitted_at')
        serializer = ArticleListSerializer(articles, many=True)
        
        return Response({
            'count': articles.count(),
            'articles': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def my_articles(self, request):
        """
        Get current user's articles with all statuses
        
        GET /api/articles/my_articles/
        """
        articles = Article.objects.filter(author=request.user).order_by('-created_at')
        serializer = ArticleListSerializer(articles, many=True)
        
        return Response({
            'count': articles.count(),
            'articles': serializer.data
        })


class RatingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Rating
    
    Actions:
    - list: Get all ratings (filtered by article if provided)
    - create: Create/update rating for an article
    - retrieve: Get specific rating
    - update/partial_update: Update rating
    - destroy: Delete rating
    """
    serializer_class = RatingSerializer
    permission_classes = [KnowledgeBasePermission]
    
    def get_queryset(self):
        """Filter ratings by article if provided"""
        queryset = Rating.objects.all()
        
        article_id = self.request.query_params.get('article_id')
        if article_id:
            queryset = queryset.filter(article_id=article_id)
        
        article_slug = self.request.query_params.get('article_slug')
        if article_slug:
            queryset = queryset.filter(article__slug=article_slug)
        
        return queryset.select_related('article', 'user')
    
    def perform_create(self, serializer):
        """Set user to current user when creating rating"""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_ratings(self, request):
        """
        Get current user's ratings
        
        GET /api/ratings/my_ratings/
        """
        ratings = Rating.objects.filter(user=request.user).select_related('article')
        serializer = self.get_serializer(ratings, many=True)
        return Response(serializer.data)


class ArticleViewViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for ArticleView (read-only)
    For analytics and tracking purposes
    """
    serializer_class = ArticleViewSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['viewed_at']
    ordering = ['-viewed_at']
    
    def get_queryset(self):
        """Filter views by article if provided"""
        queryset = ArticleView.objects.all()
        
        # Only staff can see all views
        if not self.request.user.is_staff:
            return ArticleView.objects.none()
        
        article_id = self.request.query_params.get('article_id')
        if article_id:
            queryset = queryset.filter(article_id=article_id)
        
        article_slug = self.request.query_params.get('article_slug')
        if article_slug:
            queryset = queryset.filter(article__slug=article_slug)
        
        return queryset.select_related('article', 'user')
    
    @action(detail=False, methods=['get'])
    def my_views(self, request):
        """
        Get current user's view history
        
        GET /api/article-views/my_views/
        """
        views = ArticleView.objects.filter(
            user=request.user
        ).select_related('article')
        
        serializer = self.get_serializer(views, many=True)
        return Response(serializer.data)



class ArticleLikeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ArticleLike
    
    Actions:
    - list: Get all likes/dislikes (filtered by article if provided)
    - create: Create/update like/dislike for an article
    - retrieve: Get specific like/dislike
    - destroy: Delete like/dislike
    """
    serializer_class = ArticleLikeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter likes by article if provided"""
        queryset = ArticleLike.objects.all()
        
        article_id = self.request.query_params.get('article_id')
        if article_id:
            queryset = queryset.filter(article_id=article_id)
        
        article_slug = self.request.query_params.get('article_slug')
        if article_slug:
            queryset = queryset.filter(article__slug=article_slug)
        
        return queryset.select_related('article', 'user')
    
    def perform_create(self, serializer):
        """Set user to current user when creating like/dislike"""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_likes(self, request):
        """
        Get current user's likes/dislikes
        
        GET /api/article-likes/my_likes/
        """
        likes = ArticleLike.objects.filter(user=request.user).select_related('article')
        serializer = self.get_serializer(likes, many=True)
        return Response(serializer.data)



class CommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Comment with nested replies support and Granular Permissions
    
    Permissions:
    - List/Retrieve: Public access (no auth required)
    - Create: knowledge.comments.create (auth required)
    - Update: knowledge.comments.edit (author only)
    - Delete: knowledge.comments.delete (author or staff)
    """
    serializer_class = CommentSerializer
    permission_classes = [KnowledgeBasePermission]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'like_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter comments by article if provided"""
        queryset = Comment.objects.all()
        
        article_id = self.request.query_params.get('article_id')
        if article_id:
            queryset = queryset.filter(article_id=article_id)
        
        article_slug = self.request.query_params.get('article_slug')
        if article_slug:
            queryset = queryset.filter(article__slug=article_slug)
        
        # Filter top-level comments only (no parent)
        only_top_level = self.request.query_params.get('only_top_level', 'true')
        if only_top_level.lower() == 'true':
            queryset = queryset.filter(parent__isnull=True)
        
        return queryset.select_related('article', 'user', 'parent')
    
    def perform_create(self, serializer):
        """Set user to current user when creating comment"""
        # Handle article_slug if provided instead of article ID
        article_slug = self.request.data.get('article_slug')
        if article_slug:
            try:
                from .models import Article
                article = Article.objects.get(slug=article_slug)
                serializer.save(user=self.request.user, article=article)
            except Article.DoesNotExist:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'article_slug': 'Article not found'})
        else:
            serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        """Only allow author to update their comment"""
        comment = self.get_object()
        if comment.user != self.request.user:
            raise PermissionError("You can only edit your own comments")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Only allow author to delete their comment"""
        if instance.user != self.request.user and not self.request.user.is_staff:
            raise PermissionError("You can only delete your own comments")
        instance.delete()
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """
        Like a comment (REQUIRES AUTHENTICATION)
        
        POST /api/comments/{id}/like/
        """
        comment = self.get_object()
        user = request.user
        
        # Create or update like
        like_obj, created = CommentLike.objects.update_or_create(
            comment=comment,
            user=user,
            defaults={'is_like': True}
        )
        
        # Refresh comment to get updated counts
        comment.refresh_from_db()
        
        return Response({
            'message': 'Comment liked successfully',
            'like_count': comment.like_count,
            'dislike_count': comment.dislike_count,
            'like_percentage': comment.get_like_percentage(),
            'user_action': 'like'
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def dislike(self, request, pk=None):
        """
        Dislike a comment (REQUIRES AUTHENTICATION)
        
        POST /api/comments/{id}/dislike/
        """
        comment = self.get_object()
        user = request.user
        
        # Create or update dislike
        like_obj, created = CommentLike.objects.update_or_create(
            comment=comment,
            user=user,
            defaults={'is_like': False}
        )
        
        # Refresh comment to get updated counts
        comment.refresh_from_db()
        
        return Response({
            'message': 'Comment disliked successfully',
            'like_count': comment.like_count,
            'dislike_count': comment.dislike_count,
            'like_percentage': comment.get_like_percentage(),
            'user_action': 'dislike'
        })
    
    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated])
    def unlike(self, request, pk=None):
        """
        Remove like/dislike from a comment (REQUIRES AUTHENTICATION)
        
        DELETE /api/comments/{id}/unlike/
        """
        comment = self.get_object()
        user = request.user
        
        # Delete like/dislike if exists
        deleted_count = CommentLike.objects.filter(
            comment=comment,
            user=user
        ).delete()[0]
        
        # Refresh comment to get updated counts
        comment.refresh_from_db()
        
        if deleted_count > 0:
            message = 'Like/dislike removed successfully'
        else:
            message = 'No like/dislike found to remove'
        
        return Response({
            'message': message,
            'like_count': comment.like_count,
            'dislike_count': comment.dislike_count,
            'like_percentage': comment.get_like_percentage(),
            'user_action': 'none'
        })
    
    @action(detail=True, methods=['get'])
    def user_action(self, request, pk=None):
        """
        Get current user's action on this comment
        
        GET /api/comments/{id}/user_action/
        """
        comment = self.get_object()
        
        if not request.user.is_authenticated:
            return Response({
                'user_action': 'none',
                'like_count': comment.like_count,
                'dislike_count': comment.dislike_count,
                'like_percentage': comment.get_like_percentage()
            })
        
        try:
            like_obj = CommentLike.objects.get(comment=comment, user=request.user)
            user_action = 'like' if like_obj.is_like else 'dislike'
        except CommentLike.DoesNotExist:
            user_action = 'none'
        
        return Response({
            'user_action': user_action,
            'like_count': comment.like_count,
            'dislike_count': comment.dislike_count,
            'like_percentage': comment.get_like_percentage()
        })


class CommentLikeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for CommentLike (read-only for analytics)
    """
    serializer_class = CommentLikeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by comment if provided"""
        queryset = CommentLike.objects.all()
        
        comment_id = self.request.query_params.get('comment_id')
        if comment_id:
            queryset = queryset.filter(comment_id=comment_id)
        
        return queryset.select_related('comment', 'user')
