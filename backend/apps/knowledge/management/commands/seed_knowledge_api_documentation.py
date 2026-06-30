"""
Seed Knowledge Base API Documentation
Adds all Knowledge Base API endpoints to API Documentation table

Usage:
  python manage.py seed_knowledge_api_documentation
"""
from django.core.management.base import BaseCommand
from apps.manajemen.models import ApiDocumentation


class Command(BaseCommand):
    help = 'Seed Knowledge Base API Documentation'

    def handle(self, *args, **options):
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.SUCCESS('🌱 Seeding Knowledge Base API Documentation'))
        self.stdout.write('=' * 70)

        # Define all Knowledge Base API endpoints
        api_endpoints = [
            # ============ ARTICLE ENDPOINTS ============
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/articles/',
                'description': '[PUBLIC] List all published articles with pagination, search, and filtering',
                'parameters': {
                    'query': {
                        'search': 'Search in title, content, excerpt',
                        'ordering': 'Sort by: created_at, published_at, view_count, rating_avg',
                        'page': 'Page number',
                        'page_size': 'Items per page (default: 20, max: 100)'
                    }
                },
                'is_public': True
            },
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/articles/<slug>/',
                'description': '[PUBLIC] Get article detail with AUTO VIEW TRACKING by IP address. Returns is_new_view flag.',
                'parameters': {
                    'path': {'slug': 'Article slug'}
                },
                'is_public': True
            },
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/articles/popular/',
                'description': '[PUBLIC] Get most viewed articles',
                'parameters': {
                    'query': {'limit': 'Number of articles (default: 10)'}
                },
                'is_public': True
            },
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/articles/featured/',
                'description': '[PUBLIC] Get featured articles',
                'parameters': {
                    'query': {'limit': 'Number of articles (default: 5)'}
                },
                'is_public': True
            },
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/articles/trending/',
                'description': '[PUBLIC] Get trending articles (most viewed in last 7 days)',
                'parameters': {
                    'query': {'limit': 'Number of articles (default: 10)'}
                },
                'is_public': True
            },
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/articles/most_liked/',
                'description': '[PUBLIC] Get most liked articles',
                'parameters': {
                    'query': {'limit': 'Number of articles (default: 10)'}
                },
                'is_public': True
            },
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/articles/<slug>/view_stats/',
                'description': '[PUBLIC] Get view statistics for an article (total, logged-in, anonymous, recent)',
                'parameters': {
                    'path': {'slug': 'Article slug'}
                },
                'is_public': True
            },
            {
                'method_type': 'POST',
                'url': '/apicorpu/public/1.0/knowledge/articles/<slug>/like/',
                'description': '[AUTH] Like an article. Returns updated like/dislike counts.',
                'parameters': {
                    'path': {'slug': 'Article slug'}
                },
                'is_public': False
            },
            {
                'method_type': 'POST',
                'url': '/apicorpu/public/1.0/knowledge/articles/<slug>/dislike/',
                'description': '[AUTH] Dislike an article. Returns updated like/dislike counts.',
                'parameters': {
                    'path': {'slug': 'Article slug'}
                },
                'is_public': False
            },
            {
                'method_type': 'DELETE',
                'url': '/apicorpu/public/1.0/knowledge/articles/<slug>/unlike/',
                'description': '[AUTH] Remove like/dislike from an article',
                'parameters': {
                    'path': {'slug': 'Article slug'}
                },
                'is_public': False
            },
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/articles/<slug>/user_action/',
                'description': '[PUBLIC] Get current user action on article (like/dislike/none)',
                'parameters': {
                    'path': {'slug': 'Article slug'}
                },
                'is_public': True
            },
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/articles/<slug>/who_liked/',
                'description': '[PUBLIC] Get list of users who liked this article',
                'parameters': {
                    'path': {'slug': 'Article slug'}
                },
                'is_public': True
            },
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/articles/<slug>/who_disliked/',
                'description': '[PUBLIC] Get list of users who disliked this article',
                'parameters': {
                    'path': {'slug': 'Article slug'}
                },
                'is_public': True
            },
            {
                'method_type': 'POST',
                'url': '/apicorpu/public/1.0/knowledge/articles/<slug>/share/',
                'description': '[PUBLIC] Track article share. Optional platform parameter.',
                'parameters': {
                    'path': {'slug': 'Article slug'},
                    'body': {'platform': 'facebook|twitter|whatsapp|linkedin|email|copy (optional)'}
                },
                'is_public': True
            },
            {
                'method_type': 'POST',
                'url': '/apicorpu/public/1.0/knowledge/articles/<slug>/submit_for_approval/',
                'description': '[AUTH] Submit article for approval (author only)',
                'parameters': {
                    'path': {'slug': 'Article slug'}
                },
                'is_public': False
            },
            {
                'method_type': 'POST',
                'url': '/apicorpu/public/1.0/knowledge/articles/<slug>/approve/',
                'description': '[STAFF] Approve article',
                'parameters': {
                    'path': {'slug': 'Article slug'},
                    'body': {'reason': 'Approval notes (optional)'}
                },
                'is_public': False
            },
            {
                'method_type': 'POST',
                'url': '/apicorpu/public/1.0/knowledge/articles/<slug>/reject/',
                'description': '[STAFF] Reject article',
                'parameters': {
                    'path': {'slug': 'Article slug'},
                    'body': {'reason': 'Rejection reason (required)'}
                },
                'is_public': False
            },
            {
                'method_type': 'POST',
                'url': '/apicorpu/public/1.0/knowledge/articles/<slug>/publish/',
                'description': '[AUTH] Publish approved article (staff or author)',
                'parameters': {
                    'path': {'slug': 'Article slug'}
                },
                'is_public': False
            },
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/articles/<slug>/approval_history/',
                'description': '[PUBLIC] Get approval history for article',
                'parameters': {
                    'path': {'slug': 'Article slug'}
                },
                'is_public': True
            },
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/articles/pending_approval/',
                'description': '[STAFF] Get articles pending approval',
                'parameters': None,
                'is_public': False
            },
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/articles/my_articles/',
                'description': '[AUTH] Get current user articles (all statuses)',
                'parameters': None,
                'is_public': False
            },
            
            # ============ RATING ENDPOINTS ============
            {
                'method_type': 'POST',
                'url': '/apicorpu/public/1.0/knowledge/ratings/',
                'description': '[AUTH] Create or update rating for an article (1-5 stars + optional feedback)',
                'parameters': {
                    'body': {
                        'article': 'Article ID',
                        'rating': '1-5 stars',
                        'feedback': 'Optional feedback text'
                    }
                },
                'is_public': False
            },
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/ratings/',
                'description': '[AUTH] List ratings with optional article filter',
                'parameters': {
                    'query': {
                        'article_id': 'Filter by article ID',
                        'article_slug': 'Filter by article slug'
                    }
                },
                'is_public': False
            },
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/ratings/my_ratings/',
                'description': '[AUTH] Get current user ratings',
                'parameters': None,
                'is_public': False
            },
            
            # ============ COMMENT ENDPOINTS ============
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/comments/',
                'description': '[PUBLIC] List comments with optional article filter. Supports nested comments (2 levels).',
                'parameters': {
                    'query': {
                        'article_id': 'Filter by article ID',
                        'article_slug': 'Filter by article slug',
                        'only_top_level': 'true (default) | false - Show only top-level comments',
                        'ordering': 'Sort by: created_at, like_count'
                    }
                },
                'is_public': True
            },
            {
                'method_type': 'POST',
                'url': '/apicorpu/public/1.0/knowledge/comments/',
                'description': '[AUTH] Create comment or reply',
                'parameters': {
                    'body': {
                        'article': 'Article ID',
                        'parent': 'Parent comment ID (null for top-level)',
                        'content': 'Comment text'
                    }
                },
                'is_public': False
            },
            {
                'method_type': 'PATCH',
                'url': '/apicorpu/public/1.0/knowledge/comments/<id>/',
                'description': '[AUTH] Update comment (author only)',
                'parameters': {
                    'path': {'id': 'Comment ID'},
                    'body': {'content': 'Updated comment text'}
                },
                'is_public': False
            },
            {
                'method_type': 'DELETE',
                'url': '/apicorpu/public/1.0/knowledge/comments/<id>/',
                'description': '[AUTH] Delete comment (author or staff)',
                'parameters': {
                    'path': {'id': 'Comment ID'}
                },
                'is_public': False
            },
            {
                'method_type': 'POST',
                'url': '/apicorpu/public/1.0/knowledge/comments/<id>/like/',
                'description': '[AUTH] Like a comment',
                'parameters': {
                    'path': {'id': 'Comment ID'}
                },
                'is_public': False
            },
            {
                'method_type': 'POST',
                'url': '/apicorpu/public/1.0/knowledge/comments/<id>/dislike/',
                'description': '[AUTH] Dislike a comment',
                'parameters': {
                    'path': {'id': 'Comment ID'}
                },
                'is_public': False
            },
            {
                'method_type': 'DELETE',
                'url': '/apicorpu/public/1.0/knowledge/comments/<id>/unlike/',
                'description': '[AUTH] Remove like/dislike from comment',
                'parameters': {
                    'path': {'id': 'Comment ID'}
                },
                'is_public': False
            },
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/comments/<id>/user_action/',
                'description': '[PUBLIC] Get current user action on comment (like/dislike/none)',
                'parameters': {
                    'path': {'id': 'Comment ID'}
                },
                'is_public': True
            },
            
            # ============ CATEGORY ENDPOINTS ============
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/categories/',
                'description': '[PUBLIC] List all active categories (hierarchical structure)',
                'parameters': {
                    'query': {
                        'search': 'Search in name, description',
                        'ordering': 'Sort by: name, order_index, created_at'
                    }
                },
                'is_public': True
            },
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/categories/<slug>/',
                'description': '[PUBLIC] Get category detail with article count',
                'parameters': {
                    'path': {'slug': 'Category slug'}
                },
                'is_public': True
            },
            
            # ============ TAG ENDPOINTS ============
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/tags/',
                'description': '[PUBLIC] List all tags with article count',
                'parameters': {
                    'query': {
                        'search': 'Search in name',
                        'ordering': 'Sort by: name, created_at'
                    }
                },
                'is_public': True
            },
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/tags/<slug>/',
                'description': '[PUBLIC] Get tag detail with article count',
                'parameters': {
                    'path': {'slug': 'Tag slug'}
                },
                'is_public': True
            },
            
            # ============ ANALYTICS ENDPOINTS ============
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/article-views/my_views/',
                'description': '[AUTH] Get current user view history',
                'parameters': None,
                'is_public': False
            },
            {
                'method_type': 'GET',
                'url': '/apicorpu/public/1.0/knowledge/article-likes/my_likes/',
                'description': '[AUTH] Get current user likes/dislikes',
                'parameters': None,
                'is_public': False
            },
        ]

        created_count = 0
        updated_count = 0
        skipped_count = 0

        for endpoint in api_endpoints:
            # Check if endpoint already exists
            existing = ApiDocumentation.objects.filter(
                method_type=endpoint['method_type'],
                url=endpoint['url']
            ).first()

            # Add is_public to parameters for filtering
            params = endpoint.get('parameters', {})
            if params is None:
                params = {}
            params['is_public'] = endpoint.get('is_public', False)

            if existing:
                # Update if description changed
                if existing.description != endpoint['description']:
                    existing.description = endpoint['description']
                    existing.parameters = params
                    existing.save()
                    updated_count += 1
                    self.stdout.write(f'  ♻️  Updated: {endpoint["method_type"]} {endpoint["url"]}')
                else:
                    skipped_count += 1
            else:
                # Create new
                ApiDocumentation.objects.create(
                    method_type=endpoint['method_type'],
                    url=endpoint['url'],
                    description=endpoint['description'],
                    parameters=params,
                    is_active=True
                )
                created_count += 1
                self.stdout.write(f'  ✅ Created: {endpoint["method_type"]} {endpoint["url"]}')

        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('✅ Knowledge Base API documentation seeded successfully!'))
        self.stdout.write(f'   Created: {created_count}')
        self.stdout.write(f'   Updated: {updated_count}')
        self.stdout.write(f'   Skipped: {skipped_count}')
        self.stdout.write(f'   Total: {created_count + updated_count + skipped_count} endpoints')
        self.stdout.write('')
        self.stdout.write('View at: /manajemen-aplikasi/api-documentation/')
        self.stdout.write('Public API: /manajemen-aplikasi/public-api-documentation/')
        self.stdout.write('')
