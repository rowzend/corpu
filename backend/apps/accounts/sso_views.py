"""SSO OIDC → sesi frontend asncorpu (dok 22 / dok 25 fase F1).

Kenapa perlu modul ini
----------------------
Aplikasi asncorpu adalah Next.js yang menyimpan sesi di **JWT localStorage +
cookie `token`** (`frontend/lib/services/auth.service.ts`). Login lewat Django
(OIDC) hanya membuat *session Django*, sehingga middleware Next tetap melihat
"belum login" dan melempar user ke `/login` — persis masalah yang muncul saat
uji F1. Jadi callback OIDC di sini tidak berhenti di Django: ia menukar sesi
Django menjadi **kode sekali pakai** (TTL 120 detik, disimpan di Redis) lalu
mengarahkan browser ke `/auth/sso?code=...`. Halaman itu menukar kode menjadi
pasangan JWT (endpoint `apicorpu/auth/1.0/sso-exchange/`) dan menyimpannya
dengan cara yang sama seperti login password.

Kenapa kode, bukan token langsung di URL: token di query string bocor lewat
riwayat browser, header Referer, dan log akses nginx. Kode berumur pendek dan
sekali pakai jauh lebih aman.

Aturan tetap sama dengan `backends_oidc.py`: **tanpa JIT**, user harus sudah
terdaftar & aktif di tabel `users` asncorpu.
"""

import logging
import secrets

from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponseRedirect, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from mozilla_django_oidc.views import OIDCAuthenticationCallbackView
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger(__name__)

KODE_PREFIX = 'asncorpu:sso_handoff:'
KODE_TTL = 120  # detik


def _buat_kode(user):
    """Simpan id user di Redis dengan kode acak sekali pakai."""
    kode = secrets.token_urlsafe(32)
    cache.set(f'{KODE_PREFIX}{kode}', user.pk, KODE_TTL)
    return kode


class SsoCallbackView(OIDCAuthenticationCallbackView):
    """Callback OIDC: sesudah user Django terautentikasi, serahkan ke frontend."""

    def login_success(self):
        user = self.user
        try:
            kode = _buat_kode(user)
        except Exception:  # pragma: no cover - Redis mati tidak boleh 500
            logger.exception('[SSO] gagal menyimpan kode handoff untuk user %s', user.pk)
            return HttpResponseRedirect('/sso-ditolak/?alasan=handoff')

        tujuan = f'{settings.FRONTEND_BASE_URL}/auth/sso?code={kode}'
        logger.info('[SSO] asncorpu: %s (%s) lolos SSO → frontend', user.username, user.pk)
        return HttpResponseRedirect(tujuan)


@csrf_exempt
@require_POST
def sso_exchange(request):
    """Tukar kode handoff (sekali pakai) menjadi JWT seperti respons login biasa."""
    kode = ''
    try:
        import json
        kode = (json.loads(request.body or b'{}') or {}).get('code', '')
    except (ValueError, AttributeError):
        kode = ''
    if not kode:
        kode = request.POST.get('code', '')

    kunci = f'{KODE_PREFIX}{kode}'
    user_id = cache.get(kunci) if kode else None
    if not user_id:
        return JsonResponse({
            'status': 'error',
            'message': 'Kode SSO tidak valid atau sudah kedaluwarsa. Silakan masuk ulang.',
            'code': 'SSO_CODE_INVALID',
        }, status=400)

    # Sekali pakai: hapus sebelum diproses supaya klik ganda tidak menghasilkan
    # dua sesi.
    cache.delete(kunci)

    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Akun tidak ditemukan.',
            'code': 'USER_NOT_FOUND',
        }, status=404)

    if not user.is_active:
        return JsonResponse({
            'status': 'error',
            'message': 'Akun tidak aktif',
            'code': 'USER_INACTIVE',
        }, status=403)

    refresh = RefreshToken.for_user(user)
    user.last_login = timezone.now()
    user.save(update_fields=['last_login'])

    try:
        from core.models import MsLogData
        MsLogData.log_login(user, request, via='sso_oidc')
    except Exception as exc:  # pragma: no cover - log tidak boleh menggagalkan login
        logger.error('Failed to log SSO login activity: %s', exc)

    return JsonResponse({
        'status': 'success',
        'message': 'Login successful',
        'data': {
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'token_type': 'Bearer',
            'expires_in': 86400,
            'user': {
                'user_id': user.id,
                'username': user.username,
                'name': user.name or '',
                'email': user.email or '',
                'id_pegawai': user.id_pegawai or 0,
                'user_id_opd': user.user_id_opd or 0,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
            },
        },
        'version': '5.0',
    }, status=200)
