from django.contrib import admin
from .models import (
    StaffMember,
    TeacherProfile,
    Leave,
    Performance,
    StaffDocument
)


@admin.register(StaffMember)
class StaffMemberAdmin(admin.ModelAdmin):
    list_display = ('staff_id', 'full_name', 'email', 'designation', 'department', 'employment_type', 'status', 'joining_date')
    list_filter = ('school', 'department', 'employment_type', 'status', 'joining_date')
    search_fields = ('staff_id', 'user__first_name', 'user__last_name', 'user__email', 'designation')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'staff_id', 'school', 'department', 'designation', 'status')
        }),
        ('Employment Details', {
            'fields': ('employment_type', 'joining_date', 'termination_date', 'salary')
        }),
        ('Personal Information', {
            'fields': ('date_of_birth', 'gender', 'address', 'city', 'state', 'country', 'postal_code')
        }),
        ('Emergency Contact', {
            'fields': ('emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone')
        }),
        ('Professional Information', {
            'fields': ('qualifications', 'skills', 'experience', 'notes')
        }),
        ('Audit Trail', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def full_name(self, obj):
        return obj.user.get_full_name()
    full_name.short_description = 'Name'
    
    def email(self, obj):
        return obj.user.email
    email.short_description = 'Email'
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ('staff_member', 'max_hours_per_week')
    search_fields = ('staff_member__staff_id', 'staff_member__user__first_name', 'staff_member__user__last_name')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('staff_member', 'max_hours_per_week')
        }),
        ('Teaching Details', {
            'fields': ('subjects', 'preferred_levels', 'certifications')
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


@admin.register(Leave)
class LeaveAdmin(admin.ModelAdmin):
    list_display = ('staff_member', 'leave_type', 'start_date', 'end_date', 'status')
    list_filter = ('leave_type', 'status', 'start_date')
    search_fields = ('staff_member__staff_id', 'staff_member__user__first_name', 'staff_member__user__last_name', 'reason')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('staff_member', 'leave_type', 'start_date', 'end_date', 'reason', 'status')
        }),
        ('Approval Details', {
            'fields': ('approved_by', 'approved_date', 'rejection_reason')
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


@admin.register(Performance)
class PerformanceAdmin(admin.ModelAdmin):
    list_display = ('staff_member', 'evaluation_date', 'evaluator', 'overall_rating', 'average_rating')
    list_filter = ('evaluation_date', 'overall_rating')
    search_fields = ('staff_member__staff_id', 'staff_member__user__first_name', 'staff_member__user__last_name', 'comments')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by', 'average_rating')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('staff_member', 'evaluation_date', 'evaluator', 'overall_rating')
        }),
        ('Performance Ratings', {
            'fields': ('teaching_skill', 'classroom_management', 'student_engagement',
                       'curriculum_adherence', 'punctuality', 'teamwork', 'communication',
                       'average_rating')
        }),
        ('Evaluation Details', {
            'fields': ('strengths', 'areas_for_improvement', 'goals', 'comments')
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


@admin.register(StaffDocument)
class StaffDocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'staff_member', 'document_type', 'is_confidential', 'expiry_date')
    list_filter = ('document_type', 'is_confidential', 'expiry_date')
    search_fields = ('title', 'description', 'staff_member__staff_id', 'staff_member__user__first_name', 'staff_member__user__last_name')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('staff_member', 'title', 'document_type', 'file', 'description')
        }),
        ('Document Properties', {
            'fields': ('is_confidential', 'expiry_date')
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