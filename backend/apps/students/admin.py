from django.contrib import admin
from .models import (
    Student,
    Enrollment,
    Attendance,
    AssignmentSubmission,
    StudentNote
)


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'full_name', 'email', 'school', 'status', 'admission_date')
    list_filter = ('school', 'status', 'gender', 'admission_date')
    search_fields = ('student_id', 'user__first_name', 'user__last_name', 'user__email')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'student_id', 'school', 'status')
        }),
        ('Personal Information', {
            'fields': ('date_of_birth', 'gender', 'address', 'city', 'state', 'country', 'postal_code')
        }),
        ('Emergency Contact', {
            'fields': ('emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone')
        }),
        ('Academic Information', {
            'fields': ('admission_date', 'graduation_date', 'notes')
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