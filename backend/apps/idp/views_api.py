from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db.models import Q, Count
from datetime import datetime
from django.utils import timezone
from apps.manajemen.helpers import check_permission
from .models import IdpAsn, JenisKompetensi, NamaKompetensi, PrioritasPengembangan, PilarPengembangan, JenisKegiatanPengembangan, NamaKegiatanProgram
import json
import logging

logger = logging.getLogger(__name__)


def _parse_body(request):
    """Parse request body from JSON or multipart (request.POST) uniformly."""
    if request.content_type == 'application/json' or (request.body and request.body.startswith(b'{')):
        try:
            return json.loads(request.body) if request.body else {}
        except json.JSONDecodeError:
            return {}
    return request.POST.dict() if hasattr(request.POST, 'dict') else dict(request.POST)


def _idp_permission(request, control, function):
    """Granular check for IDP module. Returns JsonResponse 403 if denied."""
    user = getattr(request, 'user', None)
    try:
        from apps.manajemen.helpers import get_active_group_id
        logger.warning('IDP_PERM_DEBUG user=%s anon=%s active_group=%s ctrl=%s fn=%s',
                       getattr(user, 'username', '?'),
                       not getattr(user, 'is_authenticated', False),
                       get_active_group_id(), control, function)
    except Exception:
        pass
    if user is None or not getattr(user, 'is_authenticated', False):
        return JsonResponse(
            {'success': False, 'message': 'Anda tidak memiliki izin untuk melakukan tindakan ini.'},
            status=403
        )
    if not check_permission(user, 'idp', control, function):
        return JsonResponse(
            {'success': False, 'message': 'Anda tidak memiliki izin untuk melakukan tindakan ini.'},
            status=403
        )
    return None


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace('Z', '')).date()
    except (ValueError, AttributeError):
        return None


def _serialize(idp, request=None):
    return {
        'id': idp.id,
        'asn': {
            'id': idp.asn.id,
            'id_pegawai': idp.asn.id_pegawai,
            'nip': idp.asn.nip_baru or idp.asn.nip_lama or '',
            'nama': idp.asn.nama_pegawai,
            'nama_jabatan': idp.asn.nama_jabatan or '',
            'nm_opd': idp.asn.nm_opd or '',
        },
        'asn_id': idp.asn_id,
        'asn_nama': idp.asn.nama_pegawai,
        'asn_nip': idp.asn.nip_baru or idp.asn.nip_lama or '',
        'asn_jabatan': idp.asn.nama_jabatan or '',
        'asn_opd': idp.asn.nm_opd or '',
        'atasan_langsung': {
            'id': idp.atasan_langsung.id if idp.atasan_langsung else None,
            'id_pegawai': idp.atasan_langsung.id_pegawai if idp.atasan_langsung else None,
            'nip': (idp.atasan_langsung.nip_baru or idp.atasan_langsung.nip_lama or '') if idp.atasan_langsung else '',
            'nama': idp.atasan_langsung.nama_pegawai if idp.atasan_langsung else '',
            'nama_jabatan': idp.atasan_langsung.nama_jabatan if idp.atasan_langsung else '',
            'nm_opd': idp.atasan_langsung.nm_opd if idp.atasan_langsung else '',
        },
        'atasan_langsung_id': idp.atasan_langsung_id,
        'atasan_langsung_nama': idp.atasan_langsung.nama_pegawai if idp.atasan_langsung else '',
        'periode_dari': idp.periode_dari.isoformat() if idp.periode_dari else None,
        'periode_sampai': idp.periode_sampai.isoformat() if idp.periode_sampai else None,
        'periode_display': idp.periode_display,
        'target_penugasan_idp': idp.target_penugasan_idp,
        'dasar_penyusunan_idp': idp.dasar_penyusunan_idp,
        'tanggal_pengajuan': idp.tanggal_pengajuan.isoformat() if idp.tanggal_pengajuan else None,
        'target_kompetensi': idp.target_kompetensi,
        'status': idp.status,
        'catatan': idp.catatan,
        'created_by': idp.created_by.username if idp.created_by else None,
        'created_at': idp.created_at.isoformat() if idp.created_at else None,
        'updated_at': idp.updated_at.isoformat() if idp.updated_at else None,
        'approved_by': idp.approved_by.username if idp.approved_by else None,
        'approved_at': idp.approved_at.isoformat() if idp.approved_at else None,
    }


@csrf_exempt
@require_http_methods(["GET", "POST"])
def idp_list_create(request):
    """
    GET: List semua IDP ASN dengan pagination dan filter
    POST: Create IDP ASN baru
    """
    if request.method == 'GET':
        denied = _idp_permission(request, 'idp_asn', 'view')
    else:
        denied = _idp_permission(request, 'idp_asn', 'create')
    if denied:
        return denied

    if request.method == 'GET':
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 10))
        search = request.GET.get('search', '')
        status = request.GET.get('status', '')

        idps = IdpAsn.objects.select_related('asn', 'atasan_langsung').all()

        if search:
            idps = idps.filter(
                Q(asn__nama_pegawai__icontains=search) |
                Q(asn__nip_baru__icontains=search) |
                Q(asn__nip_lama__icontains=search) |
                Q(asn__nama_jabatan__icontains=search) |
                Q(atasan_langsung__nama_pegawai__icontains=search)
            )

        if status and status != 'all':
            idps = idps.filter(status=status)

        paginator = Paginator(idps, per_page)
        page_obj = paginator.get_page(page)

        data = {
            'status': 'success',
            'data': [_serialize(idp, request) for idp in page_obj],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginator.count,
                'total_pages': paginator.num_pages,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            }
        }

        return JsonResponse(data)

    elif request.method == 'POST':
        try:
            body = _parse_body(request)

            asn_id = body.get('asn_id') or body.get('asn')
            if not asn_id:
                return JsonResponse(
                    {'success': False, 'message': 'ASN harus dipilih.'},
                    status=400
                )

            atasan_id = body.get('atasan_langsung_id') or body.get('atasan_langsung')

            idp = IdpAsn.objects.create(
                asn_id=asn_id,
                atasan_langsung_id=atasan_id if atasan_id else None,
                periode_dari=_parse_date(body.get('periode_dari')),
                periode_sampai=_parse_date(body.get('periode_sampai')),
                target_penugasan_idp=body.get('target_penugasan_idp', ''),
                dasar_penyusunan_idp=body.get('dasar_penyusunan_idp', ''),
                tanggal_pengajuan=_parse_date(body.get('tanggal_pengajuan')),
                target_kompetensi=body.get('target_kompetensi', ''),
                status=body.get('status', 'draft'),
                catatan=body.get('catatan', ''),
                created_by=request.user if request.user.is_authenticated else None
            )

            return JsonResponse({
                'status': 'success',
                'message': 'IDP berhasil ditambahkan',
                'data': _serialize(idp, request)
            }, status=201)
        except Exception as e:
            logger.exception("Error creating IDP")
            return JsonResponse(
                {'success': False, 'message': f'Gagal menyimpan IDP: {str(e)}'},
                status=500
            )


