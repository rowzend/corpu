from django.urls import path, include
from . import views

app_name = 'knowledge'

urlpatterns = [
    # API URLs (REST API)
    path('api/', include('apps.knowledge.urls_api')),
    
    # ============================================================================
    # PUBLIC URLS (No authentication required)
    # ============================================================================
    
    # Article URLs (Public)
    path('', views.article_list, name='article_list'),
    path('artikel/<slug:slug>/', views.article_detail, name='article_detail'),
    
    # Tag URLs (Public)
    path('tags/', views.tag_list, name='tag_list'),
    path('tag/<slug:slug>/', views.tag_detail, name='tag_detail'),
    
    # ============================================================================
    # MANAGEMENT URLS (Authentication + Permission required)
    # ============================================================================
    
    # Article Management URLs
    path('manage/articles/', views.article_manage_list, name='article_manage_list'),
    path('manage/articles/create/', views.article_create, name='article_create'),
    path('manage/articles/<slug:slug>/view/', views.article_manage_detail, name='article_manage_detail'),
    path('manage/articles/<slug:slug>/edit/', views.article_edit, name='article_edit'),
    path('manage/articles/<slug:slug>/delete/', views.article_delete, name='article_delete'),
    
    # Article Interaction URLs (AJAX)
    path('ajax/articles/<slug:slug>/like/', views.article_like, name='article_like'),
    path('ajax/articles/<slug:slug>/dislike/', views.article_dislike, name='article_dislike'),
    path('ajax/articles/<slug:slug>/rate/', views.article_rate, name='article_rate'),
    path('ajax/articles/<slug:slug>/comment/', views.article_comment, name='article_comment'),
    
    # Comment Interaction URLs (AJAX)
    path('ajax/comments/<int:pk>/like/', views.comment_like, name='comment_like'),
    path('ajax/comments/<int:pk>/dislike/', views.comment_dislike, name='comment_dislike'),
    path('ajax/comments/<int:pk>/reply/', views.comment_reply, name='comment_reply'),
    
    # Category Management URLs
    path('manage/categories/', views.category_list, name='category_list'),
    path('manage/categories/create/', views.category_create, name='category_create'),
    path('manage/categories/<int:pk>/edit/', views.category_edit, name='category_edit'),
    path('manage/categories/<int:pk>/delete/', views.category_delete, name='category_delete'),
    path('ajax/categories/<int:pk>/toggle-active/', views.category_toggle_active, name='category_toggle_active'),
    
    # Tag Management URLs
    path('manage/tags/', views.tag_manage_list, name='tag_manage_list'),
    path('manage/tags/create/', views.tag_create, name='tag_create'),
    path('manage/tags/<int:pk>/edit/', views.tag_edit, name='tag_edit'),
    path('manage/tags/<int:pk>/delete/', views.tag_delete, name='tag_delete'),
    
    # Comment Management URLs
    path('manage/comments/', views.comment_manage_list, name='comment_manage_list'),
    path('manage/comments/<int:pk>/edit/', views.comment_edit, name='comment_edit'),
    path('manage/comments/<int:pk>/delete/', views.comment_delete, name='comment_delete'),
    path('ajax/comments/<int:pk>/toggle-active/', views.comment_toggle_active, name='comment_toggle_active'),
    
    # Article Likes Management URLs
    path('manage/article-likes/', views.article_like_manage_list, name='article_like_manage_list'),
    path('manage/article-likes/<int:pk>/delete/', views.article_like_delete, name='article_like_delete'),
    path('ajax/article-likes/bulk-delete/', views.article_like_bulk_delete, name='article_like_bulk_delete'),
    
    # Comment Likes Management URLs
    path('manage/comment-likes/', views.comment_like_manage_list, name='comment_like_manage_list'),
    path('manage/comment-likes/<int:pk>/delete/', views.comment_like_delete, name='comment_like_delete'),
    path('ajax/comment-likes/bulk-delete/', views.comment_like_bulk_delete, name='comment_like_bulk_delete'),
    
    # Ratings Management URLs
    path('manage/ratings/', views.rating_manage_list, name='rating_manage_list'),
    path('manage/ratings/<int:pk>/delete/', views.rating_delete, name='rating_delete'),
    path('ajax/ratings/bulk-delete/', views.rating_bulk_delete, name='rating_bulk_delete'),
    
    # Views Management
    path('manage/views/', views.view_manage_list, name='view_manage_list'),
    path('manage/views/<int:view_id>/delete/', views.view_delete, name='view_delete'),
    path('ajax/views/bulk-delete/', views.view_bulk_delete, name='view_bulk_delete'),
]

"""
Knowledge Base URL Structure:

PUBLIC URLS (No Auth Required):
================================
/knowledge/                           - Article list (homepage)
/knowledge/artikel/{slug}/            - Article detail (public view)
/knowledge/tags/                      - Tag list
/knowledge/tag/{slug}/                - Tag detail (articles with this tag)

MANAGEMENT URLS (Auth + Permission Required):
============================================
/knowledge/manage/articles/           - Article management list
/knowledge/manage/articles/create/    - Create new article
/knowledge/manage/articles/{slug}/view/ - View article (management view)
/knowledge/manage/articles/{slug}/edit/ - Edit article
/knowledge/manage/articles/{slug}/delete/ - Delete article

/knowledge/manage/categories/         - Category management
/knowledge/manage/categories/create/  - Create category
/knowledge/manage/categories/{id}/edit/ - Edit category
/knowledge/manage/categories/{id}/delete/ - Delete category

/knowledge/manage/tags/               - Tag management
/knowledge/manage/tags/create/        - Create tag
/knowledge/manage/tags/{id}/edit/     - Edit tag
/knowledge/manage/tags/{id}/delete/   - Delete tag

AJAX URLS (Interactive Features):
=================================
/knowledge/ajax/articles/{slug}/like/     - Like article
/knowledge/ajax/articles/{slug}/dislike/  - Dislike article
/knowledge/ajax/articles/{slug}/rate/     - Rate article
/knowledge/ajax/articles/{slug}/comment/  - Add comment

/knowledge/ajax/categories/{id}/toggle-active/ - Toggle category status

PERMISSION REQUIREMENTS:
========================
Public URLs:          No authentication required
Management URLs:      Authentication + specific permissions
AJAX URLs:           Authentication required

Permission Structure:
- knowledge.articles.view     - View articles (management)
- knowledge.articles.create   - Create articles
- knowledge.articles.edit     - Edit articles (own + staff)
- knowledge.articles.delete   - Delete articles (own + staff)
- knowledge.categories.view   - View categories (management)
- knowledge.categories.create - Create categories
- knowledge.categories.edit   - Edit categories
- knowledge.categories.delete - Delete categories
- knowledge.tags.view         - View tags (management)
- knowledge.tags.create       - Create tags
- knowledge.tags.edit         - Edit tags
- knowledge.tags.delete       - Delete tags
"""
