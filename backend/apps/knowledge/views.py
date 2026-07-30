from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from django.contrib import messages
from django.http import JsonResponse, Http404
from django.db.models import Count, Q, Avg
from django.core.paginator import Paginator
from django.utils import timezone
from django.utils.text import slugify
from apps.manajemen.decorators import permission_required, permission_required_403
from apps.manajemen.helpers import check_permission
from .models import Category, Article, Tag, ArticleTag, Comment, Rating, ArticleLike, CommentLike, ArticleView
from .forms import CategoryForm, ArticleForm, TagForm, CommentForm, RatingForm, ArticleSearchForm
from .utils import get_client_ip

User = get_user_model()

# ============================================================================
# CATEGORY VIEWS
# ============================================================================

@login_required
@permission_required_403('knowledge', 'category', 'view')
def category_list(request):
    """
    List all categories with hierarchical structure
    """
    # Get search query
    search = request.GET.get('search', '')
    status_filter = request.GET.get('status', 'all')  # all, active, inactive
    
    # Base queryset
    categories = Category.objects.all()
    
    # Apply search
    if search:
        categories = categories.filter(
            Q(name__icontains=search) |
            Q(description__icontains=search)
        )
    
    # Apply status filter
    if status_filter == 'active':
        categories = categories.filter(is_active=True)
    elif status_filter == 'inactive':
        categories = categories.filter(is_active=False)
    
    # Annotate with article count
    categories = categories.annotate(
        article_count=Count('articles')
    ).order_by('order_index', 'name')
    
    # Separate parent and child categories
    parent_categories = categories.filter(parent__isnull=True)
    
    # Build hierarchical structure
    category_tree = []
    for parent in parent_categories:
        children = categories.filter(parent=parent)
        category_tree.append({
            'parent': parent,
            'children': children
        })
    
    context = {
        'category_tree': category_tree,
        'search': search,
        'status_filter': status_filter,
        'total_categories': categories.count(),
        'active_count': Category.objects.filter(is_active=True).count(),
        'inactive_count': Category.objects.filter(is_active=False).count(),
    }
    
    return render(request, 'knowledge/categories/list.html', context)


@login_required
@permission_required_403('knowledge', 'category', 'create')
def category_create(request):
    """
    Create new category
    """
    if request.method == 'POST':
        form = CategoryForm(request.POST)
        if form.is_valid():
            category = form.save()
            messages.success(request, f'Kategori "{category.name}" berhasil dibuat!')
            return redirect('knowledge:category_list')
    else:
        form = CategoryForm()
    
    context = {
        'form': form,
        'title': 'Tambah Kategori',
        'submit_text': 'Simpan',
    }
    
    return render(request, 'knowledge/categories/form.html', context)


@login_required
@permission_required_403('knowledge', 'category', 'edit')
def category_edit(request, pk):
    """
    Edit existing category
    """
    category = get_object_or_404(Category, pk=pk)
    
    if request.method == 'POST':
        form = CategoryForm(request.POST, instance=category)
        if form.is_valid():
            category = form.save()
            messages.success(request, f'Kategori "{category.name}" berhasil diupdate!')
            return redirect('knowledge:category_list')
    else:
        form = CategoryForm(instance=category)
    
    context = {
        'form': form,
        'category': category,
        'title': f'Edit Kategori: {category.name}',
        'submit_text': 'Update',
    }
    
    return render(request, 'knowledge/categories/form.html', context)


@login_required
@permission_required_403('knowledge', 'category', 'delete')
def category_delete(request, pk):
    """
    Delete category
    """
    category = get_object_or_404(Category, pk=pk)
    
    if request.method == 'POST':
        category_name = category.name
        
        # Check if category has children
        if category.children.exists():
            messages.error(
                request, 
                f'Kategori "{category_name}" tidak dapat dihapus karena memiliki sub-kategori!'
            )
            return redirect('knowledge:category_list')
        
        # Check if category has articles
        if category.articles.exists():
            messages.error(
                request, 
                f'Kategori "{category_name}" tidak dapat dihapus karena memiliki artikel!'
            )
            return redirect('knowledge:category_list')
        
        category.delete()
        messages.success(request, f'Kategori "{category_name}" berhasil dihapus!')
        return redirect('knowledge:category_list')
    
    context = {
        'category': category,
        'has_children': category.children.exists(),
        'has_articles': category.articles.exists(),
    }
    
    return render(request, 'knowledge/categories/confirm_delete.html', context)


@login_required
@permission_required_403('knowledge', 'category', 'edit')
def category_toggle_active(request, pk):
    """
    Toggle category active status (AJAX)
    """
    if request.method == 'POST':
        category = get_object_or_404(Category, pk=pk)
        category.is_active = not category.is_active
        category.save()
        
        return JsonResponse({
            'success': True,
            'is_active': category.is_active,
            'message': f'Kategori "{category.name}" berhasil {"diaktifkan" if category.is_active else "dinonaktifkan"}!'
        })
    
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)


# ============================================================================
# ARTICLE VIEWS
# ============================================================================

def article_list(request):
    """
    Public article list with search and filtering
    """
    form = ArticleSearchForm(request.GET)
    articles = Article.objects.filter(status='published').select_related('category', 'author')
    
    # Apply filters
    if form.is_valid():
        search = form.cleaned_data.get('search')
        category = form.cleaned_data.get('category')
        content_type = form.cleaned_data.get('content_type')
        ordering = form.cleaned_data.get('ordering') or '-published_at'
        
        if search:
            articles = articles.filter(
                Q(title__icontains=search) |
                Q(content__icontains=search) |
                Q(excerpt__icontains=search) |
                Q(article_tags__tag__name__icontains=search)
            ).distinct()
        
        if category:
            articles = articles.filter(category=category)
        
        if content_type:
            articles = articles.filter(content_type=content_type)
        
        articles = articles.order_by(ordering)
    else:
        articles = articles.order_by('-published_at')
    
    # Pagination
    paginator = Paginator(articles, 12)  # 12 articles per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Featured articles
    featured_articles = Article.objects.filter(
        status='published', 
        is_featured=True
    ).select_related('category', 'author')[:3]
    
    # Popular articles
    popular_articles = Article.objects.filter(
        status='published'
    ).order_by('-view_count')[:5]
    
    context = {
        'form': form,
        'page_obj': page_obj,
        'articles': page_obj.object_list,
        'featured_articles': featured_articles,
        'popular_articles': popular_articles,
        'title': 'Knowledge Base',
    }
    
    return render(request, 'knowledge/articles/list.html', context)


