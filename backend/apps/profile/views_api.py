import logging
import boto3
import requests
from botocore.config import Config
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import BasePermission, IsAuthenticated, AllowAny
from django.conf import settings
from django.core.files.base import ContentFile
from apps.manajemen.helpers import check_permission
from .models import ProfileSection, Position, Personalia, Brand
from .serializers import (
    ProfileSectionSerializer, PositionSerializer,
    PersonaliaSerializer, BrandSerializer
)
from apps.manajemen.minio_service import MinioService


def profile_permission(control):
    """
    Factory returning a DRF permission class for profile module (module 'profile').
    Maps HTTP method -> function name ('view'/'create'/'edit'/'delete').
    """
    _METHOD_MAP = {
        'GET': 'view',
        'POST': 'create',
        'PUT': 'edit',
        'PATCH': 'edit',
        'DELETE': 'delete',
    }

    class ProfilePermission(BasePermission):
        def has_permission(self, request, view):
            function = _METHOD_MAP.get(request.method)
            if not function:
                return True
            return check_permission(request.user, 'profile', control, function)

    return ProfilePermission

logger = logging.getLogger(__name__)
ESIMPEG_MINIO_BUCKET = 'esimpeg'


def _prepare_image_data(request, instance, field='image'):
    """
    Clear an image/photo field when the payload explicitly carries an empty
    value (null/empty string) and no new file is uploaded. The old file is
    deleted from storage (MinIO) and the field is stripped from the payload
    so the serializer does not validate it.
    """
    data = request.data
    has_file = bool(request.FILES.get(field))
    if field in data and data.get(field) in (None, '') and not has_file:
        current = getattr(instance, field, None)
        if current:
            try:
                current.delete(save=False)
            except Exception as e:
                logger.warning(f"Failed to delete {field} on {instance}: {e}")
        setattr(instance, field, None)
        instance.save(update_fields=[field, 'updated_at'])
        if hasattr(data, 'copy'):
            cleaned = data.copy()
            cleaned.pop(field, None)
            return cleaned
        return {k: v for k, v in data.items() if k != field}
    return data


def _download_photo_bytes(source_key):
    """Download photo bytes from ESIMPEG MinIO bucket or HTTP URL."""
    if not source_key:
        return None, None

    if source_key.startswith('http://') or source_key.startswith('https://'):
        try:
            resp = requests.get(source_key, timeout=10)
            if resp.status_code == 200:
                return resp.content, resp.headers.get('content-type', 'image/jpeg')
        except Exception as e:
            logger.warning(f"HTTP download failed for {source_key}: {e}")
            return None, None
        return None, None

    # Try ASNCorpu MinIO first
    try:
        ms = MinioService()
        if ms._available and ms.exists(source_key):
            return ms.download(source_key)
    except Exception:
        pass

    # Fallback: download from ESIMPEG MinIO bucket
    try:
        esimpeg_client = boto3.client(
            's3',
            endpoint_url=settings.MINIO_ENDPOINT,
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
            config=Config(signature_version='s3v4', connect_timeout=5, read_timeout=10),
            region_name='us-east-1',
            verify=False,
        )
        response = esimpeg_client.get_object(Bucket=ESIMPEG_MINIO_BUCKET, Key=source_key)
        return response['Body'].read(), response.get('ContentType', 'image/jpeg')
    except Exception as e:
        logger.warning(f"MinIO download failed for key='{source_key}': {e}")
        return None, None


def _copy_source_photo_to_personalia(instance, source_key):
    """Download photo from source and save to Personalia instance."""
    if not source_key:
        return
    data, content_type = _download_photo_bytes(source_key)
    if not data:
        return
    ext = 'jpg'
    if content_type:
        if 'png' in content_type:
            ext = 'png'
        elif 'gif' in content_type:
            ext = 'gif'
        elif 'webp' in content_type:
            ext = 'webp'
    instance.photo.save(f'foto.{ext}', ContentFile(data), save=True)


class ProfileSectionViewSet(viewsets.ModelViewSet):
    queryset = ProfileSection.objects.all()
    serializer_class = ProfileSectionSerializer
    permission_classes = [profile_permission('profile_section')]
    lookup_field = 'pk'

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'data': serializer.data
        })

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Section profile berhasil dibuat'
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = _prepare_image_data(request, instance, 'image')
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Section profile berhasil diperbarui'
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Section profile berhasil dihapus'
        }, status=status.HTTP_200_OK)


