import json
import logging
import time
import uuid
import threading

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from django.db.models import Q, Count, Case, When, Value, IntegerField
from django.utils import timezone

from apps.manajemen.helpers import check_permission
from .models import Pegawai, Bupati, UnitKerja, SyncLog, SyncProgress, DesainPembelajaranUnit, TujuanPembelajaranUnit, KompetensiTeknisUnit
from .serializers import PegawaiListSerializer, BupatiListSerializer, UnitKerjaListSerializer, SyncProgressSerializer, SyncLogSerializer
from .services import EsimpegAPIService

logger = logging.getLogger(__name__)


def simpeg_permission(control, function):
    """
    Factory returning a DRF permission class for the api_simpeg module.
    Reads data: requires {control}/'view'; privileged sync: {control}/'sync'.
    """
    class SimpegPermission(BasePermission):
        def has_permission(self, request, view):
            user = getattr(request, 'user', None)
            if user is None or not getattr(user, 'is_authenticated', False):
                return False
            return check_permission(user, 'api_simpeg', control, function)

    return SimpegPermission


def _safe_int(value):
    if value is None:
        return None
    try:
        s = str(value).strip()
        return int(s) if s else None
    except (ValueError, TypeError):
        return None


def _build_pegawai_data(item, user):
    return {
        'nip_baru': item.get('nipBaru'),
        'nip_lama': item.get('nipLama'),
        'nama_pegawai': item.get('namaPegawai', ''),
        'tempat_lahir': item.get('tempatLahir'),
        'tanggal_lahir': item.get('tanggalLahir'),
        'jenis_kelamin': _safe_int(item.get('jenisKelamin')),
        'alamat_rumah': item.get('alamatRumah'),
        'no_hp': item.get('nohp'),
        'id_jabatan': item.get('id_jabatan'),
        'nama_jabatan': item.get('namaJabatan'),
        'masa_kerja_jabatan': item.get('masaKerjaJabatan'),
        'kode_eselon': _safe_int(item.get('kodeEselon')),
        'id_opd': item.get('id_opd'),
        'nm_opd': item.get('nm_opd'),
        'id_opd_urut': item.get('no_urut') or None,
        'is_opd_induk': bool(item.get('is_opd_induk', False)),
        'id_sub_opd': item.get('id_sub_opd'),
        'nm_sub_opd': item.get('nm_sub_opd'),
        'id_golongan': _safe_int(item.get('kodeGolongan')),
        'nama_golongan': item.get('namaGolongan'),
        'nama_pangkat': item.get('namaPangkat'),
        'kategori_pegawai': _safe_int(item.get('kategoriPegawai')),
        'nama_kategori_pegawai': item.get('namaKategoriPegawai'),
        'tmt_cpns': item.get('tmtCPNS'),
        'masa_kerja_tahun': item.get('masaKerjaTahun') or None,
        'masa_kerja_bulan': item.get('masaKerjaBulan') or None,
        'akhir_kerja_p3k': item.get('akhirKerjaP3K'),
        'pas_foto': item.get('pas_foto'),
        'raw_data': item,
        'synced_by': user,
    }


@api_view(['GET'])
@permission_classes([simpeg_permission('pegawai', 'view')])
def pegawai_list(request):
    if not check_permission(request.user, 'api_simpeg', 'pegawai', 'view'):
        return Response({'success': False, 'error': 'Anda tidak memiliki akses untuk melihat data pegawai.'}, status=status.HTTP_403_FORBIDDEN)

    search = request.query_params.get('search', '').strip()
    id_opd = request.query_params.get('id_opd', '')
    kode_eselon = request.query_params.get('kode_eselon', '')
    page = int(request.query_params.get('page', 1))
    per_page = int(request.query_params.get('per_page', 10))

    if per_page not in [10, 25, 50, 100]:
        per_page = 10

    pegawai_qs = Pegawai.objects.all()

    if search:
        pegawai_qs = pegawai_qs.filter(
            Q(nama_pegawai__icontains=search) |
            Q(nip_baru__icontains=search) |
            Q(nip_lama__icontains=search) |
            Q(nama_jabatan__icontains=search) |
            Q(nm_opd__icontains=search)
        )

    if id_opd:
        try:
            pegawai_qs = pegawai_qs.filter(id_opd=int(id_opd))
        except (ValueError, TypeError):
            pass

    if kode_eselon:
        try:
            pegawai_qs = pegawai_qs.filter(kode_eselon=int(kode_eselon))
        except (ValueError, TypeError):
            pass

    pegawai_qs = pegawai_qs.annotate(
        _eselon_group_priority=Case(
            When(kode_eselon__in=[11, 12], then=Value(1)),
            When(kode_eselon__in=[21, 22], then=Value(2)),
            When(kode_eselon__isnull=True, then=Value(99)),
            default=Value(3),
            output_field=IntegerField(),
        ),
        _status_priority=Case(
            When(kategori_pegawai=2, then=Value(1)),
            When(kategori_pegawai=1, then=Value(2)),
            When(akhir_kerja_p3k__isnull=False, then=Value(3)),
            default=Value(4),
            output_field=IntegerField(),
        )
    ).order_by(
        '_eselon_group_priority',
        'id_opd_urut',
        'kode_eselon',
        '_status_priority',
        'id_golongan',
        'id_pegawai',
    )

    total = pegawai_qs.count()
    start = (page - 1) * per_page
    end = start + per_page
    items = pegawai_qs[start:end]

    serializer = PegawaiListSerializer(items, many=True)

    last_sync = SyncLog.objects.filter(status='success').first()
    last_sync_data = None
    if last_sync:
        last_sync_data = {
            'synced_at': last_sync.synced_at.isoformat() if last_sync.synced_at else None,
            'total_records': last_sync.total_records,
            'synced_by': last_sync.synced_by.username if last_sync.synced_by else None,
        }

    return Response({
        'success': True,
        'data': serializer.data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'total_pages': (total + per_page - 1) // per_page,
        },
        'last_sync': last_sync_data,
    })


