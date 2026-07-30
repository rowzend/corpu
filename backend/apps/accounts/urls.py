"""
URLs untuk accounts app
"""
from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    # Login - redirect to landing page
    path('login/', views.login_redirect, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),
    path('change-password/', views.change_password_view, name='change_password'),
    path('force-change-password/', views.force_change_password_view, name='force_change_password'),
]
