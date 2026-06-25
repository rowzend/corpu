import logging

from django.http import HttpResponse
from django.views.decorators.http import require_GET
from django.views.decorators.cache import cache_control
from django.views.decorators.clickjacking import xframe_options_exempt

from apps.manajemen.minio_service import MinioService

logger = logging.getLogger(__name__)


@require_GET
@cache_control(max_age=86400)
@xframe_options_exempt
def minio_proxy(request, key):
    minio = MinioService()
    if not minio._available:
        logger.warning('[MINIO_PROXY] Repository unreachable')
        resp = HttpResponse('Repository tidak dapat dijangkau', status=503, content_type='text/plain; charset=utf-8')
        resp['X-Frame-Options'] = 'SAMEORIGIN'
        return resp
    try:
        if not minio.exists(key):
            logger.warning(f'[MINIO_PROXY] File not found: {key}')
            resp = HttpResponse('File tidak ditemukan', status=404, content_type='text/plain; charset=utf-8')
            resp['X-Frame-Options'] = 'SAMEORIGIN'
            return resp
        file_bytes, content_type = minio.download(key)
        resp = HttpResponse(file_bytes, content_type=content_type)
        resp['X-Frame-Options'] = 'SAMEORIGIN'
        return resp
    except Exception as e:
        logger.error(f'[MINIO_PROXY] Error serving {key}: {e}')
        resp = HttpResponse('File tidak tersedia', status=404, content_type='text/plain; charset=utf-8')
        resp['X-Frame-Options'] = 'SAMEORIGIN'
        return resp
