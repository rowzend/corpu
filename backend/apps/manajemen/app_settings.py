"""
App Settings Management Views
"""

import json
from django.contrib import messages
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db.models import Q
from django_tables2 import RequestConfig

from apps.manajemen.decorators import permission_required_403
from apps.manajemen.models import AppSettings, UserTableSelection
import django_tables2 as tables


# ============================================================================
# DJANGO TABLES2 TABLE DEFINITION
# ============================================================================

class AppSettingsTable(tables.Table):
    """Table for App Settings list"""
    
    key = tables.Column(verbose_name='Key', attrs={'td': {'class': 'font-mono text-sm'}})
    value = tables.Column(verbose_name='Value', attrs={'td': {'class': 'truncate max-w-xs'}})
    type = tables.Column(verbose_name='Type')
    category = tables.Column(verbose_name='Category')
    is_public = tables.BooleanColumn(verbose_name='Public', yesno='✅,❌')
    
    class Meta:
        model = AppSettings
        template_name = 'django_tables2/tailwind.html'
        fields = ('key', 'value', 'type', 'category', 'is_public')
        attrs = {
            'class': 'min-w-full divide-y divide-gray-200',
            'thead': {'class': 'bg-gray-50'},
            'th': {'class': 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'},
            'tbody': {'class': 'bg-white divide-y divide-gray-200'},
            'td': {'class': 'px-6 py-4 whitespace-nowrap text-sm text-gray-900'},
        }


# ============================================================================
# LIST VIEW
# ============================================================================

@ensure_csrf_cookie
@permission_required_403('data_aplikasi', 'app_settings', 'view')
def app_settings_list(request):
    """List all app settings with filtering and search"""
    
    # Handle bulk delete
    if request.method == 'POST' and 'action' in request.POST:
        action = request.POST.get('action')
        selected_ids = request.POST.getlist('selected_ids')
        
        if not selected_ids:
            # Try to get from UserTableSelection
            try:
                selection = UserTableSelection.objects.get(user=request.user, page_key='app_settings_list')
                selected_ids = selection.selected_ids or []
            except UserTableSelection.DoesNotExist:
                selected_ids = []
        
        if not selected_ids:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'error': 'Tidak ada item yang dipilih'}, status=400)
            messages.error(request, 'Tidak ada item yang dipilih')
            return redirect('manajemen_aplikasi:app_settings_list')
        
        if action == 'bulk_delete':
            qs = AppSettings.objects.filter(id__in=selected_ids)
            deleted_count = qs.count()
            deleted_keys = list(qs.values_list('key', flat=True))
            
            if deleted_count:
                qs.delete()
                UserTableSelection.objects.filter(user=request.user, page_key='app_settings_list').delete()
            
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': True, 'deleted': True, 'count': deleted_count, 'names': deleted_keys})
            
            messages.success(request, f'{deleted_count} pengaturan berhasil dihapus')
            return redirect('manajemen_aplikasi:app_settings_list')
    
    # Handle AJAX save/load selections
    if request.method == 'POST' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        content_type = request.headers.get('Content-Type', '') or ''
        if 'application/json' in content_type:
            try:
                payload = request.body.decode('utf-8') if isinstance(request.body, (bytes, bytearray)) else (request.body or '')
                data = json.loads(payload or '{}')
            except Exception:
                data = {}
            
            action = data.get('action')
            if action == 'save_selection':
                page_key = data.get('page_key', 'app_settings_list')
                selected_ids = data.get('selected_ids', [])
                UserTableSelection.objects.update_or_create(
                    user=request.user,
                    page_key=page_key,
                    defaults={'selected_ids': selected_ids},
                )
                return JsonResponse({'success': True, 'count': len(selected_ids)})
            
            if action == 'load_selection':
                page_key = data.get('page_key', 'app_settings_list')
                try:
                    selection = UserTableSelection.objects.get(user=request.user, page_key=page_key)
                    return JsonResponse({'success': True, 'selected_ids': selection.selected_ids})
                except UserTableSelection.DoesNotExist:
                    return JsonResponse({'success': True, 'selected_ids': []})
    
    # Regular GET request
    qs = AppSettings.objects.all()
    
    # Filters
    category_filter = request.GET.get('category', '')
    type_filter = request.GET.get('type', '')
    is_public_filter = request.GET.get('is_public', '')
    search_query = request.GET.get('search', '').strip()
    
    if category_filter:
        qs = qs.filter(category=category_filter)
    
    if type_filter:
        qs = qs.filter(type=type_filter)
    
    if is_public_filter:
        if is_public_filter == '1':
            qs = qs.filter(is_public=True)
        elif is_public_filter == '0':
            qs = qs.filter(is_public=False)
    
    if search_query:
        qs = qs.filter(
            Q(key__icontains=search_query)
            | Q(value__icontains=search_query)
            | Q(description__icontains=search_query)
        )
    
    qs = qs.order_by('category', 'key')
    
    # Statistics
    total = qs.count()
    stats = {
        'total': total,
        'public': qs.filter(is_public=True).count(),
        'private': qs.filter(is_public=False).count(),
        'by_category': {},
    }
    
    for category_code, category_label in AppSettings.CATEGORY_CHOICES:
        count = qs.filter(category=category_code).count()
        if count > 0:
            stats['by_category'][category_label] = count
    
    # Table
    table = AppSettingsTable(qs)
    per_page = request.GET.get('per_page', '25')
    try:
        per_page = int(per_page)
        if per_page not in [10, 25, 50, 100]:
            per_page = 25
    except (ValueError, TypeError):
        per_page = 25
    
    RequestConfig(request, paginate={'per_page': per_page}).configure(table)
    
    context = {
        'table': table,
        'stats': stats,
        'total': total,
        'search_query': search_query,
        'category_filter': category_filter,
        'type_filter': type_filter,
        'is_public_filter': is_public_filter,
        'per_page': per_page,
        'category_choices': AppSettings.CATEGORY_CHOICES,
        'type_choices': AppSettings.TYPE_CHOICES,
    }
    
    is_htmx = request.headers.get('HX-Request') or request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    if is_htmx and 'action' not in request.POST:
        return render(request, 'manajemen_aplikasi/app_settings/partials/_table.html', context)
    
    return render(request, 'manajemen_aplikasi/app_settings/list.html', context)


