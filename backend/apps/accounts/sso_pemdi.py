"""SSO Pemdi (OAuth2 authorization code + PKCE) — spec
``doc_dari_ai/opencode/asncorpu/sso/sso-asncorpu.md``.

Empat endpoint yang terdaftar di Pemdi (URL harus persis — beda satu karakter
sudah ditolak IdP dengan galat 400)::

    GET  /api/sso/masuk         → redirect ke /oauth/authorize Pemdi (PKCE S256)
    GET  /api/sso/kembali       → callback: tukar code → userinfo → handoff JWT
    POST /api/sso/keluar        → back-channel logout (HMAC X-SSO-Waktu/X-SSO-Tanda)
    GET  /api/sso/daftar-akun   → daftar NIP+peran aktif (ditarik Pemdi tiap 05.00)

Alur ``kembali`` tidak berhenti di Django: ia menukar ``code`` lalu menyerahkan
sesi ke frontend lewat **kode handoff sekali pakai** di Redis (mekanisme sama
dengan ``sso_views.py`` fase F1) → halaman ``/auth/sso`` menukarnya menjadi
pasangan JWT SimpleJWT.

Aturan gerbang (dok 22 G1, tetap berlaku): **tanpa JIT** — NIP harus sudah
punya baris ``users`` aktif (username = NIP hasil push portal / ESIMPEG).
Akun non-ASN datang dengan ``nip: null`` → ditolak ``?sso=tidak-terdaftar``.

Back-channel ``/api/sso/keluar`` menyimpan **``sub`` + waktu keluar** di Redis
(lifetimes 8 hari > refresh token 7 hari); token yang membawa ``sub`` tersebut
dan terbit *sebelum* waktu keluar ditolak di jalur akses (DRF), refresh, verify,
dan ``jwt_required``. Token login password (tanpa ``sub``) tidak terpengaruh.
"""

import base64
import hashlib
import hmac
import json
import logging
import re
import secrets
import time
from urllib.parse import urlencode

import requests
from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponseRedirect, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

logger = logging.getLogger(__name__)

REVOKED_PREFIX = 'asncorpu:sso_revoked:'
REVOKED_TTL = 8 * 24 * 3600   # detik — melebihi refresh token (7 hari)
JENDELA_DETIK = 300           # jendela kesegaran header webhook (5 menit)
NIP_RE = re.compile(r'^\d{18}$')


# --------------------------------------------------------------------------
# Helper bersama
# --------------------------------------------------------------------------
def _acak() -> str:
    return secrets.token_urlsafe(32)


def _challenge(verifier: str) -> str:
    """PKCE S256: base64url(sha256(verifier)) tanpa padding."""
    digest = hashlib.sha256(verifier.encode('ascii')).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b'=').decode('ascii')


def _ke(path: str) -> HttpResponseRedirect:
    """Redirect ke frontend (APP_URL bila diisi, else FRONTEND_BASE_URL)."""
    basis = (getattr(settings, 'SSO_APP_URL', '') or settings.FRONTEND_BASE_URL).rstrip('/')
    return HttpResponseRedirect(f'{basis}{path}')


def sub_dicabut(sub, iat) -> bool:
    """True bila ``sub`` diakhiri dari Pemdi sebelum token terbit.

    Dipanggil dari jalur akses DRF, refresh, verify, dan ``jwt_required``.
    Redis mati → jangan blokir (fail-open, sama dengan TokenBlacklist).
    """
    if not sub:
        return False
    try:
        revoked_at = cache.get(f'{REVOKED_PREFIX}{sub}')
        if revoked_at is None:
            return False
        return float(iat or 0) < float(revoked_at)
    except Exception as exc:  # pragma: no cover - Redis down tidak boleh 500
        logger.error('[SSO-Pemdi] gagal cek revocation sub=%s: %s', sub, exc)
        return False


def _tanda_sah(request, pesan) -> bool:
    """Verifikasi HMAC-SHA256 header ``X-SSO-Waktu``/``X-SSO-Tanda`` (spec §lib/sso.ts).

    ``pesan(waktu)`` mengembalikan string yang di-HMAC — pola identik dengan
    ESIMPEG (``apps/accounts/sso_webhook.py``): jendela 300 detik + compare
    timing-safe.
    """
    if not settings.SSO_WEBHOOK_SECRET:
        return False
    waktu = request.headers.get('x-sso-waktu', '') or ''
    tanda = request.headers.get('x-sso-tanda', '') or ''
    if not re.fullmatch(r'\d+', waktu):
        return False
    if abs(time.time() - int(waktu)) > JENDELA_DETIK:
        return False
    harus = hmac.new(
        settings.SSO_WEBHOOK_SECRET.encode('utf-8'),
        pesan(waktu).encode('utf-8'),
        hashlib.sha256,
    ).hexdigest()
    # Panjang sama dulu supaya compare_digest tidak melempar; lalu compare aman.
    return len(tanda) == len(harus) and hmac.compare_digest(tanda.lower(), harus)