class PersonaliaViewSet(viewsets.ModelViewSet):
    queryset = Personalia.objects.all()
    serializer_class = PersonaliaSerializer
    permission_classes = [profile_permission('profile_personalia')]
    lookup_field = 'pk'

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'data': serializer.data
        })

    def create(self, request, *args, **kwargs):
        source_bupati_id = request.data.get('source_bupati_id')
        source_pegawai_id = request.data.get('source_pegawai_id')

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()

        if not request.FILES.get('photo') and (source_bupati_id or source_pegawai_id):
            try:
                if source_bupati_id:
                    from apps.api_simpeg.models import Bupati
                    bupati = Bupati.objects.get(id_bupati=source_bupati_id)
                    _copy_source_photo_to_personalia(instance, bupati.foto)
                elif source_pegawai_id:
                    from apps.api_simpeg.models import Pegawai
                    pegawai = Pegawai.objects.get(id_pegawai=source_pegawai_id)
                    _copy_source_photo_to_personalia(instance, pegawai.pas_foto)
                instance.refresh_from_db()
            except Exception as e:
                logger.warning(f"Failed to copy source photo to personalia: {e}")

        return Response({
            'success': True,
            'data': PersonaliaSerializer(instance).data,
            'message': 'Personalia berhasil ditambahkan'
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_photo = instance.photo
        data = _prepare_image_data(request, instance, 'photo')

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if request.FILES.get('photo') and old_photo:
            try:
                old_photo.delete(save=False)
            except Exception as e:
                logger.warning(f"Failed to delete old photo: {e}")

        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Personalia berhasil diperbarui'
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.photo:
            try:
                instance.photo.delete(save=False)
            except Exception as e:
                logger.warning(f"Failed to delete photo: {e}")
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Personalia berhasil dihapus'
        }, status=status.HTTP_200_OK)


class PositionViewSet(viewsets.ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    permission_classes = [profile_permission('profile_position')]
    lookup_field = 'pk'

    def get_queryset(self):
        if self.action == 'list':
            return Position.objects.filter(parent__isnull=True)
        return Position.objects.all()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'data': serializer.data
        })

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Jabatan berhasil ditambahkan'
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
            'message': 'Jabatan berhasil diperbarui'
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Jabatan berhasil dihapus'
        }, status=status.HTTP_200_OK)


class PublicPositionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Position.objects.filter(is_active=True)
    serializer_class = PositionSerializer
    permission_classes = [AllowAny]
    lookup_field = 'pk'

    def get_queryset(self):
        if self.action == 'list':
            return Position.objects.filter(parent__isnull=True, is_active=True)
        return Position.objects.filter(is_active=True)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'data': serializer.data
        })


# Public read-only views (no auth required)
class PublicProfileSectionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProfileSection.objects.filter(is_active=True)
    serializer_class = ProfileSectionSerializer
    permission_classes = [AllowAny]
    lookup_field = 'pk'

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'data': serializer.data
        })


class PublicPersonaliaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Personalia.objects.filter(is_active=True)
    serializer_class = PersonaliaSerializer
    permission_classes = [AllowAny]
    lookup_field = 'pk'

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'data': serializer.data
        })


class BrandViewSet(viewsets.ModelViewSet):
    """
    ViewSet untuk mengelola Brand institusi
    """
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [profile_permission('profile_section')]
    lookup_field = 'pk'

    def get_serializer_context(self):
        """Add request to serializer context for building absolute URLs"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'data': serializer.data
        })

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Brand berhasil ditambahkan'
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = _prepare_image_data(request, instance, 'image')
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Brand berhasil diperbarui'
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Brand berhasil dihapus'
        }, status=status.HTTP_200_OK)


class PublicBrandViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public ViewSet untuk Brand (read-only, no auth required)
    """
    queryset = Brand.objects.filter(is_active=True)
    serializer_class = BrandSerializer
    permission_classes = [AllowAny]
    lookup_field = 'pk'

    def get_serializer_context(self):
        """Add request to serializer context for building absolute URLs"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'data': serializer.data
        })