def article_detail(request, slug):
    """
    Public article detail with view tracking and interactions
    """
    article = get_object_or_404(
        Article.objects.select_related('category', 'author'),
        slug=slug,
        status='published'
    )
    
    # Track view (IP-based)
    ip_address = get_client_ip(request)
    article.increment_view_count(ip_address=ip_address, user=request.user if request.user.is_authenticated else None)
    
    # Get user's like/dislike status
    user_like_status = None
    if request.user.is_authenticated:
        try:
            user_like = ArticleLike.objects.get(article=article, user=request.user)
            user_like_status = 'like' if user_like.is_like else 'dislike'
        except ArticleLike.DoesNotExist:
            user_like_status = None
    
    # Get user's rating
    user_rating = None
    if request.user.is_authenticated:
        try:
            user_rating = Rating.objects.get(article=article, user=request.user)
        except Rating.DoesNotExist:
            pass
    
    # Get comments (top-level only, replies loaded via AJAX)
    comments = Comment.objects.filter(
        article=article,
        parent__isnull=True
    ).select_related('user').order_by('-created_at')
    
    # Get article tags
    tags = article.article_tags.all().select_related('tag')
    
    # Related articles
    related_articles = Article.objects.filter(
        status='published',
        category=article.category
    ).exclude(id=article.id).select_related('category', 'author')[:4]
    
    # Forms
    comment_form = CommentForm() if request.user.is_authenticated else None
    rating_form = RatingForm() if request.user.is_authenticated else None
    
    context = {
        'article': article,
        'tags': tags,
        'comments': comments,
        'related_articles': related_articles,
        'user_like_status': user_like_status,
        'user_rating': user_rating,
        'comment_form': comment_form,
        'rating_form': rating_form,
        'can_edit': request.user.is_authenticated and (
            article.author == request.user or 
            check_permission(request.user, 'knowledge', 'articles', 'edit')
        ),
        'can_delete': request.user.is_authenticated and (
            article.author == request.user or 
            check_permission(request.user, 'knowledge', 'articles', 'delete')
        ),
        'is_management_view': False,  # Flag to indicate this is public view
    }
    
    return render(request, 'knowledge/articles/detail.html', context)


@login_required
@permission_required_403('knowledge', 'articles', 'view')
def article_manage_detail(request, slug):
    """
    Article detail for management area (requires permission)
    Shows all articles including draft/pending, not just published
    """
    article = get_object_or_404(
        Article.objects.select_related('category', 'author'),
        slug=slug
    )
    
    # Check if user can view this article
    can_view_all = check_permission(request.user, 'knowledge', 'articles', 'edit')
    if not can_view_all and article.author != request.user:
        messages.error(request, 'Anda tidak memiliki akses untuk melihat artikel ini.')
        return redirect('knowledge:article_manage_list')
    
    # Track view (IP-based)
    ip_address = get_client_ip(request)
    article.increment_view_count(ip_address=ip_address, user=request.user)
    
    # Get user's like/dislike status
    user_like_status = None
    try:
        user_like = ArticleLike.objects.get(article=article, user=request.user)
        user_like_status = 'like' if user_like.is_like else 'dislike'
    except ArticleLike.DoesNotExist:
        user_like_status = None
    
    # Get user's rating
    user_rating = None
    try:
        user_rating = Rating.objects.get(article=article, user=request.user)
    except Rating.DoesNotExist:
        pass
    
    # Get comments (top-level only)
    comments = Comment.objects.filter(
        article=article,
        parent__isnull=True
    ).select_related('user').order_by('-created_at')
    
    # Get article tags
    tags = article.article_tags.all().select_related('tag')
    
    # Related articles (same category)
    related_articles = Article.objects.filter(
        category=article.category
    ).exclude(id=article.id).select_related('category', 'author')[:4]
    
    # Forms
    comment_form = CommentForm()
    rating_form = RatingForm()
    
    context = {
        'article': article,
        'tags': tags,
        'comments': comments,
        'related_articles': related_articles,
        'user_like_status': user_like_status,
        'user_rating': user_rating,
        'comment_form': comment_form,
        'rating_form': rating_form,
        'can_edit': article.author == request.user or check_permission(request.user, 'knowledge', 'articles', 'edit'),
        'can_delete': article.author == request.user or check_permission(request.user, 'knowledge', 'articles', 'delete'),
        'is_management_view': True,  # Flag to indicate this is management view
    }
    
    return render(request, 'knowledge/articles/detail.html', context)


