"""
Dashboard API URLs
"""
from django.urls import path
from . import views_api

app_name = 'dashboard_api'

urlpatterns = [
    path('stats/', views_api.DashboardStatsAPIView.as_view(), name='stats'),
    path('activities/', views_api.RecentActivitiesAPIView.as_view(), name='activities'),
    path('system-status/', views_api.SystemStatusAPIView.as_view(), name='system_status'),
    path('charts/', views_api.DashboardChartsAPIView.as_view(), name='charts'),
]