@csrf_exempt
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def idp_detail(request, pk):
    """Detail, update, atau hapus IDP ASN."""
    denied = _idp_permission(request, 'idp_asn', 'edit' if request.method in ('PUT', 'PATCH') else ('delete' if request.method == 'DELETE' else 'view'))
    if denied:
        return denied

    try:
        idp = IdpAsn.objects.select_related('asn', 'atasan_langsung').get(pk=pk)
    except IdpAsn.DoesNotExist:
        return JsonResponse(
            {'success': False, 'message': 'IDP tidak ditemukan.'},
            status=404
        )

    if request.method == 'GET':
        return JsonResponse({
            'status': 'success',
            'data': _serialize(idp, request)
        })

    elif request.method in ('PUT', 'PATCH'):
        try:
            body = _parse_body(request)

            asn_id = body.get('asn_id') or body.get('asn') or idp.asn_id
            atasan_id = body.get('atasan_langsung_id') or body.get('atasan_langsung')

            idp.asn_id = asn_id
            idp.atasan_langsung_id = atasan_id if atasan_id else None
            if body.get('periode_dari') is not None:
                idp.periode_dari = _parse_date(body['periode_dari'])
            if body.get('periode_sampai') is not None:
                idp.periode_sampai = _parse_date(body['periode_sampai'])
            if body.get('target_penugasan_idp') is not None:
                idp.target_penugasan_idp = body['target_penugasan_idp']
            if body.get('dasar_penyusunan_idp') is not None:
                idp.dasar_penyusunan_idp = body['dasar_penyusunan_idp']
            if body.get('tanggal_pengajuan') is not None:
                idp.tanggal_pengajuan = _parse_date(body['tanggal_pengajuan'])
            if body.get('target_kompetensi') is not None:
                idp.target_kompetensi = body['target_kompetensi']
            if body.get('status') is not None:
                idp.status = body['status']
            if body.get('catatan') is not None:
                idp.catatan = body['catatan']

            idp.save()

            return JsonResponse({
                'status': 'success',
                'message': 'IDP berhasil diperbarui',
                'data': _serialize(idp, request)
            })
        except Exception as e:
            logger.exception("Error updating IDP")
            return JsonResponse(
                {'success': False, 'message': f'Gagal memperbarui IDP: {str(e)}'},
                status=500
            )

    elif request.method == 'DELETE':
        try:
            idp.delete()
            return JsonResponse({
                'status': 'success',
                'message': 'IDP berhasil dihapus'
            })
        except Exception as e:
            return JsonResponse(
                {'success': False, 'message': f'Gagal menghapus IDP: {str(e)}'},
                status=500
            )


@csrf_exempt
@require_http_methods(["GET"])
def idp_stats(request):
    """Statistik IDP ASN."""
    denied = _idp_permission(request, 'idp_asn', 'view')
    if denied:
        return denied

    total = IdpAsn.objects.count()
    stats = {
        'total_idp': total,
        'draft': IdpAsn.objects.filter(status='draft').count(),
        'submitted': IdpAsn.objects.filter(status='submitted').count(),
        'approved': IdpAsn.objects.filter(status='approved').count(),
        'rejected': IdpAsn.objects.filter(status='rejected').count(),
        'total_asn': IdpAsn.objects.values('asn').distinct().count(),
    }

    return JsonResponse({
        'status': 'success',
        'data': stats
    })


@csrf_exempt
@require_http_methods(["GET"])
def idp_approval_list(request):
    """
    GET: Daftar IDP yang diajukan (submitted) untuk di-approve.
    """
    denied = _idp_permission(request, 'idp_approval', 'view')
    if denied:
        return denied

    page = int(request.GET.get('page', 1))
    per_page = int(request.GET.get('per_page', 10))
    search = request.GET.get('search', '')
    status = request.GET.get('status', 'submitted')

    idps = IdpAsn.objects.select_related('asn', 'atasan_langsung').filter(status=status)

    if search:
        idps = idps.filter(
            Q(asn__nama_pegawai__icontains=search) |
            Q(asn__nip_baru__icontains=search) |
            Q(asn__nip_lama__icontains=search) |
            Q(asn__nama_jabatan__icontains=search) |
            Q(atasan_langsung__nama_pegawai__icontains=search)
        )

    paginator = Paginator(idps, per_page)
    page_obj = paginator.get_page(page)

    return JsonResponse({
        'status': 'success',
        'data': [_serialize(idp, request) for idp in page_obj],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': paginator.count,
            'total_pages': paginator.num_pages,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
        }
    })


