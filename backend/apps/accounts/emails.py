"""Layanan verifikasi email pendaftaran ASN Corpu (dok 23 — alur SIMPEL).

Prinsip:
- Token ditandatangani (django.core.signing), tanpa tabel tambahan.
- Isi token: ``<user_id>:<timestamp_kirim_email>``. Karena timestamp kirim ikut
  ditandatangani, "kirim ulang" otomatis membatalkan link lama (timestamp di DB
  berubah → token lama tidak cocok lagi).
- Semua kegagalan pengiriman TIDAK membatalkan pendaftaran (dok 23 F7):
  pendaftar bisa memakai tombol "Kirim ulang email verifikasi".
"""

import logging
from urllib.parse import quote

from django.conf import settings
from django.core import signing
from django.core.mail import EmailMultiAlternatives
from django.urls import reverse
from django.utils import timezone

logger = logging.getLogger(__name__)

SALT = 'asncorpu-email-verify'


def _signer():
    return signing.TimestampSigner(salt=SALT)


def buat_token_verifikasi(user):
    """Token bertanda tangan untuk user (memakai waktu kirim terakhir sebagai nonce)."""
    sent = user.email_verify_sent_at or timezone.now()
    return _signer().sign('%s:%s' % (user.pk, int(sent.timestamp())))


def verifikasi_token(token):
    """Periksa token.

    Return ``(user, error)`` dengan ``error`` salah satu: ``None`` | ``'expired'`` | ``'invalid'``.
    """
    from django.contrib.auth import get_user_model

    if not token:
        return None, 'invalid'
    try:
        raw = _signer().unsign(token, max_age=settings.EMAIL_VERIFY_TOKEN_TTL)
    except signing.SignatureExpired:
        return None, 'expired'
    except signing.BadSignature:
        return None, 'invalid'

    try:
        pk_raw, ts_raw = raw.split(':', 1)
        pk, ts = int(pk_raw), int(ts_raw)
    except (ValueError, TypeError):
        return None, 'invalid'

    User = get_user_model()
    user = User.objects.filter(pk=pk).first()
    if user is None:
        return None, 'invalid'

    sent = user.email_verify_sent_at
    if sent is None or int(sent.timestamp()) != ts:
        # link lama yang sudah dibatalkan oleh "kirim ulang"
        return None, 'expired'
    return user, None


def buat_url_verifikasi(user):
    """URL verifikasi memakai FRONTEND_BASE_URL (bukan Host header — anti phishing)."""
    path = reverse('api_corpu_verify_email')
    return '%s%s?token=%s' % (settings.FRONTEND_BASE_URL, path, quote(buat_token_verifikasi(user)))


def url_hasil_verifikasi(status):
    return '%s/auth/verify?status=%s' % (settings.FRONTEND_BASE_URL, status)


def kirim_verifikasi(user):
    """Tandai waktu kirim lalu kirim email verifikasi. Return True bila terkirim."""
    user.email_verify_sent_at = timezone.now()
    user.save(update_fields=['email_verify_sent_at'])

    url = buat_url_verifikasi(user)
    ttl_jam = int(settings.EMAIL_VERIFY_TOKEN_TTL / 3600)
    subject = 'Verifikasi email akun ASN Corpu'
    text = (
        'Halo %s,\n\n'
        'Terima kasih telah mendaftar di ASN Corpu (Lembaga Manajemen ASN Corpu).\n'
        'Klik tautan berikut untuk memverifikasi email Anda:\n\n%s\n\n'
        'Tautan berlaku %s jam. Bila Anda tidak merasa mendaftar, abaikan email ini.\n\n'
        'ASN Corpu — BKPSDM Kab. Pesisir Selatan\n'
    ) % (user.name or user.username, url, ttl_jam)
    html = (
        '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto">'
        '<h2 style="color:#111">Verifikasi email akun ASN Corpu</h2>'
        '<p style="color:#333">Halo <b>%s</b>,</p>'
        '<p style="color:#333">Terima kasih telah mendaftar di ASN Corpu. '
        'Klik tombol di bawah untuk memverifikasi email Anda.</p>'
        '<p style="margin:24px 0">'
        '<a href="%s" style="background:#0f766e;color:#fff;padding:12px 20px;'
        'border-radius:8px;text-decoration:none;font-weight:bold">Verifikasi Email</a></p>'
        '<p style="color:#666;font-size:12px">Tautan berlaku %s jam. Bila Anda tidak '
        'merasa mendaftar, abaikan email ini.</p>'
        '<p style="color:#999;font-size:12px">ASN Corpu — BKPSDM Kab. Pesisir Selatan</p>'
        '</div>'
    ) % (user.name or user.username, url, ttl_jam)

    try:
        msg = EmailMultiAlternatives(
            subject, text, settings.DEFAULT_FROM_EMAIL, [user.email],
        )
        msg.attach_alternative(html, 'text/html')
        msg.send(fail_silently=False)
        logger.info('[register] email verifikasi terkirim ke %s (user %s)', user.email, user.pk)
        return True
    except Exception:
        # Jangan buang data pendaftar hanya karena SMTP bermasalah (dok 23 F7)
        logger.exception('[register] GAGAL kirim email verifikasi ke %s (user %s)', user.email, user.pk)
        return False
