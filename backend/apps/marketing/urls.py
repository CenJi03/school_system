"""
URL patterns for the marketing app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'campaigns', views.CampaignViewSet)
router.register(r'leads', views.LeadViewSet)
router.register(r'interactions', views.InteractionViewSet)
router.register(r'promotions', views.PromotionViewSet)
router.register(r'analytics', views.MarketingAnalyticsViewSet)

# URLs patterns
urlpatterns = [
    path('', include(router.urls)),
]