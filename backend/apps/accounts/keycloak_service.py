"""
Push user self-register asncorpu → Keycloak (realm `pemda`).

Pola sama dengan survey_pemda_python/core/oidc_provision.py (dokumen sso/):
- User lokal = sumber kebenaran status pendaftaran (pending/approved/rejected)
- Keycloak   = penyimpan kredensial:
    * saat register : user dibuat DISABLED (enabled=false) + password di-set
                      (saat inilah satu-satunya saat kita tahu password plaintext)
    * saat approve  : user di-ENABLE (enabled=true)

KEAMANAN realm bareng (pemda dipakai survey/ESIMPEG/asncorpu):
  Setiap user yang dibuat asncorpu dimasukkan ke GROUP penanda `asncorpu`
  (dibuat otomatis bila belum ada). Operasi "disable / ganti password / enable"
  HANYA dilakukan pada user yang tergabung group itu — jika username yang sama
  sudah dipakai user app lain, kita SKIP + log warning (register lokal tetap
  sukses; jangan pernah merusak akun app lain).

  CATATAN: memakai GROUP, bukan user attribute — Keycloak 26 hanya menyimpan
  atribut yang dideklarasikan di declarative user profile realm, atribut liar
  dibuang diam-diam walau lewat Admin API (sudah teruji).

Env (python-decouple, lihat core/settings.py):
  KEYCLOAK_ADMIN_URL    kosong = fitur MATI (return 'skipped')
  KEYCLOAK_ADMIN_USERNAME / KEYCLOAK_ADMIN_PASSWORD   (default admin/admin — lokal)
  KEYCLOAK_REALM                                (default: pemda)

Tidak PERNAH memblokir register/approve: semua error ditangkap → return 'error:...'
+ warning di log.
"""
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

TIMEOUT = 8
ORIGIN_GROUP = 'asncorpu'  # group penanda kepemilikan user di Keycloak

# cache group id per proses (gunicorn worker) supaya tidak query berulang
_owner_group_cache: dict = {}


def _base():
    return settings.KEYCLOAK_ADMIN_URL.rstrip('/')


def _realm():
    return settings.KEYCLOAK_REALM


def _admin_token():
    """Ambil admin token: password grant client 'admin-cli' di realm master."""
    r = requests.post(
        f"{_base()}/realms/master/protocol/openid-connect/token",
        data={
            'grant_type': 'password',
            'client_id': 'admin-cli',
            'username': settings.KEYCLOAK_ADMIN_USERNAME,
            'password': settings.KEYCLOAK_ADMIN_PASSWORD,
        },
        timeout=TIMEOUT,
    )
    r.raise_for_status()
    return r.json()['access_token']


def _headers(token):
    return {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}


def _find_user(username, token):
    """Cari user by username (exact) → dict user Keycloak atau None."""
    r = requests.get(
        f"{_base()}/admin/realms/{_realm()}/users",
        params={'username': username, 'exact': True},
        headers=_headers(token),
        timeout=TIMEOUT,
    )
    r.raise_for_status()
    users = r.json()
    return users[0] if users else None


