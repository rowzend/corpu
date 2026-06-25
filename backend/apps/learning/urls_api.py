from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views_api

app_name = 'learning_api'

router = DefaultRouter()
router.register(r'courses', views_api.CourseViewSet, basename='course')
router.register(r'modules', views_api.ModuleViewSet, basename='module')
router.register(r'lessons', views_api.LessonViewSet, basename='lesson')
router.register(r'enrollments', views_api.EnrollmentViewSet, basename='enrollment')
router.register(r'lesson-progress', views_api.LessonProgressViewSet, basename='lesson_progress')
router.register(r'quizzes', views_api.QuizViewSet, basename='quiz')
router.register(r'quiz-questions', views_api.QuizQuestionViewSet, basename='quiz_question')
router.register(r'certificates', views_api.CertificateViewSet, basename='certificate')
router.register(r'ratings', views_api.CourseRatingViewSet, basename='rating')
router.register(r'comments', views_api.CourseCommentViewSet, basename='comment')

urlpatterns = [
    path('', include(router.urls)),
    path('certificate-settings/', views_api.certificate_settings, name='certificate_settings'),
    path('certificate-settings/<int:pk>/', views_api.certificate_settings, name='certificate_settings_detail'),
]
