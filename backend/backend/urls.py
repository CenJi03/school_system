"""
URL Configuration for School Management System project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="School Management System API",
        default_version='v1',
        description="API documentation for School Management System",
        terms_of_service="https://www.example.com/terms/",
        contact=openapi.Contact(email="contact@example.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # API Endpoints
    path('api/auth/', include('apps.authentication.urls')),
    path('api/core/', include('apps.core.urls')),
    path('api/curriculum/', include('apps.curriculum.urls')),
    path('api/students/', include('apps.students.urls')),
    path('api/staff/', include('apps.staff.urls')),
    path('api/facilities/', include('apps.facilities.urls')),
    path('api/finance/', include('apps.finance.urls')),
    path('api/marketing/', include('apps.marketing.urls')),
    path('api/quality/', include('apps.quality.urls')),
    path('api/security/', include('security.urls')),  # Add security URLs
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
    # Debug toolbar
    if 'debug_toolbar' in settings.INSTALLED_APPS:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns