from rest_framework import viewsets, status
from rest_framework.permissions import BasePermission, AllowAny
from rest_framework.response import Response
from apps.manajemen.helpers import check_permission
from .models import HeroImage
from .serializers import HeroImageSerializer

def hero_permission():
    """
    Factory returning a DRF permission class for hero module.
    Maps HTTP method -> function ('view'/'create'/'edit'/'delete').
    """
    _METHOD_MAP = {
        'GET': 'view',
        'POST': 'create',
        'PUT': 'edit',
        'PATCH': 'edit',
        'DELETE': 'delete',
    }

    class HeroPermission(BasePermission):
        def has_permission(self, request, view):
            user = getattr(request, 'user', None)
            if user is None or not getattr(user, 'is_authenticated', False):
                return False
            function = _METHOD_MAP.get(request.method)
            if not function:
                return True
            return check_permission(user, 'hero', 'hero_banner', function)

    return HeroPermission


class HeroImageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HeroImage.objects.filter(is_active=True)
    serializer_class = HeroImageSerializer
    permission_classes = [AllowAny]
    lookup_field = 'pk'

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({'success': True, 'data': serializer.data})


class HeroImageAdminViewSet(viewsets.ModelViewSet):
    queryset = HeroImage.objects.all()
    serializer_class = HeroImageSerializer
    permission_classes = [hero_permission()]
    lookup_field = 'pk'

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Hero image berhasil ditambahkan'
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Hero image berhasil diperbarui'
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Hero image berhasil dihapus'
        }, status=status.HTTP_200_OK)