@csrf_exempt
@require_http_methods(["POST"])
def idp_approval_action(request, pk):
    """
    POST: Approve / Reject IDP.
    Body: {action: 'approve'|'reject', catatan: '...'}
    """
    denied = _idp_permission(request, 'idp_approval', 'approve')
    if denied:
        return denied

    try:
        idp = IdpAsn.objects.select_related('asn', 'atasan_langsung').get(pk=pk)
    except IdpAsn.DoesNotExist:
        return JsonResponse(
            {'success': False, 'message': 'IDP tidak ditemukan.'},
            status=404
        )

    if idp.status != 'submitted':
        return JsonResponse(
            {'success': False, 'message': 'Hanya IDP berstatus "Diajukan" yang dapat disetujui atau ditolak.'},
            status=400
        )

    try:
        body = _parse_body(request)
        action = body.get('action', '').lower()

        if action == 'approve':
            idp.status = IdpAsn.StatusChoices.APPROVED
            message = 'IDP berhasil disetujui'
        elif action == 'reject':
            idp.status = IdpAsn.StatusChoices.REJECTED
            message = 'IDP berhasil ditolak'
        else:
            return JsonResponse(
                {'success': False, 'message': "Action harus berupa 'approve' atau 'reject'."},
                status=400
            )

        idp.catatan = body.get('catatan', idp.catatan or '')
        idp.approved_by = request.user if request.user.is_authenticated else None
        idp.approved_at = timezone.now()
        idp.save()

        return JsonResponse({
            'status': 'success',
            'message': message,
            'data': _serialize(idp, request)
        })
    except Exception as e:
        logger.exception("Error processing IDP approval")
        return JsonResponse(
            {'success': False, 'message': f'Gagal memproses persetujuan IDP: {str(e)}'},
            status=500
        )


def _serialize_jenis_kompetensi(item):
    return {
        'id': item.id,
        'kode': item.kode,
        'nama': item.nama,
        'deskripsi': item.deskripsi,
        'is_active': item.is_active,
        'created_at': item.created_at.isoformat() if item.created_at else None,
        'updated_at': item.updated_at.isoformat() if item.updated_at else None,
    }


@csrf_exempt
@require_http_methods(["GET", "POST"])
def jenis_kompetensi_list_create(request):
    """
    GET: List master data jenis kompetensi dengan pagination + search
    POST: Create jenis kompetensi baru
    """
    if request.method == 'GET':
        denied = _idp_permission(request, 'idp_asn', 'view')
    else:
        denied = _idp_permission(request, 'idp_asn', 'create')
    if denied:
        return denied

    if request.method == 'GET':
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 10))
        search = request.GET.get('search', '')
        is_active = request.GET.get('is_active', '')

        items = JenisKompetensi.objects.all()

        if search:
            items = items.filter(
                Q(nama__icontains=search) |
                Q(kode__icontains=search) |
                Q(deskripsi__icontains=search)
            )

        if is_active in ('true', 'false'):
            items = items.filter(is_active=(is_active == 'true'))

        paginator = Paginator(items, per_page)
        page_obj = paginator.get_page(page)

        return JsonResponse({
            'status': 'success',
            'data': [_serialize_jenis_kompetensi(item) for item in page_obj],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginator.count,
                'total_pages': paginator.num_pages,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            }
        })

    elif request.method == 'POST':
        try:
            body = _parse_body(request)

            nama = (body.get('nama') or '').strip()
            if not nama:
                return JsonResponse(
                    {'success': False, 'message': 'Nama jenis kompetensi harus diisi.'},
                    status=400
                )

            item = JenisKompetensi.objects.create(
                kode=(body.get('kode') or '').strip(),
                nama=nama,
                deskripsi=body.get('deskripsi', '') or '',
                is_active=body.get('is_active', True),
            )

            return JsonResponse({
                'status': 'success',
                'message': 'Jenis Kompetensi berhasil ditambahkan',
                'data': _serialize_jenis_kompetensi(item)
            }, status=201)
        except Exception as e:
            logger.exception("Error creating jenis kompetensi")
            return JsonResponse(
                {'success': False, 'message': f'Gagal menyimpan jenis kompetensi: {str(e)}'},
                status=500
            )


@csrf_exempt
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def jenis_kompetensi_detail(request, pk):
    """Detail, update, atau hapus jenis kompetensi."""
    denied = _idp_permission(request, 'idp_asn', 'edit' if request.method in ('PUT', 'PATCH') else ('delete' if request.method == 'DELETE' else 'view'))
    if denied:
        return denied

    try:
        item = JenisKompetensi.objects.get(pk=pk)
    except JenisKompetensi.DoesNotExist:
        return JsonResponse(
            {'success': False, 'message': 'Jenis Kompetensi tidak ditemukan.'},
            status=404
        )

    if request.method == 'GET':
        return JsonResponse({
            'status': 'success',
            'data': _serialize_jenis_kompetensi(item)
        })

    elif request.method in ('PUT', 'PATCH'):
        try:
            body = _parse_body(request)

            if body.get('kode') is not None:
                item.kode = (body['kode'] or '').strip()
            if body.get('nama') is not None:
                nama = (body['nama'] or '').strip()
                if not nama:
                    return JsonResponse(
                        {'success': False, 'message': 'Nama jenis kompetensi harus diisi.'},
                        status=400
                    )
                item.nama = nama
            if body.get('deskripsi') is not None:
                item.deskripsi = body['deskripsi'] or ''
            if body.get('is_active') is not None:
                item.is_active = bool(body['is_active'])

            item.save()

            return JsonResponse({
                'status': 'success',
                'message': 'Jenis Kompetensi berhasil diperbarui',
                'data': _serialize_jenis_kompetensi(item)
            })
        except Exception as e:
            logger.exception("Error updating jenis kompetensi")
            return JsonResponse(
                {'success': False, 'message': f'Gagal memperbarui jenis kompetensi: {str(e)}'},
                status=500
            )

    elif request.method == 'DELETE':
        try:
            item.delete()
            return JsonResponse({
                'status': 'success',
                'message': 'Jenis Kompetensi berhasil dihapus'
            })
        except Exception as e:
            logger.exception("Error deleting jenis kompetensi")
            return JsonResponse(
                {'success': False, 'message': f'Gagal menghapus jenis kompetensi: {str(e)}'},
                status=500
            )


def _serialize_nama_kompetensi(item):
    return {
        'id': item.id,
        'jenis_kompetensi': {
            'id': item.jenis_kompetensi.id,
            'kode': item.jenis_kompetensi.kode,
            'nama': item.jenis_kompetensi.nama,
        },
        'jenis_kompetensi_id': item.jenis_kompetensi_id,
        'jenis_kompetensi_nama': item.jenis_kompetensi.nama,
        'kode': item.kode,
        'nama': item.nama,
        'deskripsi': item.deskripsi,
        'is_active': item.is_active,
        'created_at': item.created_at.isoformat() if item.created_at else None,
        'updated_at': item.updated_at.isoformat() if item.updated_at else None,
    }