@api_view(['POST'])
@permission_classes([simpeg_permission('pegawai', 'sync')])
def pegawai_sync(request):
    if not check_permission(request.user, 'api_simpeg', 'pegawai', 'sync'):
        return Response({'success': False, 'error': 'Anda tidak memiliki akses untuk sinkronisasi data pegawai.'}, status=status.HTTP_403_FORBIDDEN)

    password = request.data.get('password')

    esimpeg_token = request.session.get('esimpeg_access_token')

    if not esimpeg_token:
        if not password:
            return Response({
                'success': False,
                'error': 'Token ESIMPEG tidak ditemukan. Silakan masukkan password ESIMPEG Anda.',
                'code': 'PASSWORD_REQUIRED'
            }, status=status.HTTP_401_UNAUTHORIZED)

        logger.info(f"No ESIMPEG token found for user {request.user.username}, attempting login with password...")
        api_service = EsimpegAPIService()
        login_result = api_service.login(
            username=request.user.username,
            password=password
        )

        if login_result and 'access_token' in login_result:
            esimpeg_token = login_result['access_token']
            request.session['esimpeg_access_token'] = esimpeg_token
            request.session['esimpeg_refresh_token'] = login_result.get('refresh_token')
            logger.info(f"Login successful for user {request.user.username}")
        else:
            return Response({
                'success': False,
                'error': 'Login ke ESIMPEG gagal. Password salah atau akun tidak ditemukan di ESIMPEG.',
                'code': 'LOGIN_FAILED'
            }, status=status.HTTP_401_UNAUTHORIZED)

    sync_id = str(uuid.uuid4())[:8]

    progress = SyncProgress.objects.create(
        sync_id=sync_id,
        user=request.user,
        status='running'
    )

    sync_thread = threading.Thread(
        target=_run_sync_in_background,
        args=(sync_id, request.user.id, esimpeg_token)
    )
    sync_thread.daemon = True
    sync_thread.start()

    return Response({
        'success': True,
        'sync_id': sync_id,
        'message': 'Sync started in background'
    })


@api_view(['GET'])
@permission_classes([simpeg_permission('pegawai', 'view')])
def pegawai_sync_progress(request, sync_id):
    if not check_permission(request.user, 'api_simpeg', 'pegawai', 'view'):
        return Response({'success': False, 'error': 'Akses ditolak.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        progress = SyncProgress.objects.get(sync_id=sync_id, user=request.user)
        serializer = SyncProgressSerializer(progress)
        return Response({
            'success': True,
            **serializer.data
        })
    except SyncProgress.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Progress not found'
        }, status=status.HTTP_404_NOT_FOUND)


def _process_items_bulk(items, user, existing_ids_set, now):
    to_create = []
    to_update_ids = []
    to_update_data = []
    new_count = 0
    up_count = 0
    total = 0

    for item in items:
        id_pegawai = item.get('id_pegawai')
        if not id_pegawai:
            continue
        data = _build_pegawai_data(item, user)
        data['synced_at'] = now
        if id_pegawai in existing_ids_set:
            to_update_ids.append(id_pegawai)
            to_update_data.append(data)
        else:
            data['id_pegawai'] = id_pegawai
            data['created_at'] = now
            to_create.append(Pegawai(**data))
        total += 1

    if to_create:
        Pegawai.objects.bulk_create(to_create, ignore_conflicts=True)
        new_count = len(to_create)

    if to_update_ids:
        for id_pegawai, data in zip(to_update_ids, to_update_data):
            Pegawai.objects.filter(id_pegawai=id_pegawai).update(**data)
        up_count = len(to_update_ids)

    return total, new_count, up_count


def _link_users_to_pegawai():
    from django.contrib.auth import get_user_model
    User = get_user_model()

    users = User.objects.filter(
        id_pegawai__isnull=True
    ).exclude(
        username__isnull=True
    ).exclude(
        username=''
    )

    updated = 0
    for u in users:
        pegawai = Pegawai.objects.filter(
            nip_baru=u.username
        ).first()
        if pegawai:
            User.objects.filter(id=u.id).update(id_pegawai=pegawai.id_pegawai)
            updated += 1

    if updated:
        logger.info(f"Linked {updated} users to pegawai data by NIP match")