def _klaim_id_token(id_token: str) -> dict:
    """Decode payload id_token TANPA verifikasi tanda tangan.

    Aman dilakukan karena id_token diterima langsung dari endpoint token IdP
    lewat TLS dengan client_secret + PKCE (bukan dari browser). Dipakai sebagai
    cadangan bila ``/oauth/userinfo`` tidak terjangkau.
    """
    try:
        bagian = id_token.split('.')[1]
        bagian += '=' * (-len(bagian) % 4)
        return json.loads(base64.urlsafe_b64decode(bagian))
    except Exception:  # pragma: no cover
        logger.warning('[SSO-Pemdi] gagal decode id_token')
        return {}


# --------------------------------------------------------------------------
# 1) GET /api/sso/masuk — mulai login
# --------------------------------------------------------------------------
@require_GET
def sso_masuk(request):
    # Saklar darurat: Pemdi mati (SSO_CLIENT_ID kosong) → jatuh ke alur lama
    # bila OIDC Keycloak masih aktif, atau halaman login bila tidak ada SSO.
    if not settings.PEMDI_SSO_ENABLED:
        if getattr(settings, 'OIDC_ENABLED', False):
            return HttpResponseRedirect('/oidc/authenticate/')
        return HttpResponseRedirect('/')

    state = _acak()
    verifier = _acak()
    request.session['sso_state'] = state
    request.session['sso_state_ts'] = int(time.time())
    request.session['sso_verifier'] = verifier

    query = urlencode({
        'response_type': 'code',
        'client_id': settings.SSO_CLIENT_ID,
        'redirect_uri': _redirect_uri(),
        'scope': settings.SSO_RP_SCOPES,
        'state': state,
        'code_challenge': _challenge(verifier),
        'code_challenge_method': 'S256',
    })
    return HttpResponseRedirect(f'{settings.SSO_PEMDI_URL}/oauth/authorize?{query}')


def _redirect_uri() -> str:
    basis = (getattr(settings, 'SSO_APP_URL', '') or settings.FRONTEND_BASE_URL).rstrip('/')
    return f'{basis}/api/sso/kembali'


# --------------------------------------------------------------------------
# 2) GET /api/sso/kembali — callback: code → user → handoff JWT
# --------------------------------------------------------------------------
@require_GET
def sso_kembali(request):
    def gagal():
        return _ke('/login?sso=gagal')

    if not settings.PEMDI_SSO_ENABLED:
        return gagal()

    # Sekali pakai: state/verifier dihapus walau validasi gagal.
    state = request.session.pop('sso_state', None)
    ts = request.session.pop('sso_state_ts', 0) or 0
    verifier = request.session.pop('sso_verifier', None)
    code = request.GET.get('code') or ''

    if not code or not state or request.GET.get('state') != state or not verifier:
        logger.warning('[SSO-Pemdi] kembali: state/PKCE tidak cocok')
        return gagal()
    if time.time() - ts > settings.SSO_STATE_TTL:
        logger.warning('[SSO-Pemdi] kembali: state kedaluwarsa')
        return gagal()

    # Tukar code di endpoint token (server-to-server; PKCE verifier ikut).
    try:
        resp = requests.post(
            f'{settings.SSO_PEMDI_URL}/oauth/token',
            data={
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': _redirect_uri(),
                'client_id': settings.SSO_CLIENT_ID,
                'client_secret': settings.SSO_CLIENT_SECRET,
                'code_verifier': verifier,
            },
            headers={'Accept': 'application/json'},
            timeout=15,
        )
        if not resp.ok:
            logger.warning('[SSO-Pemdi] token endpoint %s: %s', resp.status_code, resp.text[:300])
            return gagal()
        token = resp.json()
    except requests.RequestException as exc:
        logger.error('[SSO-Pemdi] token endpoint gagal: %s', exc)
        return gagal()

    # Klaim identitas: /oauth/userinfo dulu (pola spec); id_token sebagai cadangan.
    info = {}
    access_token = token.get('access_token')
    if access_token:
        try:
            u = requests.get(
                f'{settings.SSO_PEMDI_URL}/oauth/userinfo',
                headers={'Authorization': f'Bearer {access_token}'},
                timeout=10,
            )
            if u.ok:
                info = u.json()
        except requests.RequestException as exc:
            logger.warning('[SSO-Pemdi] userinfo gagal (%s) — coba id_token', exc)
    if not info and token.get('id_token'):
        info = _klaim_id_token(token['id_token'])
    if not info:
        return gagal()

    nip = str(info.get('nip') or '').strip()
    if not nip:
        # Pemdi mengirim non-ASN dengan nip: null / jenis: non_asn.
        logger.info('[SSO-Pemdi] ditolak: klaim tanpa nip (non-ASN?) sub=%s', info.get('sub'))
        return _ke('/login?sso=tidak-terdaftar')

    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User.objects.filter(username__iexact=nip, is_active=True).first()
    if not user:
        logger.warning('[SSO-Pemdi] DITOLAK: NIP %s tidak terdaftar/aktif (tanpa JIT)', nip)
        return _ke('/login?sso=tidak-terdaftar')

    # Serahkan ke frontend lewat kode handoff sekali pakai (Redis, TTL 120 dtk).
    try:
        from apps.accounts.sso_views import _buat_kode
        kode = _buat_kode(user, sub=info.get('sub'), via='sso_pemdi')
    except Exception:  # pragma: no cover - Redis mati tidak boleh 500
        logger.exception('[SSO-Pemdi] gagal simpan handoff untuk user %s', user.pk)
        return gagal()

    logger.info('[SSO-Pemdi] %s (%s) lolos SSO Pemdi → frontend', user.username, user.pk)
    return _ke(f'/auth/sso?code={kode}')


