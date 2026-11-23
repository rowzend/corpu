"""Autentikasi JWT yang menghormati pencabutan sesi SSO Pemdi.

Pencabutan back-channel (``POST /api/sso/keluar``) menyimpan ``sub`` + waktu
keluar di Redis. Token yang membawa ``sub`` tersebut dan terbit *sebelum* waktu
keluar harus ditolak di semua jalur; jalur refresh/verify/jwt_required sudah
memeriksa lewat ``TokenBlacklist`` + ``sub_dicabut`` — kelas ini melengkapi
jalur akses DRF (``DEFAULT_AUTHENTICATION_CLASSES``).

Token login password tidak membawa ``sub`` → tidak terpengaruh sama sekali
(login lokal tetap jalan walau SSO dicabut — prinsip rollback doc 147).
"""

from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.accounts.sso_pemdi import sub_dicabut


class PemdiJWTAuthentication(JWTAuthentication):
    """JWTAuthentication + cek revocation ``sub`` (SSO Pemdi)."""

    def get_validated_token(self, raw_token):
        validated = super().get_validated_token(raw_token)
        sub = validated.get('sub')
        if sub and sub_dicabut(sub, validated.get('iat') or 0):
            raise AuthenticationFailed(
                'Sesi SSO telah diakhiri dari Pemdi. Silakan masuk ulang.',
                code='SSO_SESSION_REVOKED',
            )
        return validated
