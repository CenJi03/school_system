from django.contrib import admin
from .models import (
    Survey,
    Question,
    QuestionOption,
    SurveyResponse,
    Answer,
    Feedback,
    ImprovementPlan,
    QualityMetric,
    MetricMeasurement
)


class QuestionOptionInline(admin.TabularInline):
    model = QuestionOption
    extra = 3


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 3
    fields = ('text', 'question_type', 'is_required', 'order', 'help_text')


@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ('title', 'survey_type', 'school', 'start_date', 'end_date', 'status', 'is_anonymous')
    list_filter = ('survey_type', 'status', 'school', 'is_anonymous', 'start_date')
    search_fields = ('title', 'description', 'instructions')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    inlines = [QuestionInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'school', 'survey_type', 'status')
        }),
        ('Target Audience', {
            'fields': ('department', 'course', 'instructor')
        }),
        ('Survey Settings', {
            'fields': ('is_anonymous', 'allow_multiple_submissions', 'start_date', 'end_date', 'instructions')
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


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'survey', 'question_type', 'is_required', 'order')
    list_filter = ('survey', 'question_type', 'is_required')
    search_fields = ('text', 'help_text')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    inlines = [QuestionOptionInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('survey', 'text', 'question_type', 'is_required', 'order')
        }),
        ('Rating Settings', {
            'fields': ('min_value', 'max_value')
        }),
        ('Additional Information', {
            'fields': ('help_text',)
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


class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 0
    readonly_fields = ('question', 'text_answer', 'numeric_answer', 'selected_options')
    fields = ('question', 'text_answer', 'numeric_answer')
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(SurveyResponse)
class SurveyResponseAdmin(admin.ModelAdmin):
    list_display = ('survey', 'respondent_name', 'submission_date', 'ip_address')
    list_filter = ('survey', 'submission_date')
    search_fields = ('respondent__first_name', 'respondent__last_name', 'respondent__email', 'ip_address')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by', 'survey', 'respondent', 'submission_date', 'ip_address', 'user_agent')
    inlines = [AnswerInline]
    
    fieldsets = (
        ('Response Information', {
            'fields': ('survey', 'respondent', 'submission_date')
        }),
        ('Metadata', {
            'fields': ('ip_address', 'user_agent')
        }),
        ('Audit Trail', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def respondent_name(self, obj):
        if obj.respondent:
            return obj.respondent.get_full_name() or obj.respondent.email
        return "Anonymous"
    respondent_name.short_description = 'Respondent'
    
    def has_add_permission(self, request):
        return False


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('subject', 'feedback_type', 'school', 'submitter_name', 'status', 'created_at')
    list_filter = ('feedback_type', 'status', 'school', 'is_anonymous', 'created_at')
    search_fields = ('subject', 'content', 'submitter__first_name', 'submitter__last_name', 'submitter__email', 'contact_email')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('school', 'submitter', 'is_anonymous', 'feedback_type', 'subject', 'content')
        }),
        ('Related Entities', {
            'fields': ('department', 'course', 'staff_member')
        }),
        ('Status and Assignment', {
            'fields': ('status', 'assigned_to', 'resolution', 'resolved_date')
        }),
        ('Contact Information', {
            'fields': ('contact_email', 'allow_contact')
        }),
        ('Audit Trail', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def submitter_name(self, obj):
        if obj.is_anonymous or not obj.submitter:
            return "Anonymous"
        return obj.submitter.get_full_name() or obj.submitter.email
    submitter_name.short_description = 'Submitter'
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(ImprovementPlan)
class ImprovementPlanAdmin(admin.ModelAdmin):
    list_display = ('title', 'improvement_area', 'school', 'department', 'status', 'start_date', 'target_completion_date')
    list_filter = ('improvement_area', 'status', 'school', 'department', 'start_date')
    search_fields = ('title', 'description', 'objectives', 'resources_required')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'school', 'department', 'improvement_area', 'status')
        }),
        ('Plan Details', {
            'fields': ('description', 'objectives', 'success_criteria')
        }),
        ('Implementation', {
            'fields': ('responsible_person', 'start_date', 'target_completion_date', 'actual_completion_date')
        }),
        ('Resources', {
            'fields': ('resources_required', 'estimated_cost')
        }),
        ('Approval', {
            'fields': ('approved_by', 'approved_date')
        }),
        ('Evaluation', {
            'fields': ('evaluation_method', 'evaluation_results', 'evaluation_date')
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


class MetricMeasurementInline(admin.TabularInline):
    model = MetricMeasurement
    extra = 1
    fields = ('date', 'value', 'measured_by', 'notes')


@admin.register(QualityMetric)
class QualityMetricAdmin(admin.ModelAdmin):
    list_display = ('name', 'metric_type', 'school', 'department', 'target_value', 'is_active')
    list_filter = ('metric_type', 'school', 'department', 'is_active')
    search_fields = ('name', 'description', 'calculation_method')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    inlines = [MetricMeasurementInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'school', 'department', 'metric_type', 'is_active')
        }),
        ('Metric Details', {
            'fields': ('description', 'calculation_method', 'frequency')
        }),
        ('Targets', {
            'fields': ('target_value', 'minimum_acceptable', 'responsible_person')
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


@admin.register(MetricMeasurement)
class MetricMeasurementAdmin(admin.ModelAdmin):
    list_display = ('metric', 'date', 'value', 'meets_target', 'meets_minimum', 'measured_by')
    list_filter = ('metric', 'date', 'measured_by')
    search_fields = ('metric__name', 'notes')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by', 'meets_target', 'meets_minimum')
    
    fieldsets = (
        ('Measurement Information', {
            'fields': ('metric', 'date', 'value', 'meets_target', 'meets_minimum')
        }),
        ('Context', {
            'fields': ('notes', 'measured_by', 'course', 'instructor')
        }),
        ('Audit Trail', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
            if not obj.measured_by:
                obj.measured_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)