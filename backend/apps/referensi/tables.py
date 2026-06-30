import django_tables2 as tables
from django.urls import reverse
from django.utils.html import format_html

from apps.common.table_attrs import (
    dt_col_attrs, dt_actions_attrs, dt_row_number_attrs,
    dt_checkbox_attrs, dt_render_row_number, dt_render_actions,
    dt_render_badge,
)
from .models import MsPerguruanTinggi, MsProgramStudi


def _dt_render_actions(record, table, module_name, control_name, edit_url, delete_url):
    user = getattr(getattr(table, 'request', None), 'user', None)
    from apps.manajemen.helpers import check_permission
    can_edit = check_permission(user, module_name, control_name, 'edit') if user else False
    can_delete = check_permission(user, module_name, control_name, 'delete') if user else False
    edit_link = {'url': edit_url, 'title': 'Edit', 'a_class': 'text-blue-600 hover:text-blue-800', 'icon_class': 'fas fa-edit'} if can_edit else None
    delete_link = {'url': delete_url, 'title': 'Delete', 'a_class': 'text-red-600 hover:text-red-800', 'icon_class': 'fas fa-trash'} if can_delete else None
    return dt_render_actions(*(link for link in [edit_link, delete_link] if link))


class _BaseReferensiTable(tables.Table):
    selection = tables.CheckBoxColumn(
        accessor='pk',
        attrs=dt_checkbox_attrs(th_width='3%'),
        orderable=False,
    )
    row_number = tables.Column(
        empty_values=(),
        verbose_name='No',
        attrs=dt_row_number_attrs(width='6%'),
        orderable=False,
    )

    def render_row_number(self, record, table):
        return dt_render_row_number(table, self)


def _actions_col(width='10%'):
    return tables.Column(
        verbose_name='Aksi',
        empty_values=(),
        orderable=False,
        attrs=dt_actions_attrs(width=width),
    )


class PerguruanTinggiTable(_BaseReferensiTable):
    kode_pt = tables.Column(
        verbose_name='Kode PT',
        attrs=dt_col_attrs(td_weight='medium', td_color='gray-900'),
    )
    nama_pt = tables.Column(
        verbose_name='Nama PT',
        attrs=dt_col_attrs(td_weight='medium'),
    )
    bentuk_pt = tables.Column(
        verbose_name='Bentuk',
        attrs=dt_col_attrs(width='10%'),
    )
    status_pt = tables.Column(
        verbose_name='Status',
        attrs=dt_col_attrs(width='8%', td_align='center'),
    )
    kota = tables.Column(
        verbose_name='Kota',
        attrs=dt_col_attrs(width='12%'),
    )
    akreditasi = tables.Column(
        verbose_name='Akreditasi',
        attrs=dt_col_attrs(width='8%', td_align='center'),
    )
    is_active = tables.Column(
        verbose_name='Aktif',
        attrs=dt_col_attrs(width='6%', td_align='center'),
    )
    actions = _actions_col(width='10%')

    class Meta:
        model = MsPerguruanTinggi
        template_name = 'django_tables2/tailwind.html'
        fields = ('selection', 'row_number', 'kode_pt', 'nama_pt', 'bentuk_pt', 'status_pt', 'kota', 'akreditasi', 'is_active', 'actions')
        attrs = {'id': 'perguruan_tinggi_table', 'class': 'min-w-full divide-y divide-gray-200'}
        per_page = 10

    def render_is_active(self, value):
        if value:
            return dt_render_badge('Aktif', bg_class='bg-green-100', text_class='text-green-800', icon_class='fas fa-check-circle')
        return dt_render_badge('Nonaktif', bg_class='bg-red-100', text_class='text-red-800', icon_class='fas fa-times-circle')

    def render_actions(self, record, table):
        edit_url = reverse('referensi:perguruan_tinggi_edit', args=[record.id])
        delete_url = reverse('referensi:perguruan_tinggi_delete', args=[record.id])
        return _dt_render_actions(record, table, 'referensi', 'perguruan_tinggi', edit_url, delete_url)


class ProgramStudiTable(_BaseReferensiTable):
    kode_prodi = tables.Column(
        verbose_name='Kode Prodi',
        attrs=dt_col_attrs(td_color='gray-900', width='10%'),
    )
    nama_prodi = tables.Column(
        verbose_name='Nama Prodi',
        attrs=dt_col_attrs(td_weight='medium'),
    )
    jenjang = tables.Column(
        verbose_name='Jenjang',
        attrs=dt_col_attrs(width='8%', td_align='center'),
    )
    perguruan_tinggi = tables.Column(
        verbose_name='PT',
        attrs=dt_col_attrs(td_weight='medium'),
    )
    akreditasi = tables.Column(
        verbose_name='Akreditasi',
        attrs=dt_col_attrs(width='8%', td_align='center'),
    )
    is_active = tables.Column(
        verbose_name='Aktif',
        attrs=dt_col_attrs(width='6%', td_align='center'),
    )
    actions = _actions_col(width='10%')

    class Meta:
        model = MsProgramStudi
        template_name = 'django_tables2/tailwind.html'
        fields = ('selection', 'row_number', 'kode_prodi', 'nama_prodi', 'jenjang', 'perguruan_tinggi', 'akreditasi', 'is_active', 'actions')
        attrs = {'id': 'program_studi_table', 'class': 'min-w-full divide-y divide-gray-200'}
        per_page = 10

    def render_perguruan_tinggi(self, value):
        return str(value)

    def render_is_active(self, value):
        if value:
            return dt_render_badge('Aktif', bg_class='bg-green-100', text_class='text-green-800', icon_class='fas fa-check-circle')
        return dt_render_badge('Nonaktif', bg_class='bg-red-100', text_class='text-red-800', icon_class='fas fa-times-circle')

    def render_actions(self, record, table):
        edit_url = reverse('referensi:program_studi_edit', args=[record.id])
        delete_url = reverse('referensi:program_studi_delete', args=[record.id])
        return _dt_render_actions(record, table, 'referensi', 'program_studi', edit_url, delete_url)
