"""
URL patterns for the authentication app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'activities', views.UserActivityViewSet)

# URLs that do not follow the viewset pattern
auth_urls = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('password-reset/', views.PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]

# Combine router URLs and other URLs
urlpatterns = [
    path('', include(router.urls)),
    path('', include(auth_urls)),
]