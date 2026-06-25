from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_api import NewsViewSet

router = DefaultRouter()
router.register(r'', NewsViewSet, basename='news')

app_name = 'news_api'

urlpatterns = [
    path('', include(router.urls)),
]
