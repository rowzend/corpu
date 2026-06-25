"""
Management API URLs
"""
from django.urls import path
from . import views_api

app_name = 'manajemen_api'

urlpatterns = [
    # User Management
    path('users/', views_api.UserListAPIView.as_view(), name='user_list'),
    path('users/create/', views_api.UserCreateAPIView.as_view(), name='user_create'),
    path('users/<int:pk>/', views_api.UserDetailAPIView.as_view(), name='user_detail'),
    path('users/<int:pk>/update/', views_api.UserUpdateAPIView.as_view(), name='user_update'),
    path('users/<int:pk>/delete/', views_api.UserDeleteAPIView.as_view(), name='user_delete'),
    
    # Role Management
    path('roles/', views_api.RoleListAPIView.as_view(), name='role_list'),
    path('roles/create/', views_api.RoleCreateAPIView.as_view(), name='role_create'),
    path('roles/<int:pk>/', views_api.RoleDetailAPIView.as_view(), name='role_detail'),
    path('roles/<int:pk>/update/', views_api.RoleUpdateAPIView.as_view(), name='role_update'),
    path('roles/<int:pk>/delete/', views_api.RoleDeleteAPIView.as_view(), name='role_delete'),
    path('roles/<int:pk>/permissions/', views_api.RolePermissionUpdateAPIView.as_view(), name='role_permissions'),
    
    # Permission Management
    path('permissions/modules/', views_api.PermissionModuleListAPIView.as_view(), name='permission_modules'),
    path('permissions/rules/', views_api.PermissionRuleListAPIView.as_view(), name='permission_rules'),
    path('permissions/user/', views_api.UserPermissionsAPIView.as_view(), name='user_permissions'),
    
    # Menu
    path('menu/', views_api.MenuListAPIView.as_view(), name='menu'),
    
    # App Settings
    path('settings/', views_api.AppSettingsListAPIView.as_view(), name='settings_list'),
    path('settings/<str:key>/', views_api.AppSettingsUpdateAPIView.as_view(), name='settings_update'),
]