# ============================================================================
# CREATE VIEW
# ============================================================================

@permission_required_403('data_aplikasi', 'app_settings', 'create')
def app_settings_create(request):
    """Create new app setting"""
    
    if request.method == 'POST':
        key = (request.POST.get('key') or '').strip()
        value = (request.POST.get('value') or '').strip()
        type_val = (request.POST.get('type') or 'string').strip()
        category = (request.POST.get('category') or 'general').strip()
        description = (request.POST.get('description') or '').strip()
        is_public = request.POST.get('is_public') in ('1', 'true', 'True', 'on', 'yes')
        
        errors = []
        field_errors = {}
        
        if not key:
            errors.append('Key harus diisi!')
            field_errors['key'] = ['Key harus diisi!']
        elif AppSettings.objects.filter(key=key).exists():
            errors.append(f'Setting dengan key "{key}" sudah ada!')
            field_errors['key'] = [f'Setting dengan key "{key}" sudah ada!']
        
        is_htmx = request.headers.get('HX-Request') or request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        if errors:
            if is_htmx:
                resp = HttpResponse(status=204)
                resp['HX-Trigger'] = json.dumps({'app-settings-form-invalid': {'errors': errors, 'fieldErrors': field_errors}})
                return resp
            for e in errors:
                messages.error(request, e)
            return render(request, 'manajemen_aplikasi/app_settings/form.html', {
                'errors_list': errors,
                'category_choices': AppSettings.CATEGORY_CHOICES,
                'type_choices': AppSettings.TYPE_CHOICES,
            })
        
        AppSettings.objects.create(
            key=key,
            value=value,
            type=type_val,
            category=category,
            description=description,
            is_public=is_public,
        )
        
        if is_htmx:
            resp = HttpResponse(status=204)
            resp['HX-Trigger'] = json.dumps({
                'app-settings-form-success': {
                    'message': f'Setting "{key}" berhasil dibuat!',
                    'redirect': reverse('manajemen_aplikasi:app_settings_list')
                }
            })
            return resp
        
        messages.success(request, f'✅ Setting "{key}" berhasil dibuat!')
        return redirect('manajemen_aplikasi:app_settings_list')
    
    context = {
        'category_choices': AppSettings.CATEGORY_CHOICES,
        'type_choices': AppSettings.TYPE_CHOICES,
    }
    return render(request, 'manajemen_aplikasi/app_settings/form.html', context)


