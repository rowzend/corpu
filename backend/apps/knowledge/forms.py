from django import forms
from django.core.exceptions import ValidationError
from .models import Category, Article, Tag, ArticleTag, Comment, Rating


class CategoryForm(forms.ModelForm):
    """
    Form for creating/editing categories
    """
    class Meta:
        model = Category
        fields = ['name', 'slug', 'description', 'parent', 'order_index', 'is_active']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                'placeholder': 'Nama kategori'
            }),
            'slug': forms.TextInput(attrs={
                'class': 'form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                'placeholder': 'slug-kategori (otomatis jika kosong)'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-textarea w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                'rows': 3,
                'placeholder': 'Deskripsi kategori'
            }),
            'parent': forms.Select(attrs={
                'class': 'form-select w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
            }),
            'order_index': forms.NumberInput(attrs={
                'class': 'form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                'placeholder': '0'
            }),
            'is_active': forms.CheckboxInput(attrs={
                'class': 'form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500'
            }),
        }
        help_texts = {
            'slug': 'URL-friendly version of name. Leave blank to auto-generate.',
            'parent': 'Select parent category to create sub-category.',
            'order_index': 'Lower numbers appear first.',
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Make slug optional (will auto-generate if empty)
        self.fields['slug'].required = False
        
        # Filter parent choices to only show active parent categories
        # Exclude self if editing (prevent circular reference)
        if self.instance.pk:
            self.fields['parent'].queryset = Category.objects.filter(
                is_active=True
            ).exclude(pk=self.instance.pk).exclude(parent=self.instance)
        else:
            self.fields['parent'].queryset = Category.objects.filter(is_active=True)
        
        # Add empty choice for parent
        self.fields['parent'].empty_label = '-- Tidak ada parent (kategori utama) --'
    
    def clean(self):
        cleaned_data = super().clean()
        parent = cleaned_data.get('parent')
        
        # Prevent circular reference
        if self.instance.pk and parent:
            if parent == self.instance:
                raise forms.ValidationError('Kategori tidak bisa menjadi parent dari dirinya sendiri!')
            
            # Check if parent is a child of this category
            if parent.parent == self.instance:
                raise forms.ValidationError('Kategori tidak bisa menjadi parent dari parent-nya sendiri!')
        
        return cleaned_data


class ArticleForm(forms.ModelForm):
    """
    Form for creating/editing articles with rich features
    """
    tags = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
            'placeholder': 'django, python, tutorial (pisahkan dengan koma)',
            'data-toggle': 'tags'
        }),
        help_text='Pisahkan tag dengan koma. Tag baru akan dibuat otomatis.'
    )
    
    class Meta:
        model = Article
        fields = [
            'title', 'slug', 'content', 'excerpt', 'category', 
            'content_type', 'thumbnail', 'youtube_url', 'file_upload', 
            'file_url', 'external_url', 'status', 'is_featured'
        ]
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                'placeholder': 'Judul artikel',
                'required': True
            }),
            'slug': forms.TextInput(attrs={
                'class': 'form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                'placeholder': 'slug-artikel (otomatis dari judul jika kosong)'
            }),
            'content': forms.Textarea(attrs={
                'class': 'form-textarea w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                'rows': 15,
                'placeholder': 'Konten artikel (mendukung Markdown)',
                'data-editor': 'markdown'
            }),
            'excerpt': forms.Textarea(attrs={
                'class': 'form-textarea w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                'rows': 3,
                'placeholder': 'Ringkasan artikel (otomatis dari konten jika kosong)'
            }),
            'category': forms.Select(attrs={
                'class': 'form-select w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
            }),
            'content_type': forms.Select(attrs={
                'class': 'form-select w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                'data-toggle': 'content-type'
            }),
            'thumbnail': forms.ClearableFileInput(attrs={
                'class': 'form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                'accept': 'image/*'
            }),
            'youtube_url': forms.URLInput(attrs={
                'class': 'form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                'placeholder': 'https://www.youtube.com/watch?v=xxxxx',
                'data-content-type': 'video'
            }),
            'file_upload': forms.ClearableFileInput(attrs={
                'class': 'form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                'data-content-type': 'document'
            }),
            'file_url': forms.URLInput(attrs={
                'class': 'form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                'placeholder': 'https://drive.google.com/file/d/xxxxx',
                'data-content-type': 'document'
            }),
            'external_url': forms.URLInput(attrs={
                'class': 'form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                'placeholder': 'https://example.com/article',
                'data-content-type': 'link'
            }),
            'status': forms.Select(attrs={
                'class': 'form-select w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
            }),
            'is_featured': forms.CheckboxInput(attrs={
                'class': 'form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500'
            }),
        }
        help_texts = {
            'slug': 'URL-friendly version. Kosongkan untuk generate otomatis dari judul.',
            'content': 'Gunakan Markdown untuk formatting. Contoh: **bold**, *italic*, `code`',
            'excerpt': 'Ringkasan singkat. Kosongkan untuk generate otomatis dari konten.',
            'thumbnail': 'Gambar thumbnail (JPG, PNG, GIF). Maksimal 2MB.',
            'youtube_url': 'Link video YouTube. Hanya tampil jika Content Type = Video.',
            'file_upload': 'Upload file langsung. Hanya tampil jika Content Type = Document.',
            'file_url': 'Link file eksternal (Google Drive, Dropbox, dll).',
            'external_url': 'Link ke website eksternal. Hanya tampil jika Content Type = Link.',
            'is_featured': 'Artikel unggulan akan ditampilkan di halaman utama.',
        }
    
    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
        # Make slug optional
        self.fields['slug'].required = False
        self.fields['excerpt'].required = False
        
        # Filter categories to only active ones
        self.fields['category'].queryset = Category.objects.filter(is_active=True)
        self.fields['category'].empty_label = '-- Pilih Kategori --'
        
        # Limit status choices based on user permissions and current status
        if self.user:
            status_choices = [('draft', 'Draft')]
            
            # If editing existing article
            if self.instance.pk:
                current_status = self.instance.status
                
                # Author can submit for approval if draft or rejected
                if current_status in ['draft', 'rejected']:
                    status_choices.append(('pending', 'Submit for Approval'))
                
                # Keep current status if not draft
                if current_status not in ['draft']:
                    status_choices.append((current_status, dict(Article.STATUS_CHOICES)[current_status]))
                
                # Staff can set any status
                if hasattr(self.user, 'is_staff') and self.user.is_staff:
                    status_choices = Article.STATUS_CHOICES
            else:
                # New article: only draft for regular users
                if hasattr(self.user, 'is_staff') and self.user.is_staff:
                    status_choices = Article.STATUS_CHOICES
            
            self.fields['status'].choices = status_choices
        
        # Load existing tags
        if self.instance.pk:
            existing_tags = self.instance.article_tags.all().values_list('tag__name', flat=True)
            self.fields['tags'].initial = ', '.join(existing_tags)
    
    def clean_youtube_url(self):
        """Validate YouTube URL format"""
        youtube_url = self.cleaned_data.get('youtube_url')
        content_type = self.cleaned_data.get('content_type')
        
        if youtube_url and content_type == 'video':
            # Basic YouTube URL validation
            if 'youtube.com' not in youtube_url and 'youtu.be' not in youtube_url:
                raise ValidationError('URL harus berupa link YouTube yang valid.')
        
        return youtube_url
    
    def clean(self):
        cleaned_data = super().clean()
        content_type = cleaned_data.get('content_type')
        
        # Validate required fields based on content type
        if content_type == 'video':
            if not cleaned_data.get('youtube_url'):
                self.add_error('youtube_url', 'URL YouTube wajib diisi untuk tipe konten Video.')
        
        elif content_type == 'document':
            if not cleaned_data.get('file_upload') and not cleaned_data.get('file_url'):
                self.add_error('file_upload', 'File upload atau File URL wajib diisi untuk tipe konten Dokumen.')
        
        elif content_type == 'link':
            if not cleaned_data.get('external_url'):
                self.add_error('external_url', 'URL eksternal wajib diisi untuk tipe konten Link.')
        
        return cleaned_data
    
    def save(self, commit=True):
        """Save article and handle tags"""
        article = super().save(commit=False)
        
        # Set author if creating new article
        if not article.pk and self.user:
            article.author = self.user
        
        if commit:
            article.save()
            
            # Handle tags
            tags_input = self.cleaned_data.get('tags', '')
            if tags_input:
                # Clear existing tags
                ArticleTag.objects.filter(article=article).delete()
                
                # Process new tags
                tag_names = [name.strip() for name in tags_input.split(',') if name.strip()]
                for tag_name in tag_names:
                    tag, created = Tag.objects.get_or_create(
                        name=tag_name,
                        defaults={'slug': tag_name.lower().replace(' ', '-')}
                    )
                    ArticleTag.objects.get_or_create(article=article, tag=tag)
        
        return article


class TagForm(forms.ModelForm):
    """
    Form for creating/editing tags
    """
    class Meta:
        model = Tag
        fields = ['name', 'slug', 'description', 'color', 'is_active']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                'placeholder': 'Nama tag',
                'required': True
            }),
            'slug': forms.TextInput(attrs={
                'class': 'form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                'placeholder': 'slug-tag (otomatis dari nama jika kosong)'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-textarea w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                'rows': 3,
                'placeholder': 'Deskripsi singkat tentang tag ini'
            }),
            'color': forms.TextInput(attrs={
                'class': 'form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                'placeholder': '#3B82F6',
                'pattern': '^#[0-9A-Fa-f]{6}$',
                'title': 'Masukkan kode warna hex (contoh: #3B82F6)'
            }),
            'is_active': forms.CheckboxInput(attrs={
                'class': 'form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500'
            }),
        }
        help_texts = {
            'slug': 'URL-friendly version. Kosongkan untuk generate otomatis dari nama.',
            'description': 'Deskripsi singkat tentang tag ini (opsional).',
            'color': 'Kode warna hex untuk tag (contoh: #3B82F6).',
            'is_active': 'Tag aktif akan ditampilkan di daftar tag publik.',
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['slug'].required = False
        self.fields['description'].required = False
    
    def clean_color(self):
        """Validate color hex format"""
        color = self.cleaned_data.get('color')
        if color:
            # Ensure it starts with # and is 7 characters long
            if not color.startswith('#'):
                color = '#' + color
            
            # Validate hex format
            if len(color) != 7:
                raise ValidationError('Kode warna harus 6 karakter hex (contoh: #3B82F6)')
            
            try:
                int(color[1:], 16)  # Try to convert hex to int
            except ValueError:
                raise ValidationError('Kode warna tidak valid. Gunakan format hex (contoh: #3B82F6)')
        
        return color


class CommentForm(forms.ModelForm):
    """
    Form for creating/editing comments
    """
    class Meta:
        model = Comment
        fields = ['content']
        widgets = {
            'content': forms.Textarea(attrs={
                'class': 'form-textarea w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                'rows': 4,
                'placeholder': 'Tulis komentar Anda...',
                'required': True
            }),
        }
    
    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        self.article = kwargs.pop('article', None)
        self.parent = kwargs.pop('parent', None)
        super().__init__(*args, **kwargs)
    
    def save(self, commit=True):
        comment = super().save(commit=False)
        
        if self.user:
            comment.user = self.user
        if self.article:
            comment.article = self.article
        if self.parent:
            comment.parent = self.parent
        
        if commit:
            comment.save()
        
        return comment


class RatingForm(forms.ModelForm):
    """
    Form for rating articles
    """
    class Meta:
        model = Rating
        fields = ['rating', 'feedback']
        widgets = {
            'rating': forms.Select(
                choices=[(i, f'{i} ⭐') for i in range(1, 6)],
                attrs={
                    'class': 'form-select w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                    'required': True
                }
            ),
            'feedback': forms.Textarea(attrs={
                'class': 'form-textarea w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                'rows': 3,
                'placeholder': 'Berikan feedback Anda (opsional)...'
            }),
        }
        help_texts = {
            'rating': 'Berikan rating 1-5 bintang untuk artikel ini.',
            'feedback': 'Feedback opsional untuk membantu penulis.',
        }
    
    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        self.article = kwargs.pop('article', None)
        super().__init__(*args, **kwargs)
    
    def save(self, commit=True):
        rating = super().save(commit=False)
        
        if self.user:
            rating.user = self.user
        if self.article:
            rating.article = self.article
        
        if commit:
            rating.save()
        
        return rating


class ArticleSearchForm(forms.Form):
    """
    Form for searching articles
    """
    search = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
            'placeholder': 'Cari artikel, kategori, atau tag...',
            'data-search': 'articles'
        })
    )
    
    category = forms.ModelChoiceField(
        queryset=Category.objects.filter(is_active=True),
        required=False,
        empty_label='-- Semua Kategori --',
        widget=forms.Select(attrs={
            'class': 'form-select w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
        })
    )
    
    status = forms.ChoiceField(
        choices=[
            ('', '-- Semua Status --'),
            ('published', 'Published'),
            ('draft', 'Draft'),
            ('pending', 'Pending Approval'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected'),
        ],
        required=False,
        widget=forms.Select(attrs={
            'class': 'form-select w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
        })
    )
    
    content_type = forms.ChoiceField(
        choices=[('', '-- Semua Tipe --')] + Article.CONTENT_TYPE_CHOICES,
        required=False,
        widget=forms.Select(attrs={
            'class': 'form-select w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
        })
    )
    
    ordering = forms.ChoiceField(
        choices=[
            ('-published_at', 'Terbaru'),
            ('-view_count', 'Paling Banyak Dilihat'),
            ('-like_count', 'Paling Disukai'),
            ('-rating_avg', 'Rating Tertinggi'),
            ('title', 'Judul A-Z'),
            ('-created_at', 'Dibuat Terbaru'),
        ],
        required=False,
        initial='-published_at',
        widget=forms.Select(attrs={
            'class': 'form-select w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
        })
    )
