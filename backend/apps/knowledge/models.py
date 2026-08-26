import os
from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from core.utils import clean_filename


def knowledge_thumbnail_upload_to(instance, filename):
    date_path = timezone.now().strftime('%Y/%m')
    return f'knowledge/thumbnails/{date_path}/{clean_filename(filename)}'


def knowledge_file_upload_to(instance, filename):
    date_path = timezone.now().strftime('%Y/%m')
    return f'knowledge/files/{date_path}/{clean_filename(filename)}'


def knowledge_document_upload_to(instance, filename):
    date_path = timezone.now().strftime('%Y/%m')
    return f'knowledge/documents/{date_path}/{clean_filename(filename)}'


class Category(models.Model):
    """
    Knowledge Base Category with hierarchical structure (parent-child)
    Supports nested categories (e.g., Teknologi > Programming > Python)
    """
    name = models.CharField(max_length=100, verbose_name='Nama Kategori')
    slug = models.SlugField(max_length=100, unique=True, verbose_name='Slug')
    description = models.TextField(blank=True, null=True, verbose_name='Deskripsi')
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        verbose_name='Parent Kategori'
    )
    order_index = models.IntegerField(default=0, verbose_name='Urutan')
    is_active = models.BooleanField(default=True, verbose_name='Aktif')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Diupdate Pada')

    class Meta:
        db_table = 'knowledge_categories'
        verbose_name = 'Kategori'
        verbose_name_plural = 'Kategori'
        ordering = ['order_index', 'name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['parent']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def get_full_path(self):
        """Get full category path (e.g., 'Teknologi > Programming > Python')"""
        path = [self.name]
        parent = self.parent
        while parent:
            path.insert(0, parent.name)
            parent = parent.parent
        return ' > '.join(path)

    def get_children(self):
        """Get all active child categories"""
        return self.children.filter(is_active=True)

    def get_article_count(self):
        """Get total articles in this category (including children)"""
        count = self.articles.filter(status='published').count()
        for child in self.children.all():
            count += child.get_article_count()
        return count

    def get_course_count(self):
        """Get total published courses in this category (including children)"""
        count = self.courses.filter(status='published').count()
        for child in self.children.all():
            count += child.get_course_count()
        return count


class Tag(models.Model):
    """
    Tags for articles (e.g., 'django', 'python', 'tutorial')
    """
    name = models.CharField(max_length=50, unique=True, verbose_name='Nama Tag')
    slug = models.SlugField(max_length=50, unique=True, verbose_name='Slug')
    description = models.TextField(blank=True, null=True, verbose_name='Deskripsi')
    color = models.CharField(
        max_length=7, 
        default='#3B82F6', 
        verbose_name='Warna Tag',
        help_text='Kode warna hex (contoh: #3B82F6)'
    )
    is_active = models.BooleanField(default=True, verbose_name='Aktif')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')

    class Meta:
        db_table = 'knowledge_tags'
        verbose_name = 'Tag'
        verbose_name_plural = 'Tags'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def get_article_count(self):
        """Get total published articles with this tag"""
        return self.articles.filter(article__status='published').count()


class Article(models.Model):
    """
    Knowledge Base Article
    Supports: text content, file attachments, YouTube videos, and thumbnails
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]
    
    CONTENT_TYPE_CHOICES = [
        ('article', 'Artikel'),
        ('video', 'Video'),
        ('document', 'Dokumen'),
        ('link', 'Link'),
    ]

    title = models.CharField(max_length=200, verbose_name='Judul')
    slug = models.SlugField(max_length=200, unique=True, verbose_name='Slug')
    content = models.TextField(verbose_name='Konten')
    excerpt = models.TextField(blank=True, null=True, verbose_name='Ringkasan')
    
    # Media fields (inspired by KMS Kemenkes)
    thumbnail = models.ImageField(
        upload_to=knowledge_thumbnail_upload_to,
        blank=True,
        null=True,
        verbose_name='Thumbnail',
        help_text='Gambar thumbnail untuk artikel (recommended: 800x600px)'
    )
    content_type = models.CharField(
        max_length=20,
        choices=CONTENT_TYPE_CHOICES,
        default='article',
        verbose_name='Tipe Konten'
    )
    
    # File attachments
    file_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='Link File',
        help_text='Link ke file eksternal (Google Drive, Dropbox, dll)'
    )
    file_upload = models.FileField(
        upload_to=knowledge_file_upload_to,
        blank=True,
        null=True,
        verbose_name='Upload File',
        help_text='Upload file langsung (PDF, DOC, PPT, dll)'
    )
    file_size = models.BigIntegerField(
        blank=True,
        null=True,
        verbose_name='Ukuran File (bytes)',
        help_text='Ukuran file dalam bytes'
    )
    file_type = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Tipe File',
        help_text='Tipe file (PDF, DOC, PPT, dll)'
    )
    
    # YouTube video
    youtube_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='Link YouTube',
        help_text='Link video YouTube (contoh: https://www.youtube.com/watch?v=xxxxx)'
    )
    youtube_embed_id = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='YouTube Video ID',
        help_text='ID video YouTube (auto-extracted dari URL)'
    )
    video_duration = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Durasi Video',
        help_text='Durasi video (contoh: 10:30)'
    )
    
    # External link
    external_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='Link Eksternal',
        help_text='Link ke website eksternal'
    )
    
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='articles',
        verbose_name='Penulis'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='articles',
        verbose_name='Kategori'
    )
    source_lesson = models.OneToOneField(
        'learning.Lesson',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='knowledge_article',
        verbose_name='Sumber Lesson LMS',
    )
    source_module = models.ForeignKey(
        'learning.Module',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='knowledge_articles',
        verbose_name='Sumber Modul LMS',
    )
    source_course = models.OneToOneField(
        'learning.Course',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='knowledge_article',
        verbose_name='Sumber Course LMS',
    )
    order = models.IntegerField(default=0, verbose_name='Urutan (dari LMS)')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        verbose_name='Status'
    )
    is_featured = models.BooleanField(default=False, verbose_name='Featured')
    view_count = models.IntegerField(default=0, verbose_name='Jumlah View')
    like_count = models.IntegerField(default=0, verbose_name='Jumlah Like')
    dislike_count = models.IntegerField(default=0, verbose_name='Jumlah Dislike')
    share_count = models.IntegerField(default=0, verbose_name='Jumlah Share')
    rating_avg = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00,
        verbose_name='Rating Rata-rata'
    )
    rating_count = models.IntegerField(default=0, verbose_name='Jumlah Rating')
    
    # Approval fields
    submitted_at = models.DateTimeField(null=True, blank=True, verbose_name='Diajukan Pada')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_articles',
        verbose_name='Disetujui Oleh'
    )
    approved_at = models.DateTimeField(null=True, blank=True, verbose_name='Disetujui Pada')
    rejection_reason = models.TextField(blank=True, null=True, verbose_name='Alasan Ditolak')
    rejection_count = models.IntegerField(default=0, verbose_name='Jumlah Ditolak')
    
    published_at = models.DateTimeField(null=True, blank=True, verbose_name='Dipublikasi Pada')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Diupdate Pada')

    class Meta:
        db_table = 'knowledge_articles'
        verbose_name = 'Artikel'
        verbose_name_plural = 'Artikel'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['category']),
            models.Index(fields=['status']),
            models.Index(fields=['is_featured']),
            models.Index(fields=['published_at']),
            models.Index(fields=['content_type']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        
        # Handle duplicate slugs by appending number
        if not self.pk:  # Only for new articles
            original_slug = self.slug
            counter = 1
            while Article.objects.filter(slug=self.slug).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1
        
        # Auto-generate excerpt from content if not provided
        if not self.excerpt and self.content:
            self.excerpt = self.content[:200] + '...' if len(self.content) > 200 else self.content
        
        # Extract YouTube video ID from URL
        if self.youtube_url and not self.youtube_embed_id:
            self.youtube_embed_id = self.extract_youtube_id(self.youtube_url)
        
        # Get file size and type if file uploaded
        if self.file_upload and not self.file_size:
            self.file_size = self.file_upload.size
            self.file_type = self.file_upload.name.split('.')[-1].upper()
        
        super().save(*args, **kwargs)

    def extract_youtube_id(self, url):
        """Extract YouTube video ID from URL"""
        import re
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)',
            r'youtube\.com\/embed\/([^&\n?#]+)',
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None

    def get_youtube_embed_url(self):
        """Get YouTube embed URL"""
        if self.youtube_embed_id:
            return f"https://www.youtube.com/embed/{self.youtube_embed_id}"
        return None

    def get_youtube_thumbnail(self):
        """Get YouTube thumbnail URL"""
        if self.youtube_embed_id:
            return f"https://img.youtube.com/vi/{self.youtube_embed_id}/maxresdefault.jpg"
        return None

    def get_file_icon(self):
        """Get icon class based on file type"""
        if not self.file_type:
            return 'fas fa-file'
        
        file_type = self.file_type.lower()
        icons = {
            'pdf': 'fas fa-file-pdf',
            'doc': 'fas fa-file-word',
            'docx': 'fas fa-file-word',
            'xls': 'fas fa-file-excel',
            'xlsx': 'fas fa-file-excel',
            'ppt': 'fas fa-file-powerpoint',
            'pptx': 'fas fa-file-powerpoint',
            'zip': 'fas fa-file-archive',
            'rar': 'fas fa-file-archive',
            'jpg': 'fas fa-file-image',
            'jpeg': 'fas fa-file-image',
            'png': 'fas fa-file-image',
            'gif': 'fas fa-file-image',
            'mp4': 'fas fa-file-video',
            'avi': 'fas fa-file-video',
            'mp3': 'fas fa-file-audio',
            'wav': 'fas fa-file-audio',
        }
        return icons.get(file_type, 'fas fa-file')

    def get_file_size_display(self):
        """Get human-readable file size"""
        if not self.file_size:
            return None
        
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"

    def increment_view_count(self, ip_address=None, user=None):
        """
        Increment view count based on IP address or user
        Only counts unique views (1 IP = 1 view per article)
        
        Args:
            ip_address: IP address of the viewer
            user: User object (optional, for logged-in users)
        
        Returns:
            bool: True if view was counted (new view), False if already viewed
        """
        if ip_address:
            # Check if this IP already viewed this article
            view_exists = ArticleView.objects.filter(
                article=self,
                ip_address=ip_address
            ).exists()
            
            if not view_exists:
                # Create new view record
                ArticleView.objects.create(
                    article=self,
                    ip_address=ip_address,
                    user=user
                )
                # Increment counter
                self.view_count += 1
                self.save(update_fields=['view_count'])
                return True
            return False
        else:
            # Fallback: increment without IP tracking (old behavior)
            self.view_count += 1
            self.save(update_fields=['view_count'])
            return True

    def update_rating(self):
        """Update average rating and count"""
        ratings = self.ratings.all()
        if ratings.exists():
            self.rating_avg = ratings.aggregate(models.Avg('rating'))['rating__avg']
            self.rating_count = ratings.count()
        else:
            self.rating_avg = 0.00
            self.rating_count = 0
        self.save(update_fields=['rating_avg', 'rating_count'])

    def update_likes(self):
        """Update like and dislike count"""
        likes = self.likes.filter(is_like=True).count()
        dislikes = self.likes.filter(is_like=False).count()
        
        self.like_count = likes
        self.dislike_count = dislikes
        self.save(update_fields=['like_count', 'dislike_count'])
    
    def get_like_percentage(self):
        """Get like percentage (0-100)"""
        total = self.like_count + self.dislike_count
        if total == 0:
            return 0
        return round((self.like_count / total) * 100, 1)
    
    def get_author_initial(self):
        """Get author initials for avatar (e.g., 'AZ' for 'Andi Zulfaidawaty')"""
        if hasattr(self.author, 'name') and self.author.name:
            # Split name into words and take first letter of each
            name_parts = self.author.name.split()
            if len(name_parts) >= 2:
                return f"{name_parts[0][0]}{name_parts[-1][0]}".upper()
            elif len(name_parts) == 1:
                return name_parts[0][:2].upper()
        
        if self.author.username:
            return self.author.username[:2].upper()
        return "?"
    
    def get_author_full_name(self):
        """Get author full name with title"""
        if hasattr(self.author, 'name') and self.author.name:
            return self.author.name
        return self.author.username
    
    def get_author_role(self):
        """Get author role/position"""
        # Assuming user has a profile with role/position field
        if hasattr(self.author, 'profile') and hasattr(self.author.profile, 'position'):
            return self.author.profile.position
        return "Author"
    
    def increment_share_count(self):
        """Increment share count"""
        self.share_count += 1
        self.save(update_fields=['share_count'])
    
    def get_time_since_published(self):
        """Get human-readable time since published"""
        if not self.published_at:
            return None
        
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - self.published_at
        
        if diff < timedelta(minutes=1):
            return "Baru saja"
        elif diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes} menit yang lalu"
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"{hours} jam yang lalu"
        elif diff < timedelta(days=7):
            days = diff.days
            return f"{days} hari yang lalu"
        elif diff < timedelta(days=30):
            weeks = int(diff.days / 7)
            return f"{weeks} minggu yang lalu"
        elif diff < timedelta(days=365):
            months = int(diff.days / 30)
            return f"{months} bulan yang lalu"
        else:
            years = int(diff.days / 365)
            return f"{years} tahun yang lalu"
    
    def get_comment_count(self):
        """Get total comment count (including replies)"""
        return self.comments.count()
    
    def submit_for_approval(self, user=None):
        """Submit article for approval"""
        from django.utils import timezone
        
        if self.status not in ['draft', 'rejected']:
            raise ValueError("Only draft or rejected articles can be submitted for approval")
        
        self.status = 'pending'
        self.submitted_at = timezone.now()
        self.save(update_fields=['status', 'submitted_at'])
        
        # Create history record
        ApprovalHistory.objects.create(
            article=self,
            action='submitted',
            actor=user or self.author,
            reason='Submitted for approval'
        )
    
    def approve(self, approver, reason=None):
        """Approve article"""
        from django.utils import timezone
        
        if self.status != 'pending':
            raise ValueError("Only pending articles can be approved")
        
        self.status = 'approved'
        self.approved_by = approver
        self.approved_at = timezone.now()
        self.rejection_reason = None  # Clear previous rejection reason
        self.save(update_fields=['status', 'approved_by', 'approved_at', 'rejection_reason'])
        
        # Create history record
        ApprovalHistory.objects.create(
            article=self,
            action='approved',
            actor=approver,
            reason=reason or 'Article approved'
        )
    
    def reject(self, rejector, reason):
        """Reject article"""
        if self.status != 'pending':
            raise ValueError("Only pending articles can be rejected")
        
        self.status = 'rejected'
        self.rejection_reason = reason
        self.rejection_count += 1
        self.save(update_fields=['status', 'rejection_reason', 'rejection_count'])
        
        # Create history record
        ApprovalHistory.objects.create(
            article=self,
            action='rejected',
            actor=rejector,
            reason=reason
        )
    
    def publish(self, publisher=None):
        """Publish article (must be approved first)"""
        from django.utils import timezone
        
        if self.status != 'approved':
            raise ValueError("Only approved articles can be published")
        
        self.status = 'published'
        self.published_at = timezone.now()
        self.save(update_fields=['status', 'published_at'])
        
        # Create history record
        ApprovalHistory.objects.create(
            article=self,
            action='published',
            actor=publisher or self.author,
            reason='Article published'
        )
    
    def get_approval_history(self):
        """Get approval history ordered by date"""
        return self.approval_history.all().order_by('-created_at')
    
    def get_rejection_history(self):
        """Get rejection history only"""
        return self.approval_history.filter(action='rejected').order_by('-created_at')
    
    def can_submit_for_approval(self):
        """Check if article can be submitted for approval"""
        return self.status in ['draft', 'rejected']
    
    def can_approve(self):
        """Check if article can be approved"""
        return self.status == 'pending'
    
    def can_reject(self):
        """Check if article can be rejected"""
        return self.status == 'pending'
    
    def can_publish(self):
        """Check if article can be published"""
        return self.status == 'approved'


class ArticleDocument(models.Model):
    """
    Additional file attachment for an Article.
    An article can have multiple documents (PDF, DOC, PPT, etc).
    Documents pulled from LMS lessons keep a reference to the source lesson.
    """
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name='Artikel'
    )
    file = models.FileField(
        upload_to=knowledge_document_upload_to,
        verbose_name='File'
    )
    file_name = models.CharField(max_length=255, blank=True, verbose_name='Nama File')
    file_size = models.BigIntegerField(
        blank=True,
        null=True,
        verbose_name='Ukuran File (bytes)'
    )
    file_type = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Tipe File'
    )
    source_lesson = models.ForeignKey(
        'learning.Lesson',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='article_documents',
        verbose_name='Sumber Lesson LMS',
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')

    class Meta:
        db_table = 'knowledge_article_documents'
        verbose_name = 'Dokumen Artikel'
        verbose_name_plural = 'Dokumen Artikel'
        ordering = ['created_at', 'id']
        indexes = [
            models.Index(fields=['article']),
            models.Index(fields=['source_lesson']),
        ]

    def __str__(self):
        return self.file_name or self.file.name

    def save(self, *args, **kwargs):
        if not self.file_name and self.file:
            self.file_name = os.path.basename(self.file.name)
        if not self.file_size and self.file:
            self.file_size = self.file.size
        if not self.file_type and self.file:
            self.file_type = self.file.name.split('.')[-1].upper()
        super().save(*args, **kwargs)

    def get_file_size_display(self):
        """Human readable file size"""
        if not self.file_size:
            return ''
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024 or unit == 'GB':
                return f"{size:.1f} {unit}"
            size /= 1024


class ArticleTag(models.Model):
    """
    Many-to-Many relationship between Article and Tag
    """
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='article_tags',
        verbose_name='Artikel'
    )
    tag = models.ForeignKey(
        Tag,
        on_delete=models.CASCADE,
        related_name='articles',
        verbose_name='Tag'
    )

    class Meta:
        db_table = 'knowledge_article_tags'
        verbose_name = 'Artikel Tag'
        verbose_name_plural = 'Artikel Tags'
        unique_together = ('article', 'tag')

    def __str__(self):
        return f"{self.article.title} - {self.tag.name}"


class ApprovalHistory(models.Model):
    """
    History of article approval/rejection
    Tracks all approval attempts and rejections
    """
    ACTION_CHOICES = [
        ('submitted', 'Submitted for Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('published', 'Published'),
    ]
    
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='approval_history',
        verbose_name='Artikel'
    )
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        verbose_name='Aksi'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='approval_actions',
        verbose_name='Dilakukan Oleh'
    )
    reason = models.TextField(
        blank=True,
        null=True,
        verbose_name='Alasan/Keterangan',
        help_text='Alasan ditolak atau catatan approval'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Tanggal')

    class Meta:
        db_table = 'knowledge_approval_history'
        verbose_name = 'Approval History'
        verbose_name_plural = 'Approval Histories'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['article', 'action']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.article.title} - {self.get_action_display()} by {self.actor.username if self.actor else 'System'}"


class ArticleView(models.Model):
    """
    Track article views by IP address
    Ensures unique view count (1 IP = 1 view per article)
    """
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='views',
        verbose_name='Artikel'
    )
    ip_address = models.GenericIPAddressField(
        verbose_name='IP Address',
        help_text='IP address of the viewer'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='article_views',
        verbose_name='User',
        help_text='User if logged in (optional)'
    )
    user_agent = models.TextField(
        blank=True,
        null=True,
        verbose_name='User Agent',
        help_text='Browser/device information'
    )
    viewed_at = models.DateTimeField(auto_now_add=True, verbose_name='Dilihat Pada')

    class Meta:
        db_table = 'knowledge_article_views'
        verbose_name = 'Article View'
        verbose_name_plural = 'Article Views'
        unique_together = ('article', 'ip_address')
        ordering = ['-viewed_at']
        indexes = [
            models.Index(fields=['article', 'ip_address']),
            models.Index(fields=['viewed_at']),
        ]

    def __str__(self):
        user_info = f" ({self.user.username})" if self.user else ""
        return f"{self.article.title} - {self.ip_address}{user_info}"


class ArticleLike(models.Model):
    """
    Article likes/dislikes by users
    Each user can only like OR dislike an article (not both)
    User can change their vote or remove it
    """
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='likes',
        verbose_name='Artikel'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='article_likes',
        verbose_name='User'
    )
    is_like = models.BooleanField(
        verbose_name='Is Like',
        help_text='True = Like, False = Dislike'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Diupdate Pada')

    class Meta:
        db_table = 'knowledge_article_likes'
        verbose_name = 'Article Like/Dislike'
        verbose_name_plural = 'Article Likes/Dislikes'
        unique_together = ('article', 'user')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['article', 'user']),
            models.Index(fields=['is_like']),
        ]

    def __str__(self):
        action = "liked" if self.is_like else "disliked"
        return f"{self.user.username} {action} {self.article.title}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update article like/dislike count after saving
        self.article.update_likes()


class Comment(models.Model):
    """
    Comments on articles with nested reply support
    Supports like/dislike on comments
    """
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='Artikel'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='article_comments',
        verbose_name='User'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies',
        verbose_name='Parent Comment',
        help_text='Null = top-level comment, Not null = reply to another comment'
    )
    content = models.TextField(verbose_name='Konten Komentar')
    like_count = models.IntegerField(default=0, verbose_name='Jumlah Like')
    dislike_count = models.IntegerField(default=0, verbose_name='Jumlah Dislike')
    is_edited = models.BooleanField(default=False, verbose_name='Sudah Diedit')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Diupdate Pada')

    class Meta:
        db_table = 'knowledge_comments'
        verbose_name = 'Comment'
        verbose_name_plural = 'Comments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['article', 'parent']),
            models.Index(fields=['user']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        if self.parent:
            return f"{self.user.username} replied to {self.parent.user.username}"
        return f"{self.user.username} commented on {self.article.title}"

    def save(self, *args, **kwargs):
        # Mark as edited if content changed (except on creation)
        if self.pk:
            old_comment = Comment.objects.get(pk=self.pk)
            if old_comment.content != self.content:
                self.is_edited = True
        super().save(*args, **kwargs)

    def get_replies(self):
        """Get all replies to this comment"""
        return self.replies.all().order_by('created_at')

    def get_reply_count(self):
        """Get total number of replies"""
        return self.replies.count()

    def update_likes(self):
        """Update like and dislike count"""
        likes = self.comment_likes.filter(is_like=True).count()
        dislikes = self.comment_likes.filter(is_like=False).count()
        
        self.like_count = likes
        self.dislike_count = dislikes
        self.save(update_fields=['like_count', 'dislike_count'])
    
    def get_like_percentage(self):
        """Get like percentage (0-100)"""
        total = self.like_count + self.dislike_count
        if total == 0:
            return 0
        return round((self.like_count / total) * 100, 1)


class CommentLike(models.Model):
    """
    Likes/dislikes on comments
    Each user can only like OR dislike a comment (not both)
    """
    comment = models.ForeignKey(
        Comment,
        on_delete=models.CASCADE,
        related_name='comment_likes',
        verbose_name='Comment'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comment_likes',
        verbose_name='User'
    )
    is_like = models.BooleanField(
        verbose_name='Is Like',
        help_text='True = Like, False = Dislike'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')

    class Meta:
        db_table = 'knowledge_comment_likes'
        verbose_name = 'Comment Like/Dislike'
        verbose_name_plural = 'Comment Likes/Dislikes'
        unique_together = ('comment', 'user')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['comment', 'user']),
            models.Index(fields=['is_like']),
        ]

    def __str__(self):
        action = "liked" if self.is_like else "disliked"
        return f"{self.user.username} {action} comment by {self.comment.user.username}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update comment like/dislike count after saving
        self.comment.update_likes()


class Rating(models.Model):
    """
    Article ratings by users
    """
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='ratings',
        verbose_name='Artikel'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='article_ratings',
        verbose_name='User'
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Rating'
    )
    feedback = models.TextField(blank=True, null=True, verbose_name='Feedback')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')

    class Meta:
        db_table = 'knowledge_ratings'
        verbose_name = 'Rating'
        verbose_name_plural = 'Ratings'
        unique_together = ('article', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.article.title} - {self.user.username} ({self.rating}/5)"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update article rating after saving
        self.article.update_rating()
