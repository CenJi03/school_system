from django.contrib import admin
from .models import ActivityLog, SecurityAlert

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'timestamp', 'user', 'ip_address', 'user_agent')
    list_filter = ('action', 'timestamp')
    search_fields = ('details', 'user__email', 'user_agent')
    readonly_fields = ('timestamp',)

@admin.register(SecurityAlert)
class SecurityAlertAdmin(admin.ModelAdmin):
    """Admin interface for SecurityAlert model"""
    list_display = ('timestamp', 'user', 'type', 'severity', 'status', 'ip_address')
    list_filter = ('severity', 'status', 'timestamp', 'type')
    search_fields = ('user__email', 'ip_address', 'details', 'type')
    readonly_fields = ('timestamp', 'user', 'type', 'details', 'severity', 'ip_address')
    actions = ['mark_as_acknowledged', 'mark_as_resolved', 'mark_as_false_positive']
    date_hierarchy = 'timestamp'
    
    def mark_as_acknowledged(self, request, queryset):
        queryset.update(status='ACKNOWLEDGED')
    mark_as_acknowledged.short_description = "Mark selected alerts as acknowledged"
    
    def mark_as_resolved(self, request, queryset):
        from django.utils import timezone
        queryset.update(
            status='RESOLVED',
            resolved_by=request.user,
            resolution_timestamp=timezone.now()
        )
    mark_as_resolved.short_description = "Mark selected alerts as resolved"
    
    def mark_as_false_positive(self, request, queryset):
        from django.utils import timezone
        queryset.update(
            status='FALSE_POSITIVE',
            resolved_by=request.user,
            resolution_timestamp=timezone.now()
        )
    mark_as_false_positive.short_description = "Mark selected alerts as false positive"