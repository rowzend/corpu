"""
Custom Authentication Backends for ASN CORPU
Supports fallback authentication to ESIMPEG Python
"""
import requests
import json
import logging
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.conf import settings

logger = logging.getLogger(__name__)
User = get_user_model()


class AuthenticationError(Exception):
    """Custom exception for authentication errors with specific codes"""
    def __init__(self, code, message):
        self.code = code
        self.message = message
        super().__init__(message)


class FlexibleAuthBackend(ModelBackend):
    """
    Custom authentication backend that supports:
    1. Username/Email/NIP login
    2. Fallback to ESIMPEG Python if user not found locally
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None

        # Bersihkan sisa error dari percobaan login sebelumnya, supaya pesan
        # error lama tidak "nyangkut" dan ditampilkan untuk percobaan berikutnya.
        if hasattr(request, 'session'):
            request.session.pop('auth_error_code', None)
            request.session.pop('auth_error_message', None)

        # Step 1: Try local authentication first
        user = self._authenticate_local(username, password)
        if user:
            logger.info(f"Local authentication successful for: {username}")
            return user

        # Step 2: If local auth fails, try ESIMPEG fallback
        user, error_code, error_message = self._authenticate_esimpeg_fallback(username, password)
        if user:
            logger.info(f"ESIMPEG fallback authentication successful for: {username}")
            return user

        # Store error details for views to use
        if hasattr(request, 'session'):
            request.session['auth_error_code'] = error_code
            request.session['auth_error_message'] = error_message

        logger.warning(f"Authentication failed for: {username}")
        return None

    def _authenticate_local(self, username, password):
        """
        Authenticate against local ASN CORPU database
        Supports username, email, or NIP
        """
        try:
            user = User.objects.get(
                Q(username=username) |
                Q(email=username)
            )
            if user.check_password(password):
                return user
        except User.DoesNotExist:
            logger.debug(f"User not found locally: {username}")
        except User.MultipleObjectsReturned:
            logger.warning(f"Multiple users found for: {username}")
        except Exception as e:
            logger.error(f"Local authentication error: {e}")

        return None

    def _authenticate_esimpeg_fallback(self, username, password):
        """
        Fallback authentication to ESIMPEG Python
        If successful, creates or updates user in local database
        Returns tuple: (user, error_code, error_message)
        """
        if not getattr(settings, 'ESIMPEG_FALLBACK_ENABLED', True):
            return None, 'FALLBACK_DISABLED', (
                'Akun tidak ditemukan di sistem dan login melalui ESIMPEG sedang '
                'dinonaktifkan. Silakan hubungi administrator.'
            )

        esimpeg_url = getattr(settings, 'ESIMPEG_API_URL', None)
        if not esimpeg_url:
            logger.warning("ESIMPEG_API_URL not configured")
            return None, 'ESIMPEG_NOT_CONFIGURED', (
                'Akun tidak ditemukan dan layanan ESIMPEG belum dikonfigurasi. '
                'Silakan hubungi administrator.'
            )

        try:
            login_url = f"{esimpeg_url}/apisimpeg/5.0/auth/login"

            response = requests.post(
                login_url,
                json={'username': username, 'password': password},
                headers={
                    'Content-Type': 'application/json',
                    'User-Agent': 'ASN-CORPU-Fallback/1.0'
                },
                timeout=10
            )
        except requests.exceptions.Timeout:
            logger.warning("ESIMPEG API timeout")
            return None, 'ESIMPEG_TIMEOUT', (
                'Layanan ESIMPEG tidak merespons (timeout). Silakan coba lagi.'
            )
        except requests.exceptions.ConnectionError as e:
            logger.warning(f"ESIMPEG API connection error: {e}")
            return None, 'ESIMPEG_UNREACHABLE', (
                'Tidak dapat terhubung ke layanan ESIMPEG. Silakan coba lagi '
                'atau hubungi administrator.'
            )
        except Exception as e:
            logger.error(f"ESIMPEG fallback error: {e}")
            return None, 'ESIMPEG_ERROR', (
                'Terjadi kesalahan saat memverifikasi akun ke layanan ESIMPEG. '
                'Silakan coba lagi atau hubungi administrator.'
            )

        # Baca body respons (boleh HTML saat server error, jangan sampai exception)
        try:
            data = response.json()
        except (ValueError, json.JSONDecodeError):
            data = None

        # --- Sukses ---
        if (response.status_code == 200 and isinstance(data, dict)
                and data.get('status') == 'success'):
            user_data = data.get('data', {}).get('user', {}) or {}
            user = self._get_or_create_user_from_esimpeg(user_data, username, password)
            if user:
                return user, None, None
            # ESIMPEG menerima login, tapi gagal sinkron ke DB lokal
            logger.error(f"ESIMPEG login OK tapi sinkronisasi akun lokal gagal: {username}")
            return None, 'ESIMPEG_USER_SYNC_FAILED', (
                'Login ESIMPEG berhasil, tetapi gagal menyinkronkan akun ke '
                'sistem ini. Silakan hubungi administrator.'
            )

        # --- ESIMPEG merespons dengan pesan error (JSON) ---
        if isinstance(data, dict) and data.get('message'):
            error_code = data.get('code') or f'ESIMPEG_HTTP_{response.status_code}'
            return None, error_code, data.get('message')

        # --- ESIMPEG error server (HTML / tanpa JSON), mis. DisallowedHost ---
        if response.status_code >= 500:
            detail = response.text or ''
            if 'DisallowedHost' in detail:
                logger.error(
                    f"ESIMPEG menolak host (ALLOWED_HOSTS). URL={login_url} "
                    f"HTTP {response.status_code}"
                )
            else:
                logger.error(
                    f"ESIMPEG server error HTTP {response.status_code}: {detail[:300]}"
                )
            return None, 'ESIMPEG_SERVER_ERROR', (
                f'Layanan ESIMPEG mengalami kesalahan server (HTTP '
                f'{response.status_code}). Silakan hubungi administrator.'
            )

        # --- Respon tidak dikenal ---
        logger.warning(
            f"ESIMPEG login gagal HTTP {response.status_code}: "
            f"{(response.text or '')[:300]}"
        )
        return None, 'ESIMPEG_INVALID_RESPONSE', (
            'Layanan ESIMPEG memberikan respons yang tidak dikenali. '
            'Silakan coba lagi.'
        )

    def _get_or_create_user_from_esimpeg(self, user_data, username, password):
        """
        Find existing user or create new from ESIMPEG data.
        If user exists, update password and sync profile data.
        """
        try:
            from django.contrib.auth.models import Group

            name = user_data.get('name', username)
            email = user_data.get('email', f"{username}@esimpeg.local")
            user_id_opd = user_data.get('user_id_opd', 0)
            id_pegawai = user_data.get('id_pegawai', 0)

            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'name': name,
                    'user_id_opd': user_id_opd,
                    'id_pegawai': id_pegawai,
                    'is_active': True
                }
            )

            if created:
                user.set_password(password)
                user.save()
                logger.info(f"Created user from ESIMPEG: {username}")

                try:
                    user_group = Group.objects.get(name='User')
                    user.groups.add(user_group)
                except Group.DoesNotExist:
                    user_group = Group.objects.create(name='User')
                    user.groups.add(user_group)
            else:
                user.set_password(password)
                user.name = name
                user.email = email
                user.user_id_opd = user_id_opd
                user.id_pegawai = id_pegawai
                user.is_active = True
                user.save()
                logger.info(f"Updated user from ESIMPEG: {username}")

            return user

        except Exception as e:
            logger.error(f"Failed to get/create user from ESIMPEG: {e}")
            return None


class ESIMPEGOnlyBackend(ModelBackend):
    """
    Authentication backend that ONLY checks ESIMPEG
    Useful for testing or specific use cases
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None

        return self._authenticate_esimpeg(username, password)

    def _authenticate_esimpeg(self, username, password):
        """
        Direct authentication to ESIMPEG Python
        """
        esimpeg_url = getattr(settings, 'ESIMPEG_API_URL', None)
        if not esimpeg_url:
            return None

        try:
            login_url = f"{esimpeg_url}/apisimpeg/5.0/auth/login"

            response = requests.post(
                login_url,
                json={'username': username, 'password': password},
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    user, created = User.objects.get_or_create(
                        username=username,
                        defaults={
                            'email': f"{username}@esimpeg.local",
                            'name': username,
                            'is_active': True
                        }
                    )

                    if created:
                        user.set_password(password)
                        user.save()

                    return user

        except Exception as e:
            logger.error(f"ESIMPEG-only authentication error: {e}")

        return None
