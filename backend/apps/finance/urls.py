"""
URL patterns for the finance app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'fee-structures', views.FeeStructureViewSet)
router.register(r'fee-items', views.FeeItemViewSet)
router.register(r'invoices', views.InvoiceViewSet)
router.register(r'payments', views.PaymentViewSet)
router.register(r'expenses', views.ExpenseViewSet)
router.register(r'budgets', views.BudgetViewSet)

# URLs patterns
urlpatterns = [
    path('', include(router.urls)),
]