"""
URL patterns for the students app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'students', views.StudentViewSet)
router.register(r'enrollments', views.EnrollmentViewSet)
router.register(r'attendance', views.AttendanceViewSet)
router.register(r'submissions', views.AssignmentSubmissionViewSet)
router.register(r'notes', views.StudentNoteViewSet)

# URLs patterns
urlpatterns = [
    path('', include(router.urls)),
]