@login_required
@permission_required('knowledge', 'articles', 'view')
def article_manage_list(request):
    """
    Article management list for authenticated users
    """
    form = ArticleSearchForm(request.GET)
    
    # Base queryset - show user's articles + published articles
    if check_permission(request.user, 'knowledge', 'articles', 'edit'):
        # Staff can see all articles
        articles = Article.objects.all()
    else:
        # Regular users see published + their own articles
        articles = Article.objects.filter(
            Q(status='published') | Q(author=request.user)
        )
    
    articles = articles.select_related('category', 'author')
    
    # Apply filters
    if form.is_valid():
        search = form.cleaned_data.get('search')
        category = form.cleaned_data.get('category')
        status = form.cleaned_data.get('status')
        content_type = form.cleaned_data.get('content_type')
        ordering = form.cleaned_data.get('ordering') or '-created_at'
        
        if search:
            articles = articles.filter(
                Q(title__icontains=search) |
                Q(content__icontains=search) |
                Q(excerpt__icontains=search)
            )
        
        if category:
            articles = articles.filter(category=category)
        
        if status:
            articles = articles.filter(status=status)
        
        if content_type:
            articles = articles.filter(content_type=content_type)
        
        articles = articles.order_by(ordering)
    else:
        articles = articles.order_by('-created_at')
    
    # Pagination
    paginator = Paginator(articles, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Statistics
    stats = {
        'total': articles.count(),
        'published': articles.filter(status='published').count(),
        'draft': articles.filter(status='draft').count(),
        'pending': articles.filter(status='pending').count(),
        'my_articles': articles.filter(author=request.user).count() if request.user.is_authenticated else 0,
    }
    
    context = {
        'form': form,
        'page_obj': page_obj,
        'articles': page_obj.object_list,
        'stats': stats,
        'title': 'Manajemen Artikel',
        'can_create': check_permission(request.user, 'knowledge', 'articles', 'create'),
        'can_approve': check_permission(request.user, 'knowledge', 'articles', 'approve'),
    }
    
    return render(request, 'knowledge/articles/manage_list.html', context)


@login_required
@permission_required('knowledge', 'articles', 'create')
def article_create(request):
    """
    Create new article
    """
    if request.method == 'POST':
        form = ArticleForm(request.POST, request.FILES, user=request.user)
        if form.is_valid():
            # Check if title already exists (before save)
            title = form.cleaned_data.get('title')
            slug_from_title = slugify(title)
            
            # Check for duplicate slug
            if Article.objects.filter(slug=slug_from_title).exists():
                # Count how many similar slugs exist
                similar_count = Article.objects.filter(slug__startswith=slug_from_title).count()
                messages.warning(
                    request, 
                    f'⚠️ Artikel dengan judul serupa sudah ada ({similar_count} artikel). '
                    f'Slug akan otomatis disesuaikan menjadi "{slug_from_title}-{similar_count}".'
                )
            
            article = form.save()
            
            # Show success message with actual slug
            if article.slug != slug_from_title:
                messages.success(
                    request, 
                    f'✅ Artikel "{article.title}" berhasil dibuat dengan slug: {article.slug}'
                )
            else:
                messages.success(request, f'✅ Artikel "{article.title}" berhasil dibuat!')
            
            # Redirect based on status
            if article.status == 'pending':
                messages.info(request, 'Artikel telah disubmit untuk approval.')
                return redirect('knowledge:article_manage_list')
            else:
                return redirect('knowledge:article_manage_detail', slug=article.slug)
    else:
        form = ArticleForm(user=request.user)
    
    context = {
        'form': form,
        'title': 'Buat Artikel Baru',
        'submit_text': 'Simpan Artikel',
    }
    
    return render(request, 'knowledge/articles/form.html', context)


@login_required
def article_edit(request, slug):
    """
    Edit existing article (author or staff only)
    """
    article = get_object_or_404(Article, slug=slug)
    
    # Check permission
    if not (article.author == request.user or check_permission(request.user, 'knowledge', 'articles', 'edit')):
        messages.error(request, 'Anda tidak memiliki izin untuk mengedit artikel ini.')
        return redirect('knowledge:article_detail', slug=slug)
    
    if request.method == 'POST':
        form = ArticleForm(request.POST, request.FILES, instance=article, user=request.user)
        if form.is_valid():
            article = form.save()
            messages.success(request, f'Artikel "{article.title}" berhasil diupdate!')
            return redirect('knowledge:article_detail', slug=article.slug)
    else:
        form = ArticleForm(instance=article, user=request.user)
    
    context = {
        'form': form,
        'article': article,
        'title': f'Edit Artikel: {article.title}',
        'submit_text': 'Update Artikel',
    }
    
    return render(request, 'knowledge/articles/form.html', context)


@login_required
def article_delete(request, slug):
    """
    Delete article (author or staff only)
    """
    article = get_object_or_404(Article, slug=slug)
    
    # Check permission
    if not (article.author == request.user or check_permission(request.user, 'knowledge', 'articles', 'delete')):
        messages.error(request, 'Anda tidak memiliki izin untuk menghapus artikel ini.')
        return redirect('knowledge:article_detail', slug=slug)
    
    if request.method == 'POST':
        article_title = article.title
        article.delete()
        messages.success(request, f'Artikel "{article_title}" berhasil dihapus!')
        return redirect('knowledge:article_manage_list')
    
    context = {
        'article': article,
    }
    
    return render(request, 'knowledge/articles/confirm_delete.html', context)


# ============================================================================
# ARTICLE INTERACTION VIEWS
# ============================================================================

@login_required
def article_like(request, slug):
    """
    Like/unlike article (AJAX)
    """
    if request.method == 'POST':
        article = get_object_or_404(Article, slug=slug)
        
        like_obj, created = ArticleLike.objects.get_or_create(
            article=article,
            user=request.user,
            defaults={'is_like': True}
        )
        
        if not created:
            if like_obj.is_like:
                # Already liked, remove like
                like_obj.delete()
                action = 'removed'
            else:
                # Was dislike, change to like
                like_obj.is_like = True
                like_obj.save()
                action = 'liked'
        else:
            action = 'liked'
        
        # Refresh article to get updated counts
        article.refresh_from_db()
        
        return JsonResponse({
            'success': True,
            'action': action,
            'like_count': article.like_count,
            'dislike_count': article.dislike_count,
            'like_percentage': article.get_like_percentage(),
        })
    
    return JsonResponse({'success': False}, status=400)


@login_required
def article_dislike(request, slug):
    """
    Dislike/undislike article (AJAX)
    """
    if request.method == 'POST':
        article = get_object_or_404(Article, slug=slug)
        
        like_obj, created = ArticleLike.objects.get_or_create(
            article=article,
            user=request.user,
            defaults={'is_like': False}
        )
        
        if not created:
            if not like_obj.is_like:
                # Already disliked, remove dislike
                like_obj.delete()
                action = 'removed'
            else:
                # Was like, change to dislike
                like_obj.is_like = False
                like_obj.save()
                action = 'disliked'
        else:
            action = 'disliked'
        
        # Refresh article to get updated counts
        article.refresh_from_db()
        
        return JsonResponse({
            'success': True,
            'action': action,
            'like_count': article.like_count,
            'dislike_count': article.dislike_count,
            'like_percentage': article.get_like_percentage(),
        })
    
    return JsonResponse({'success': False}, status=400)


@login_required
def article_rate(request, slug):
    """
    Rate article (AJAX)
    """
    if request.method == 'POST':
        article = get_object_or_404(Article, slug=slug)
        form = RatingForm(request.POST, user=request.user, article=article)
        
        if form.is_valid():
            # Check if user already rated
            existing_rating = Rating.objects.filter(article=article, user=request.user).first()
            if existing_rating:
                # Update existing rating
                existing_rating.rating = form.cleaned_data['rating']
                existing_rating.feedback = form.cleaned_data['feedback']
                existing_rating.save()
                action = 'updated'
            else:
                # Create new rating
                form.save()
                action = 'created'
            
            # Refresh article to get updated rating
            article.refresh_from_db()
            
            return JsonResponse({
                'success': True,
                'action': action,
                'rating_avg': float(article.rating_avg),
                'rating_count': article.rating_count,
            })
        else:
            return JsonResponse({
                'success': False,
                'errors': form.errors
            }, status=400)
    
    return JsonResponse({'success': False}, status=400)


@login_required
def article_comment(request, slug):
    """
    Add comment to article (AJAX)
    """
    if request.method == 'POST':
        article = get_object_or_404(Article, slug=slug)
        parent_id = request.POST.get('parent_id')
        parent = None
        
        if parent_id:
            parent = get_object_or_404(Comment, id=parent_id, article=article)
        
        form = CommentForm(request.POST, user=request.user, article=article, parent=parent)
        
        if form.is_valid():
            comment = form.save()
            
            return JsonResponse({
                'success': True,
                'comment': {
                    'id': comment.id,
                    'content': comment.content,
                    'user_name': comment.user.get_full_name() or comment.user.username,
                    'created_at': comment.created_at.strftime('%d %b %Y %H:%M'),
                    'parent_id': comment.parent.id if comment.parent else None,
                }
            })
        else:
            return JsonResponse({
                'success': False,
                'errors': form.errors
            }, status=400)
    
    return JsonResponse({'success': False}, status=400)


# ============================================================================
# TAG VIEWS
# ============================================================================

def tag_list(request):
    """
    Public tag list
    """
    search = request.GET.get('search', '')
    
    # Menggunakan relasi many-to-many yang benar tanpa filter status dulu
    tags = Tag.objects.annotate(
        article_count=Count('articles')
    ).filter(article_count__gt=0)
    
    if search:
        tags = tags.filter(name__icontains=search)
    
    tags = tags.order_by('-article_count', 'name')
    
    # Pagination
    paginator = Paginator(tags, 24)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'tags': page_obj.object_list,
        'search': search,
        'title': 'Daftar Tag',
    }
    
    return render(request, 'knowledge/tags/list.html', context)