def _run_sync_in_background(sync_id, user_id, esimpeg_token):
    from django.contrib.auth import get_user_model
    User = get_user_model()

    start_time = time.time()
    api_service = EsimpegAPIService()

    try:
        progress = SyncProgress.objects.get(sync_id=sync_id)
        user = User.objects.get(id=user_id)

        sync_log = SyncLog.objects.create(synced_by=user, status='partial')
        total_records = 0
        new_records = 0
        updated_records = 0

        existing_ids_set = set(Pegawai.objects.values_list('id_pegawai', flat=True))

        first_data = api_service.get_pegawai_list(
            token=esimpeg_token, page=1, per_page=200, search=None, id_opd=None
        )

        if not first_data:
            raise Exception("Gagal mengambil data dari API ESIMPEG")

        total_pages = first_data.get('pagination', {}).get('total_pages', 1)
        total_items = first_data.get('pagination', {}).get('total', 0)

        progress.total_pages = total_pages
        progress.total_records = total_items
        progress.save()

        logger.info(f"[Sync {sync_id}] Starting sync: {total_pages} pages, {total_items} records")

        now = timezone.now()
        items = first_data.get('items', [])
        t, n, u = _process_items_bulk(items, user, existing_ids_set, now)
        total_records += t
        new_records += n
        updated_records += u
        existing_ids_set.update(item.get('id_pegawai') for item in items if item.get('id_pegawai'))

        progress.current_page = 1
        progress.processed_records = total_records
        progress.new_records = new_records
        progress.updated_records = updated_records
        progress.save()

        for page in range(2, total_pages + 1):
            data = api_service.get_pegawai_list(
                token=esimpeg_token, page=page, per_page=200, search=None, id_opd=None
            )
            if not data or not data.get('items'):
                continue

            items = data.get('items', [])
            t, n, u = _process_items_bulk(items, user, existing_ids_set, now)
            total_records += t
            new_records += n
            updated_records += u
            existing_ids_set.update(item.get('id_pegawai') for item in items if item.get('id_pegawai'))

            progress.current_page = page
            progress.processed_records = total_records
            progress.new_records = new_records
            progress.updated_records = updated_records
            progress.save()

        progress.status = 'completed'
        progress.save()

        _link_users_to_pegawai()

        duration = time.time() - start_time
        sync_log.total_records = total_records
        sync_log.new_records = new_records
        sync_log.updated_records = updated_records
        sync_log.status = 'success'
        sync_log.duration_seconds = duration
        sync_log.save()

        logger.info(f"[Sync {sync_id}] Completed: {total_records} records in {duration:.2f}s")

    except Exception as e:
        logger.error(f"[Sync {sync_id}] Error: {str(e)}", exc_info=True)
        try:
            progress = SyncProgress.objects.get(sync_id=sync_id)
            progress.status = 'failed'
            progress.error_message = str(e)
            progress.save()
        except Exception:
            pass
        try:
            if 'sync_log' in locals():
                sync_log.status = 'failed'
                sync_log.error_message = str(e)
                sync_log.duration_seconds = time.time() - start_time
                sync_log.save()
        except Exception:
            pass


