from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db.models import Q, Count
from .models import HcdpProgram
from .forms import HcdpProgramForm
import json


@csrf_exempt
@require_http_methods(["GET", "POST"])
def program_list_create(request):
    """
    GET: List semua program HCDP dengan pagination dan filter
    POST: Create program HCDP baru
    """
    if request.method == 'GET':
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 10))
        search = request.GET.get('search', '')
        category = request.GET.get('category', '')
        status = request.GET.get('status', '')
        
        programs = HcdpProgram.objects.all().order_by('-created_at')
        
        if search:
            programs = programs.filter(
                Q(judul__icontains=search) |
                Q(deskripsi__icontains=search)
            )
        
        if category and category != 'all':
            programs = programs.filter(kategori__iexact=category)
        
        if status and status != 'all':
            programs = programs.filter(status=status)
        
        paginator = Paginator(programs, per_page)
        page_obj = paginator.get_page(page)
        
        data = {
            'status': 'success',
            'data': [
                {
                    'id': p.id,
                    'title': p.judul,
                    'description': p.deskripsi,
                    'category': p.kategori,
                    'instructor': p.instruktur,
                    'start_date': p.tanggal_mulai.isoformat() if p.tanggal_mulai else None,
                    'end_date': p.tanggal_selesai.isoformat() if p.tanggal_selesai else None,
                    'duration': p.durasi,
                    'location': p.lokasi,
                    'max_participants': p.maks_peserta,
                    'registered_participants': 0,
                    'status': p.status,
                    'level': p.level,
                    'tags': p.tags_list,
                    'is_active': p.is_active,
                    'is_published': p.is_published,
                    'gambar_url': request.build_absolute_uri(p.gambar.url) if p.gambar else None,
                    'created_at': p.created_at.isoformat(),
                    'updated_at': p.updated_at.isoformat(),
                }
                for p in page_obj
            ],
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
            body = json.loads(request.body)
            
            program = HcdpProgram.objects.create(
                judul=body.get('title', ''),
                deskripsi=body.get('description', ''),
                kategori=body.get('category', 'Leadership'),
                instruktur=body.get('instructor', ''),
                durasi=body.get('duration', ''),
                lokasi=body.get('location', ''),
                maks_peserta=body.get('max_participants', 0),
                status=body.get('status', 'upcoming'),
                level=body.get('level', 'beginner'),
                tags=', '.join(body.get('tags', [])) if isinstance(body.get('tags'), list) else body.get('tags', ''),
                is_active=body.get('is_active', True),
                is_published=body.get('is_published', False),
                created_by=request.user if request.user.is_authenticated else None
            )
            
            if body.get('start_date'):
                from datetime import datetime
                try:
                    program.tanggal_mulai = datetime.fromisoformat(body['start_date'].replace('Z', '')).date()
                except (ValueError, AttributeError):
                    pass
            
            if body.get('end_date'):
                from datetime import datetime
                try:
                    program.tanggal_selesai = datetime.fromisoformat(body['end_date'].replace('Z', '')).date()
                except (ValueError, AttributeError):
                    pass
            
            program.save()
            
            return JsonResponse({
                'status': 'success',
                'message': 'Program berhasil ditambahkan',
                'data': {
                    'id': program.id,
                    'title': program.judul,
                    'description': program.deskripsi,
                    'category': program.kategori,
                    'instructor': program.instruktur,
                    'start_date': program.tanggal_mulai.isoformat() if program.tanggal_mulai else None,
                    'end_date': program.tanggal_selesai.isoformat() if program.tanggal_selesai else None,
                    'duration': program.durasi,
                    'location': program.lokasi,
                    'max_participants': program.maks_peserta,
                    'status': program.status,
                    'level': program.level,
                    'tags': program.tags_list,
                    'is_active': program.is_active,
                    'is_published': program.is_published,
                    'created_at': program.created_at.isoformat(),
                }
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid JSON'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def program_detail(request, pk):
    """
    GET: Detail program HCDP
    PUT: Update program HCDP
    DELETE: Delete program HCDP
    """
    try:
        program = HcdpProgram.objects.get(pk=pk)
    except HcdpProgram.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Program tidak ditemukan'
        }, status=404)
    
    if request.method == 'GET':
        data = {
            'status': 'success',
            'data': {
                'id': program.id,
                'title': program.judul,
                'description': program.deskripsi,
                'category': program.kategori,
                'instructor': program.instruktur,
                'start_date': program.tanggal_mulai.isoformat() if program.tanggal_mulai else None,
                'end_date': program.tanggal_selesai.isoformat() if program.tanggal_selesai else None,
                'duration': program.durasi,
                'location': program.lokasi,
                'max_participants': program.maks_peserta,
                'registered_participants': 0,
                'status': program.status,
                'level': program.level,
                'tags': program.tags_list,
                'is_active': program.is_active,
                'is_published': program.is_published,
                'gambar_url': request.build_absolute_uri(program.gambar.url) if program.gambar else None,
                'created_at': program.created_at.isoformat(),
                'updated_at': program.updated_at.isoformat(),
            }
        }
        return JsonResponse(data)
    
    elif request.method == 'PUT':
        try:
            body = json.loads(request.body)
            
            if 'title' in body:
                program.judul = body['title']
            if 'description' in body:
                program.deskripsi = body['description']
            if 'category' in body:
                program.kategori = body['category']
            if 'instructor' in body:
                program.instruktur = body['instructor']
            if 'duration' in body:
                program.durasi = body['duration']
            if 'location' in body:
                program.lokasi = body['location']
            if 'max_participants' in body:
                program.maks_peserta = body['max_participants']
            if 'status' in body:
                program.status = body['status']
            if 'level' in body:
                program.level = body['level']
            if 'tags' in body:
                program.tags = ', '.join(body['tags']) if isinstance(body['tags'], list) else body['tags']
            if 'is_active' in body:
                program.is_active = body['is_active']
            if 'is_published' in body:
                program.is_published = body['is_published']
            
            if 'start_date' in body and body['start_date']:
                from datetime import datetime
                try:
                    program.tanggal_mulai = datetime.fromisoformat(body['start_date'].replace('Z', '')).date()
                except (ValueError, AttributeError):
                    pass
            elif 'start_date' in body and body['start_date'] is None:
                program.tanggal_mulai = None
            
            if 'end_date' in body and body['end_date']:
                from datetime import datetime
                try:
                    program.tanggal_selesai = datetime.fromisoformat(body['end_date'].replace('Z', '')).date()
                except (ValueError, AttributeError):
                    pass
            elif 'end_date' in body and body['end_date'] is None:
                program.tanggal_selesai = None
            
            program.save()
            
            return JsonResponse({
                'status': 'success',
                'message': 'Program berhasil diupdate',
                'data': {
                    'id': program.id,
                    'title': program.judul,
                    'description': program.deskripsi,
                    'category': program.kategori,
                    'instructor': program.instruktur,
                    'start_date': program.tanggal_mulai.isoformat() if program.tanggal_mulai else None,
                    'end_date': program.tanggal_selesai.isoformat() if program.tanggal_selesai else None,
                    'duration': program.durasi,
                    'location': program.lokasi,
                    'max_participants': program.maks_peserta,
                    'status': program.status,
                    'level': program.level,
                    'tags': program.tags_list,
                    'is_active': program.is_active,
                    'is_published': program.is_published,
                    'updated_at': program.updated_at.isoformat(),
                }
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid JSON'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    elif request.method == 'DELETE':
        program.delete()
        return JsonResponse({
            'status': 'success',
            'message': 'Program berhasil dihapus'
        })


@csrf_exempt
@require_http_methods(["GET"])
def program_stats(request):
    """
    Get statistik program HCDP untuk dashboard
    """
    total_programs = HcdpProgram.objects.count()
    active_programs = HcdpProgram.objects.filter(is_active=True).count()
    published_programs = HcdpProgram.objects.filter(is_published=True).count()
    ongoing_programs = HcdpProgram.objects.filter(status='ongoing').count()
    completed_programs = HcdpProgram.objects.filter(status='completed').count()
    
    data = {
        'status': 'success',
        'data': {
            'total_programs': total_programs,
            'active_programs': active_programs,
            'published_programs': published_programs,
            'ongoing_programs': ongoing_programs,
            'completed_programs': completed_programs,
            'total_participants': 0,
        }
    }
    
    return JsonResponse(data)