def tag_detail(request, slug):
    """
    Public tag detail with articles
    """
    tag = get_object_or_404(Tag, slug=slug)
    
    # Get articles with this tag
    articles = Article.objects.filter(
        article_tags__tag=tag,
        status='published'
    ).select_related('category', 'author').order_by('-published_at')
    
    # Pagination
    paginator = Paginator(articles, 12)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'tag': tag,
        'page_obj': page_obj,
        'articles': page_obj.object_list,
        'title': f'Tag: {tag.name}',
    }
    
    return render(request, 'knowledge/tags/detail.html', context)


@login_required
@permission_required('knowledge', 'tags', 'view')
def tag_manage_list(request):
    """
    Tag management list
    """
    search = request.GET.get('search', '')
    
    tags = Tag.objects.annotate(
        article_count=Count('articles')
    )
    
    if search:
        tags = tags.filter(
            Q(name__icontains=search) |
            Q(slug__icontains=search)
        )
    
    tags = tags.order_by('-article_count', 'name')
    
    # Statistics
    total_tags = Tag.objects.count()
    active_tags = Tag.objects.filter(is_active=True).count()
    total_articles = Article.objects.filter(status='published').count()
    avg_articles_per_tag = total_articles / total_tags if total_tags > 0 else 0
    
    # Pagination
    paginator = Paginator(tags, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'tags': page_obj.object_list,
        'search': search,
        'title': 'Manajemen Tag',
        'can_create': check_permission(request.user, 'knowledge', 'tags', 'create'),
        'total_tags': total_tags,
        'active_tags': active_tags,
        'total_articles': total_articles,
        'avg_articles_per_tag': avg_articles_per_tag,
    }
    
    return render(request, 'knowledge/tags/manage_list.html', context)


@login_required
@permission_required('knowledge', 'tags', 'create')
def tag_create(request):
    """
    Create new tag
    """
    if request.method == 'POST':
        form = TagForm(request.POST)
        if form.is_valid():
            tag = form.save()
            messages.success(request, f'Tag "{tag.name}" berhasil dibuat!')
            return redirect('knowledge:tag_manage_list')
    else:
        form = TagForm()
    
    context = {
        'form': form,
        'title': 'Tambah Tag',
        'submit_text': 'Simpan',
    }
    
    return render(request, 'knowledge/tags/form.html', context)


@login_required
@permission_required('knowledge', 'tags', 'edit')
def tag_edit(request, pk):
    """
    Edit existing tag
    """
    tag = get_object_or_404(Tag, pk=pk)
    
    if request.method == 'POST':
        form = TagForm(request.POST, instance=tag)
        if form.is_valid():
            tag = form.save()
            messages.success(request, f'Tag "{tag.name}" berhasil diupdate!')
            return redirect('knowledge:tag_manage_list')
    else:
        form = TagForm(instance=tag)
    
    context = {
        'form': form,
        'tag': tag,
        'title': f'Edit Tag: {tag.name}',
        'submit_text': 'Update',
    }
    
    return render(request, 'knowledge/tags/form.html', context)


@login_required
@permission_required('knowledge', 'tags', 'delete')
def tag_delete(request, pk):
    """
    Delete tag
    """
    tag = get_object_or_404(Tag, pk=pk)
    
    if request.method == 'POST':
        tag_name = tag.name
        
        # Check if tag has articles
        if tag.articles.exists():
            messages.error(
                request, 
                f'Tag "{tag_name}" tidak dapat dihapus karena masih digunakan oleh artikel!'
            )
            return redirect('knowledge:tag_manage_list')
        
        tag.delete()
        messages.success(request, f'Tag "{tag_name}" berhasil dihapus!')
        return redirect('knowledge:tag_manage_list')
    
    context = {
        'tag': tag,
        'has_articles': tag.articles.exists(),
        'article_count': tag.articles.count(),
    }
    
    return render(request, 'knowledge/tags/confirm_delete.html', context)


# ============================================================================
# COMMENT MANAGEMENT VIEWS
# ============================================================================

