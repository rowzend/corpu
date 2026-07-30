from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django_tables2 import RequestConfig

from apps.manajemen.decorators import permission_required_403
from .models import MsPerguruanTinggi, MsProgramStudi
from .forms import MsPerguruanTinggiForm, MsProgramStudiForm
from .tables import PerguruanTinggiTable, ProgramStudiTable


MODULE = 'referensi'


@permission_required_403(MODULE, 'perguruan_tinggi', 'list')
def perguruan_tinggi_list(request):
    queryset = MsPerguruanTinggi.objects.filter(deleted_at__isnull=True)
    table = PerguruanTinggiTable(queryset, request=request)
    RequestConfig(request).configure(table)
    breadcrumb = [
        {'label': 'Referensi', 'url': '#'},
        {'label': 'Perguruan Tinggi', 'url': ''},
    ]
    return render(request, 'referensi/perguruan_tinggi/list.html', {
        'title': 'Perguruan Tinggi',
        'table': table,
        'breadcrumb': breadcrumb,
        'module_name': MODULE,
        'control_name': 'perguruan_tinggi',
        'function_name': 'list',
    })


@permission_required_403(MODULE, 'perguruan_tinggi', 'create')
def perguruan_tinggi_create(request):
    if request.method == 'POST':
        form = MsPerguruanTinggiForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Perguruan tinggi berhasil ditambahkan.')
            return redirect('referensi:perguruan_tinggi_list')
    else:
        form = MsPerguruanTinggiForm()
    breadcrumb = [
        {'label': 'Referensi', 'url': '#'},
        {'label': 'Perguruan Tinggi', 'url': '#'},
        {'label': 'Tambah', 'url': ''},
    ]
    return render(request, 'referensi/perguruan_tinggi/form.html', {
        'title': 'Tambah Perguruan Tinggi',
        'form': form,
        'breadcrumb': breadcrumb,
        'module_name': MODULE,
        'control_name': 'perguruan_tinggi',
    })


@permission_required_403(MODULE, 'perguruan_tinggi', 'edit')
def perguruan_tinggi_edit(request, pk):
    obj = get_object_or_404(MsPerguruanTinggi, pk=pk)
    if request.method == 'POST':
        form = MsPerguruanTinggiForm(request.POST, instance=obj)
        if form.is_valid():
            form.save()
            messages.success(request, 'Perguruan tinggi berhasil diperbarui.')
            return redirect('referensi:perguruan_tinggi_list')
    else:
        form = MsPerguruanTinggiForm(instance=obj)
    breadcrumb = [
        {'label': 'Referensi', 'url': '#'},
        {'label': 'Perguruan Tinggi', 'url': 'referensi:perguruan_tinggi_list'},
        {'label': 'Edit', 'url': ''},
    ]
    return render(request, 'referensi/perguruan_tinggi/form.html', {
        'title': 'Edit Perguruan Tinggi',
        'form': form,
        'breadcrumb': breadcrumb,
        'module_name': MODULE,
        'control_name': 'perguruan_tinggi',
    })


@permission_required_403(MODULE, 'perguruan_tinggi', 'delete')
def perguruan_tinggi_delete(request, pk):
    obj = get_object_or_404(MsPerguruanTinggi, pk=pk)
    if request.method == 'POST':
        obj.delete()
        messages.success(request, 'Perguruan tinggi berhasil dihapus.')
        return redirect('referensi:perguruan_tinggi_list')
    breadcrumb = [
        {'label': 'Referensi', 'url': '#'},
        {'label': 'Perguruan Tinggi', 'url': 'referensi:perguruan_tinggi_list'},
        {'label': 'Hapus', 'url': ''},
    ]
    return render(request, 'referensi/perguruan_tinggi/confirm_delete.html', {
        'title': 'Hapus Perguruan Tinggi',
        'object': obj,
        'breadcrumb': breadcrumb,
        'module_name': MODULE,
        'control_name': 'perguruan_tinggi',
    })


@permission_required_403(MODULE, 'program_studi', 'list')
def program_studi_list(request):
    queryset = MsProgramStudi.objects.filter(deleted_at__isnull=True)
    table = ProgramStudiTable(queryset, request=request)
    RequestConfig(request).configure(table)
    breadcrumb = [
        {'label': 'Referensi', 'url': '#'},
        {'label': 'Program Studi', 'url': ''},
    ]
    return render(request, 'referensi/program_studi/list.html', {
        'title': 'Program Studi',
        'table': table,
        'breadcrumb': breadcrumb,
        'module_name': MODULE,
        'control_name': 'program_studi',
        'function_name': 'list',
    })


@permission_required_403(MODULE, 'program_studi', 'create')
def program_studi_create(request):
    if request.method == 'POST':
        form = MsProgramStudiForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Program studi berhasil ditambahkan.')
            return redirect('referensi:program_studi_list')
    else:
        form = MsProgramStudiForm()
    breadcrumb = [
        {'label': 'Referensi', 'url': '#'},
        {'label': 'Program Studi', 'url': '#'},
        {'label': 'Tambah', 'url': ''},
    ]
    return render(request, 'referensi/program_studi/form.html', {
        'title': 'Tambah Program Studi',
        'form': form,
        'breadcrumb': breadcrumb,
        'module_name': MODULE,
        'control_name': 'program_studi',
    })


@permission_required_403(MODULE, 'program_studi', 'edit')
def program_studi_edit(request, pk):
    obj = get_object_or_404(MsProgramStudi, pk=pk)
    if request.method == 'POST':
        form = MsProgramStudiForm(request.POST, instance=obj)
        if form.is_valid():
            form.save()
            messages.success(request, 'Program studi berhasil diperbarui.')
            return redirect('referensi:program_studi_list')
    else:
        form = MsProgramStudiForm(instance=obj)
    breadcrumb = [
        {'label': 'Referensi', 'url': '#'},
        {'label': 'Program Studi', 'url': 'referensi:program_studi_list'},
        {'label': 'Edit', 'url': ''},
    ]
    return render(request, 'referensi/program_studi/form.html', {
        'title': 'Edit Program Studi',
        'form': form,
        'breadcrumb': breadcrumb,
        'module_name': MODULE,
        'control_name': 'program_studi',
    })


@permission_required_403(MODULE, 'program_studi', 'delete')
def program_studi_delete(request, pk):
    obj = get_object_or_404(MsProgramStudi, pk=pk)
    if request.method == 'POST':
        obj.delete()
        messages.success(request, 'Program studi berhasil dihapus.')
        return redirect('referensi:program_studi_list')
    breadcrumb = [
        {'label': 'Referensi', 'url': '#'},
        {'label': 'Program Studi', 'url': 'referensi:program_studi_list'},
        {'label': 'Hapus', 'url': ''},
    ]
    return render(request, 'referensi/program_studi/confirm_delete.html', {
        'title': 'Hapus Program Studi',
        'object': obj,
        'breadcrumb': breadcrumb,
        'module_name': MODULE,
        'control_name': 'program_studi',
    })
