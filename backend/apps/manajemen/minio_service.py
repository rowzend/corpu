import boto3
import logging
from botocore.config import Config
from botocore.exceptions import ClientError
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)


class MinioService:
    CACHE_KEY_AVAILABLE = 'minio_available'
    CACHE_TTL = 60

    def __init__(self):
        self.bucket = settings.MINIO_BUCKET
        self._available = True
        self.client = None

        cached = cache.get(self.CACHE_KEY_AVAILABLE)
        if cached is False:
            self._available = False
            return

        try:
            self.client = boto3.client(
                's3',
                endpoint_url=settings.MINIO_ENDPOINT,
                aws_access_key_id=settings.MINIO_ACCESS_KEY,
                aws_secret_access_key=settings.MINIO_SECRET_KEY,
                config=Config(
                    signature_version='s3v4',
                    connect_timeout=2,
                    read_timeout=3,
                    retries={'max_attempts': 1},
                ),
                region_name=settings.MINIO_REGION,
                verify=False,
            )
            self._ensure_bucket()
            cache.set(self.CACHE_KEY_AVAILABLE, True, self.CACHE_TTL)
        except Exception as e:
            logger.warning(f'MinIO unreachable at {settings.MINIO_ENDPOINT}: {e}')
            self._available = False
            self.client = None
            cache.set(self.CACHE_KEY_AVAILABLE, False, self.CACHE_TTL)

    def _ensure_bucket(self):
        try:
            self.client.head_bucket(Bucket=self.bucket)
        except ClientError:
            self.client.create_bucket(Bucket=self.bucket)
            logger.info(f'Created bucket: {self.bucket}')

    def upload(self, key, file_bytes, content_type='application/octet-stream'):
        if not self._available:
            raise ConnectionError('MinIO not available')
        self.client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=file_bytes,
            ContentType=content_type,
        )
        return key

    def upload_base64(self, key, base64_content, content_type='application/pdf'):
        import base64
        file_bytes = base64.b64decode(base64_content)
        return self.upload(key, file_bytes, content_type)

    def download(self, key):
        if not self._available:
            raise ConnectionError('MinIO not available')
        response = self.client.get_object(Bucket=self.bucket, Key=key)
        return response['Body'].read(), response.get('ContentType', 'application/octet-stream')

    def delete(self, key):
        if not self._available:
            raise ConnectionError('MinIO not available')
        self.client.delete_object(Bucket=self.bucket, Key=key)

    def exists(self, key):
        if not self._available:
            return False
        try:
            self.client.head_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError:
            return False

    def get_presigned_url(self, key, expires=3600):
        if not self._available:
            raise ConnectionError('MinIO not available')
        return self.client.generate_presigned_url(
            'get_object',
            Params={'Bucket': self.bucket, 'Key': key},
            ExpiresIn=expires,
        )

    def get_file_response(self, key):
        from django.http import HttpResponse, Http404
        if not self._available:
            raise ConnectionError('MinIO not available')
        try:
            obj = self.client.get_object(Bucket=self.bucket, Key=key)
            data = obj['Body'].read()
            content_type = obj.get('ContentType', 'application/octet-stream')
            response = HttpResponse(data, content_type=content_type)
            filename = key.split('/')[-1]
            response['Content-Disposition'] = f'inline; filename="{filename}"'
            return response
        except ClientError:
            raise Http404('File not found')

    def list_files(self, prefix=''):
        if not self._available:
            return []
        response = self.client.list_objects_v2(Bucket=self.bucket, Prefix=prefix)
        return response.get('Contents', [])
