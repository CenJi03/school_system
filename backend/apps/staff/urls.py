"""
URL patterns for the staff app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'staff-members', views.StaffMemberViewSet)
router.register(r'teacher-profiles', views.TeacherProfileViewSet)
router.register(r'leaves', views.LeaveViewSet)
router.register(r'performances', views.PerformanceViewSet)
router.register(r'documents', views.StaffDocumentViewSet)

# URLs patterns
urlpatterns = [
    path('', include(router.urls)),
]