@api_view(['GET'])
@permission_classes([simpeg_permission('pegawai', 'view')])
def pegawai_detail(request, pk):
    if not check_permission(request.user, 'api_simpeg', 'pegawai', 'view'):
        return Response({'success': False, 'error': 'Akses ditolak.'}, status=status.HTTP_403_FORBIDDEN)
    try:
        pegawai = Pegawai.objects.get(id_pegawai=pk)
        serializer = PegawaiListSerializer(pegawai)
        return Response({'success': True, 'data': serializer.data})
    except Pegawai.DoesNotExist:
        return Response({'success': False, 'error': 'Data pegawai tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([simpeg_permission('pegawai', 'view')])
def pegawai_sync_logs(request):
    if not check_permission(request.user, 'api_simpeg', 'pegawai', 'view'):
        return Response({'success': False, 'error': 'Akses ditolak.'}, status=status.HTTP_403_FORBIDDEN)
    logs = SyncLog.objects.all()[:20]
    serializer = SyncLogSerializer(logs, many=True)
    return Response({'success': True, 'data': serializer.data})


# ─── Bupati ──────────────────────────────────────────────────────────


@api_view(['GET'])
@permission_classes([simpeg_permission('bupati', 'view')])
def bupati_list(request):
    if not check_permission(request.user, 'api_simpeg', 'bupati', 'view'):
        return Response({'success': False, 'error': 'Akses ditolak.'}, status=status.HTTP_403_FORBIDDEN)

    page = int(request.query_params.get('page', 1))
    per_page = int(request.query_params.get('per_page', 10))

    if per_page not in [10, 25, 50, 100]:
        per_page = 10

    qs = Bupati.objects.all()
    total = qs.count()
    start = (page - 1) * per_page
    end = start + per_page
    items = qs[start:end]

    serializer = BupatiListSerializer(items, many=True)

    return Response({
        'success': True,
        'data': serializer.data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'total_pages': (total + per_page - 1) // per_page,
        },
    })


@api_view(['POST'])
@permission_classes([simpeg_permission('bupati', 'sync')])
def bupati_sync(request):
    if not check_permission(request.user, 'api_simpeg', 'bupati', 'sync'):
        return Response({'success': False, 'error': 'Akses ditolak.'}, status=status.HTTP_403_FORBIDDEN)

    password = request.data.get('password')
    esimpeg_token = request.session.get('esimpeg_access_token')

    if not esimpeg_token:
        if not password:
            return Response({
                'success': False,
                'code': 'PASSWORD_REQUIRED',
                'error': 'Token ESIMPEG tidak ditemukan.',
            }, status=status.HTTP_401_UNAUTHORIZED)
        api_service = EsimpegAPIService()
        login_result = api_service.login(username=request.user.username, password=password)
        if login_result and 'access_token' in login_result:
            esimpeg_token = login_result['access_token']
            request.session['esimpeg_access_token'] = esimpeg_token
            request.session['esimpeg_refresh_token'] = login_result.get('refresh_token')
        else:
            return Response({
                'success': False,
                'code': 'LOGIN_FAILED',
                'error': 'Login ke ESIMPEG gagal.',
            }, status=status.HTTP_401_UNAUTHORIZED)

    sync_id = str(uuid.uuid4())[:8]
    sync_thread = threading.Thread(
        target=_run_bupati_sync_in_background,
        args=(sync_id, request.user.id, esimpeg_token)
    )
    sync_thread.daemon = True
    sync_thread.start()

    return Response({'success': True, 'sync_id': sync_id, 'message': 'Sync bupati started'})


@api_view(['GET'])
@permission_classes([simpeg_permission('bupati', 'view')])
def bupati_sync_progress(request, sync_id):
    if not check_permission(request.user, 'api_simpeg', 'bupati', 'view'):
        return Response({'success': False, 'error': 'Akses ditolak.'}, status=status.HTTP_403_FORBIDDEN)
    try:
        progress = SyncProgress.objects.get(sync_id=sync_id, user=request.user)
        serializer = SyncProgressSerializer(progress)
        return Response({'success': True, **serializer.data})
    except SyncProgress.DoesNotExist:
        return Response({'success': False, 'error': 'Progress not found'}, status=status.HTTP_404_NOT_FOUND)


def _run_bupati_sync_in_background(sync_id, user_id, esimpeg_token):
    from django.contrib.auth import get_user_model
    User = get_user_model()

    try:
        progress = SyncProgress.objects.create(sync_id=sync_id, user_id=user_id, status='running')
        user = User.objects.get(id=user_id)

        api_service = EsimpegAPIService()
        data = api_service.get_bupati_list(token=esimpeg_token)

        if not data or not data.get('items'):
            progress.status = 'completed'
            progress.processed_records = 0
            progress.total_records = 0
            progress.save()
            return

        items = data.get('items', [])
        total = len(items)

        progress.total_pages = 1
        progress.total_records = total
        progress.save()

        now = timezone.now()
        existing_ids = set(Bupati.objects.values_list('id_bupati', flat=True))

        to_create = []
        to_update_ids = []
        to_update_data = []

        for item in items:
            id_bupati = item.get('id')
            if not id_bupati:
                continue

            nama_status = item.get('namaStatus') or ''
            status_val = item.get('status')
            if status_val is None:
                status_val = 1 if nama_status.lower() == 'aktif' else 0

            bupati_data = {
                'nama': item.get('nama', ''),
                'gelar_depan': item.get('gelar_depan'),
                'gelar_belakang': item.get('gelar_belakang'),
                'nik': item.get('nik'),
                'foto': item.get('foto'),
                'jabatan': item.get('jabatan') or _safe_int(item.get('jabatan')),
                'nama_jabatan': item.get('namaJabatan'),
                'status': status_val,
                'nama_status': nama_status,
                'jenis_penugasan': item.get('jenisPenugasan'),
                'periode_awal': item.get('periodeAwal'),
                'periode_akhir': item.get('periodeAkhir'),
                'raw_data': item,
                'synced_by': user,
                'synced_at': now,
            }

            if id_bupati in existing_ids:
                to_update_ids.append(id_bupati)
                to_update_data.append(bupati_data)
            else:
                bupati_data['id_bupati'] = id_bupati
                bupati_data['created_at'] = now
                to_create.append(Bupati(**bupati_data))

        if to_create:
            Bupati.objects.bulk_create(to_create, ignore_conflicts=True)

        if to_update_ids:
            for id_bupati, data in zip(to_update_ids, to_update_data):
                Bupati.objects.filter(id_bupati=id_bupati).update(**data)

        progress.current_page = 1
        progress.processed_records = total
        progress.new_records = len(to_create)
        progress.updated_records = len(to_update_ids)
        progress.status = 'completed'
        progress.save()

        logger.info(f"[Bupati Sync {sync_id}] Completed: {total} records")

    except Exception as e:
        logger.error(f"[Bupati Sync {sync_id}] Error: {str(e)}", exc_info=True)
        try:
            progress = SyncProgress.objects.get(sync_id=sync_id)
            progress.status = 'failed'
            progress.error_message = str(e)
            progress.save()
        except Exception:
            pass


# ─── Unit Kerja ────────────────────────────────────────────────────────


def _build_unit_kerja_data(item, user):
    jenis = item.get('jenis_organisasi') or {}
    status_val = item.get('status')
    if status_val is None:
        status_val = 1
    return {
        'nm_opd': item.get('nama') or '',
        'id_opd_urut': item.get('no_urut') or None,
        'level': _safe_int(item.get('level')) or 0,
        'is_opd_induk': bool(item.get('is_opd_induk', False)),
        'status': status_val,
        'id_jenis_organisasi': jenis.get('id'),
        'nama_jenis_organisasi': jenis.get('nama'),
        'path': item.get('path') or [],
        'raw_data': item,
        'synced_by': user,
    }


def _process_unit_kerja_items(items, user, existing_ids_set, now):
    to_create = []
    to_update_ids = []
    to_update_data = []
    new_count = 0
    up_count = 0
    total = 0

    for item in items:
        id_opd = item.get('id_opd')
        if not id_opd:
            continue
        data = _build_unit_kerja_data(item, user)
        data['synced_at'] = now
        if id_opd in existing_ids_set:
            to_update_ids.append(id_opd)
            to_update_data.append(data)
        else:
            data['id_opd'] = id_opd
            data['created_at'] = now
            to_create.append(UnitKerja(**data))
        total += 1

    if to_create:
        UnitKerja.objects.bulk_create(to_create, ignore_conflicts=True)
        new_count = len(to_create)

    if to_update_ids:
        for id_opd, data in zip(to_update_ids, to_update_data):
            UnitKerja.objects.filter(id_opd=id_opd).update(**data)
        up_count = len(to_update_ids)

    return total, new_count, up_count


def _relink_unit_kerja_parents():
    """Re-link parent_id (self-FK) dari raw_data['parent_id'].

    Flat list API tidak menjamin parent lebih dulu, jadi relink dilakukan
    setelah semua halaman tersimpan. Parent lama (sudah dihapus di ESIMPEG)
    di-set NULL agar tidak menggantung ke unit yang tidak ada.
    """
    units = {u.id_opd: u for u in UnitKerja.objects.all().only('id_opd', 'parent_id', 'raw_data')}
    valid_ids = set(units.keys())
    updates = []

    for u in units.values():
        raw = u.raw_data or {}
        pid = raw.get('parent_id')
        if pid is not None and pid in valid_ids and pid != u.id_opd:
            parent_obj = units[pid]
            if u.parent_id != parent_obj.pk:
                u.parent = parent_obj
                updates.append(u)
        elif pid is not None and u.parent_id is not None:
            u.parent = None
            updates.append(u)

    if updates:
        UnitKerja.objects.bulk_update(updates, ['parent'])

    return len(updates)


@api_view(['GET'])
@permission_classes([simpeg_permission('unit_kerja', 'view')])
def unit_kerja_list(request):
    if not check_permission(request.user, 'api_simpeg', 'unit_kerja', 'view'):
        return Response({'success': False, 'error': 'Anda tidak memiliki akses untuk melihat data unit kerja.'}, status=status.HTTP_403_FORBIDDEN)

    search = request.query_params.get('search', '').strip()
    parent_id = request.query_params.get('parent_id', '')
    status_filter = request.query_params.get('status', '')
    is_opd_induk = request.query_params.get('is_opd_induk', '')
    page = int(request.query_params.get('page', 1))
    per_page = int(request.query_params.get('per_page', 10))

    if per_page not in [10, 25, 50, 100]:
        per_page = 10

    qs = UnitKerja.objects.select_related('parent').all()

    if search:
        qs = qs.filter(nm_opd__icontains=search)

    if parent_id:
        try:
            qs = qs.filter(parent__id_opd=int(parent_id))
        except (ValueError, TypeError):
            pass

    if status_filter in ('0', '1'):
        qs = qs.filter(status=int(status_filter))

    if is_opd_induk in ('true', '1'):
        qs = qs.filter(is_opd_induk=True)

    total = qs.count()
    start = (page - 1) * per_page
    end = start + per_page
    items = qs[start:end]

    serializer = UnitKerjaListSerializer(items, many=True)

    stats = qs.aggregate(
        total_aktif=Count('id_opd', filter=Q(status=1)),
        total_nonaktif=Count('id_opd', filter=~Q(status=1)),
        total_opd_induk=Count('id_opd', filter=Q(is_opd_induk=True)),
        total_opd_induk_aktif=Count('id_opd', filter=Q(is_opd_induk=True, status=1)),
    )

    last_sync = SyncLog.objects.filter(status='success').first()
    last_sync_data = None
    if last_sync:
        last_sync_data = {
            'synced_at': last_sync.synced_at.isoformat() if last_sync.synced_at else None,
            'total_records': last_sync.total_records,
            'synced_by': last_sync.synced_by.username if last_sync.synced_by else None,
        }

    return Response({
        'success': True,
        'data': serializer.data,
        'stats': {
            'total_aktif': stats['total_aktif'] or 0,
            'total_nonaktif': stats['total_nonaktif'] or 0,
            'total_opd_induk': stats['total_opd_induk'] or 0,
            'total_opd_induk_aktif': stats['total_opd_induk_aktif'] or 0,
        },
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'total_pages': (total + per_page - 1) // per_page,
        },
        'last_sync': last_sync_data,
    })


