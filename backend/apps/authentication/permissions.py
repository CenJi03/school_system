from rest_framework import permissions

class IsAdminCreatedUser(permissions.BasePermission):
    """
    Permission check for users created by admins.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin_created