@login_required
@permission_required('knowledge', 'comments', 'view')
def comment_manage_list(request):
    """
    Comment management list for moderators
    """
    search = request.GET.get('search', '')
    article_filter = request.GET.get('article', '')
    status_filter = request.GET.get('status', 'all')  # all, active, reported
    
    # Base queryset - Only show top-level comments (parent__isnull=True)
    comments = Comment.objects.filter(parent__isnull=True).select_related('user', 'article', 'parent')
    
    # Apply search
    if search:
        comments = comments.filter(
            Q(content__icontains=search) |
            Q(user__username__icontains=search) |
            Q(article__title__icontains=search)
        )
    
    # Apply article filter
    if article_filter:
        comments = comments.filter(article__slug=article_filter)
    
    # Apply status filter (for future use when we add moderation)
    # For now, we'll just show all comments
    
    comments = comments.order_by('-created_at')
    
    # Pagination
    paginator = Paginator(comments, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Statistics
    stats = {
        'total': Comment.objects.count(),
        'today': Comment.objects.filter(created_at__date=timezone.now().date()).count(),
        'this_week': Comment.objects.filter(created_at__gte=timezone.now() - timezone.timedelta(days=7)).count(),
        'top_level': Comment.objects.filter(parent__isnull=True).count(),
        'replies': Comment.objects.filter(parent__isnull=False).count(),
    }
    
    # Recent articles with comments
    recent_articles = Article.objects.filter(
        comments__isnull=False,
        status='published'
    ).annotate(
        comment_count=Count('comments')
    ).order_by('-comment_count')[:10]
    
    context = {
        'page_obj': page_obj,
        'comments': page_obj.object_list,
        'search': search,
        'article_filter': article_filter,
        'status_filter': status_filter,
        'stats': stats,
        'recent_articles': recent_articles,
        'title': 'Manajemen Komentar',
        'can_edit': check_permission(request.user, 'knowledge', 'comments', 'edit'),
        'can_delete': check_permission(request.user, 'knowledge', 'comments', 'delete'),
    }
    
    return render(request, 'knowledge/comments/manage_list.html', context)


@login_required
@permission_required('knowledge', 'comments', 'edit')
def comment_edit(request, pk):
    """
    Edit comment (moderation)
    """
    comment = get_object_or_404(Comment, pk=pk)
    
    if request.method == 'POST':
        form = CommentForm(request.POST, instance=comment)
        if form.is_valid():
            comment = form.save()
            messages.success(request, f'Komentar berhasil diupdate!')
            return redirect('knowledge:comment_manage_list')
    else:
        form = CommentForm(instance=comment)
    
    context = {
        'form': form,
        'comment': comment,
        'title': f'Edit Komentar',
        'submit_text': 'Update Komentar',
    }
    
    return render(request, 'knowledge/comments/form.html', context)


@login_required
@permission_required('knowledge', 'comments', 'delete')
def comment_delete(request, pk):
    """
    Delete comment
    """
    comment = get_object_or_404(Comment, pk=pk)
    
    if request.method == 'POST':
        article_title = comment.article.title
        comment_preview = comment.content[:50] + '...' if len(comment.content) > 50 else comment.content
        comment.delete()
        messages.success(request, f'Komentar "{comment_preview}" berhasil dihapus!')
        return redirect('knowledge:comment_manage_list')
    
    context = {
        'comment': comment,
        'has_replies': comment.replies.exists(),
        'reply_count': comment.replies.count(),
    }
    
    return render(request, 'knowledge/comments/confirm_delete.html', context)


@login_required
@permission_required('knowledge', 'comments', 'moderate')
def comment_toggle_active(request, pk):
    """
    Toggle comment active status (for moderation)
    """
    if request.method == 'POST':
        comment = get_object_or_404(Comment, pk=pk)
        
        # For now, we'll use a simple flag. In the future, we can add is_active field to Comment model
        # For demonstration, we'll just return success
        
        return JsonResponse({
            'success': True,
            'message': f'Status komentar berhasil diubah!'
        })
    
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)


# ============================================================================


# ============================================================================
# COMMENT INTERACTION VIEWS
# ============================================================================

@login_required
def comment_like(request, pk):
    """
    Like/unlike comment (AJAX)
    """
    if request.method == 'POST':
        comment = get_object_or_404(Comment, pk=pk)
        
        like_obj, created = CommentLike.objects.get_or_create(
            comment=comment,
            user=request.user,
            defaults={'is_like': True}
        )
        
        if not created:
            if like_obj.is_like:
                # Already liked, remove like
                like_obj.delete()
                action = 'removed'
            else:
                # Was dislike, change to like
                like_obj.is_like = True
                like_obj.save()
                action = 'liked'
        else:
            action = 'liked'
        
        # Refresh comment to get updated counts
        comment.refresh_from_db()
        
        return JsonResponse({
            'success': True,
            'action': action,
            'like_count': comment.like_count,
            'dislike_count': comment.dislike_count,
            'like_percentage': comment.get_like_percentage(),
        })
    
    return JsonResponse({'success': False}, status=400)


@login_required
def comment_dislike(request, pk):
    """
    Dislike/undislike comment (AJAX)
    """
    if request.method == 'POST':
        comment = get_object_or_404(Comment, pk=pk)
        
        like_obj, created = CommentLike.objects.get_or_create(
            comment=comment,
            user=request.user,
            defaults={'is_like': False}
        )
        
        if not created:
            if not like_obj.is_like:
                # Already disliked, remove dislike
                like_obj.delete()
                action = 'removed'
            else:
                # Was like, change to dislike
                like_obj.is_like = False
                like_obj.save()
                action = 'disliked'
        else:
            action = 'disliked'
        
        # Refresh comment to get updated counts
        comment.refresh_from_db()
        
        return JsonResponse({
            'success': True,
            'action': action,
            'like_count': comment.like_count,
            'dislike_count': comment.dislike_count,
            'like_percentage': comment.get_like_percentage(),
        })
    
    return JsonResponse({'success': False}, status=400)


@login_required
def comment_reply(request, pk):
    """
    Reply to a comment (AJAX)
    Limited to 2 levels: Only top-level comments can be replied to
    """
    if request.method == 'POST':
        parent_comment = get_object_or_404(Comment, pk=pk)
        content = request.POST.get('content', '').strip()
        
        if not content:
            return JsonResponse({
                'success': False,
                'error': 'Konten reply tidak boleh kosong'
            }, status=400)
        
        # Check if parent is already a reply (level 1)
        # If yes, reply to its parent instead (keep it at level 1)
        if parent_comment.parent:
            # This is a reply to a reply, so reply to the original parent
            actual_parent = parent_comment.parent
        else:
            # This is a reply to a top-level comment
            actual_parent = parent_comment
        
        # Create reply
        reply = Comment.objects.create(
            article=actual_parent.article,
            user=request.user,
            parent=actual_parent,
            content=content
        )
        
        return JsonResponse({
            'success': True,
            'reply': {
                'id': reply.id,
                'content': reply.content,
                'user_name': reply.user.get_full_name() or reply.user.username,
                'user_initial': reply.user.get_full_name()[0] if reply.user.get_full_name() else reply.user.username[0],
                'created_at': reply.created_at.strftime('%d %b %Y %H:%M'),
                'parent_id': reply.parent.id,
                'like_count': reply.like_count,
                'dislike_count': reply.dislike_count,
            }
        })
    
    return JsonResponse({'success': False}, status=400)


# ============================================================================
# ARTICLE LIKES MANAGEMENT VIEWS
# ============================================================================

