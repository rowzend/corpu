from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views_api

router = DefaultRouter()
router.register(r'sections', views_api.ProfileSectionViewSet, basename='profile_section')
router.register(r'personalia', views_api.PersonaliaViewSet, basename='personalia')
router.register(r'brands', views_api.BrandViewSet, basename='brand')

urlpatterns = [
    path('', include(router.urls)),
]
