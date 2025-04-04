from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'blocked-ips', views.BlockedIPViewSet)
router.register(r'security-settings', views.SecuritySettingViewSet)
router.register(r'security-logs', views.SecurityLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('check-ip/<str:ip_address>/', views.check_ip_status, name='check-ip-status'),
    path('security-summary/', views.security_summary, name='security-summary'),
]