@csrf_exempt
@require_http_methods(["GET", "POST"])
def nama_kompetensi_list_create(request):
    """
    GET: List master data nama kompetensi dengan pagination + search
    POST: Create nama kompetensi baru
    """
    if request.method == 'GET':
        denied = _idp_permission(request, 'idp_asn', 'view')
    else:
        denied = _idp_permission(request, 'idp_asn', 'create')
    if denied:
        return denied

    if request.method == 'GET':
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 10))
        search = request.GET.get('search', '')
        is_active = request.GET.get('is_active', '')
        jenis_kompetensi_id = request.GET.get('jenis_kompetensi_id', '')

        items = NamaKompetensi.objects.select_related('jenis_kompetensi').all()

        if search:
            items = items.filter(
                Q(nama__icontains=search) |
                Q(kode__icontains=search) |
                Q(deskripsi__icontains=search) |
                Q(jenis_kompetensi__nama__icontains=search)
            )

        if jenis_kompetensi_id:
            items = items.filter(jenis_kompetensi_id=jenis_kompetensi_id)

        if is_active in ('true', 'false'):
            items = items.filter(is_active=(is_active == 'true'))

        paginator = Paginator(items, per_page)
        page_obj = paginator.get_page(page)

        return JsonResponse({
            'status': 'success',
            'data': [_serialize_nama_kompetensi(item) for item in page_obj],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginator.count,
                'total_pages': paginator.num_pages,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            }
        })

    elif request.method == 'POST':
        try:
            body = _parse_body(request)

            nama = (body.get('nama') or '').strip()
            if not nama:
                return JsonResponse(
                    {'success': False, 'message': 'Nama kompetensi harus diisi.'},
                    status=400
                )

            jenis_id = body.get('jenis_kompetensi_id') or body.get('jenis_kompetensi')
            if not jenis_id:
                return JsonResponse(
                    {'success': False, 'message': 'Jenis Kompetensi harus dipilih.'},
                    status=400
                )
            if not JenisKompetensi.objects.filter(pk=jenis_id).exists():
                return JsonResponse(
                    {'success': False, 'message': 'Jenis Kompetensi tidak ditemukan.'},
                    status=400
                )

            item = NamaKompetensi.objects.create(
                jenis_kompetensi_id=jenis_id,
                kode=(body.get('kode') or '').strip(),
                nama=nama,
                deskripsi=body.get('deskripsi', '') or '',
                is_active=body.get('is_active', True),
            )

            return JsonResponse({
                'status': 'success',
                'message': 'Nama Kompetensi berhasil ditambahkan',
                'data': _serialize_nama_kompetensi(item)
            }, status=201)
        except Exception as e:
            logger.exception("Error creating nama kompetensi")
            return JsonResponse(
                {'success': False, 'message': f'Gagal menyimpan nama kompetensi: {str(e)}'},
                status=500
            )


@csrf_exempt
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def nama_kompetensi_detail(request, pk):
    """Detail, update, atau hapus nama kompetensi."""
    denied = _idp_permission(request, 'idp_asn', 'edit' if request.method in ('PUT', 'PATCH') else ('delete' if request.method == 'DELETE' else 'view'))
    if denied:
        return denied

    try:
        item = NamaKompetensi.objects.select_related('jenis_kompetensi').get(pk=pk)
    except NamaKompetensi.DoesNotExist:
        return JsonResponse(
            {'success': False, 'message': 'Nama Kompetensi tidak ditemukan.'},
            status=404
        )

    if request.method == 'GET':
        return JsonResponse({
            'status': 'success',
            'data': _serialize_nama_kompetensi(item)
        })

    elif request.method in ('PUT', 'PATCH'):
        try:
            body = _parse_body(request)

            if body.get('kode') is not None:
                item.kode = (body['kode'] or '').strip()
            if body.get('nama') is not None:
                nama = (body['nama'] or '').strip()
                if not nama:
                    return JsonResponse(
                        {'success': False, 'message': 'Nama kompetensi harus diisi.'},
                        status=400
                    )
                item.nama = nama
            if body.get('jenis_kompetensi_id') is not None:
                jenis_id = body['jenis_kompetensi_id']
                if not jenis_id or not JenisKompetensi.objects.filter(pk=jenis_id).exists():
                    return JsonResponse(
                        {'success': False, 'message': 'Jenis Kompetensi tidak ditemukan.'},
                        status=400
                    )
                item.jenis_kompetensi_id = jenis_id
            if body.get('deskripsi') is not None:
                item.deskripsi = body['deskripsi'] or ''
            if body.get('is_active') is not None:
                item.is_active = bool(body['is_active'])

            item.save()

            return JsonResponse({
                'status': 'success',
                'message': 'Nama Kompetensi berhasil diperbarui',
                'data': _serialize_nama_kompetensi(item)
            })
        except Exception as e:
            logger.exception("Error updating nama kompetensi")
            return JsonResponse(
                {'success': False, 'message': f'Gagal memperbarui nama kompetensi: {str(e)}'},
                status=500
            )

    elif request.method == 'DELETE':
        try:
            item.delete()
            return JsonResponse({
                'status': 'success',
                'message': 'Nama Kompetensi berhasil dihapus'
            })
        except Exception as e:
            logger.exception("Error deleting nama kompetensi")
            return JsonResponse(
                {'success': False, 'message': f'Gagal menghapus nama kompetensi: {str(e)}'},
                status=500
            )


def _serialize_prioritas_pengembangan(item):
    return {
        'id': item.id,
        'tingkat_prioritas': item.tingkat_prioritas,
        'is_active': item.is_active,
        'created_at': item.created_at.isoformat() if item.created_at else None,
        'updated_at': item.updated_at.isoformat() if item.updated_at else None,
    }