@api_view(['POST'])
@permission_classes([simpeg_permission('unit_kerja', 'sync')])
def unit_kerja_sync(request):
    if not check_permission(request.user, 'api_simpeg', 'unit_kerja', 'sync'):
        return Response({'success': False, 'error': 'Anda tidak memiliki akses untuk sinkronisasi data unit kerja.'}, status=status.HTTP_403_FORBIDDEN)

    password = request.data.get('password')
    esimpeg_token = request.session.get('esimpeg_access_token')

    if not esimpeg_token:
        if not password:
            return Response({
                'success': False,
                'code': 'PASSWORD_REQUIRED',
                'error': 'Token ESIMPEG tidak ditemukan.',
            }, status=status.HTTP_401_UNAUTHORIZED)
        api_service = EsimpegAPIService()
        login_result = api_service.login(username=request.user.username, password=password)
        if login_result and 'access_token' in login_result:
            esimpeg_token = login_result['access_token']
            request.session['esimpeg_access_token'] = esimpeg_token
            request.session['esimpeg_refresh_token'] = login_result.get('refresh_token')
        else:
            return Response({
                'success': False,
                'code': 'LOGIN_FAILED',
                'error': 'Login ke ESIMPEG gagal.',
            }, status=status.HTTP_401_UNAUTHORIZED)

    sync_id = str(uuid.uuid4())[:8]

    SyncProgress.objects.create(
        sync_id=sync_id,
        user=request.user,
        status='running'
    )

    sync_thread = threading.Thread(
        target=_run_unit_kerja_sync_in_background,
        args=(sync_id, request.user.id, esimpeg_token)
    )
    sync_thread.daemon = True
    sync_thread.start()

    return Response({'success': True, 'sync_id': sync_id, 'message': 'Sync unit kerja started'})


