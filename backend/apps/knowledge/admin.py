from django.contrib import admin
from .models import Category, Article, Tag, ArticleTag, Rating, ArticleView, ArticleLike, Comment, CommentLike, ApprovalHistory

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'parent', 'order_index', 'is_active', 'created_at')
    list_filter = ('is_active', 'parent')
    search_fields = ('name', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('order_index', 'name')

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'category', 'status', 'is_featured', 'view_count', 'like_count', 'dislike_count', 'rejection_count', 'published_at')
    list_filter = ('status', 'is_featured', 'category', 'created_at', 'rejection_count')
    search_fields = ('title', 'slug', 'content', 'excerpt')
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'published_at'
    ordering = ('-created_at',)
    readonly_fields = ('view_count', 'like_count', 'dislike_count', 'share_count', 'rating_avg', 'rating_count', 'rejection_count', 'submitted_at', 'approved_at', 'published_at', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('title', 'slug', 'content', 'excerpt', 'author', 'category', 'content_type')
        }),
        ('Media', {
            'fields': ('thumbnail', 'youtube_url', 'youtube_embed_id', 'video_duration', 'file_upload', 'file_url', 'external_url'),
            'classes': ('collapse',)
        }),
        ('Status & Approval', {
            'fields': ('status', 'is_featured', 'submitted_at', 'approved_by', 'approved_at', 'rejection_reason', 'rejection_count')
        }),
        ('Stats', {
            'fields': ('view_count', 'like_count', 'dislike_count', 'share_count', 'rating_avg', 'rating_count'),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ('published_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['submit_for_approval', 'approve_articles', 'reject_articles', 'publish_articles']
    
    def submit_for_approval(self, request, queryset):
        count = 0
        for article in queryset:
            if article.can_submit_for_approval():
                article.submit_for_approval(request.user)
                count += 1
        self.message_user(request, f"{count} artikel berhasil diajukan untuk approval")
    submit_for_approval.short_description = "Submit selected articles for approval"
    
    def approve_articles(self, request, queryset):
        count = 0
        for article in queryset:
            if article.can_approve():
                article.approve(request.user, "Approved via admin")
                count += 1
        self.message_user(request, f"{count} artikel berhasil disetujui")
    approve_articles.short_description = "Approve selected articles"
    
    def reject_articles(self, request, queryset):
        # This would need a custom admin action with form for rejection reason
        self.message_user(request, "Use individual article page to reject with reason")
    reject_articles.short_description = "Reject selected articles (use detail page)"
    
    def publish_articles(self, request, queryset):
        count = 0
        for article in queryset:
            if article.can_publish():
                article.publish(request.user)
                count += 1
        self.message_user(request, f"{count} artikel berhasil dipublikasi")
    publish_articles.short_description = "Publish selected articles"

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'created_at')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ('article', 'user', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('article__title', 'user__username', 'feedback')


@admin.register(ArticleView)
class ArticleViewAdmin(admin.ModelAdmin):
    list_display = ('article', 'ip_address', 'user', 'viewed_at')
    list_filter = ('viewed_at',)
    search_fields = ('article__title', 'ip_address', 'user__username')
    readonly_fields = ('article', 'ip_address', 'user', 'user_agent', 'viewed_at')
    date_hierarchy = 'viewed_at'
    ordering = ('-viewed_at',)
    
    def has_add_permission(self, request):
        # Disable manual add (views should be created automatically)
        return False
    
    def has_change_permission(self, request, obj=None):
        # Make read-only
        return False


@admin.register(ArticleLike)
class ArticleLikeAdmin(admin.ModelAdmin):
    list_display = ('article', 'user', 'get_action', 'created_at', 'updated_at')
    list_filter = ('is_like', 'created_at')
    search_fields = ('article__title', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
    
    def get_action(self, obj):
        return "👍 Like" if obj.is_like else "👎 Dislike"
    get_action.short_description = 'Action'


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('get_comment_preview', 'user', 'article', 'parent', 'like_count', 'dislike_count', 'get_reply_count', 'created_at')
    list_filter = ('created_at', 'is_edited')
    search_fields = ('content', 'user__username', 'article__title')
    readonly_fields = ('like_count', 'dislike_count', 'is_edited', 'created_at', 'updated_at')
    ordering = ('-created_at',)
    
    def get_comment_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    get_comment_preview.short_description = 'Comment'
    
    def get_reply_count(self, obj):
        return obj.get_reply_count()
    get_reply_count.short_description = 'Replies'


@admin.register(CommentLike)
class CommentLikeAdmin(admin.ModelAdmin):
    list_display = ('comment', 'user', 'get_action', 'created_at')
    list_filter = ('is_like', 'created_at')
    search_fields = ('comment__content', 'user__username')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    
    def get_action(self, obj):
        return "👍 Like" if obj.is_like else "👎 Dislike"
    get_action.short_description = 'Action'


@admin.register(ApprovalHistory)
class ApprovalHistoryAdmin(admin.ModelAdmin):
    list_display = ('article', 'action', 'actor', 'get_reason_preview', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('article__title', 'actor__username', 'reason')
    readonly_fields = ('article', 'action', 'actor', 'reason', 'created_at')
    ordering = ('-created_at',)
    
    def get_reason_preview(self, obj):
        if obj.reason:
            return obj.reason[:50] + '...' if len(obj.reason) > 50 else obj.reason
        return '-'
    get_reason_preview.short_description = 'Reason'
    
    def has_add_permission(self, request):
        # Disable manual add (history created automatically)
        return False
    
    def has_change_permission(self, request, obj=None):
        # Make read-only
        return False