@csrf_exempt
@require_http_methods(["GET", "POST"])
def prioritas_pengembangan_list_create(request):
    """
    GET: List master data prioritas pengembangan dengan pagination + search
    POST: Create prioritas pengembangan baru
    """
    if request.method == 'GET':
        denied = _idp_permission(request, 'idp_asn', 'view')
    else:
        denied = _idp_permission(request, 'idp_asn', 'create')
    if denied:
        return denied

    if request.method == 'GET':
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 10))
        search = request.GET.get('search', '')
        is_active = request.GET.get('is_active', '')

        items = PrioritasPengembangan.objects.all()

        if search:
            items = items.filter(
                Q(tingkat_prioritas__icontains=search)
            )

        if is_active in ('true', 'false'):
            items = items.filter(is_active=(is_active == 'true'))

        paginator = Paginator(items, per_page)
        page_obj = paginator.get_page(page)

        return JsonResponse({
            'status': 'success',
            'data': [_serialize_prioritas_pengembangan(item) for item in page_obj],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginator.count,
                'total_pages': paginator.num_pages,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            }
        })

    elif request.method == 'POST':
        try:
            body = _parse_body(request)

            tingkat = (body.get('tingkat_prioritas') or '').strip()
            if not tingkat:
                return JsonResponse(
                    {'success': False, 'message': 'Tingkat Prioritas harus diisi.'},
                    status=400
                )

            item = PrioritasPengembangan.objects.create(
                tingkat_prioritas=tingkat,
                is_active=body.get('is_active', True),
            )

            return JsonResponse({
                'status': 'success',
                'message': 'Prioritas Pengembangan berhasil ditambahkan',
                'data': _serialize_prioritas_pengembangan(item)
            }, status=201)
        except Exception as e:
            logger.exception("Error creating prioritas pengembangan")
            return JsonResponse(
                {'success': False, 'message': f'Gagal menyimpan prioritas pengembangan: {str(e)}'},
                status=500
            )


@csrf_exempt
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def prioritas_pengembangan_detail(request, pk):
    """Detail, update, atau hapus prioritas pengembangan."""
    denied = _idp_permission(request, 'idp_asn', 'edit' if request.method in ('PUT', 'PATCH') else ('delete' if request.method == 'DELETE' else 'view'))
    if denied:
        return denied

    try:
        item = PrioritasPengembangan.objects.get(pk=pk)
    except PrioritasPengembangan.DoesNotExist:
        return JsonResponse(
            {'success': False, 'message': 'Prioritas Pengembangan tidak ditemukan.'},
            status=404
        )

    if request.method == 'GET':
        return JsonResponse({
            'status': 'success',
            'data': _serialize_prioritas_pengembangan(item)
        })

    elif request.method in ('PUT', 'PATCH'):
        try:
            body = _parse_body(request)

            if body.get('tingkat_prioritas') is not None:
                tingkat = (body['tingkat_prioritas'] or '').strip()
                if not tingkat:
                    return JsonResponse(
                        {'success': False, 'message': 'Tingkat Prioritas harus diisi.'},
                        status=400
                    )
                item.tingkat_prioritas = tingkat
            if body.get('is_active') is not None:
                item.is_active = bool(body['is_active'])

            item.save()

            return JsonResponse({
                'status': 'success',
                'message': 'Prioritas Pengembangan berhasil diperbarui',
                'data': _serialize_prioritas_pengembangan(item)
            })
        except Exception as e:
            logger.exception("Error updating prioritas pengembangan")
            return JsonResponse(
                {'success': False, 'message': f'Gagal memperbarui prioritas pengembangan: {str(e)}'},
                status=500
            )

    elif request.method == 'DELETE':
        try:
            item.delete()
            return JsonResponse({
                'status': 'success',
                'message': 'Prioritas Pengembangan berhasil dihapus'
            })
        except Exception as e:
            logger.exception("Error deleting prioritas pengembangan")
            return JsonResponse(
                {'success': False, 'message': f'Gagal menghapus prioritas pengembangan: {str(e)}'},
                status=500
            )


def _serialize_pilar_pengembangan(item):
    return {
        'id': item.id,
        'nama': item.nama,
        'persentase': item.persentase,
        'deskripsi': item.deskripsi,
        'is_active': item.is_active,
        'created_at': item.created_at.isoformat() if item.created_at else None,
        'updated_at': item.updated_at.isoformat() if item.updated_at else None,
    }


@csrf_exempt
@require_http_methods(["GET", "POST"])
def pilar_pengembangan_list_create(request):
    """
    GET: List master data pilar pengembangan dengan pagination + search
    POST: Create pilar pengembangan baru
    """
    if request.method == 'GET':
        denied = _idp_permission(request, 'idp_asn', 'view')
    else:
        denied = _idp_permission(request, 'idp_asn', 'create')
    if denied:
        return denied

    if request.method == 'GET':
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 10))
        search = request.GET.get('search', '')
        is_active = request.GET.get('is_active', '')

        items = PilarPengembangan.objects.all()

        if search:
            items = items.filter(
                Q(nama__icontains=search) |
                Q(deskripsi__icontains=search)
            )

        if is_active in ('true', 'false'):
            items = items.filter(is_active=(is_active == 'true'))

        paginator = Paginator(items, per_page)
        page_obj = paginator.get_page(page)

        return JsonResponse({
            'status': 'success',
            'data': [_serialize_pilar_pengembangan(item) for item in page_obj],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginator.count,
                'total_pages': paginator.num_pages,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            }
        })

    elif request.method == 'POST':
        try:
            body = _parse_body(request)

            nama = (body.get('nama') or '').strip()
            if not nama:
                return JsonResponse(
                    {'success': False, 'message': 'Nama Metode harus diisi.'},
                    status=400
                )

            try:
                persentase = int(body.get('persentase', 0) or 0)
            except (ValueError, TypeError):
                persentase = 0

            item = PilarPengembangan.objects.create(
                nama=nama,
                persentase=persentase,
                deskripsi=(body.get('deskripsi') or '').strip(),
                is_active=body.get('is_active', True),
            )

            return JsonResponse({
                'status': 'success',
                'message': 'Metode Pengembangan Kompetensi berhasil ditambahkan',
                'data': _serialize_pilar_pengembangan(item)
            }, status=201)
        except Exception as e:
            logger.exception("Error creating pilar pengembangan")
            return JsonResponse(
                {'success': False, 'message': f'Gagal menyimpan metode pengembangan kompetensi: {str(e)}'},
                status=500
            )