@api_view(['GET'])
@permission_classes([simpeg_permission('unit_kerja', 'view')])
def unit_kerja_sync_progress(request, sync_id):
    if not check_permission(request.user, 'api_simpeg', 'unit_kerja', 'view'):
        return Response({'success': False, 'error': 'Akses ditolak.'}, status=status.HTTP_403_FORBIDDEN)
    try:
        progress = SyncProgress.objects.get(sync_id=sync_id, user=request.user)
        serializer = SyncProgressSerializer(progress)
        return Response({'success': True, **serializer.data})
    except SyncProgress.DoesNotExist:
        return Response({'success': False, 'error': 'Progress not found'}, status=status.HTTP_404_NOT_FOUND)


def _run_unit_kerja_sync_in_background(sync_id, user_id, esimpeg_token):
    from django.contrib.auth import get_user_model
    User = get_user_model()

    start_time = time.time()
    api_service = EsimpegAPIService()

    try:
        progress = SyncProgress.objects.get(sync_id=sync_id)
        user = User.objects.get(id=user_id)

        sync_log = SyncLog.objects.create(synced_by=user, status='partial')
        total_records = 0
        new_records = 0
        updated_records = 0

        existing_ids_set = set(UnitKerja.objects.values_list('id_opd', flat=True))

        first_data = api_service.get_unit_kerja_list(token=esimpeg_token, page=1, per_page=200)

        if not first_data:
            raise Exception("Gagal mengambil data dari API ESIMPEG")

        total_pages = first_data.get('pagination', {}).get('total_pages', 1)
        total_items = first_data.get('pagination', {}).get('total', 0)

        progress.total_pages = total_pages
        progress.total_records = total_items
        progress.save()

        logger.info(f"[Sync {sync_id}] Starting unit kerja sync: {total_pages} pages, {total_items} records")

        now = timezone.now()
        items = first_data.get('items', [])
        t, n, u = _process_unit_kerja_items(items, user, existing_ids_set, now)
        total_records += t
        new_records += n
        updated_records += u
        existing_ids_set.update(item.get('id_opd') for item in items if item.get('id_opd'))

        progress.current_page = 1
        progress.processed_records = total_records
        progress.new_records = new_records
        progress.updated_records = updated_records
        progress.save()

        for page in range(2, total_pages + 1):
            data = api_service.get_unit_kerja_list(token=esimpeg_token, page=page, per_page=200)
            if not data or not data.get('items'):
                continue

            items = data.get('items', [])
            t, n, u = _process_unit_kerja_items(items, user, existing_ids_set, now)
            total_records += t
            new_records += n
            updated_records += u
            existing_ids_set.update(item.get('id_opd') for item in items if item.get('id_opd'))

            progress.current_page = page
            progress.processed_records = total_records
            progress.new_records = new_records
            progress.updated_records = updated_records
            progress.save()

        relinked = _relink_unit_kerja_parents()

        progress.status = 'completed'
        progress.save()

        duration = time.time() - start_time
        sync_log.total_records = total_records
        sync_log.new_records = new_records
        sync_log.updated_records = updated_records
        sync_log.status = 'success'
        sync_log.duration_seconds = duration
        sync_log.save()

        logger.info(f"[Sync {sync_id}] Completed: {total_records} records, {relinked} parent links fixed in {duration:.2f}s")

    except Exception as e:
        logger.error(f"[Sync {sync_id}] Error: {str(e)}", exc_info=True)
        try:
            progress = SyncProgress.objects.get(sync_id=sync_id)
            progress.status = 'failed'
            progress.error_message = str(e)
            progress.save()
        except Exception:
            pass
        try:
            if 'sync_log' in locals():
                sync_log.status = 'failed'
                sync_log.error_message = str(e)
                sync_log.duration_seconds = time.time() - start_time
                sync_log.save()
        except Exception:
            pass


