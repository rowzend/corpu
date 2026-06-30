"""
Seed Knowledge Base Sample Articles
Run: python manage.py seed_knowledge_sample_articles
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.knowledge.models import Article, Category, Tag, ArticleTag

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed Knowledge Base Sample Articles'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing articles before seeding')
        parser.add_argument('--user', type=str, help='Username of article author (default: first superuser)')

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS('🌱 Seeding Knowledge Base Sample Articles'))
        self.stdout.write('=' * 70)

        # Get author
        username = options.get('user')
        if username:
            try:
                author = User.objects.get(username=username)
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'❌ User "{username}" not found'))
                return
        else:
            # Try to get first staff user or any user
            author = User.objects.filter(is_active=True).first()
            if not author:
                self.stdout.write(self.style.ERROR('❌ No active user found. Please create a user first.'))
                return

        self.stdout.write(f'  📝 Author: {author.username}')

        if options.get('clear'):
            count = Article.objects.all().count()
            Article.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'  🗑️  Cleared {count} existing articles'))

        # Get categories
        try:
            cat_programming = Category.objects.get(slug='programming')
            cat_database = Category.objects.get(slug='database')
            cat_tutorial = Category.objects.get(slug='tutorial')
            cat_peraturan = Category.objects.get(slug='peraturan')
        except Category.DoesNotExist:
            self.stdout.write(self.style.ERROR('❌ Categories not found. Please run seed_knowledge_categories first.'))
            return

        # Get tags
        tag_python = Tag.objects.get_or_create(name='Python', slug='python')[0]
        tag_django = Tag.objects.get_or_create(name='Django', slug='django')[0]
        tag_tutorial = Tag.objects.get_or_create(name='Tutorial', slug='tutorial')[0]
        tag_database = Tag.objects.get_or_create(name='PostgreSQL', slug='postgresql')[0]
        tag_asn = Tag.objects.get_or_create(name='ASN', slug='asn')[0]

        articles_data = [
            {
                'title': 'Panduan Lengkap Django REST Framework',
                'slug': 'panduan-lengkap-django-rest-framework',
                'content': '''
# Panduan Lengkap Django REST Framework

Django REST Framework (DRF) adalah toolkit yang powerful untuk membangun Web APIs dengan Django.

## Instalasi

```bash
pip install djangorestframework
```

## Setup

Tambahkan ke INSTALLED_APPS:

```python
INSTALLED_APPS = [
    ...
    'rest_framework',
]
```

## Membuat Serializer

```python
from rest_framework import serializers

class ArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = '__all__'
```

## Membuat ViewSet

```python
from rest_framework import viewsets

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
```

## URL Configuration

```python
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'articles', ArticleViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]
```

Selamat! API Anda sudah siap digunakan.
                ''',
                'excerpt': 'Tutorial lengkap membuat REST API dengan Django REST Framework',
                'category': cat_programming,
                'tags': [tag_python, tag_django, tag_tutorial],
                'status': 'published',
                'is_featured': True,
            },
            {
                'title': 'Optimasi Query Database dengan Django ORM',
                'slug': 'optimasi-query-database-django-orm',
                'content': '''
# Optimasi Query Database dengan Django ORM

Tips dan trik untuk mengoptimalkan query database di Django.

## 1. Gunakan select_related()

Untuk ForeignKey dan OneToOne:

```python
# ❌ Bad: N+1 queries
articles = Article.objects.all()
for article in articles:
    print(article.author.name)  # Query per iteration

# ✅ Good: 1 query with JOIN
articles = Article.objects.select_related('author').all()
for article in articles:
    print(article.author.name)  # No additional query
```

## 2. Gunakan prefetch_related()

Untuk ManyToMany dan reverse ForeignKey:

```python
# ✅ Good: 2 queries total
articles = Article.objects.prefetch_related('tags').all()
for article in articles:
    for tag in article.tags.all():  # No additional query
        print(tag.name)
```

## 3. Gunakan only() dan defer()

```python
# Only load specific fields
articles = Article.objects.only('title', 'slug')

# Defer loading heavy fields
articles = Article.objects.defer('content')
```

## 4. Gunakan annotate() untuk aggregation

```python
from django.db.models import Count

articles = Article.objects.annotate(
    comment_count=Count('comments')
)
```

Dengan teknik ini, aplikasi Anda akan jauh lebih cepat!
                ''',
                'excerpt': 'Tips optimasi query database untuk performa maksimal',
                'category': cat_database,
                'tags': [tag_django, tag_database, tag_tutorial],
                'status': 'published',
                'is_featured': True,
            },
            {
                'title': 'Cara Menggunakan Sistem Knowledge Base',
                'slug': 'cara-menggunakan-sistem-knowledge-base',
                'content': '''
# Cara Menggunakan Sistem Knowledge Base

Panduan lengkap menggunakan sistem Knowledge Base ASN Corpu.

## Fitur-fitur Utama

### 1. Membaca Artikel
- Browse artikel berdasarkan kategori
- Search artikel dengan keyword
- Filter berdasarkan tag

### 2. Interaksi dengan Artikel
- **Like/Dislike**: Berikan feedback pada artikel
- **Rating**: Beri rating 1-5 bintang
- **Comment**: Tulis komentar dan reply
- **Share**: Bagikan artikel ke social media

### 3. Membuat Artikel (untuk Author)
1. Login ke sistem
2. Klik "Buat Artikel Baru"
3. Isi judul, konten, kategori, dan tags
4. Submit untuk approval
5. Tunggu approval dari admin
6. Setelah approved, artikel bisa dipublish

### 4. Approval Workflow
- **Draft**: Artikel masih draft
- **Pending**: Menunggu approval
- **Approved**: Sudah disetujui, siap publish
- **Rejected**: Ditolak dengan alasan
- **Published**: Sudah dipublikasi

## Tips Penggunaan
- Gunakan search untuk menemukan artikel cepat
- Subscribe ke kategori favorit
- Berikan feedback dengan like/rating
- Diskusi di comment section

Selamat menggunakan Knowledge Base!
                ''',
                'excerpt': 'Panduan lengkap menggunakan sistem Knowledge Base ASN Corpu',
                'category': cat_tutorial,
                'tags': [tag_tutorial],
                'status': 'published',
                'is_featured': False,
            },
            {
                'title': 'Peraturan Tunjangan Kinerja ASN 2026',
                'slug': 'peraturan-tunjangan-kinerja-asn-2026',
                'content': '''
# Peraturan Tunjangan Kinerja ASN 2026

Informasi lengkap tentang peraturan tunjangan kinerja ASN tahun 2026.

## Dasar Hukum
- Peraturan Pemerintah No. XX Tahun 2026
- Peraturan Menteri PANRB No. XX Tahun 2026

## Komponen Tunjangan
1. **Tunjangan Kinerja Dasar**
   - Berdasarkan kelas jabatan
   - Dibayarkan setiap bulan

2. **Tunjangan Kinerja Tambahan**
   - Berdasarkan capaian kinerja
   - Evaluasi setiap triwulan

3. **Tunjangan Khusus**
   - Untuk jabatan tertentu
   - Sesuai ketentuan

## Perhitungan
Tunjangan Kinerja = (Tunjangan Dasar × Capaian Kinerja) + Tunjangan Khusus

## Syarat Penerimaan
- Status ASN aktif
- Tidak sedang menjalani hukuman disiplin
- Capaian kinerja minimal 60%

## Mekanisme Pembayaran
- Dibayarkan bersamaan dengan gaji
- Melalui rekening masing-masing pegawai

Untuk informasi lebih lanjut, hubungi bagian kepegawaian.
                ''',
                'excerpt': 'Informasi lengkap peraturan tunjangan kinerja ASN tahun 2026',
                'category': cat_peraturan,
                'tags': [tag_asn],
                'status': 'published',
                'is_featured': False,
            },
        ]

        created_count = 0
        updated_count = 0

        for article_data in articles_data:
            tags = article_data.pop('tags', [])
            
            # Create/Update article
            article, created = Article.objects.update_or_create(
                slug=article_data['slug'],
                defaults={
                    'title': article_data['title'],
                    'content': article_data['content'],
                    'excerpt': article_data['excerpt'],
                    'category': article_data['category'],
                    'author': author,
                    'status': article_data['status'],
                    'is_featured': article_data['is_featured'],
                    'published_at': timezone.now() if article_data['status'] == 'published' else None,
                }
            )
            
            # Add tags
            for tag in tags:
                ArticleTag.objects.get_or_create(article=article, tag=tag)
            
            if created:
                self.stdout.write(f'  ✅ Created: {article.title}')
                created_count += 1
            else:
                self.stdout.write(f'  ♻️  Updated: {article.title}')
                updated_count += 1

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'✅ Seeding complete! Created: {created_count}, Updated: {updated_count}'))
        self.stdout.write(f'Total articles: {Article.objects.count()}')
