from django.urls import path
from . import views_api

app_name = 'hcdp_api'

urlpatterns = [
    # List & Create
    path('programs/', views_api.program_list_create, name='program_list_create'),
    
    # Detail, Update, Delete
    path('programs/<int:pk>/', views_api.program_detail, name='program_detail'),
    
    # Stats
    path('stats/', views_api.program_stats, name='program_stats'),
]