def _ensure_owner_group(token):
    """Ambil/buat group penanda `asncorpu` → group id (cached per proses)."""
    if ORIGIN_GROUP in _owner_group_cache:
        return _owner_group_cache[ORIGIN_GROUP]

    r = requests.get(
        f"{_base()}/admin/realms/{_realm()}/groups",
        params={'search': ORIGIN_GROUP},
        headers=_headers(token),
        timeout=TIMEOUT,
    )
    r.raise_for_status()
    for g in r.json():
        if g.get('name') == ORIGIN_GROUP:
            _owner_group_cache[ORIGIN_GROUP] = g['id']
            return g['id']

    r = requests.post(
        f"{_base()}/admin/realms/{_realm()}/groups",
        json={'name': ORIGIN_GROUP},
        headers=_headers(token),
        timeout=TIMEOUT,
    )
    if r.status_code == 201:
        loc = (r.headers.get('Location') or '').rstrip('/')
        gid = loc.split('/')[-1]
        if gid:
            _owner_group_cache[ORIGIN_GROUP] = gid
            return gid
    elif r.status_code == 409:  # balapan dengan proses lain → cari lagi
        r = requests.get(
            f"{_base()}/admin/realms/{_realm()}/groups",
            params={'search': ORIGIN_GROUP},
            headers=_headers(token),
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        for g in r.json():
            if g.get('name') == ORIGIN_GROUP:
                _owner_group_cache[ORIGIN_GROUP] = g['id']
                return g['id']

    raise RuntimeError(f'gagal membuat group penanda {ORIGIN_GROUP} di Keycloak')


def _owned(kc_user_id, token):
    """True jika user Keycloak ini milik asncorpu (tergabung group penanda)."""
    try:
        r = requests.get(
            f"{_base()}/admin/realms/{_realm()}/users/{kc_user_id}/groups",
            headers=_headers(token),
            timeout=TIMEOUT,
        )
        if r.status_code != 200:
            logger.warning('Keycloak: gagal cek group user %s → HTTP %s',
                           kc_user_id, r.status_code)
            return False
        return any(g.get('name') == ORIGIN_GROUP for g in r.json())
    except requests.RequestException as e:
        logger.warning('Keycloak: gagal cek group user %s: %s', kc_user_id, e)
        return False


def ensure_keycloak_user(username, password, full_name='', email='', enabled=False):
    """
    Dipanggil SAAT REGISTER — pastikan user ada di Keycloak (disabled) + masuk
    group penanda `asncorpu`.

    Return: 'created' | 'updated' | 'exists-foreign' | 'skipped' | 'error:...'
    """
    if not settings.KEYCLOAK_ADMIN_URL:
        return 'skipped'
    try:
        token = _admin_token()
        kc_user = _find_user(username, token)

        if kc_user is None:
            parts = (full_name or username).split(' ', 1)
            payload = {
                'username': username,
                'email': email or None,
                'firstName': parts[0],
                'lastName': parts[1] if len(parts) > 1 else '',
                'enabled': bool(enabled),
                'emailVerified': False,
                'credentials': [{
                    'type': 'password',
                    'value': password,
                    'temporary': False,
                }],
            }
            r = requests.post(
                f"{_base()}/admin/realms/{_realm()}/users",
                json=payload,
                headers=_headers(token),
                timeout=TIMEOUT,
            )
            if r.status_code == 201:
                # tandai kepemilikan: masukkan ke group penanda
                uid = None
                loc = (r.headers.get('Location') or '').rstrip('/')
                if loc:
                    uid = loc.split('/')[-1]
                if not uid:
                    found = _find_user(username, token)
                    uid = found.get('id') if found else None
                if uid:
                    try:
                        gid = _ensure_owner_group(token)
                        # KC 26: tambah anggota group = PUT users/{id}/groups/{gid}
                        # (POST groups/{gid}/members/{uid} → 404, sudah teruji)
                        mr = requests.put(
                            f"{_base()}/admin/realms/{_realm()}/users/{uid}/groups/{gid}",
                            headers=_headers(token),
                            timeout=TIMEOUT,
                        )
                        if mr.status_code not in (200, 204):
                            logger.error(
                                'Keycloak: user %s GAGAL masuk group %s → HTTP %s %s '
                                '(approve nanti tidak akan bisa enable)',
                                username, ORIGIN_GROUP, mr.status_code, mr.text[:200],
                            )
                    except (requests.RequestException, RuntimeError) as e:
                        # tanpa group, user ini dianggap "bukan milik" → enable
                        # saat approve akan dilewati. Log keras agar cepat ketahuan.
                        logger.error(
                            'Keycloak: user %s dibuat tapi GAGAL masuk group %s: %s '
                            '(approve nanti tidak akan bisa enable)',
                            username, ORIGIN_GROUP, e,
                        )
                return 'created'
            if r.status_code != 409:  # 409 = balapan, coba pakai baris yg sudah ada
                logger.warning('Keycloak create user %s → HTTP %s %s',
                               username, r.status_code, r.text[:300])
                return f'error:create_{r.status_code}'
            kc_user = _find_user(username, token)
            if kc_user is None:
                return 'error:recheck_failed'

        # User sudah ada di Keycloak
        if not _owned(kc_user['id'], token):
            # Bukan milik asncorpu (app lain di realm pemda) → JANGAN disentuh
            logger.warning(
                'Keycloak user %s sudah ada milik app lain (bukan group %s) — '
                'skip disable/password, pendaftaran lokal tetap diproses',
                username, ORIGIN_GROUP,
            )
            return 'exists-foreign'

        # Milik asncorpu: samakan enabled + email, lalu set password
        upd = {'enabled': bool(enabled)}
        if email and not kc_user.get('email'):
            upd['email'] = email
        r = requests.put(
            f"{_base()}/admin/realms/{_realm()}/users/{kc_user['id']}",
            json=upd,
            headers=_headers(token),
            timeout=TIMEOUT,
        )
        if r.status_code not in (200, 204):
            logger.warning('Keycloak update user %s → HTTP %s', username, r.status_code)
        r = requests.put(
            f"{_base()}/admin/realms/{_realm()}/users/{kc_user['id']}/reset-password",
            json={'type': 'password', 'value': password, 'temporary': False},
            headers=_headers(token),
            timeout=TIMEOUT,
        )
        if r.status_code not in (200, 204):
            logger.warning('Keycloak set password %s → HTTP %s', username, r.status_code)
            return f'error:password_{r.status_code}'
        return 'updated'
    except (requests.RequestException, RuntimeError) as e:
        logger.warning('Keycloak error saat ensure user %s: %s', username, e)
        return f'error:{type(e).__name__}'


def set_keycloak_enabled(username, enabled):
    """
    Dipanggil SAAT APPROVE/REJECT — enable/disable user asncorpu di Keycloak.

    Return: 'ok' | 'not_found' | 'foreign' | 'skipped' | 'error:...'
    """
    if not settings.KEYCLOAK_ADMIN_URL:
        return 'skipped'
    try:
        token = _admin_token()
        kc_user = _find_user(username, token)
        if kc_user is None:
            logger.warning('Keycloak: user %s tidak ada (push saat register gagal?) — '
                           'login lokal tetap bisa, SSO menyusul setelah provision ulang',
                           username)
            return 'not_found'
        if not _owned(kc_user['id'], token):
            logger.warning('Keycloak: user %s bukan milik asncorpu (bukan group %s) — skip enable',
                           username, ORIGIN_GROUP)
            return 'foreign'
        r = requests.put(
            f"{_base()}/admin/realms/{_realm()}/users/{kc_user['id']}",
            json={'enabled': bool(enabled)},
            headers=_headers(token),
            timeout=TIMEOUT,
        )
        if r.status_code in (200, 204):
            return 'ok'
        logger.warning('Keycloak enable/disable %s → HTTP %s', username, r.status_code)
        return f'error:{r.status_code}'
    except (requests.RequestException, RuntimeError) as e:
        logger.warning('Keycloak unreachable saat set enabled=%s untuk %s: %s',
                       enabled, username, e)
        return f'error:{type(e).__name__}'
