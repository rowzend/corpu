import requests
import logging
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)


class EsimpegAPIService:
    def __init__(self):
        self.base_url = getattr(settings, 'ESIMPEG_API_URL', 'http://localhost:8000')
        self.timeout = getattr(settings, 'ESIMPEG_API_TIMEOUT', 10)
        self.host_header = getattr(settings, 'ESIMPEG_API_HOST_HEADER', None)

    def login(self, username, password):
        url = f"{self.base_url}/apisimpeg/5.0/auth/login"
        headers = {'Content-Type': 'application/json'}
        if self.host_header:
            headers['Host'] = self.host_header

        try:
            response = requests.post(url, json={'username': username, 'password': password}, headers=headers, timeout=self.timeout)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    logger.info(f"ESIMPEG API login successful for user: {username}")
                    return data.get('data')
                logger.warning(f"ESIMPEG API login failed: {data.get('message')}")
                return None
            logger.error(f"ESIMPEG API login failed with status {response.status_code}")
            return None
        except requests.exceptions.Timeout:
            logger.error(f"ESIMPEG API login timeout for user: {username}")
            return None
        except requests.exceptions.ConnectionError:
            logger.error(f"ESIMPEG API connection error (API might be down)")
            return None
        except Exception as e:
            logger.error(f"ESIMPEG API login error: {str(e)}")
            return None

    def verify_token(self, token):
        url = f"{self.base_url}/apisimpeg/5.0/auth/verify"
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        if self.host_header:
            headers['Host'] = self.host_header
        try:
            response = requests.post(url, headers=headers, timeout=self.timeout)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"ESIMPEG API verify token error: {str(e)}")
            return False

    def refresh_token(self, refresh_token):
        url = f"{self.base_url}/apisimpeg/5.0/auth/refresh"
        try:
            response = requests.post(url, json={'refresh_token': refresh_token}, headers={'Content-Type': 'application/json'}, timeout=self.timeout)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    return data.get('data')
            return None
        except Exception as e:
            logger.error(f"ESIMPEG API refresh token error: {str(e)}")
            return None

    def get_pegawai_list(self, token, page=1, per_page=50, search=None, id_opd=None):
        url = f"{self.base_url}/apisimpeg/5.0/pegawai/data/list"
        params = {'page': page, 'per_page': per_page}
        if search:
            params['search'] = search
        if id_opd:
            params['id_opd'] = id_opd

        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        if self.host_header:
            headers['Host'] = self.host_header

        try:
            response = requests.get(url, params=params, headers=headers, timeout=self.timeout)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    return data.get('data')
                elif 'data' in data and isinstance(data.get('data'), dict) and 'items' in data['data']:
                    return data['data']
            return None
        except Exception as e:
            logger.error(f"ESIMPEG API get pegawai list error: {str(e)}")
            return None

    def get_pegawai_by_nip(self, token, nip):
        url = f"{self.base_url}/apisimpeg/5.0/pegawai/data/nip/{nip}"
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        if self.host_header:
            headers['Host'] = self.host_header
        try:
            response = requests.get(url, headers=headers, timeout=self.timeout)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    return data.get('data')
            return None
        except Exception as e:
            logger.error(f"ESIMPEG API get pegawai by NIP error: {str(e)}")
            return None

    def get_bupati_list(self, token, status=None):
        url = f"{self.base_url}/apisimpeg/5.0/bupati/list"
        params = {}
        if status is not None:
            params['status'] = status

        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        if self.host_header:
            headers['Host'] = self.host_header

        try:
            response = requests.get(url, params=params, headers=headers, timeout=self.timeout)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success' and 'data' in data:
                    return data['data']
                if 'data' in data and isinstance(data.get('data'), dict) and 'items' in data['data']:
                    return data['data']
            return None
        except Exception as e:
            logger.error(f"ESIMPEG API get bupati list error: {str(e)}")
            return None

    def get_unit_kerja_list(self, token, page=1, per_page=200, search=None, status=None):
        url = f"{self.base_url}/apisimpeg/5.0/unit-kerja/list"
        params = {'page': page, 'per_page': per_page}
        if search:
            params['search'] = search
        if status is not None:
            params['status'] = status

        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        if self.host_header:
            headers['Host'] = self.host_header

        try:
            response = requests.get(url, params=params, headers=headers, timeout=self.timeout)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    return data.get('data')
                if 'data' in data and isinstance(data.get('data'), dict) and 'items' in data['data']:
                    return data['data']
            return None
        except Exception as e:
            logger.error(f"ESIMPEG API get unit kerja list error: {str(e)}")
            return None

    def is_api_available(self):
        cache_key = 'esimpeg_api_available'
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        url = f"{self.base_url}/health"
        try:
            response = requests.get(url, timeout=3)
            available = response.status_code == 200
            cache.set(cache_key, available, 60)
            return available
        except Exception:
            cache.set(cache_key, False, 60)
            return False