@csrf_exempt
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def pilar_pengembangan_detail(request, pk):
    """Detail, update, atau hapus pilar pengembangan."""
    denied = _idp_permission(request, 'idp_asn', 'edit' if request.method in ('PUT', 'PATCH') else ('delete' if request.method == 'DELETE' else 'view'))
    if denied:
        return denied

    try:
        item = PilarPengembangan.objects.get(pk=pk)
    except PilarPengembangan.DoesNotExist:
        return JsonResponse(
            {'success': False, 'message': 'Metode Pengembangan Kompetensi tidak ditemukan.'},
            status=404
        )

    if request.method == 'GET':
        return JsonResponse({
            'status': 'success',
            'data': _serialize_pilar_pengembangan(item)
        })

    elif request.method in ('PUT', 'PATCH'):
        try:
            body = _parse_body(request)

            if body.get('nama') is not None:
                nama = (body['nama'] or '').strip()
                if not nama:
                    return JsonResponse(
                        {'success': False, 'message': 'Nama Metode harus diisi.'},
                        status=400
                    )
                item.nama = nama
            if body.get('persentase') is not None:
                try:
                    item.persentase = int(body['persentase'])
                except (ValueError, TypeError):
                    item.persentase = 0
            if body.get('deskripsi') is not None:
                item.deskripsi = (body['deskripsi'] or '').strip()
            if body.get('is_active') is not None:
                item.is_active = bool(body['is_active'])

            item.save()

            return JsonResponse({
                'status': 'success',
                'message': 'Metode Pengembangan Kompetensi berhasil diperbarui',
                'data': _serialize_pilar_pengembangan(item)
            })
        except Exception as e:
            logger.exception("Error updating pilar pengembangan")
            return JsonResponse(
                {'success': False, 'message': f'Gagal memperbarui metode pengembangan kompetensi: {str(e)}'},
                status=500
            )

    elif request.method == 'DELETE':
        try:
            item.delete()
            return JsonResponse({
                'status': 'success',
                'message': 'Metode Pengembangan Kompetensi berhasil dihapus'
            })
        except Exception as e:
            logger.exception("Error deleting pilar pengembangan")
            return JsonResponse(
                {'success': False, 'message': f'Gagal menghapus metode pengembangan kompetensi: {str(e)}'},
                status=500
            )


def _serialize_jenis_kegiatan_pengembangan(item):
    return {
        'id': item.id,
        'pilar_pengembangan': {
            'id': item.pilar_pengembangan.id,
            'nama': item.pilar_pengembangan.nama,
            'persentase': item.pilar_pengembangan.persentase,
        },
        'pilar_pengembangan_id': item.pilar_pengembangan_id,
        'pilar_pengembangan_nama': item.pilar_pengembangan.nama,
        'pilar_pengembangan_persentase': item.pilar_pengembangan.persentase,
        'nama': item.nama,
        'deskripsi': item.deskripsi,
        'is_active': item.is_active,
        'created_at': item.created_at.isoformat() if item.created_at else None,
        'updated_at': item.updated_at.isoformat() if item.updated_at else None,
    }


@csrf_exempt
@require_http_methods(["GET", "POST"])
def jenis_kegiatan_pengembangan_list_create(request):
    """
    GET: List master data jenis kegiatan pengembangan dengan pagination + search
    POST: Create jenis kegiatan pengembangan baru
    """
    if request.method == 'GET':
        denied = _idp_permission(request, 'idp_asn', 'view')
    else:
        denied = _idp_permission(request, 'idp_asn', 'create')
    if denied:
        return denied

    if request.method == 'GET':
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 10))
        search = request.GET.get('search', '')
        is_active = request.GET.get('is_active', '')
        pilar_pengembangan_id = request.GET.get('pilar_pengembangan_id', '')

        items = JenisKegiatanPengembangan.objects.select_related('pilar_pengembangan').all()

        if search:
            items = items.filter(
                Q(nama__icontains=search) |
                Q(deskripsi__icontains=search) |
                Q(pilar_pengembangan__nama__icontains=search)
            )

        if pilar_pengembangan_id:
            items = items.filter(pilar_pengembangan_id=pilar_pengembangan_id)

        if is_active in ('true', 'false'):
            items = items.filter(is_active=(is_active == 'true'))

        paginator = Paginator(items, per_page)
        page_obj = paginator.get_page(page)

        return JsonResponse({
            'status': 'success',
            'data': [_serialize_jenis_kegiatan_pengembangan(item) for item in page_obj],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginator.count,
                'total_pages': paginator.num_pages,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            }
        })

    elif request.method == 'POST':
        try:
            body = _parse_body(request)

            nama = (body.get('nama') or '').strip()
            if not nama:
                return JsonResponse(
                    {'success': False, 'message': 'Bentuk Pengembangan Kompetensi harus diisi.'},
                    status=400
                )

            pilar_id = body.get('pilar_pengembangan_id') or body.get('pilar_pengembangan')
            if not pilar_id:
                return JsonResponse(
                    {'success': False, 'message': 'Metode Pengembangan Kompetensi harus dipilih.'},
                    status=400
                )
            if not PilarPengembangan.objects.filter(pk=pilar_id).exists():
                return JsonResponse(
                    {'success': False, 'message': 'Metode Pengembangan Kompetensi tidak ditemukan.'},
                    status=400
                )

            item = JenisKegiatanPengembangan.objects.create(
                pilar_pengembangan_id=pilar_id,
                nama=nama,
                deskripsi=body.get('deskripsi', '') or '',
                is_active=body.get('is_active', True),
            )

            return JsonResponse({
                'status': 'success',
                'message': 'Bentuk Pengembangan Kompetensi berhasil ditambahkan',
                'data': _serialize_jenis_kegiatan_pengembangan(item)
            }, status=201)
        except Exception as e:
            logger.exception("Error creating jenis kegiatan pengembangan")
            return JsonResponse(
                {'success': False, 'message': f'Gagal menyimpan bentuk pengembangan kompetensi: {str(e)}'},
                status=500
            )


