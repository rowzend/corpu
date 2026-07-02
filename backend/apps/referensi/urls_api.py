from django.urls import path
from . import views_api

app_name = 'referensi_api'

urlpatterns = [
    # Wilayah (Provinsi, Kabupaten, Kecamatan, Kelurahan)
    path('provinsi/', views_api.ProvinsiListAPIView.as_view(), name='provinsi_list'),
    path('provinsi/<int:pk>/', views_api.ProvinsiDetailAPIView.as_view(), name='provinsi_detail'),
    path('provinsi/<int:pk>/update/', views_api.ProvinsiDetailAPIView.as_view(), name='provinsi_update'),
    path('provinsi/<int:pk>/delete/', views_api.ProvinsiDetailAPIView.as_view(), name='provinsi_delete'),

    path('kabupaten/', views_api.KabupatenListAPIView.as_view(), name='kabupaten_list'),
    path('kabupaten/<int:pk>/', views_api.KabupatenDetailAPIView.as_view(), name='kabupaten_detail'),
    path('kabupaten/<int:pk>/update/', views_api.KabupatenDetailAPIView.as_view(), name='kabupaten_update'),
    path('kabupaten/<int:pk>/delete/', views_api.KabupatenDetailAPIView.as_view(), name='kabupaten_delete'),

    path('kecamatan/', views_api.KecamatanListAPIView.as_view(), name='kecamatan_list'),
    path('kecamatan/<int:pk>/', views_api.KecamatanDetailAPIView.as_view(), name='kecamatan_detail'),
    path('kecamatan/<int:pk>/update/', views_api.KecamatanDetailAPIView.as_view(), name='kecamatan_update'),
    path('kecamatan/<int:pk>/delete/', views_api.KecamatanDetailAPIView.as_view(), name='kecamatan_delete'),

    path('kelurahan/', views_api.KelurahanListAPIView.as_view(), name='kelurahan_list'),
    path('kelurahan/<int:pk>/', views_api.KelurahanDetailAPIView.as_view(), name='kelurahan_detail'),
    path('kelurahan/<int:pk>/update/', views_api.KelurahanDetailAPIView.as_view(), name='kelurahan_update'),
    path('kelurahan/<int:pk>/delete/', views_api.KelurahanDetailAPIView.as_view(), name='kelurahan_delete'),

    path('perguruan-tinggi/', views_api.PerguruanTinggiListAPIView.as_view(), name='perguruan_tinggi_list'),
    path('perguruan-tinggi/<int:pk>/', views_api.PerguruanTinggiDetailAPIView.as_view(), name='perguruan_tinggi_detail'),
    path('perguruan-tinggi/<int:pk>/update/', views_api.PerguruanTinggiDetailAPIView.as_view(), name='perguruan_tinggi_update'),
    path('perguruan-tinggi/<int:pk>/delete/', views_api.PerguruanTinggiDetailAPIView.as_view(), name='perguruan_tinggi_delete'),

    path('program-studi/', views_api.ProgramStudiListAPIView.as_view(), name='program_studi_list'),
    path('program-studi/<int:pk>/', views_api.ProgramStudiDetailAPIView.as_view(), name='program_studi_detail'),
    path('program-studi/<int:pk>/update/', views_api.ProgramStudiDetailAPIView.as_view(), name='program_studi_update'),
    path('program-studi/<int:pk>/delete/', views_api.ProgramStudiDetailAPIView.as_view(), name='program_studi_delete'),

    path('instansi/', views_api.InstansiListAPIView.as_view(), name='instansi_list'),
    path('instansi/<int:pk>/', views_api.InstansiDetailAPIView.as_view(), name='instansi_detail'),
    path('instansi/<int:pk>/update/', views_api.InstansiDetailAPIView.as_view(), name='instansi_update'),
    path('instansi/<int:pk>/delete/', views_api.InstansiDetailAPIView.as_view(), name='instansi_delete'),
    path('instansi/import/', views_api.InstansiImportXLSXAPIView.as_view(), name='instansi_import'),

    path('kategori-user/', views_api.KategoriUserListAPIView.as_view(), name='kategori_user_list'),
    path('kategori-user/<int:pk>/', views_api.KategoriUserDetailAPIView.as_view(), name='kategori_user_detail'),
    path('kategori-user/<int:pk>/update/', views_api.KategoriUserDetailAPIView.as_view(), name='kategori_user_update'),
    path('kategori-user/<int:pk>/delete/', views_api.KategoriUserDetailAPIView.as_view(), name='kategori_user_delete'),

    path('sync/', views_api.SyncReferensiAPIView.as_view(), name='referensi_sync'),
]
