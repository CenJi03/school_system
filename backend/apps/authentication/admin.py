from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User, UserActivity


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin view for User model
    """
    list_display = ('username', 'email', 'user_type', 'is_admin_created', 'is_active')
    list_filter = ('is_active', 'user_type', 'is_admin_created')
    
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        (_('Personal info'), {'fields': ('user_type',)}),
        (_('Permissions'), {'fields': ('is_active', 'is_superuser', 'is_admin_created')}),
        (_('Groups and Permissions'), {'fields': ('groups', 'user_permissions')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'user_type', 'is_admin_created'),
        }),
    )
    
    search_fields = ('email', 'username')
    ordering = ('username', 'email')
    filter_horizontal = ('groups', 'user_permissions',)
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.is_admin_created = True  # Set flag for admin-created users
        super().save_model(request, obj, form, change)


@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    """
    Admin view for UserActivity model
    """
    list_display = ('user', 'action', 'ip_address', 'timestamp')
    list_filter = ('action', 'timestamp')
    search_fields = ('user__email', 'action', 'ip_address')
    date_hierarchy = 'timestamp'
    readonly_fields = ('user', 'action', 'ip_address', 'user_agent', 'timestamp')