# ============================================================================
# EDIT VIEW
# ============================================================================

@permission_required_403('data_aplikasi', 'app_settings', 'edit')
def app_settings_edit(request, setting_id: int):
    """Edit existing app setting"""
    
    obj = get_object_or_404(AppSettings, id=setting_id)
    
    if request.method == 'POST':
        value = (request.POST.get('value') or '').strip()
        type_val = (request.POST.get('type') or 'string').strip()
        category = (request.POST.get('category') or 'general').strip()
        description = (request.POST.get('description') or '').strip()
        is_public = request.POST.get('is_public') in ('1', 'true', 'True', 'on', 'yes')
        
        obj.value = value
        obj.type = type_val
        obj.category = category
        obj.description = description
        obj.is_public = is_public
        obj.save()
        
        is_htmx = request.headers.get('HX-Request') or request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        if is_htmx:
            resp = HttpResponse(status=204)
            resp['HX-Trigger'] = json.dumps({
                'app-settings-form-success': {
                    'message': f'Setting "{obj.key}" berhasil diupdate!',
                    'redirect': reverse('manajemen_aplikasi:app_settings_list')
                }
            })
            return resp
        
        messages.success(request, f'✅ Setting "{obj.key}" berhasil diupdate!')
        return redirect('manajemen_aplikasi:app_settings_list')
    
    context = {
        'setting': obj,
        'edit_mode': True,
        'category_choices': AppSettings.CATEGORY_CHOICES,
        'type_choices': AppSettings.TYPE_CHOICES,
    }
    return render(request, 'manajemen_aplikasi/app_settings/form.html', context)


# ============================================================================
# DELETE VIEW
# ============================================================================

@permission_required_403('data_aplikasi', 'app_settings', 'delete')
def app_settings_delete(request, setting_id: int):
    """Delete app setting"""
    
    obj = get_object_or_404(AppSettings, id=setting_id)
    
    if request.method == 'POST':
        key = obj.key
        obj.delete()
        messages.success(request, f'✅ Setting "{key}" berhasil dihapus!')
        return redirect('manajemen_aplikasi:app_settings_list')
    
    context = {
        'setting': obj,
    }
    return render(request, 'manajemen_aplikasi/app_settings/delete.html', context)


# ============================================================================
# PUBLIC API - Get All Public Settings
# ============================================================================

def public_settings_api(request):
    """
    Public API endpoint to get all public settings
    No authentication required
    Returns settings grouped by category
    """
    
    settings = AppSettings.objects.filter(is_public=True).order_by('category', 'key')
    
    # Group by category
    grouped = {}
    for setting in settings:
        category = setting.category
        if category not in grouped:
            grouped[category] = {}
        
        grouped[category][setting.key] = {
            'value': setting.get_value(),
            'type': setting.type,
            'description': setting.description,
        }
    
    # Also provide flat structure
    flat = {}
    for setting in settings:
        flat[setting.key] = setting.get_value()
    
    response_data = {
        'success': True,
        'settings': {
            'grouped': grouped,
            'flat': flat,
        },
        'total': settings.count(),
    }
    
    return JsonResponse(response_data, json_dumps_params={'indent': 2, 'ensure_ascii': False})


# ============================================================================
# PUBLIC API - Get Single Setting by Key
# ============================================================================

def public_setting_by_key_api(request, key: str):
    """
    Public API endpoint to get a single setting by key
    No authentication required (only if is_public=True)
    """
    
    try:
        setting = AppSettings.objects.get(key=key, is_public=True)
        
        response_data = {
            'success': True,
            'setting': {
                'key': setting.key,
                'value': setting.get_value(),
                'type': setting.type,
                'category': setting.category,
                'description': setting.description,
            }
        }
        
        return JsonResponse(response_data, json_dumps_params={'indent': 2, 'ensure_ascii': False})
    
    except AppSettings.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': f'Setting "{key}" not found or not public'
        }, status=404)
