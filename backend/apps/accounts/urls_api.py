from django.urls import path
from . import views_api

app_name = 'accounts_api'

urlpatterns = [
    path('profile/', views_api.UserProfileDetailAPIView.as_view(), name='user_profile_detail'),
    path('profile/<int:user_id>/', views_api.UserProfilePublicAPIView.as_view(), name='user_profile_public'),
]