@csrf_exempt
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def jenis_kegiatan_pengembangan_detail(request, pk):
    """Detail, update, atau hapus jenis kegiatan pengembangan."""
    denied = _idp_permission(request, 'idp_asn', 'edit' if request.method in ('PUT', 'PATCH') else ('delete' if request.method == 'DELETE' else 'view'))
    if denied:
        return denied

    try:
        item = JenisKegiatanPengembangan.objects.select_related('pilar_pengembangan').get(pk=pk)
    except JenisKegiatanPengembangan.DoesNotExist:
        return JsonResponse(
            {'success': False, 'message': 'Bentuk Pengembangan Kompetensi tidak ditemukan.'},
            status=404
        )

    if request.method == 'GET':
        return JsonResponse({
            'status': 'success',
            'data': _serialize_jenis_kegiatan_pengembangan(item)
        })

    elif request.method in ('PUT', 'PATCH'):
        try:
            body = _parse_body(request)

            if body.get('nama') is not None:
                nama = (body['nama'] or '').strip()
                if not nama:
                    return JsonResponse(
                        {'success': False, 'message': 'Bentuk Pengembangan Kompetensi harus diisi.'},
                        status=400
                    )
                item.nama = nama
            if body.get('pilar_pengembangan_id') is not None:
                pilar_id = body['pilar_pengembangan_id']
                if not pilar_id or not PilarPengembangan.objects.filter(pk=pilar_id).exists():
                    return JsonResponse(
                        {'success': False, 'message': 'Metode Pengembangan Kompetensi tidak ditemukan.'},
                        status=400
                    )
                item.pilar_pengembangan_id = pilar_id
            if body.get('deskripsi') is not None:
                item.deskripsi = (body['deskripsi'] or '').strip()
            if body.get('is_active') is not None:
                item.is_active = bool(body['is_active'])

            item.save()
            item = JenisKegiatanPengembangan.objects.select_related('pilar_pengembangan').get(pk=pk)

            return JsonResponse({
                'status': 'success',
                'message': 'Bentuk Pengembangan Kompetensi berhasil diperbarui',
                'data': _serialize_jenis_kegiatan_pengembangan(item)
            })
        except Exception as e:
            logger.exception("Error updating jenis kegiatan pengembangan")
            return JsonResponse(
                {'success': False, 'message': f'Gagal memperbarui bentuk pengembangan kompetensi: {str(e)}'},
                status=500
            )

    elif request.method == 'DELETE':
        try:
            item.delete()
            return JsonResponse({
                'status': 'success',
                'message': 'Bentuk Pengembangan Kompetensi berhasil dihapus'
            })
        except Exception as e:
            logger.exception("Error deleting jenis kegiatan pengembangan")
            return JsonResponse(
                {'success': False, 'message': f'Gagal menghapus bentuk pengembangan kompetensi: {str(e)}'},
                status=500
            )


def _serialize_nama_kegiatan_program(item):
    return {
        'id': item.id,
        'bentuk_pengembangan': {
            'id': item.bentuk_pengembangan.id,
            'nama': item.bentuk_pengembangan.nama,
        },
        'bentuk_pengembangan_id': item.bentuk_pengembangan_id,
        'bentuk_pengembangan_nama': item.bentuk_pengembangan.nama,
        'nama': item.nama,
        'deskripsi': item.deskripsi,
        'is_active': item.is_active,
        'created_at': item.created_at.isoformat() if item.created_at else None,
        'updated_at': item.updated_at.isoformat() if item.updated_at else None,
    }


@csrf_exempt
@require_http_methods(["GET", "POST"])
def nama_kegiatan_program_list_create(request):
    """
    GET: List master data nama kegiatan / program dengan pagination + search
    POST: Create nama kegiatan / program baru
    """
    if request.method == 'GET':
        denied = _idp_permission(request, 'idp_asn', 'view')
    else:
        denied = _idp_permission(request, 'idp_asn', 'create')
    if denied:
        return denied

    if request.method == 'GET':
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 10))
        search = request.GET.get('search', '')
        is_active = request.GET.get('is_active', '')
        bentuk_pengembangan_id = request.GET.get('bentuk_pengembangan_id', '')
        pilar_pengembangan_id = request.GET.get('pilar_pengembangan_id', '')

        items = NamaKegiatanProgram.objects.select_related('bentuk_pengembangan').all()

        if search:
            items = items.filter(
                Q(nama__icontains=search) |
                Q(deskripsi__icontains=search) |
                Q(bentuk_pengembangan__nama__icontains=search)
            )

        if bentuk_pengembangan_id:
            items = items.filter(bentuk_pengembangan_id=bentuk_pengembangan_id)

        if pilar_pengembangan_id:
            items = items.filter(bentuk_pengembangan__pilar_pengembangan_id=pilar_pengembangan_id)

        if is_active in ('true', 'false'):
            items = items.filter(is_active=(is_active == 'true'))

        paginator = Paginator(items, per_page)
        page_obj = paginator.get_page(page)

        return JsonResponse({
            'status': 'success',
            'data': [_serialize_nama_kegiatan_program(item) for item in page_obj],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginator.count,
                'total_pages': paginator.num_pages,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            }
        })

    elif request.method == 'POST':
        try:
            body = _parse_body(request)

            nama = (body.get('nama') or '').strip()
            if not nama:
                return JsonResponse(
                    {'success': False, 'message': 'Nama kegiatan/program harus diisi.'},
                    status=400
                )

            bentuk_id = body.get('bentuk_pengembangan_id') or body.get('bentuk_pengembangan')
            if not bentuk_id:
                return JsonResponse(
                    {'success': False, 'message': 'Bentuk Pengembangan Kompetensi harus dipilih.'},
                    status=400
                )
            if not JenisKegiatanPengembangan.objects.filter(pk=bentuk_id).exists():
                return JsonResponse(
                    {'success': False, 'message': 'Bentuk Pengembangan Kompetensi tidak ditemukan.'},
                    status=400
                )

            item = NamaKegiatanProgram.objects.create(
                bentuk_pengembangan_id=bentuk_id,
                nama=nama,
                deskripsi=body.get('deskripsi', '') or '',
                is_active=body.get('is_active', True),
            )

            return JsonResponse({
                'status': 'success',
                'message': 'Nama Kegiatan / Program berhasil ditambahkan',
                'data': _serialize_nama_kegiatan_program(item)
            }, status=201)
        except Exception as e:
            logger.exception("Error creating nama kegiatan program")
            return JsonResponse(
                {'success': False, 'message': f'Gagal menyimpan nama kegiatan/program: {str(e)}'},
                status=500
            )


