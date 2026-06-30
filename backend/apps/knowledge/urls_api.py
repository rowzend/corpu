"""
API URLs for Knowledge Base
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_api import (
    CategoryViewSet,
    ArticleViewSet,
    TagViewSet,
    RatingViewSet,
    ArticleViewViewSet,
    ArticleLikeViewSet,
    CommentViewSet,
    CommentLikeViewSet,
    knowledge_stats
)

# Create router
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'articles', ArticleViewSet, basename='article')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'ratings', RatingViewSet, basename='rating')
router.register(r'article-views', ArticleViewViewSet, basename='articleview')
router.register(r'article-likes', ArticleLikeViewSet, basename='articlelike')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'comment-likes', CommentLikeViewSet, basename='commentlike')

app_name = 'knowledge_api'

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', knowledge_stats, name='knowledge_stats'),
]

"""
API URLs for Knowledge Base

NEW API STRUCTURE (v1.0):
========================
Base URL: /apicorpu/public/1.0/knowledge/

Public Endpoints (No Authentication):
- GET    /apicorpu/public/1.0/knowledge/categories/              - List all categories
- GET    /apicorpu/public/1.0/knowledge/categories/{slug}/       - Get category detail
- GET    /apicorpu/public/1.0/knowledge/articles/                - List all articles
- GET    /apicorpu/public/1.0/knowledge/articles/{slug}/         - Get article detail + track view
- GET    /apicorpu/public/1.0/knowledge/articles/popular/        - Get most viewed articles
- GET    /apicorpu/public/1.0/knowledge/articles/featured/       - Get featured articles
- GET    /apicorpu/public/1.0/knowledge/articles/trending/       - Get trending articles (7 days)
- GET    /apicorpu/public/1.0/knowledge/articles/most_liked/     - Get most liked articles
- GET    /apicorpu/public/1.0/knowledge/articles/{slug}/view_stats/ - Get view statistics
- GET    /apicorpu/public/1.0/knowledge/articles/{slug}/user_action/ - Get user's action
- GET    /apicorpu/public/1.0/knowledge/articles/{slug}/who_liked/ - Get list of users who liked
- GET    /apicorpu/public/1.0/knowledge/articles/{slug}/who_disliked/ - Get list of users who disliked
- GET    /apicorpu/public/1.0/knowledge/tags/                    - List all tags
- GET    /apicorpu/public/1.0/knowledge/tags/{slug}/             - Get tag detail
- GET    /apicorpu/public/1.0/knowledge/comments/                - List comments

Authenticated Endpoints (JWT Required):
- POST   /apicorpu/public/1.0/knowledge/articles/                - Create article
- PUT    /apicorpu/public/1.0/knowledge/articles/{slug}/         - Update article
- PATCH  /apicorpu/public/1.0/knowledge/articles/{slug}/         - Partial update
- DELETE /apicorpu/public/1.0/knowledge/articles/{slug}/         - Delete article
- POST   /apicorpu/public/1.0/knowledge/articles/{slug}/like/    - Like article
- POST   /apicorpu/public/1.0/knowledge/articles/{slug}/dislike/ - Dislike article
- DELETE /apicorpu/public/1.0/knowledge/articles/{slug}/unlike/  - Remove like/dislike
- GET    /apicorpu/public/1.0/knowledge/articles/my_articles/    - Get my articles
- GET    /apicorpu/public/1.0/knowledge/articles/pending_approval/ - Get pending articles (staff)
- POST   /apicorpu/public/1.0/knowledge/articles/{slug}/submit_for_approval/ - Submit for approval
- POST   /apicorpu/public/1.0/knowledge/articles/{slug}/approve/ - Approve article (staff)
- POST   /apicorpu/public/1.0/knowledge/articles/{slug}/reject/  - Reject article (staff)
- POST   /apicorpu/public/1.0/knowledge/articles/{slug}/publish/ - Publish article
- GET    /apicorpu/public/1.0/knowledge/articles/{slug}/approval_history/ - Get approval history
- POST   /apicorpu/public/1.0/knowledge/ratings/                 - Create/update rating
- GET    /apicorpu/public/1.0/knowledge/ratings/my_ratings/      - Get my ratings
- POST   /apicorpu/public/1.0/knowledge/comments/                - Create comment/reply
- PUT    /apicorpu/public/1.0/knowledge/comments/{id}/           - Update comment
- PATCH  /apicorpu/public/1.0/knowledge/comments/{id}/           - Partial update
- DELETE /apicorpu/public/1.0/knowledge/comments/{id}/           - Delete comment
- POST   /apicorpu/public/1.0/knowledge/comments/{id}/like/      - Like comment
- POST   /apicorpu/public/1.0/knowledge/comments/{id}/dislike/   - Dislike comment
- DELETE /apicorpu/public/1.0/knowledge/comments/{id}/unlike/    - Remove like/dislike
- GET    /apicorpu/public/1.0/knowledge/article-views/my_views/  - Get my view history
- GET    /apicorpu/public/1.0/knowledge/article-likes/my_likes/  - Get my likes/dislikes

Query Parameters:
- search: Search in title, content, excerpt
- ordering: Sort by field (e.g., -view_count, -rating_avg, -like_count, -created_at)
- limit: Limit results (for popular/featured/trending/most_liked)
- article_id: Filter by article ID (for ratings/views/likes/comments)
- article_slug: Filter by article slug (for ratings/views/likes/comments)
- only_top_level: true/false - Filter top-level comments only (default: true)

Examples:
- GET /apicorpu/public/1.0/knowledge/articles/?search=django&ordering=-like_count
- GET /apicorpu/public/1.0/knowledge/articles/most_liked/?limit=5
- POST /apicorpu/public/1.0/knowledge/articles/my-article/like/
- GET /apicorpu/public/1.0/knowledge/comments/?article_slug=my-article&only_top_level=true
"""
