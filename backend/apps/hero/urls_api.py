from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views_api

router = DefaultRouter()
router.register(r'', views_api.HeroImageViewSet, basename='public_hero')

urlpatterns = [
    path('', include(router.urls)),
]
