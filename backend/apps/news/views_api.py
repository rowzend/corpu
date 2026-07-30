from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404

from .models import News
from .serializers import NewsListSerializer, NewsDetailSerializer, NewsWriteSerializer


class NewsViewSet(viewsets.ModelViewSet):
    queryset = News.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'excerpt', 'content']
    ordering_fields = ['published_at', 'created_at', 'views']
    ordering = ['-published_at', '-created_at']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return NewsWriteSerializer
        if self.action == 'list':
            return NewsListSerializer
        return NewsDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return News.objects.all()
        return News.objects.filter(status='published')

    def get_object(self):
        queryset = self.get_queryset()
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup = self.kwargs.get(lookup_url_kwarg)

        if lookup is not None:
            try:
                pk = int(lookup)
                obj = get_object_or_404(queryset, pk=pk)
            except (ValueError, TypeError):
                obj = get_object_or_404(queryset, slug=lookup)

            self.check_object_permissions(self.request, obj)
            return obj
        return super().get_object()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return Response({
                'success': True,
                'data': serializer.data,
                'total': self.paginator.page.paginator.count,
            })

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'total': len(serializer.data),
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({'success': True, 'data': serializer.data})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({'success': True, 'data': NewsDetailSerializer(serializer.instance).data}, status=201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({'success': True, 'data': NewsDetailSerializer(serializer.instance).data})

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({'success': True, 'message': 'Berita berhasil dihapus'})

    @action(detail=False, methods=['get'])
    def latest(self, request):
        limit = int(request.query_params.get('limit', 3))
        news = self.get_queryset().filter(status='published')[:limit]
        serializer = NewsListSerializer(news, many=True)
        return Response({'success': True, 'data': serializer.data})

    @action(detail=False, methods=['get'], url_path='category/(?P<category>[^/.]+)')
    def by_category(self, request, category=None):
        limit = int(request.query_params.get('limit', 10))
        news = self.get_queryset().filter(
            category=category, status='published'
        )[:limit]
        serializer = NewsListSerializer(news, many=True)
        return Response({'success': True, 'data': serializer.data})
