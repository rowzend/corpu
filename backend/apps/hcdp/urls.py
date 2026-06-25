from django.urls import path
from . import views

app_name = 'hcdp'

urlpatterns = [
    # Public URLs (Landing Page)
    path('', views.hcdp_public_list, name='public_list'),
    path('<int:pk>/', views.hcdp_public_detail, name='public_detail'),
    
    # Dashboard URLs (CRUD)
    path('dashboard/', views.hcdp_dashboard_list, name='dashboard_list'),
    path('dashboard/create/', views.hcdp_dashboard_create, name='dashboard_create'),
    path('dashboard/<int:pk>/', views.hcdp_dashboard_detail, name='dashboard_detail'),
    path('dashboard/<int:pk>/update/', views.hcdp_dashboard_update, name='dashboard_update'),
    path('dashboard/<int:pk>/delete/', views.hcdp_dashboard_delete, name='dashboard_delete'),
    
    # API URLs (untuk Next.js)
    path('api/list/', views.api_hcdp_list, name='api_list'),
    path('api/<int:pk>/', views.api_hcdp_detail, name='api_detail'),
]