@api_view(['GET'])
@permission_classes([simpeg_permission('unit_kerja', 'view')])
def unit_kerja_tree(request):
    """Tree hierarki unit kerja dari database lokal asncorpu.

    Hierarki dibangun dari field ``path`` (materialized path hasil sync ESIMPEG)
    karena relasi ``parent`` pada sumber data tidak konsisten (ada siklus).

    Query param:
      search           : cari nama unit; hasil dipangkas ke subtree yang cocok
                         (pencarian mencakup seluruh unit, termasuk non-aktif)
      include_inactive : '1' untuk menyertakan unit status=0; tanpa ini unit
                         non-aktif tetap tampil redup sebagai konteks bila
                         punya keturunan aktif (ditandai ``_context``)
      root_id          : batasi tree mulai dari unit tertentu
    """
    if not check_permission(request.user, 'api_simpeg', 'unit_kerja', 'view'):
        return Response({'success': False, 'error': 'Anda tidak memiliki akses untuk melihat data unit kerja.'}, status=status.HTTP_403_FORBIDDEN)

    search = (request.GET.get('search') or '').strip().lower()
    include_inactive = request.GET.get('include_inactive') == '1'
    root_id = request.GET.get('root_id')

    units = list(UnitKerja.objects.all().only(
        'id_opd', 'nm_opd', 'status', 'level',
        'is_opd_induk', 'nama_jenis_organisasi', 'id_opd_urut', 'path'
    ))

    info = {}
    paths = {}
    for u in units:
        p = u.path
        if isinstance(p, str):
            try:
                p = json.loads(p)
            except (TypeError, ValueError):
                p = None
        ids = [e.get('id_opd') for e in (p or []) if e.get('id_opd')]
        paths[u.id_opd] = ids
        info[u.id_opd] = {
            'id_opd': u.id_opd,
            'nm_opd': u.nm_opd,
            'level': u.level,
            'status': u.status,
            'is_opd_induk': u.is_opd_induk,
            'jenis_organisasi': u.nama_jenis_organisasi,
            'id_opd_urut': u.id_opd_urut,
        }
        # pastikan node path yang bukan unit tetap punya info minimal
        for e in (p or []):
            pid = e.get('id_opd')
            if pid and pid not in info:
                info[pid] = {
                    'id_opd': pid, 'nm_opd': e.get('nama'), 'level': None,
                    'status': 1, 'is_opd_induk': False,
                    'jenis_organisasi': None, 'id_opd_urut': None,
                }

    # bangun edge parent->child dari rantai path
    children_map = {}
    roots = []
    for uid, ids in paths.items():
        if not ids:
            roots.append(uid)
            continue
        if ids[-1] != uid:
            ids = ids + [uid]
        for a, b in zip(ids, ids[1:]):
            children_map.setdefault(a, set()).add(b)
        roots.append(ids[0])

    def _sort_key(nid):
        n = info.get(nid, {})
        urut = n.get('id_opd_urut')
        return (urut is None, urut or 0, (n.get('nm_opd') or '').lower(), nid)

    # hapus duplikat root, pertahankan urutan
    seen_roots = set()
    ordered_roots = []
    for r in sorted(set(roots), key=_sort_key):
        if r not in seen_roots:
            seen_roots.add(r)
            ordered_roots.append(r)

    if root_id:
        try:
            rid = int(root_id)
        except (TypeError, ValueError):
            rid = None
        ordered_roots = [rid] if rid in info else []

    visible = {n['id_opd'] for n in info.values() if n['status'] == 1} if not include_inactive else None

    total_shown = 0

    def _serialize(nid, depth, seen):
        """Return dict node atau None bila dipangkas."""
        nonlocal total_shown
        if nid not in info or nid in seen or depth > 60:
            return None
        seen = seen | {nid}
        node = info[nid]

        kept_children = []
        for kid in sorted(children_map.get(nid, ()), key=_sort_key):
            child = _serialize(kid, depth + 1, seen)
            if child is not None:
                kept_children.append(child)

        is_visible = visible is None or nid in visible
        name_match = (not search) or (search in (node.get('nm_opd') or '').lower())

        if search:
            # mode cari: abaikan filter status, sisakan subtree yang cocok
            if not name_match and not kept_children:
                return None
        elif not is_visible:
            # konteks: hanya tampil bila punya keturunan aktif
            if not kept_children:
                return None

        total_shown += 1
        result = dict(node)
        result['children'] = kept_children
        result['_context'] = not is_visible
        return result

    data = []
    for r in ordered_roots:
        node = _serialize(r, 0, frozenset())
        if node is not None:
            data.append(node)

    return Response({
        'success': True,
        'data': data,
        'stats': {
            'total_shown': total_shown,
            'total_all': len(units),
            'total_roots': len(data),
        },
    })


def _serialize_desain_unit(desain):
    return {
        'id': desain.id,
        'unit_kerja': {
            'id_opd': desain.unit_kerja_id,
            'nm_opd': desain.unit_kerja.nm_opd,
            'path_names': [
                p.get('nama') for p in (desain.unit_kerja.path or [])
                if isinstance(p, dict)
            ],
        },
        # tiap kompetensi teknis membawa daftar tujuannya sendiri
        'kompetensi_teknis': [
            {
                'id': k.id,
                'uraian': k.uraian,
                'urutan': k.urutan,
                'tujuan': [
                    {'id': t.id, 'uraian': t.uraian, 'urutan': t.urutan}
                    for t in k.tujuan.all()
                ],
            }
            for k in desain.kompetensi_teknis.prefetch_related('tujuan').all()
        ],
        'keterangan': desain.keterangan,
        'updated_at': desain.updated_at.isoformat() if desain.updated_at else None,
    }


def _clean_uraian_rows(raw_rows):
    """Normalisasi list [{uraian, urutan?}] -> [(uraian, urutan)], buang kosong.
    Return None bila tipe bukan list (invalid)."""
    if raw_rows is None:
        return []
    if not isinstance(raw_rows, list):
        return None
    cleaned = []
    for i, r in enumerate(raw_rows, start=1):
        uraian = str((r or {}).get('uraian') or '').strip()
        if not uraian:
            continue
        cleaned.append((uraian, int((r or {}).get('urutan') or i)))
    return cleaned


