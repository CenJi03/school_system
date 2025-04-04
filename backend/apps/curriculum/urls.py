"""
URL patterns for the curriculum app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'courses', views.CourseViewSet)
router.register(r'materials', views.CourseMaterialViewSet)
router.register(r'lessons', views.LessonViewSet)
router.register(r'schedules', views.ClassScheduleViewSet)
router.register(r'assignments', views.AssignmentViewSet)
router.register(r'syllabi', views.SyllabusViewSet)

# URLs patterns
urlpatterns = [
    path('', include(router.urls)),
]