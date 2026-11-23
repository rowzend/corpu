"""Backend autentikasi OIDC (SSO Keycloak realm `pemda`) untuk ASN Corpu.

Dipakai HANYA bila `OIDC_RP_CLIENT_ID` di-set di environment
(lihat blok "SSO OIDC" di `core/settings.py`).

Aturan (dok 22 G1 + dok 25 C1):
- **TANPA JIT**: user harus sudah punya baris di tabel `users` asncorpu dan
  aktif. Approval admin (portal / register asncorpu) adalah gerbangnya —
  SSO hanya menggantikan form password.
- Pencarian user memakai **`username` ATAU `email`** karena username berbeda
  menurut pintu masuknya:
    * pegawai hasil push portal 8020 → `username` = **NIP**
    * pendaftar umum (dok 23)      → `username` = **email**
  Tanpa aturan ini, seluruh pegawai hasil daftar portal akan ditolak SSO.
- Role/permission lokal TIDAK pernah diambil dari klaim Keycloak.
"""

import logging

from django.contrib.auth import get_user_model
from django.db.models import Q
from mozilla_django_oidc.auth import OIDCAuthenticationBackend

logger = logging.getLogger(__name__)
User = get_user_model()


class AsncorpuOIDCAuthenticationBackend(OIDCAuthenticationBackend):
    """Cocokkan klaim Keycloak ke baris user asncorpu (tanpa membuat user baru)."""

    def get_userinfo(self, access_token, id_token, payload):
        """Pakai klaim id_token, jangan panggil endpoint /userinfo.

        Pola sama dengan portal/ESIMPEG/survey (dok 17 G.3, doc 78 §7.2):
        /userinfo menolak token dengan "Invalid token issuer" bila host server
        (172.20.0.1 / host.docker.internal) berbeda dari host penerbit token
        (localhost = host browser, supaya cookie session Keycloak dibagi
        dengan portal). id_token sudah diverifikasi tanda tangan + nonce.
        """
        return payload

    def _kunci(self, claims):
        username = (claims.get('preferred_username') or '').strip()
        email = (claims.get('email') or '').strip()
        return username, email

    def filter_users_by_claims(self, claims):
        """Cari user aktif berdasarkan username NIP **atau** email."""
        username, email = self._kunci(claims)
        if not username and not email:
            logger.warning('[SSO] asncorpu DITOLAK: klaim tanpa username/email')
            return User.objects.none()

        kondisi = Q()
        if username:
            kondisi |= Q(username__iexact=username)
        if email:
            kondisi |= Q(email__iexact=email)

        qs = User.objects.filter(kondisi, is_active=True)
        if not qs.exists():
            logger.warning(
                "[SSO] asncorpu DITOLAK: '%s' / '%s' tidak terdaftar atau nonaktif "
                '(tanpa JIT — gerbang dok 22)',
                username, email,
            )
            return User.objects.none()
        return qs

    def create_user(self, claims):
        """Tidak pernah dipakai (OIDC_CREATE_USER=False) — dipertahankan eksplisit."""
        logger.warning(
            "[SSO] asncorpu: create_user dipanggil untuk '%s' — ditolak (tanpa JIT)",
            claims.get('preferred_username'),
        )
        return None

    def update_user(self, user, claims):
        """Sinkronkan nama & email saja — role/permission tidak disentuh."""
        fields = []
        email = (claims.get('email') or '').strip()
        name = (claims.get('name') or '').strip()
        if email and user.email != email:
            user.email = email
            fields.append('email')
        if name and getattr(user, 'name', None) != name:
            user.name = name
            fields.append('name')
        if fields:
            try:
                user.save(update_fields=fields)
            except Exception:  # pragma: no cover - jangan gagalkan login
                logger.exception('[SSO] gagal sinkron profil user %s', user.pk)
        return user
