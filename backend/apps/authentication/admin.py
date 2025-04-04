from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User, UserActivity


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin view for User model
    """
    list_display = ('email', 'first_name', 'last_name', 'user_type', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_active', 'is_staff', 'user_type')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('username', 'first_name', 'last_name', 'profile_picture', 'phone_number')}),
        (_('User type'), {'fields': ('user_type',)}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('date_joined',)}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'first_name', 'last_name', 'user_type'),
        }),
    )

    readonly_fields = ('date_joined',)


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