from django.contrib import admin
from .models import BlockedIP, SecuritySetting, UserSecurityProfile

@admin.register(BlockedIP)
class BlockedIPAdmin(admin.ModelAdmin):
    list_display = ('ip_address', 'blocked_at', 'blocked_until', 'is_permanent', 'is_active')
    list_filter = ('is_permanent', 'blocked_at')
    search_fields = ('ip_address', 'reason')
    readonly_fields = ('blocked_at',)
    actions = ['unblock_ips']
    
    def unblock_ips(self, request, queryset):
        from django.utils import timezone
        queryset.update(is_permanent=False, blocked_until=timezone.now())
        
        # Clear cache entries
        from django.core.cache import cache
        for ip in queryset:
            cache.delete(f"blocked_ip_{ip.ip_address}")
            
    unblock_ips.short_description = "Unblock selected IPs"
    
    def is_active(self, obj):
        return obj.is_active
    is_active.boolean = True

@admin.register(SecuritySetting)
class SecuritySettingAdmin(admin.ModelAdmin):
    list_display = ('key', 'updated_at', 'description')
    search_fields = ('key', 'description')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(UserSecurityProfile)
class UserSecurityProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'failed_login_attempts', 'account_locked', 'locked_until')
    list_filter = ('account_locked',)
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