@login_required
@permission_required_403('knowledge', 'article_like', 'view')
def article_like_manage_list(request):
    """
    Manage article likes/dislikes - List, filter, moderation, statistics
    """
    # Get filter parameters
    search = request.GET.get('search', '')
    article_id = request.GET.get('article', '')
    user_id = request.GET.get('user', '')
    action_filter = request.GET.get('action', 'all')  # all, like, dislike
    date_from = request.GET.get('date_from', '')
    date_to = request.GET.get('date_to', '')
    
    # Base queryset
    likes = ArticleLike.objects.select_related('article', 'user').all()
    
    # Apply search (article title or username)
    if search:
        likes = likes.filter(
            Q(article__title__icontains=search) |
            Q(user__username__icontains=search) |
            Q(user__first_name__icontains=search) |
            Q(user__last_name__icontains=search)
        )
    
    # Filter by article
    if article_id:
        likes = likes.filter(article_id=article_id)
    
    # Filter by user
    if user_id:
        likes = likes.filter(user_id=user_id)
    
    # Filter by action (like/dislike)
    if action_filter == 'like':
        likes = likes.filter(is_like=True)
    elif action_filter == 'dislike':
        likes = likes.filter(is_like=False)
    
    # Filter by date range
    if date_from:
        likes = likes.filter(created_at__gte=date_from)
    if date_to:
        likes = likes.filter(created_at__lte=date_to)
    
    # Order by newest first
    likes = likes.order_by('-created_at')
    
    # Statistics
    total_likes = ArticleLike.objects.filter(is_like=True).count()
    total_dislikes = ArticleLike.objects.filter(is_like=False).count()
    total_engagement = total_likes + total_dislikes
    like_percentage = (total_likes / total_engagement * 100) if total_engagement > 0 else 0
    
    # Most active users (top 10)
    most_active_users = ArticleLike.objects.values(
        'user__username', 'user__name'
    ).annotate(
        total_actions=Count('id')
    ).order_by('-total_actions')[:10]
    
    # Most liked articles (top 10)
    most_liked_articles = Article.objects.annotate(
        like_count_calc=Count('likes', filter=Q(likes__is_like=True))
    ).order_by('-like_count_calc')[:10]
    
    # Pagination
    paginator = Paginator(likes, 25)
    page = request.GET.get('page')
    likes_page = paginator.get_page(page)
    
    # Get all articles for filter dropdown
    articles = Article.objects.filter(status='published').order_by('-created_at')[:50]
    
    context = {
        'likes': likes_page,
        'articles': articles,
        'search': search,
        'article_id': article_id,
        'user_id': user_id,
        'action_filter': action_filter,
        'date_from': date_from,
        'date_to': date_to,
        'total_likes': total_likes,
        'total_dislikes': total_dislikes,
        'total_engagement': total_engagement,
        'like_percentage': round(like_percentage, 1),
        'most_active_users': most_active_users,
        'most_liked_articles': most_liked_articles,
        'title': 'Manage Article Likes/Dislikes',
    }
    
    return render(request, 'knowledge/likes/article_likes_list.html', context)


@login_required
@permission_required_403('knowledge', 'article_like', 'delete')
def article_like_delete(request, pk):
    """
    Delete specific article like/dislike
    """
    like = get_object_or_404(ArticleLike, pk=pk)
    article_title = like.article.title
    action = "like" if like.is_like else "dislike"
    
    if request.method == 'POST':
        like.delete()
        messages.success(request, f'{action.capitalize()} untuk artikel "{article_title}" berhasil dihapus!')
        return redirect('knowledge:article_like_manage_list')
    
    context = {
        'like': like,
        'action': action,
        'title': f'Hapus {action.capitalize()}',
    }
    
    return render(request, 'knowledge/likes/article_like_delete.html', context)


@login_required
@permission_required_403('knowledge', 'article_like', 'delete')
def article_like_bulk_delete(request):
    """
    Bulk delete article likes/dislikes (AJAX)
    """
    if request.method == 'POST':
        like_ids = request.POST.getlist('like_ids[]')
        
        if not like_ids:
            return JsonResponse({
                'success': False,
                'error': 'Tidak ada item yang dipilih'
            }, status=400)
        
        deleted_count = ArticleLike.objects.filter(id__in=like_ids).delete()[0]
        
        return JsonResponse({
            'success': True,
            'deleted_count': deleted_count,
            'message': f'{deleted_count} item berhasil dihapus'
        })
    
    return JsonResponse({'success': False}, status=400)


# ============================================================================
# COMMENT LIKES MANAGEMENT VIEWS
# ============================================================================

@login_required
@permission_required_403('knowledge', 'comment_like', 'view')
def comment_like_manage_list(request):
    """
    Manage comment likes/dislikes - List, filter, moderation, spam detection
    """
    # Get filter parameters
    search = request.GET.get('search', '')
    article_id = request.GET.get('article', '')
    comment_id = request.GET.get('comment', '')
    user_id = request.GET.get('user', '')
    action_filter = request.GET.get('action', 'all')  # all, like, dislike
    date_from = request.GET.get('date_from', '')
    date_to = request.GET.get('date_to', '')
    
    # Base queryset
    likes = CommentLike.objects.select_related('comment', 'comment__article', 'user').all()
    
    # Apply search (comment content, article title, or username)
    if search:
        likes = likes.filter(
            Q(comment__content__icontains=search) |
            Q(comment__article__title__icontains=search) |
            Q(user__username__icontains=search) |
            Q(user__name__icontains=search)
        )
    
    # Filter by article
    if article_id:
        likes = likes.filter(comment__article_id=article_id)
    
    # Filter by comment
    if comment_id:
        likes = likes.filter(comment_id=comment_id)
    
    # Filter by user
    if user_id:
        likes = likes.filter(user_id=user_id)
    
    # Filter by action (like/dislike)
    if action_filter == 'like':
        likes = likes.filter(is_like=True)
    elif action_filter == 'dislike':
        likes = likes.filter(is_like=False)
    
    # Filter by date range
    if date_from:
        likes = likes.filter(created_at__gte=date_from)
    if date_to:
        likes = likes.filter(created_at__lte=date_to)
    
    # Order by newest first
    likes = likes.order_by('-created_at')
    
    # Statistics
    total_likes = CommentLike.objects.filter(is_like=True).count()
    total_dislikes = CommentLike.objects.filter(is_like=False).count()
    total_engagement = total_likes + total_dislikes
    like_percentage = (total_likes / total_engagement * 100) if total_engagement > 0 else 0
    
    # Most active users (top 10)
    most_active_users = CommentLike.objects.values(
        'user__username', 'user__name'
    ).annotate(
        total_actions=Count('id')
    ).order_by('-total_actions')[:10]
    
    # Most liked comments (top 10)
    most_liked_comments = Comment.objects.annotate(
        like_count_calc=Count('comment_likes', filter=Q(comment_likes__is_like=True))
    ).order_by('-like_count_calc')[:10]
    
    # Suspicious activity detection (users with > 50 actions in last 24 hours)
    from datetime import timedelta
    yesterday = timezone.now() - timedelta(days=1)
    suspicious_users = CommentLike.objects.filter(
        created_at__gte=yesterday
    ).values(
        'user__username', 'user__id'
    ).annotate(
        action_count=Count('id')
    ).filter(action_count__gt=50).order_by('-action_count')
    
    # Pagination
    paginator = Paginator(likes, 25)
    page = request.GET.get('page')
    likes_page = paginator.get_page(page)
    
    # Get all articles for filter dropdown
    articles = Article.objects.filter(status='published').order_by('-created_at')[:50]
    
    context = {
        'likes': likes_page,
        'articles': articles,
        'search': search,
        'article_id': article_id,
        'comment_id': comment_id,
        'user_id': user_id,
        'action_filter': action_filter,
        'date_from': date_from,
        'date_to': date_to,
        'total_likes': total_likes,
        'total_dislikes': total_dislikes,
        'total_engagement': total_engagement,
        'like_percentage': round(like_percentage, 1),
        'most_active_users': most_active_users,
        'most_liked_comments': most_liked_comments,
        'suspicious_users': suspicious_users,
        'title': 'Manage Comment Likes/Dislikes',
    }
    
    return render(request, 'knowledge/likes/comment_likes_list.html', context)


