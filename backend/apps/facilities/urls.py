"""
URL patterns for the facilities app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'buildings', views.BuildingViewSet)
router.register(r'rooms', views.RoomViewSet)
router.register(r'equipment', views.EquipmentViewSet)
router.register(r'maintenance', views.MaintenanceViewSet)
router.register(r'reservations', views.ReservationViewSet)
router.register(r'inventory', views.InventoryViewSet)

# URLs patterns
urlpatterns = [
    path('', include(router.urls)),
]