"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import path, include
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static
from . import views
from apps.manajemen.admin_site import permission_admin_site
from apps.manajemen.views_api import PublicSettingsListAPIView

# Admin customization (applies to both default and custom admin site)
admin_brand = getattr(settings, 'APP_NAME', 'ASN CORPU')
admin.site.site_header = f'{admin_brand} Administration'
admin.site.site_title = f'{admin_brand} Admin'
admin.site.index_title = f'Welcome to {admin_brand} Administration'

# Use custom PermissionAdminSite that authorizes via permission keys
# 1) Ensure default admin discovers all registered ModelAdmins
admin.autodiscover()

# 2) Copy all registrations from default admin to custom site
from django.contrib.admin.sites import AlreadyRegistered
for model, modeladmin in admin.site._registry.items():
    try:
        permission_admin_site.register(model, type(modeladmin))
    except AlreadyRegistered:
        pass

urlpatterns = [
    # Health check and API status
    path('health/', views.health_check, name='health_check'),
    
    # Django Admin (keep for backend management) - accessible via /admin-backend/
    path('admin/', permission_admin_site.urls),
    path('admin-backend/', permission_admin_site.urls),
    
    # API Framework (for browsable API)
    path('api/', include('rest_framework.urls')),
    
    # Accounts URLs (for session management and password change)
    path('accounts/', include('apps.accounts.urls')),
    
    # ========================================
    # API ASN CORPU - Public & Authenticated
    # ========================================
    
    # Public API v1.0 (No Authentication Required)
    # ========================================
    path('apicorpu/public/1.0/knowledge/', include('apps.knowledge.urls_api')),
    path('apicorpu/public/1.0/profile/', include('apps.profile.urls_api_public')),
    path('apicorpu/public/1.0/hero/', include('apps.hero.urls_api')),
    path('apicorpu/public/1.0/settings/', PublicSettingsListAPIView.as_view(), name='public_settings'),
    
    # Authenticated API v1.0 (JWT Required)
    # ========================================
    # Dashboard API
    path('apicorpu/1.0/dashboard/', include('apps.dashboard.urls_api')),
    
    # Management API (Users, Roles, Permissions)
    path('apicorpu/1.0/management/', include('apps.manajemen.urls_api')),
    
    # HCDP API (Human Capital Development Program)
    path('apicorpu/1.0/hcdp/', include('apps.hcdp.urls_api')),
    
    # Knowledge API (Authenticated - for admin/staff)
    path('apicorpu/1.0/knowledge/', include('apps.knowledge.urls_api')),
    
    # Profile Instansi API
    path('apicorpu/1.0/profile/', include('apps.profile.urls_api')),
    
    # Hero API (Admin CRUD)
    path('apicorpu/1.0/hero/', include('apps.hero.urls_api_admin')),

    # SIMPeG API (Sinkronisasi Data Pegawai)
    path('apicorpu/1.0/simpeg/', include('apps.api_simpeg.urls')),

    # Referensi (Perguruan Tinggi & Program Studi) - Django Template Views
    path('apicorpu/1.0/referensi/', include('apps.referensi.urls')),

    # Accounts API (User Profile)
    path('apicorpu/1.0/user/', include('apps.accounts.urls_api')),

    # Referensi REST API untuk frontend Next.js
    path('apicorpu/1.0/referensi-api/', include('apps.referensi.urls_api')),

    # Login redirect for permission_required decorator
    path('login/', RedirectView.as_view(url='/admin/login/', permanent=False), name='login'),

    # Learning API
    path('apicorpu/1.0/learning/', include('apps.learning.urls_api')),
    
    # News API
    path('apicorpu/1.0/news/', include('apps.news.urls_api')),

    # Notifications API
    path('apicorpu/1.0/notifications/', views.api_notifications_list, name='api_notifications_list'),
    path('apicorpu/1.0/notifications/<int:notification_id>/read', views.api_notifications_read, name='api_notifications_read'),
    path('apicorpu/1.0/notifications/read-all', views.api_notifications_read_all, name='api_notifications_read_all'),
    
    # JWT Authentication
    path('apicorpu/auth/1.0/login/', views.api_jwt_login_v5, name='api_corpu_login'),
    path('apicorpu/auth/1.0/verify/', views.api_jwt_verify_v5, name='api_corpu_verify'),
    path('apicorpu/auth/1.0/refresh/', views.api_jwt_refresh_v5, name='api_corpu_refresh'),
    path('apicorpu/auth/1.0/logout/', views.api_logout_v5, name='api_corpu_logout'),
    path('apicorpu/auth/1.0/change-password', views.api_change_password_v5, name='api_change_password_v5'),
    path('apicorpu/auth/1.0/revoke-all-tokens', views.api_revoke_all_tokens_v5, name='api_revoke_all_tokens_v5'),
    path('apicorpu/auth/1.0/revoke-by-username', views.api_revoke_by_username_v5, name='api_revoke_by_username_v5'),
    
    # Session status (for frontend session monitoring)
    path('session/status', views.session_status, name='session_status'),
    
    # Session-based (for compatibility)
    path('apicorpu/auth/1.0/login-session', views.api_login_v5, name='api_login_v5'),
    
    # API Routes List
    path('apicorpu/routes', views.api_routes_list_v5, name='api_routes_list_v5'),
    
    # Resources
    path('apicorpu/users/1.0/list', views.api_users_list_v5, name='api_users_list_v5'),
    
    # Webhooks (Password Sync Pipeline - Compatible with ESIMPEG)
    path('apicorpu/webhooks/1.0/register', views.webhook_register_v5, name='webhook_register_v5'),
    path('apicorpu/webhooks/1.0/list', views.webhook_list_v5, name='webhook_list_v5'),
    path('apicorpu/webhooks/1.0/unregister/<str:app_name>', views.webhook_unregister_v5, name='webhook_unregister_v5'),
    path('apicorpu/webhooks/1.0/sync-password-manual', views.webhook_sync_password_manual_v5, name='webhook_sync_password_manual_v5'),
    
    # Legacy API v5.0 (Backward Compatibility - Will be deprecated)
    # ========================================
    path('apicorpu/5.0/auth/login', views.api_jwt_login_v5, name='api_corpu_login_legacy'),
    path('apicorpu/5.0/auth/verify', views.api_jwt_verify_v5, name='api_corpu_verify_legacy'),
    path('apicorpu/5.0/auth/refresh', views.api_jwt_refresh_v5, name='api_corpu_refresh_legacy'),
    path('apicorpu/5.0/auth/logout', views.api_logout_v5, name='api_corpu_logout_legacy'),
    path('apicorpu/5.0/auth/change-password', views.api_change_password_v5, name='api_change_password_v5_legacy'),
    path('apicorpu/5.0/auth/revoke-all-tokens', views.api_revoke_all_tokens_v5, name='api_revoke_all_tokens_v5_legacy'),
    path('apicorpu/5.0/auth/revoke-by-username', views.api_revoke_by_username_v5, name='api_revoke_by_username_v5_legacy'),
    path('apicorpu/5.0/login/username-corpu', views.api_login_v5, name='api_login_v5_legacy'),
    path('apicorpu/5.0/routes', views.api_routes_list_v5, name='api_routes_list_v5_legacy'),
    path('apicorpu/5.0/users/list', views.api_users_list_v5, name='api_users_list_v5_legacy'),
    path('apicorpu/5.0/webhooks/register', views.webhook_register_v5, name='webhook_register_v5_legacy'),
    path('apicorpu/5.0/webhooks/list', views.webhook_list_v5, name='webhook_list_v5_legacy'),
    path('apicorpu/5.0/webhooks/unregister/<str:app_name>', views.webhook_unregister_v5, name='webhook_unregister_v5_legacy'),
    path('apicorpu/5.0/webhooks/sync-password-manual', views.webhook_sync_password_manual_v5, name='webhook_sync_password_manual_v5_legacy'),
    
    # Redirect all other requests to Next.js frontend
    # This is handled by nginx, but adding fallback for direct Django access
    path('', RedirectView.as_view(url='http://localhost:3000/', permanent=False), name='redirect_to_frontend'),
]

# MinIO proxy - serve files from MinIO via Django proxy view
from apps.manajemen.proxy_views import minio_proxy
urlpatterns += [
    path('media/minio/<path:key>', minio_proxy, name='minio_proxy'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
