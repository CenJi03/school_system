from django.contrib import admin
from .models import (
    Campaign,
    Lead,
    Interaction,
    Promotion,
    MarketingAnalytics
)


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ('name', 'campaign_type', 'school', 'start_date', 'end_date', 'status', 'budget')
    list_filter = ('campaign_type', 'status', 'school', 'start_date')
    search_fields = ('name', 'description', 'goal')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'campaign_type', 'description', 'school', 'status')
        }),
        ('Timeline and Budget', {
            'fields': ('start_date', 'end_date', 'budget')
        }),
        ('Strategy', {
            'fields': ('target_audience', 'goal', 'success_metrics', 'expected_roi')
        }),
        ('Audit Trail', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


class InteractionInline(admin.TabularInline):
    model = Interaction
    extra = 1
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'email', 'school', 'source', 'status', 'assigned_to', 'followup_date')
    list_filter = ('status', 'source', 'school', 'created_at', 'followup_date')
    search_fields = ('first_name', 'last_name', 'email', 'phone', 'interest', 'notes')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    inlines = [InteractionInline]
    
    fieldsets = (
        ('Contact Information', {
            'fields': ('first_name', 'last_name', 'email', 'phone', 'address')
        }),
        ('Lead Details', {
            'fields': ('school', 'status', 'source', 'campaign')
        }),
        ('Interest and Assignment', {
            'fields': ('interest', 'notes', 'assigned_to', 'followup_date')
        }),
        ('Audit Trail', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Interaction)
class InteractionAdmin(admin.ModelAdmin):
    list_display = ('lead', 'interaction_type', 'date', 'conducted_by', 'next_contact_date')
    list_filter = ('interaction_type', 'date', 'conducted_by')
    search_fields = ('lead__first_name', 'lead__last_name', 'lead__email', 'summary', 'outcome', 'next_steps')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('lead', 'interaction_type', 'date', 'conducted_by')
        }),
        ('Details', {
            'fields': ('summary', 'outcome', 'next_steps', 'next_contact_date')
        }),
        ('Audit Trail', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
            if not obj.conducted_by:
                obj.conducted_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'school', 'campaign', 'start_date', 'end_date', 'status', 'is_valid')
    list_filter = ('status', 'school', 'start_date', 'end_date')
    search_fields = ('name', 'code', 'description')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by', 'is_valid')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'code', 'description', 'school', 'campaign', 'status')
        }),
        ('Discount Details', {
            'fields': ('discount_amount', 'discount_percentage')
        }),
        ('Validity', {
            'fields': ('start_date', 'end_date', 'max_uses', 'current_uses', 'is_valid')
        }),
        ('Terms and Conditions', {
            'fields': ('terms_conditions',)
        }),
        ('Audit Trail', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(MarketingAnalytics)
class MarketingAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('metric_type', 'school', 'campaign', 'date', 'value')
    list_filter = ('metric_type', 'school', 'date')
    search_fields = ('notes', 'campaign__name')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('school', 'date', 'campaign', 'metric_type', 'value')
        }),
        ('Additional Information', {
            'fields': ('notes',)
        }),
        ('Audit Trail', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)