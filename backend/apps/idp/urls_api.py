from django.urls import path
from . import views_api

app_name = 'idp_api'

urlpatterns = [
    # List & Create
    path('asn/', views_api.idp_list_create, name='idp_list_create'),

    # Detail, Update, Delete
    path('asn/<int:pk>/', views_api.idp_detail, name='idp_detail'),
    path('asn/<int:pk>/submit/', views_api.idp_submit_action, name='idp_submit_action'),
    path('asn/<int:pk>/riwayat/', views_api.idp_riwayat, name='idp_riwayat'),

    # Stats
    path('stats/', views_api.idp_stats, name='idp_stats'),

    # Approval
    path('approval/', views_api.idp_approval_list, name='idp_approval_list'),
    path('approval/<int:pk>/', views_api.idp_approval_action, name='idp_approval_action'),

    # Verifikasi (atasan)
    path('verifikasi/', views_api.idp_verifikasi_list, name='idp_verifikasi_list'),
    path('verifikasi/<int:pk>/', views_api.idp_verifikasi_action, name='idp_verifikasi_action'),

    # Master Data: Jenis Kompetensi
    path('jenis-kompetensi/', views_api.jenis_kompetensi_list_create, name='jenis_kompetensi_list_create'),
    path('jenis-kompetensi/<int:pk>/', views_api.jenis_kompetensi_detail, name='jenis_kompetensi_detail'),

    # Master Data: Nama Kompetensi (berelasi ke jenis kompetensi)
    path('nama-kompetensi/', views_api.nama_kompetensi_list_create, name='nama_kompetensi_list_create'),
    path('nama-kompetensi/<int:pk>/', views_api.nama_kompetensi_detail, name='nama_kompetensi_detail'),

    # Master Data: Prioritas Pengembangan
    path('prioritas-pengembangan/', views_api.prioritas_pengembangan_list_create, name='prioritas_pengembangan_list_create'),
    path('prioritas-pengembangan/<int:pk>/', views_api.prioritas_pengembangan_detail, name='prioritas_pengembangan_detail'),

    # Master Data: Metode Pengembangan Kompetensi
    path('metode-pengembangan-kompetensi/', views_api.pilar_pengembangan_list_create, name='pilar_pengembangan_list_create'),
    path('metode-pengembangan-kompetensi/<int:pk>/', views_api.pilar_pengembangan_detail, name='pilar_pengembangan_detail'),

    # Master Data: Bentuk Pengembangan Kompetensi
    path('bentuk-pengembangan-kompetensi/', views_api.jenis_kegiatan_pengembangan_list_create, name='jenis_kegiatan_pengembangan_list_create'),
    path('bentuk-pengembangan-kompetensi/<int:pk>/', views_api.jenis_kegiatan_pengembangan_detail, name='jenis_kegiatan_pengembangan_detail'),

    # Master Data: Nama Kegiatan / Program (relasi ke Bentuk Pengembangan Kompetensi)
    path('nama-kegiatan-program/', views_api.nama_kegiatan_program_list_create, name='nama_kegiatan_program_list_create'),
    path('nama-kegiatan-program/<int:pk>/', views_api.nama_kegiatan_program_detail, name='nama_kegiatan_program_detail'),

    # Desain Pembelajaran: tree read-only Metode -> Bentuk -> Nama Kegiatan
    path('desain-pembelajaran-tree/', views_api.desain_pembelajaran_tree, name='desain_pembelajaran_tree'),
]
