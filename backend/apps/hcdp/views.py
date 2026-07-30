from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import HcdpProgram
from .forms import HcdpProgramForm
import json


# ============================================
# Public Views (Landing Page)
# ============================================

def hcdp_public_list(request):
    """
    Halaman public untuk menampilkan daftar program HCDP
    """
    programs = HcdpProgram.objects.filter(
        is_active=True,
        is_published=True
    ).order_by('-created_at')
    
    # Pagination
    paginator = Paginator(programs, 9)  # 9 items per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'programs': page_obj,
        'total_programs': programs.count()
    }
    
    return render(request, 'hcdp/public_list.html', context)


def hcdp_public_detail(request, pk):
    """
    Halaman public untuk detail program HCDP
    """
    program = get_object_or_404(
        HcdpProgram,
        pk=pk,
        is_active=True,
        is_published=True
    )
    
    context = {
        'program': program
    }
    
    return render(request, 'hcdp/public_detail.html', context)


# ============================================
# Dashboard Views (CRUD)
# ============================================

@login_required
def hcdp_dashboard_list(request):
    """
    Dashboard: List semua program HCDP dengan pagination
    """
    programs = HcdpProgram.objects.all().order_by('-created_at')
    
    # Search
    search = request.GET.get('search', '')
    if search:
        programs = programs.filter(judul__icontains=search)
    
    # Filter by status
    status = request.GET.get('status', '')
    if status == 'active':
        programs = programs.filter(is_active=True)
    elif status == 'inactive':
        programs = programs.filter(is_active=False)
    
    # Pagination
    paginator = Paginator(programs, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'programs': page_obj,
        'search': search,
        'status': status,
        'total_programs': programs.count()
    }
    
    return render(request, 'hcdp/dashboard_list.html', context)


@login_required
def hcdp_dashboard_create(request):
    """
    Dashboard: Create program HCDP baru
    """
    if request.method == 'POST':
        form = HcdpProgramForm(request.POST, request.FILES)
        if form.is_valid():
            program = form.save(commit=False)
            program.created_by = request.user
            program.save()
            messages.success(request, 'Program HCDP berhasil ditambahkan!')
            return redirect('hcdp:dashboard_list')
    else:
        form = HcdpProgramForm()
    
    context = {
        'form': form,
        'action': 'create'
    }
    
    return render(request, 'hcdp/dashboard_form.html', context)


@login_required
def hcdp_dashboard_update(request, pk):
    """
    Dashboard: Update program HCDP
    """
    program = get_object_or_404(HcdpProgram, pk=pk)
    
    if request.method == 'POST':
        form = HcdpProgramForm(request.POST, request.FILES, instance=program)
        if form.is_valid():
            form.save()
            messages.success(request, 'Program HCDP berhasil diupdate!')
            return redirect('hcdp:dashboard_list')
    else:
        form = HcdpProgramForm(instance=program)
    
    context = {
        'form': form,
        'program': program,
        'action': 'update'
    }
    
    return render(request, 'hcdp/dashboard_form.html', context)


@login_required
@require_http_methods(["POST"])
def hcdp_dashboard_delete(request, pk):
    """
    Dashboard: Delete program HCDP
    """
    program = get_object_or_404(HcdpProgram, pk=pk)
    program.delete()
    messages.success(request, 'Program HCDP berhasil dihapus!')
    return redirect('hcdp:dashboard_list')


@login_required
def hcdp_dashboard_detail(request, pk):
    """
    Dashboard: Detail program HCDP
    """
    program = get_object_or_404(HcdpProgram, pk=pk)
    
    context = {
        'program': program
    }
    
    return render(request, 'hcdp/dashboard_detail.html', context)


# ============================================
# API Views (untuk Next.js Frontend)
# ============================================

def api_hcdp_list(request):
    """
    API: Get list program HCDP (public)
    """
    programs = HcdpProgram.objects.filter(
        is_active=True,
        is_published=True
    ).order_by('-created_at')
    
    # Pagination
    page = int(request.GET.get('page', 1))
    per_page = int(request.GET.get('per_page', 10))
    
    paginator = Paginator(programs, per_page)
    page_obj = paginator.get_page(page)
    
    data = {
        'status': 'success',
        'data': [
            {
                'id': p.id,
                'judul': p.judul,
                'deskripsi': p.deskripsi,
                'gambar_url': request.build_absolute_uri(p.gambar.url) if p.gambar else None,
                'created_at': p.created_at.isoformat(),
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


def api_hcdp_detail(request, pk):
    """
    API: Get detail program HCDP (public)
    """
    try:
        program = HcdpProgram.objects.get(
            pk=pk,
            is_active=True,
            is_published=True
        )
        
        data = {
            'status': 'success',
            'data': {
                'id': program.id,
                'judul': program.judul,
                'deskripsi': program.deskripsi,
                'gambar_url': request.build_absolute_uri(program.gambar.url) if program.gambar else None,
                'created_at': program.created_at.isoformat(),
                'updated_at': program.updated_at.isoformat(),
            }
        }
        
        return JsonResponse(data)
    except HcdpProgram.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Program tidak ditemukan'
        }, status=404)
