from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views_api

router = DefaultRouter()
router.register(r'sections', views_api.PublicProfileSectionViewSet, basename='public_profile_section')
router.register(r'personalia', views_api.PublicPersonaliaViewSet, basename='public_personalia')
router.register(r'brands', views_api.PublicBrandViewSet, basename='public_brand')

urlpatterns = [
    path('', include(router.urls)),
]