@csrf_exempt
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def nama_kegiatan_program_detail(request, pk):
    """Detail, update, atau hapus nama kegiatan / program."""
    denied = _idp_permission(request, 'idp_asn', 'edit' if request.method in ('PUT', 'PATCH') else ('delete' if request.method == 'DELETE' else 'view'))
    if denied:
        return denied

    try:
        item = NamaKegiatanProgram.objects.select_related('bentuk_pengembangan').get(pk=pk)
    except NamaKegiatanProgram.DoesNotExist:
        return JsonResponse(
            {'success': False, 'message': 'Nama Kegiatan / Program tidak ditemukan.'},
            status=404
        )

    if request.method == 'GET':
        return JsonResponse({
            'status': 'success',
            'data': _serialize_nama_kegiatan_program(item)
        })

    elif request.method in ('PUT', 'PATCH'):
        try:
            body = _parse_body(request)

            if body.get('nama') is not None:
                nama = (body['nama'] or '').strip()
                if not nama:
                    return JsonResponse(
                        {'success': False, 'message': 'Nama kegiatan/program harus diisi.'},
                        status=400
                    )
                item.nama = nama
            if body.get('bentuk_pengembangan_id') is not None:
                bentuk_id = body['bentuk_pengembangan_id']
                if not bentuk_id or not JenisKegiatanPengembangan.objects.filter(pk=bentuk_id).exists():
                    return JsonResponse(
                        {'success': False, 'message': 'Bentuk Pengembangan Kompetensi tidak ditemukan.'},
                        status=400
                    )
                item.bentuk_pengembangan_id = bentuk_id
            if body.get('deskripsi') is not None:
                item.deskripsi = (body['deskripsi'] or '').strip()
            if body.get('is_active') is not None:
                item.is_active = bool(body['is_active'])

            item.save()
            item = NamaKegiatanProgram.objects.select_related('bentuk_pengembangan').get(pk=pk)

            return JsonResponse({
                'status': 'success',
                'message': 'Nama Kegiatan / Program berhasil diperbarui',
                'data': _serialize_nama_kegiatan_program(item)
            })
        except Exception as e:
            logger.exception("Error updating nama kegiatan program")
            return JsonResponse(
                {'success': False, 'message': f'Gagal memperbarui nama kegiatan/program: {str(e)}'},
                status=500
            )

    elif request.method == 'DELETE':
        try:
            item.delete()
            return JsonResponse({
                'status': 'success',
                'message': 'Nama Kegiatan / Program berhasil dihapus'
            })
        except Exception as e:
            logger.exception("Error deleting nama kegiatan program")
            return JsonResponse(
                {'success': False, 'message': f'Gagal menghapus nama kegiatan/program: {str(e)}'},
                status=500
            )


@require_http_methods(["GET"])
@login_required
@csrf_exempt
def desain_pembelajaran_tree(request):
    """
    GET /idp/desain-pembelajaran-tree/

    Tree read-only master data desain pembelajaran IDP:
    Metode (PilarPengembangan) -> Bentuk (JenisKegiatanPengembangan) -> Nama Kegiatan/Program.

    Query param:
      search  : filter nama (node yg cocok tetap ditampilkan beserta induknya)
      include_inactive : '1' untuk menyertakan node is_active=False (default hanya aktif)
    """
    denied = _idp_permission(request, 'idp_asn', 'view')
    if denied:
        return denied

    search = (request.GET.get('search') or '').strip().lower()
    include_inactive = (request.GET.get('include_inactive') or '0') == '1'

    pilars = PilarPengembangan.objects.all().prefetch_related(
        'jenis_kegiatan__nama_kegiatan'
    ).order_by('id')

    def _match(nama, deskripsi=''):
        if not search:
            return False
        return search in (nama or '').lower() or search in (deskripsi or '').lower()

    data = []
    total_bentuk = 0
    total_kegiatan = 0

    for pilar in pilars:
        if not include_inactive and not pilar.is_active and not _match(pilar.nama, pilar.deskripsi):
            continue

        bentuk_nodes = []
        for bentuk in pilar.jenis_kegiatan.all():
            if not include_inactive and not bentuk.is_active and not _match(bentuk.nama, bentuk.deskripsi):
                continue

            kegiatan_nodes = []
            for kegiatan in bentuk.nama_kegiatan.all():
                if not include_inactive and not kegiatan.is_active and not _match(kegiatan.nama, kegiatan.deskripsi):
                    continue
                kegiatan_nodes.append({
                    'id': kegiatan.id,
                    'tipe': 'kegiatan',
                    'nama': kegiatan.nama,
                    'deskripsi': kegiatan.deskripsi,
                    'is_active': kegiatan.is_active,
                })

            # saat search: buang bentuk tanpa hasil sama sekali
            if search and not _match(bentuk.nama, bentuk.deskripsi) and not kegiatan_nodes:
                continue

            total_bentuk += 1
            total_kegiatan += len(kegiatan_nodes)
            bentuk_nodes.append({
                'id': bentuk.id,
                'tipe': 'bentuk',
                'nama': bentuk.nama,
                'deskripsi': bentuk.deskripsi,
                'is_active': bentuk.is_active,
                'children': kegiatan_nodes,
            })

        # saat search: buang metode tanpa hasil sama sekali
        if search and not _match(pilar.nama, pilar.deskripsi) and not bentuk_nodes:
            continue

        data.append({
            'id': pilar.id,
            'tipe': 'metode',
            'nama': pilar.nama,
            'persentase': pilar.persentase,
            'deskripsi': pilar.deskripsi,
            'is_active': pilar.is_active,
            'children': bentuk_nodes,
        })

    return JsonResponse({
        'success': True,
        'data': data,
        'stats': {
            'total_metode': len(data),
            'total_bentuk': total_bentuk,
            'total_kegiatan': total_kegiatan,
        },
    })