@login_required
@permission_required_403('knowledge', 'comment_like', 'delete')
def comment_like_delete(request, pk):
    """
    Delete specific comment like/dislike
    """
    like = get_object_or_404(CommentLike, pk=pk)
    comment_preview = like.comment.content[:50]
    action = "like" if like.is_like else "dislike"
    
    if request.method == 'POST':
        like.delete()
        messages.success(request, f'{action.capitalize()} untuk komentar "{comment_preview}..." berhasil dihapus!')
        return redirect('knowledge:comment_like_manage_list')
    
    context = {
        'like': like,
        'action': action,
        'comment_preview': comment_preview,
        'title': f'Hapus {action.capitalize()}',
    }
    
    return render(request, 'knowledge/likes/comment_like_delete.html', context)


@login_required
@permission_required_403('knowledge', 'comment_like', 'delete')
def comment_like_bulk_delete(request):
    """
    Bulk delete comment likes/dislikes (AJAX)
    """
    if request.method == 'POST':
        like_ids = request.POST.getlist('like_ids[]')
        
        if not like_ids:
            return JsonResponse({
                'success': False,
                'error': 'Tidak ada item yang dipilih'
            }, status=400)
        
        deleted_count = CommentLike.objects.filter(id__in=like_ids).delete()[0]
        
        return JsonResponse({
            'success': True,
            'deleted_count': deleted_count,
            'message': f'{deleted_count} item berhasil dihapus'
        })
    
    return JsonResponse({'success': False}, status=400)


# ============================================================================
# RATINGS MANAGEMENT VIEWS
# ============================================================================

@login_required
@permission_required_403('knowledge', 'rating', 'view')
def rating_manage_list(request):
    """
    Manage article ratings - List, filter, moderation, statistics
    """
    # Get filter parameters
    search = request.GET.get('search', '')
    article_id = request.GET.get('article', '')
    user_id = request.GET.get('user', '')
    rating_value = request.GET.get('rating', '')  # 1-5
    has_feedback = request.GET.get('has_feedback', '')  # yes, no, all
    date_from = request.GET.get('date_from', '')
    date_to = request.GET.get('date_to', '')
    
    # Base queryset
    ratings = Rating.objects.select_related('article', 'user').all()
    
    # Apply search (article title or username)
    if search:
        ratings = ratings.filter(
            Q(article__title__icontains=search) |
            Q(user__username__icontains=search) |
            Q(user__name__icontains=search) |
            Q(feedback__icontains=search)
        )
    
    # Filter by article
    if article_id:
        ratings = ratings.filter(article_id=article_id)
    
    # Filter by user
    if user_id:
        ratings = ratings.filter(user_id=user_id)
    
    # Filter by rating value (1-5)
    if rating_value:
        ratings = ratings.filter(rating=rating_value)
    
    # Filter by has feedback
    if has_feedback == 'yes':
        ratings = ratings.exclude(feedback='').exclude(feedback__isnull=True)
    elif has_feedback == 'no':
        ratings = ratings.filter(Q(feedback='') | Q(feedback__isnull=True))
    
    # Filter by date range
    if date_from:
        ratings = ratings.filter(created_at__gte=date_from)
    if date_to:
        ratings = ratings.filter(created_at__lte=date_to)
    
    # Order by newest first
    ratings = ratings.order_by('-created_at')
    
    # Statistics
    total_ratings = Rating.objects.count()
    avg_rating = Rating.objects.aggregate(avg=Avg('rating'))['avg'] or 0
    
    # Rating distribution (1-5 stars)
    rating_distribution = {}
    for i in range(1, 6):
        rating_distribution[i] = Rating.objects.filter(rating=i).count()
    
    # Ratings with feedback
    with_feedback = Rating.objects.exclude(feedback='').exclude(feedback__isnull=True).count()
    without_feedback = total_ratings - with_feedback
    
    # Most active raters (top 10)
    most_active_raters = Rating.objects.values(
        'user__username', 'user__name'
    ).annotate(
        total_ratings=Count('id'),
        avg_rating_given=Avg('rating')
    ).order_by('-total_ratings')[:10]
    
    # Most rated articles (top 10)
    most_rated_articles = Article.objects.annotate(
        rating_count_calc=Count('ratings'),
        avg_rating_calc=Avg('ratings__rating')
    ).filter(rating_count_calc__gt=0).order_by('-rating_count_calc')[:10]
    
    # Pagination
    paginator = Paginator(ratings, 25)
    page = request.GET.get('page')
    ratings_page = paginator.get_page(page)
    
    # Get all articles for filter dropdown
    articles = Article.objects.filter(status='published').order_by('-created_at')[:50]
    
    context = {
        'ratings': ratings_page,
        'articles': articles,
        'search': search,
        'article_id': article_id,
        'user_id': user_id,
        'rating_value': rating_value,
        'has_feedback': has_feedback,
        'date_from': date_from,
        'date_to': date_to,
        'total_ratings': total_ratings,
        'avg_rating': round(avg_rating, 1),
        'rating_distribution': rating_distribution,
        'with_feedback': with_feedback,
        'without_feedback': without_feedback,
        'most_active_raters': most_active_raters,
        'most_rated_articles': most_rated_articles,
        'title': 'Kelola Rating Artikel',
    }
    
    return render(request, 'knowledge/ratings/rating_list.html', context)


