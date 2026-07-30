from django.urls import path
from . import views

app_name = 'referensi'

urlpatterns = [
    path('perguruan-tinggi/', views.perguruan_tinggi_list, name='perguruan_tinggi_list'),
    path('perguruan-tinggi/create/', views.perguruan_tinggi_create, name='perguruan_tinggi_create'),
    path('perguruan-tinggi/<int:pk>/edit/', views.perguruan_tinggi_edit, name='perguruan_tinggi_edit'),
    path('perguruan-tinggi/<int:pk>/delete/', views.perguruan_tinggi_delete, name='perguruan_tinggi_delete'),
    path('program-studi/', views.program_studi_list, name='program_studi_list'),
    path('program-studi/create/', views.program_studi_create, name='program_studi_create'),
    path('program-studi/<int:pk>/edit/', views.program_studi_edit, name='program_studi_edit'),
    path('program-studi/<int:pk>/delete/', views.program_studi_delete, name='program_studi_delete'),
]
