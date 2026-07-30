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
    path('permissions/modules/create/', views_api.PermissionModuleCreateAPIView.as_view(), name='permission_module_create'),
    path('permissions/modules/<int:pk>/update/', views_api.PermissionModuleUpdateAPIView.as_view(), name='permission_module_update'),
    path('permissions/modules/<int:pk>/delete/', views_api.PermissionModuleDeleteAPIView.as_view(), name='permission_module_delete'),
    path('permissions/rules/', views_api.PermissionRuleListAPIView.as_view(), name='permission_rules'),
    path('permissions/rules/create/', views_api.PermissionRuleCreateAPIView.as_view(), name='permission_rule_create'),
    path('permissions/rules/<int:pk>/', views_api.PermissionRuleDetailAPIView.as_view(), name='permission_rule_detail'),
    path('permissions/rules/<int:pk>/update/', views_api.PermissionRuleUpdateAPIView.as_view(), name='permission_rule_update'),
    path('permissions/rules/<int:pk>/delete/', views_api.PermissionRuleDeleteAPIView.as_view(), name='permission_rule_delete'),
    path('permissions/functions/', views_api.PermissionFunctionListAPIView.as_view(), name='permission_functions'),
    path('permissions/functions/create/', views_api.PermissionFunctionCreateAPIView.as_view(), name='permission_function_create'),
    path('permissions/functions/<int:pk>/', views_api.PermissionFunctionDetailAPIView.as_view(), name='permission_function_detail'),
    path('permissions/functions/<int:pk>/update/', views_api.PermissionFunctionUpdateAPIView.as_view(), name='permission_function_update'),
    path('permissions/functions/<int:pk>/delete/', views_api.PermissionFunctionDeleteAPIView.as_view(), name='permission_function_delete'),
    path('permissions/controls/', views_api.PermissionControlListAPIView.as_view(), name='permission_controls'),
    path('permissions/controls/create/', views_api.PermissionControlCreateAPIView.as_view(), name='permission_control_create'),
    path('permissions/controls/<int:pk>/', views_api.PermissionControlDetailAPIView.as_view(), name='permission_control_detail'),
    path('permissions/controls/<int:pk>/update/', views_api.PermissionControlUpdateAPIView.as_view(), name='permission_control_update'),
    path('permissions/controls/<int:pk>/delete/', views_api.PermissionControlDeleteAPIView.as_view(), name='permission_control_delete'),
    path('permissions/user/', views_api.UserPermissionsAPIView.as_view(), name='user_permissions'),
    
    # Menu
    path('menu/', views_api.MenuListAPIView.as_view(), name='menu'),
    path('menu/create/', views_api.MenuItemCreateAPIView.as_view(), name='menu_create'),
    path('menu/<int:pk>/', views_api.MenuItemDetailAPIView.as_view(), name='menu_detail'),
    path('menu/<int:pk>/update/', views_api.MenuItemUpdateAPIView.as_view(), name='menu_update'),
    path('menu/<int:pk>/delete/', views_api.MenuItemDeleteAPIView.as_view(), name='menu_delete'),
    
    # Menu Categories
    path('menu-categories/', views_api.MenuCategoryListAPIView.as_view(), name='menu_category_list'),
    path('menu-categories/create/', views_api.MenuCategoryCreateAPIView.as_view(), name='menu_category_create'),
    path('menu-categories/<int:pk>/', views_api.MenuCategoryDetailAPIView.as_view(), name='menu_category_detail'),
    path('menu-categories/<int:pk>/update/', views_api.MenuCategoryUpdateAPIView.as_view(), name='menu_category_update'),
    path('menu-categories/<int:pk>/delete/', views_api.MenuCategoryDeleteAPIView.as_view(), name='menu_category_delete'),
    
    # API Documentation
    path('api-documentation/', views_api.ApiDocumentationListAPIView.as_view(), name='api_documentation_list'),
    path('api-documentation/create/', views_api.ApiDocumentationCreateAPIView.as_view(), name='api_documentation_create'),
    path('api-documentation/<int:pk>/', views_api.ApiDocumentationDetailAPIView.as_view(), name='api_documentation_detail'),
    path('api-documentation/<int:pk>/update/', views_api.ApiDocumentationUpdateAPIView.as_view(), name='api_documentation_update'),
    path('api-documentation/<int:pk>/delete/', views_api.ApiDocumentationDeleteAPIView.as_view(), name='api_documentation_delete'),
    
    # App Settings
    path('settings/', views_api.AppSettingsListAPIView.as_view(), name='settings_list'),
    path('settings/<str:key>/', views_api.AppSettingsUpdateAPIView.as_view(), name='settings_update'),
]