# --------------------------------------------------------------------------
# 3) POST /api/sso/keluar — back-channel logout dari Pemdi
# --------------------------------------------------------------------------
@csrf_exempt
@require_POST
def sso_keluar(request):
    if not settings.SSO_WEBHOOK_SECRET:
        return JsonResponse(
            {'status': 'error', 'message': 'SSO webhook belum dikonfigurasi', 'code': 'WEBHOOK_UNCONFIGURED'},
            status=503,
        )

    # Body mentah dipakai apa adanya untuk HMAC (spec: `${waktu}.${rawBody}`).
    body = request.body.decode('utf-8', 'replace')
    if not _tanda_sah(request, lambda waktu: f'{waktu}.{body}'):
        return JsonResponse({'status': 'error', 'message': 'Tanda tangan tidak sah', 'code': 'BAD_SIGNATURE'}, status=401)

    try:
        data = json.loads(body or '{}')
    except ValueError:
        return JsonResponse({'status': 'error', 'message': 'Body bukan JSON', 'code': 'BAD_BODY'}, status=400)

    sub = str(data.get('sub') or '').strip()
    if not sub:
        return JsonResponse({'status': 'error', 'message': 'sub wajib diisi', 'code': 'MISSING_SUB'}, status=400)

    try:
        cache.set(f'{REVOKED_PREFIX}{sub}', int(time.time()), REVOKED_TTL)
    except Exception as exc:  # pragma: no cover
        logger.error('[SSO-Pemdi] gagal simpan revocation sub=%s: %s', sub, exc)
        return JsonResponse({'status': 'error', 'message': 'Gagal menyimpan revocation', 'code': 'STORAGE_ERROR'}, status=500)

    logger.info('[SSO-Pemdi] back-channel logout sub=%s → token lama dengan sub ini ditolak', sub)
    return JsonResponse({'ok': True, 'tercabut': sub}, status=200)


# --------------------------------------------------------------------------
# 4) GET /api/sso/daftar-akun — tarikan harian Pemdi (05.00)
# --------------------------------------------------------------------------
@require_GET
def sso_daftar_akun(request):
    if not settings.SSO_WEBHOOK_SECRET:
        return JsonResponse(
            {'status': 'error', 'message': 'SSO webhook belum dikonfigurasi', 'code': 'WEBHOOK_UNCONFIGURED'},
            status=503,
        )
    # Spec: HMAC(`GET\\n/api/sso/daftar-akun\\n${waktu}`) — tanpa body.
    if not _tanda_sah(request, lambda waktu: f'GET\n/api/sso/daftar-akun\n{waktu}'):
        return JsonResponse({'status': 'error', 'message': 'Tanda tangan tidak sah', 'code': 'BAD_SIGNATURE'}, status=401)

    from django.contrib.auth import get_user_model
    User = get_user_model()

    akun = []
    for u in User.objects.filter(is_active=True).order_by('id').iterator():
        if not NIP_RE.match(u.username or ''):
            continue
        try:
            grup = u.groups.first()
            peran = grup.name if grup else 'Personil'
        except Exception:  # pragma: no cover
            peran = 'Personil'
        # Cukup NIP + peran — jangan kirim nama/email/nomor HP (spec §daftar-akun).
        akun.append({'nip': str(u.username), 'peran': peran, 'aktif': True})

    return JsonResponse({
        'aplikasi': 'asncorpu',
        'dibuat': timezone.now().isoformat(),
        'akun': akun,
    }, status=200)
