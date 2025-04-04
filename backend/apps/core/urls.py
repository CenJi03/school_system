"""
URL patterns for the core app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'schools', views.SchoolViewSet)
router.register(r'school-years', views.SchoolYearViewSet)
router.register(r'terms', views.TermViewSet)
router.register(r'departments', views.DepartmentViewSet)
router.register(r'settings', views.SystemSettingViewSet)
router.register(r'notifications', views.NotificationViewSet)

# URLs patterns
urlpatterns = [
    path('', include(router.urls)),
]