import logging
import time
import uuid
import threading

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q, Case, When, Value, IntegerField
from django.utils import timezone

from apps.manajemen.helpers import check_permission
from .models import Pegawai, Bupati, SyncLog, SyncProgress
from .serializers import PegawaiListSerializer, BupatiListSerializer, SyncProgressSerializer, SyncLogSerializer
from .services import EsimpegAPIService

logger = logging.getLogger(__name__)


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
        'raw_data': item,
        'synced_by': user,
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
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
@permission_classes([IsAuthenticated])
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
@permission_classes([IsAuthenticated])
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
@permission_classes([IsAuthenticated])
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
@permission_classes([IsAuthenticated])
def pegawai_sync_logs(request):
    if not check_permission(request.user, 'api_simpeg', 'pegawai', 'view'):
        return Response({'success': False, 'error': 'Akses ditolak.'}, status=status.HTTP_403_FORBIDDEN)
    logs = SyncLog.objects.all()[:20]
    serializer = SyncLogSerializer(logs, many=True)
    return Response({'success': True, 'data': serializer.data})


# ─── Bupati ──────────────────────────────────────────────────────────


@api_view(['GET'])
@permission_classes([IsAuthenticated])
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
@permission_classes([IsAuthenticated])
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
@permission_classes([IsAuthenticated])
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
