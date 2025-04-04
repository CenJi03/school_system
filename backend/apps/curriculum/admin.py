from django.contrib import admin
from .models import (
    Course,
    CourseMaterial,
    Lesson,
    ClassSchedule,
    Assignment,
    Syllabus
)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'department', 'level', 'credits', 'is_active')
    list_filter = ('department', 'level', 'is_active')
    search_fields = ('code', 'name', 'description')
    filter_horizontal = ('prerequisites',)
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'name', 'department', 'is_active')
        }),
        ('Course Details', {
            'fields': ('description', 'level', 'credits', 'prerequisites')
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


@admin.register(CourseMaterial)
class CourseMaterialAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'material_type', 'is_active')
    list_filter = ('course__department', 'material_type', 'is_active')
    search_fields = ('title', 'description', 'course__code', 'course__name')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('course', 'title', 'material_type', 'is_active')
        }),
        ('Content', {
            'fields': ('description', 'file', 'url')
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


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'is_active')
    list_filter = ('course__department', 'is_active')
    search_fields = ('title', 'description', 'content', 'course__code', 'course__name')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('course', 'title', 'order', 'is_active')
        }),
        ('Content', {
            'fields': ('description', 'content')
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


@admin.register(ClassSchedule)
class ClassScheduleAdmin(admin.ModelAdmin):
    list_display = ('course', 'term', 'teacher', 'day_of_week', 'start_time', 'end_time', 'is_active')
    list_filter = ('term', 'day_of_week', 'is_active', 'course__department')
    search_fields = ('course__code', 'course__name', 'teacher__email', 'room')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('course', 'term', 'teacher', 'is_active')
        }),
        ('Schedule Details', {
            'fields': ('day_of_week', 'start_time', 'end_time', 'room')
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


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'assignment_type', 'due_date', 'points', 'is_active')
    list_filter = ('course__department', 'assignment_type', 'is_active')
    search_fields = ('title', 'description', 'course__code', 'course__name')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('course', 'title', 'assignment_type', 'is_active')
        }),
        ('Assignment Details', {
            'fields': ('description', 'due_date', 'points', 'file_attachment')
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


@admin.register(Syllabus)
class SyllabusAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'term', 'is_active')
    list_filter = ('course__department', 'term', 'is_active')
    search_fields = ('title', 'description', 'content', 'course__code', 'course__name')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('course', 'term', 'title', 'is_active')
        }),
        ('Content', {
            'fields': ('description', 'content', 'file')
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