@login_required
@permission_required_403('knowledge', 'rating', 'delete')
def rating_delete(request, pk):
    """
    Delete specific rating
    """
    rating = get_object_or_404(Rating, pk=pk)
    article_title = rating.article.title
    rating_value = rating.rating
    
    if request.method == 'POST':
        rating.delete()
        messages.success(request, f'Rating {rating_value} bintang untuk artikel "{article_title}" berhasil dihapus!')
        return redirect('knowledge:rating_manage_list')
    
    context = {
        'rating': rating,
        'title': 'Hapus Rating',
    }
    
    return render(request, 'knowledge/ratings/rating_delete.html', context)


@login_required
@permission_required_403('knowledge', 'rating', 'delete')
def rating_bulk_delete(request):
    """
    Bulk delete ratings (AJAX)
    """
    if request.method == 'POST':
        rating_ids = request.POST.getlist('rating_ids[]')
        
        if not rating_ids:
            return JsonResponse({
                'success': False,
                'error': 'Tidak ada item yang dipilih'
            }, status=400)
        
        deleted_count = Rating.objects.filter(id__in=rating_ids).delete()[0]
        
        return JsonResponse({
            'success': True,
            'deleted_count': deleted_count,
            'message': f'{deleted_count} rating berhasil dihapus'
        })
    
    return JsonResponse({'success': False}, status=400)


# ============================================================================
# VIEWS MANAGEMENT
# ============================================================================

@login_required
@permission_required_403('knowledge', 'view', 'view')
def view_manage_list(request):
    """
    List and manage article views with analytics
    """
    from django.db.models import Count, Q
    from django.db.models.functions import TruncDate
    from datetime import datetime, timedelta
    
    # Get filter parameters
    article_id = request.GET.get('article')
    user_id = request.GET.get('user')
    ip_address = request.GET.get('ip')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    search = request.GET.get('search', '').strip()
    
    # Base queryset
    views = ArticleView.objects.select_related('article', 'user').all()
    
    # Apply filters
    if article_id:
        views = views.filter(article_id=article_id)
    
    if user_id:
        views = views.filter(user_id=user_id)
    
    if ip_address:
        views = views.filter(ip_address__icontains=ip_address)
    
    if date_from:
        try:
            date_from_obj = datetime.strptime(date_from, '%Y-%m-%d')
            views = views.filter(viewed_at__gte=date_from_obj)
        except ValueError:
            pass
    
    if date_to:
        try:
            date_to_obj = datetime.strptime(date_to, '%Y-%m-%d')
            # Add 1 day to include the entire end date
            date_to_obj = date_to_obj + timedelta(days=1)
            views = views.filter(viewed_at__lt=date_to_obj)
        except ValueError:
            pass
    
    if search:
        views = views.filter(
            Q(article__title__icontains=search) |
            Q(user__name__icontains=search) |
            Q(ip_address__icontains=search)
        )
    
    # Statistics
    total_views = views.count()
    unique_ips = views.values('ip_address').distinct().count()
    unique_users = views.filter(user__isnull=False).values('user').distinct().count()
    anonymous_views = views.filter(user__isnull=True).count()
    
    # Views per day (last 30 days)
    thirty_days_ago = timezone.now() - timedelta(days=30)
    views_per_day = views.filter(viewed_at__gte=thirty_days_ago).annotate(
        date=TruncDate('viewed_at')
    ).values('date').annotate(
        count=Count('id')
    ).order_by('date')
    
    # Most active IPs
    top_ips = views.values('ip_address').annotate(
        view_count=Count('id')
    ).order_by('-view_count')[:10]
    
    # Most viewed articles
    top_articles = views.values(
        'article__id',
        'article__title',
        'article__slug'
    ).annotate(
        view_count=Count('id')
    ).order_by('-view_count')[:10]
    
    # Pagination
    paginator = Paginator(views, 50)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Get all articles for filter dropdown
    articles = Article.objects.filter(status='published').order_by('title')
    
    # Get all users who have viewed articles
    users = User.objects.filter(
        article_views__isnull=False
    ).distinct().order_by('name')
    
    context = {
        'page_obj': page_obj,
        'total_views': total_views,
        'unique_ips': unique_ips,
        'unique_users': unique_users,
        'anonymous_views': anonymous_views,
        'views_per_day': list(views_per_day),
        'top_ips': top_ips,
        'top_articles': top_articles,
        'articles': articles,
        'users': users,
        # Preserve filters
        'filter_article': article_id,
        'filter_user': user_id,
        'filter_ip': ip_address,
        'filter_date_from': date_from,
        'filter_date_to': date_to,
        'filter_search': search,
    }
    
    return render(request, 'knowledge/views/view_list.html', context)


@login_required
@permission_required_403('knowledge', 'view', 'delete')
def view_delete(request, view_id):
    """
    Delete a single view record
    """
    view = get_object_or_404(ArticleView, id=view_id)
    
    if request.method == 'POST':
        article_title = view.article.title
        view.delete()
        
        messages.success(request, f'View record untuk artikel "{article_title}" berhasil dihapus')
        return redirect('knowledge:view_manage_list')
    
    context = {
        'view': view,
    }
    
    return render(request, 'knowledge/views/view_delete.html', context)


@login_required
@permission_required_403('knowledge', 'view', 'delete')
def view_bulk_delete(request):
    """
    Bulk delete view records (AJAX)
    """
    if request.method == 'POST':
        view_ids = request.POST.getlist('view_ids[]')
        
        if not view_ids:
            return JsonResponse({
                'success': False,
                'error': 'Tidak ada item yang dipilih'
            }, status=400)
        
        deleted_count = ArticleView.objects.filter(id__in=view_ids).delete()[0]
        
        return JsonResponse({
            'success': True,
            'deleted_count': deleted_count,
            'message': f'{deleted_count} view record berhasil dihapus'
        })
    
    return JsonResponse({'success': False}, status=400)