def _clean_kompetensi_rows(raw_rows):
    """Normalisasi list kompetensi bersarang tujuan.
    Return list of dict atau None bila invalid."""
    if raw_rows is None:
        return []
    if not isinstance(raw_rows, list):
        return None
    cleaned = []
    for i, kc in enumerate(raw_rows, start=1):
        uraian = str((kc or {}).get('uraian') or '').strip()
        if not uraian:
            continue  # kompetensi tanpa uraian dibuang beserta tujuannya
        tujuan = _clean_uraian_rows((kc or {}).get('tujuan'))
        if tujuan is None:
            return None
        cleaned.append({
            'uraian': uraian,
            'urutan': int((kc or {}).get('urutan') or i),
            'tujuan': tujuan,
        })
    return cleaned


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([simpeg_permission('unit_kerja', 'view')])
def unit_kerja_desain(request, id_opd):
    """Desain pembelajaran satu unit kerja.

    GET    : lihat desain (kosong = belum diisi)  -> permission view
    PUT    : simpan/upsert desain                 -> permission change
             body: {
               keterangan?,
               kompetensi_teknis: [          # input bebas, boleh >1
                 { uraian, urutan?,
                   tujuan: [{uraian, urutan?}] }   # milik kompetensi ini
               ]
             }
             strategi replace: seluruh kompetensi (+tujuannya) diganti
    DELETE : hapus desain unit tsb                -> permission change
    """
    unit = UnitKerja.objects.filter(id_opd=id_opd).first()
    if not unit:
        return Response({'success': False, 'error': 'Unit kerja tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        if not check_permission(request.user, 'api_simpeg', 'unit_kerja', 'view'):
            return Response({'success': False, 'error': 'Anda tidak memiliki akses.'}, status=status.HTTP_403_FORBIDDEN)
        desain = DesainPembelajaranUnit.objects.filter(unit_kerja=unit).first()
        if not desain:
            return Response({
                'success': True,
                'data': None,
                'message': 'Belum ada desain pembelajaran untuk unit kerja ini.',
            })
        return Response({'success': True, 'data': _serialize_desain_unit(desain)})

    # PUT / DELETE butuh permission change
    if not check_permission(request.user, 'api_simpeg', 'unit_kerja', 'change'):
        return Response({'success': False, 'error': 'Anda tidak memiliki akses untuk mengubah desain pembelajaran.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'DELETE':
        deleted, _ = DesainPembelajaranUnit.objects.filter(unit_kerja=unit).delete()
        return Response({'success': True, 'message': f'Desain pembelajaran dihapus ({deleted} record).'})

    # ---- PUT ----
    payload = getattr(request, 'data', None) or {}
    keterangan = (payload.get('keterangan') or '').strip()

    komp_rows = _clean_kompetensi_rows(payload.get('kompetensi_teknis'))
    if komp_rows is None:
        return Response(
            {'success': False, 'error': 'Field "kompetensi_teknis" harus berupa list.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    desain = DesainPembelajaranUnit.objects.filter(unit_kerja=unit).first()
    if desain is None:
        desain = DesainPembelajaranUnit(unit_kerja=unit)
    desain.keterangan = keterangan
    desain.updated_by = request.user
    if desain.pk is None:
        desain.created_by = request.user
    desain.save()

    # replace strategy: hapus kompetensi lama (cascade tujuan), buat ulang
    desain.kompetensi_teknis.all().delete()
    for kr in komp_rows:
        k = KompetensiTeknisUnit.objects.create(
            desain=desain, uraian=kr['uraian'], urutan=kr['urutan']
        )
        TujuanPembelajaranUnit.objects.bulk_create([
            TujuanPembelajaranUnit(kompetensi=k, uraian=u, urutan=o)
            for u, o in kr['tujuan']
        ])
    desain.refresh_from_db()

    return Response({
        'success': True,
        'data': _serialize_desain_unit(desain),
        'message': 'Desain pembelajaran berhasil disimpan.',
    })


@api_view(['GET'])
@permission_classes([simpeg_permission('unit_kerja', 'view')])
def unit_kerja_desain_options(request):
    """Daftar unit kerja (aktif) yang sudah punya kompetensi teknis pada
    desain pembelajarannya — untuk pilihan Target Kompetensi IDP.

    Respons per item menyertakan daftar kompetensi teknisnya (beserta tujuan
    pembelajarannya) sehingga frontend tidak perlu request kedua saat unit dipilih.
    """
    if not check_permission(request.user, 'api_simpeg', 'unit_kerja', 'view'):
        return Response({'success': False, 'error': 'Anda tidak memiliki akses.'}, status=status.HTTP_403_FORBIDDEN)

    desains = (
        DesainPembelajaranUnit.objects
        .filter(unit_kerja__status=1, kompetensi_teknis__isnull=False)
        .select_related('unit_kerja')
        .prefetch_related('kompetensi_teknis__tujuan')
        .distinct()
        .order_by('unit_kerja__id_opd_urut', 'unit_kerja__nm_opd')
    )

    data = []
    for d in desains:
        u = d.unit_kerja
        path = u.path if isinstance(u.path, list) else []
        data.append({
            'id_opd': u.id_opd,
            'nm_opd': u.nm_opd,
            'path_names': [p.get('nama') for p in path if isinstance(p, dict)],
            'kompetensi': [
                {'id': k.id, 'uraian': k.uraian, 'urutan': k.urutan,
                 'tujuan': [
                     {'id': t.id, 'uraian': t.uraian, 'urutan': t.urutan}
                     for t in k.tujuan.all()
                 ]}
                for k in d.kompetensi_teknis.all()
            ],
        })

    return Response({'success': True, 'data': data})
