from django.urls import path
from . import views

app_name = 'api_simpeg'

urlpatterns = [
    path('pegawai/', views.pegawai_list, name='pegawai_list'),
    path('pegawai/<int:pk>/', views.pegawai_detail, name='pegawai_detail'),
    path('pegawai/sync/', views.pegawai_sync, name='pegawai_sync'),
    path('pegawai/sync/progress/<str:sync_id>/', views.pegawai_sync_progress, name='pegawai_sync_progress'),
    path('pegawai/sync/logs/', views.pegawai_sync_logs, name='pegawai_sync_logs'),
    path('bupati/', views.bupati_list, name='bupati_list'),
    path('bupati/sync/', views.bupati_sync, name='bupati_sync'),
    path('bupati/sync/progress/<str:sync_id>/', views.bupati_sync_progress, name='bupati_sync_progress'),
    path('unit-kerja/', views.unit_kerja_list, name='unit_kerja_list'),
    path('unit-kerja/tree/', views.unit_kerja_tree, name='unit_kerja_tree'),
    path('unit-kerja/sync/', views.unit_kerja_sync, name='unit_kerja_sync'),
    path('unit-kerja/sync/progress/<str:sync_id>/', views.unit_kerja_sync_progress, name='unit_kerja_sync_progress'),
    path('unit-kerja/<int:id_opd>/desain/', views.unit_kerja_desain, name='unit_kerja_desain'),
    path('unit-kerja/desain-options/', views.unit_kerja_desain_options, name='unit_kerja_desain_options'),
]
