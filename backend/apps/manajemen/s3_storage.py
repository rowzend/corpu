from django.core.files.storage import Storage, FileSystemStorage
from django.core.files.base import ContentFile
from django.conf import settings
from urllib.parse import urljoin

from apps.manajemen.minio_service import MinioService


class MinioStorage(Storage):
    def __init__(self, bucket=None):
        self._minio = MinioService()
        self.bucket = bucket or settings.MINIO_BUCKET
        self._fallback = FileSystemStorage()

    def _key(self, name):
        return name

    def _check_available(self):
        return self._minio._available

    def _open(self, name, mode='rb'):
        if not self._check_available():
            return self._fallback._open(name, mode)
        data, content_type = self._minio.download(self._key(name))
        return ContentFile(data, name=name)

    def _save(self, name, content):
        if not self._check_available():
            return self._fallback._save(name, content)
        key = self._key(name)
        file_bytes = content.read()
        content_type = getattr(content, 'content_type', 'application/octet-stream')
        self._minio.upload(key, file_bytes, content_type)
        return name

    def exists(self, name):
        if not self._check_available():
            return self._fallback.exists(name)
        return self._minio.exists(self._key(name))

    def delete(self, name):
        if not self._check_available():
            return self._fallback.delete(name)
        self._minio.delete(self._key(name))

    def url(self, name):
        if not self._check_available():
            return self._fallback.url(name)
        if settings.MINIO_USE_PROXY:
            return urljoin(settings.MINIO_PROXY_URL, self._key(name))
        return self._minio.get_presigned_url(self._key(name))

    def size(self, name):
        if not self._check_available():
            return self._fallback.size(name)
        try:
            client = self._minio.client
            obj = client.head_object(Bucket=self.bucket, Key=self._key(name))
            return obj['ContentLength']
        except Exception:
            return 0

    def path(self, name):
        if not self._check_available():
            return self._fallback.path(name)
        raise NotImplementedError("MinIO storage doesn't support local paths")

    def get_available_name(self, name, max_length=None):
        return name

    def get_valid_name(self, name):
        return name
