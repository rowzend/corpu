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
            return None, 'USER_NOT_FOUND', 'Username tidak ditemukan'

        esimpeg_url = getattr(settings, 'ESIMPEG_API_URL', None)
        if not esimpeg_url:
            logger.warning("ESIMPEG_API_URL not configured")
            return None, 'USER_NOT_FOUND', 'Username tidak ditemukan'

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

            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    user_data = data.get('data', {}).get('user', {})
                    user = self._get_or_create_user_from_esimpeg(user_data, username, password)
                    if user:
                        return user, None, None
                    return None, 'USER_NOT_FOUND', 'Username tidak ditemukan'
                else:
                    error_message = data.get('message', 'Authentication failed')
                    error_code = data.get('code', 'INVALID_CREDENTIALS')
                    return None, error_code, error_message
            else:
                try:
                    data = response.json()
                    error_message = data.get('message', 'Authentication failed')
                    error_code = data.get('code', 'INVALID_CREDENTIALS')
                    return None, error_code, error_message
                except:
                    return None, 'INVALID_CREDENTIALS', 'Username atau password salah'

        except requests.exceptions.Timeout:
            logger.warning("ESIMPEG API timeout")
            return None, 'USER_NOT_FOUND', 'Username tidak ditemukan'
        except requests.exceptions.ConnectionError:
            logger.warning("ESIMPEG API connection error")
            return None, 'USER_NOT_FOUND', 'Username tidak ditemukan'
        except Exception as e:
            logger.error(f"ESIMPEG fallback error: {e}")
            return None, 'USER_NOT_FOUND', 'Username tidak ditemukan'

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
