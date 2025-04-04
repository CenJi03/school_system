from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import TimeStampedModel, School, Department
from apps.curriculum.models import Course
from apps.staff.models import StaffMember
from apps.students.models import Student

User = get_user_model()


class Survey(TimeStampedModel):
    """
    Model representing a survey for feedback collection
    """
    SURVEY_TYPE_CHOICES = (
        ('course', _('Course Evaluation')),
        ('instructor', _('Instructor Evaluation')),
        ('facility', _('Facility Evaluation')),
        ('general', _('General Feedback')),
        ('satisfaction', _('Satisfaction Survey')),
        ('exit', _('Exit Survey')),
        ('other', _('Other')),
    )
    
    STATUS_CHOICES = (
        ('draft', _('Draft')),
        ('active', _('Active')),
        ('closed', _('Closed')),
        ('archived', _('Archived')),
    )
    
    title = models.CharField(_('Title'), max_length=255)
    description = models.TextField(_('Description'), blank=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='surveys')
    survey_type = models.CharField(_('Survey Type'), max_length=20, choices=SURVEY_TYPE_CHOICES)
    
    # Target audience
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='surveys')
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='surveys')
    instructor = models.ForeignKey(StaffMember, on_delete=models.SET_NULL, null=True, blank=True, related_name='surveys')
    
    # Survey settings
    is_anonymous = models.BooleanField(_('Anonymous Survey'), default=True)
    allow_multiple_submissions = models.BooleanField(_('Allow Multiple Submissions'), default=False)
    
    # Time settings
    start_date = models.DateField(_('Start Date'))
    end_date = models.DateField(_('End Date'))
    status = models.CharField(_('Status'), max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Instructions for respondents
    instructions = models.TextField(_('Instructions'), blank=True)
    
    class Meta:
        verbose_name = _('Survey')
        verbose_name_plural = _('Surveys')
        ordering = ['-start_date', 'title']
    
    def __str__(self):
        return f"{self.title} ({self.get_survey_type_display()})"


class Question(TimeStampedModel):
    """
    Model representing a question in a survey
    """
    QUESTION_TYPE_CHOICES = (
        ('text', _('Text')),
        ('textarea', _('Text Area')),
        ('single_choice', _('Single Choice')),
        ('multiple_choice', _('Multiple Choice')),
        ('rating', _('Rating')),
        ('likert', _('Likert Scale')),
        ('yes_no', _('Yes/No')),
    )
    
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField(_('Question Text'))
    question_type = models.CharField(_('Question Type'), max_length=20, choices=QUESTION_TYPE_CHOICES)
    is_required = models.BooleanField(_('Required'), default=True)
    order = models.PositiveIntegerField(_('Order'))
    
    # For rating questions
    min_value = models.IntegerField(_('Minimum Value'), null=True, blank=True)
    max_value = models.IntegerField(_('Maximum Value'), null=True, blank=True)
    
    # Additional help text
    help_text = models.TextField(_('Help Text'), blank=True)
    
    class Meta:
        verbose_name = _('Question')
        verbose_name_plural = _('Questions')
        ordering = ['survey', 'order']
        unique_together = ['survey', 'order']
    
    def __str__(self):
        return f"{self.survey.title} - Question {self.order}: {self.text[:50]}"


class QuestionOption(TimeStampedModel):
    """
    Model representing options for choice-based questions
    """
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    text = models.CharField(_('Option Text'), max_length=255)
    order = models.PositiveIntegerField(_('Order'))
    
    class Meta:
        verbose_name = _('Question Option')
        verbose_name_plural = _('Question Options')
        ordering = ['question', 'order']
        unique_together = ['question', 'order']
    
    def __str__(self):
        return f"{self.question} - Option {self.order}: {self.text}"


class SurveyResponse(TimeStampedModel):
    """
    Model representing a response to a survey
    """
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='responses')
    respondent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='survey_responses')
    
    # Metadata
    submission_date = models.DateTimeField(_('Submission Date'), auto_now_add=True)
    ip_address = models.GenericIPAddressField(_('IP Address'), null=True, blank=True)
    user_agent = models.TextField(_('User Agent'), blank=True)
    
    class Meta:
        verbose_name = _('Survey Response')
        verbose_name_plural = _('Survey Responses')
        ordering = ['-submission_date']
    
    def __str__(self):
        if self.respondent:
            return f"{self.survey.title} - Response by {self.respondent.get_full_name()} on {self.submission_date}"
        return f"{self.survey.title} - Anonymous Response on {self.submission_date}"


class Answer(TimeStampedModel):
    """
    Model representing an answer to a question in a survey response
    """
    survey_response = models.ForeignKey(SurveyResponse, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    
    # Different types of answers based on question type
    text_answer = models.TextField(_('Text Answer'), blank=True)
    selected_options = models.ManyToManyField(QuestionOption, blank=True, related_name='answers')
    numeric_answer = models.IntegerField(_('Numeric Answer'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('Answer')
        verbose_name_plural = _('Answers')
        unique_together = ['survey_response', 'question']
    
    def __str__(self):
        return f"Answer to {self.question}"


class Feedback(TimeStampedModel):
    """
    Model representing general feedback from students/staff
    """
    FEEDBACK_TYPE_CHOICES = (
        ('suggestion', _('Suggestion')),
        ('complaint', _('Complaint')),
        ('compliment', _('Compliment')),
        ('question', _('Question')),
        ('other', _('Other')),
    )
    
    STATUS_CHOICES = (
        ('new', _('New')),
        ('under_review', _('Under Review')),
        ('in_progress', _('In Progress')),
        ('resolved', _('Resolved')),
        ('closed', _('Closed')),
    )
    
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='feedback')
    submitter = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='submitted_feedback')
    
    # Can be submitted anonymously
    is_anonymous = models.BooleanField(_('Anonymous Feedback'), default=False)
    
    # Feedback details
    feedback_type = models.CharField(_('Feedback Type'), max_length=20, choices=FEEDBACK_TYPE_CHOICES)
    subject = models.CharField(_('Subject'), max_length=255)
    content = models.TextField(_('Content'))
    
    # Related entities
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='feedback')
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='feedback')
    staff_member = models.ForeignKey(StaffMember, on_delete=models.SET_NULL, null=True, blank=True, related_name='feedback')
    
    # Status tracking
    status = models.CharField(_('Status'), max_length=20, choices=STATUS_CHOICES, default='new')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_feedback')
    
    # Follow-up
    resolution = models.TextField(_('Resolution'), blank=True)
    resolved_date = models.DateTimeField(_('Resolved Date'), null=True, blank=True)
    
    # Contact info for anonymous feedback
    contact_email = models.EmailField(_('Contact Email'), blank=True)
    allow_contact = models.BooleanField(_('Allow Contact'), default=True)
    
    class Meta:
        verbose_name = _('Feedback')
        verbose_name_plural = _('Feedback')
        ordering = ['-created_at']
    
    def __str__(self):
        if self.is_anonymous or not self.submitter:
            return f"Anonymous {self.get_feedback_type_display()}: {self.subject}"
        return f"{self.submitter.get_full_name()} - {self.get_feedback_type_display()}: {self.subject}"


class ImprovementPlan(TimeStampedModel):
    """
    Model representing quality improvement plans
    """
    STATUS_CHOICES = (
        ('draft', _('Draft')),
        ('approved', _('Approved')),
        ('in_progress', _('In Progress')),
        ('completed', _('Completed')),
        ('evaluated', _('Evaluated')),
        ('cancelled', _('Cancelled')),
    )
    
    AREA_CHOICES = (
        ('curriculum', _('Curriculum')),
        ('teaching', _('Teaching Methods')),
        ('facilities', _('Facilities')),
        ('student_services', _('Student Services')),
        ('technology', _('Technology')),
        ('policies', _('Policies & Procedures')),
        ('staff_development', _('Staff Development')),
        ('other', _('Other')),
    )
    
    title = models.CharField(_('Title'), max_length=255)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='improvement_plans')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='improvement_plans')
    
    # Plan details
    improvement_area = models.CharField(_('Improvement Area'), max_length=20, choices=AREA_CHOICES)
    description = models.TextField(_('Description'))
    objectives = models.TextField(_('Objectives'))
    
    # Implementation details
    responsible_person = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='responsible_for_plans')
    start_date = models.DateField(_('Start Date'))
    target_completion_date = models.DateField(_('Target Completion Date'))
    actual_completion_date = models.DateField(_('Actual Completion Date'), null=True, blank=True)
    
    # Resources
    resources_required = models.TextField(_('Resources Required'), blank=True)
    estimated_cost = models.DecimalField(_('Estimated Cost'), max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Tracking
    status = models.CharField(_('Status'), max_length=20, choices=STATUS_CHOICES, default='draft')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_plans')
    approved_date = models.DateField(_('Approval Date'), null=True, blank=True)
    
    # Evaluation
    success_criteria = models.TextField(_('Success Criteria'), blank=True)
    evaluation_method = models.TextField(_('Evaluation Method'), blank=True)
    evaluation_results = models.TextField(_('Evaluation Results'), blank=True)
    evaluation_date = models.DateField(_('Evaluation Date'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('Improvement Plan')
        verbose_name_plural = _('Improvement Plans')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.get_improvement_area_display()})"


class QualityMetric(TimeStampedModel):
    """
    Model representing quality metrics being tracked
    """
    METRIC_TYPE_CHOICES = (
        ('student_satisfaction', _('Student Satisfaction')),
        ('learning_outcomes', _('Learning Outcomes')),
        ('attendance_rate', _('Attendance Rate')),
        ('retention_rate', _('Retention Rate')),
        ('graduation_rate', _('Graduation Rate')),
        ('teacher_performance', _('Teacher Performance')),
        ('course_effectiveness', _('Course Effectiveness')),
        ('facility_quality', _('Facility Quality')),
        ('other', _('Other')),
    )
    
    name = models.CharField(_('Metric Name'), max_length=255)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='quality_metrics')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='quality_metrics')
    
    # Metric details
    metric_type = models.CharField(_('Metric Type'), max_length=25, choices=METRIC_TYPE_CHOICES)
    description = models.TextField(_('Description'))
    calculation_method = models.TextField(_('Calculation Method'), blank=True)
    
    # Targets
    target_value = models.DecimalField(_('Target Value'), max_digits=10, decimal_places=2, null=True, blank=True)
    minimum_acceptable = models.DecimalField(_('Minimum Acceptable Value'), max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Tracking
    frequency = models.CharField(_('Measurement Frequency'), max_length=50, blank=True)
    responsible_person = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='responsible_for_metrics')
    is_active = models.BooleanField(_('Active'), default=True)
    
    class Meta:
        verbose_name = _('Quality Metric')
        verbose_name_plural = _('Quality Metrics')
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_metric_type_display()})"


class MetricMeasurement(TimeStampedModel):
    """
    Model representing measurements for quality metrics
    """
    metric = models.ForeignKey(QualityMetric, on_delete=models.CASCADE, related_name='measurements')
    
    # Measurement details
    date = models.DateField(_('Measurement Date'))
    value = models.DecimalField(_('Measured Value'), max_digits=10, decimal_places=2)
    
    # Context
    notes = models.TextField(_('Notes'), blank=True)
    measured_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='measurements')
    
    # Optional related entities
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='metric_measurements')
    instructor = models.ForeignKey(StaffMember, on_delete=models.SET_NULL, null=True, blank=True, related_name='metric_measurements')
    
    class Meta:
        verbose_name = _('Metric Measurement')
        verbose_name_plural = _('Metric Measurements')
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.metric.name} - {self.date}: {self.value}"
    
    @property
    def meets_target(self):
        """Check if measurement meets the target value"""
        if self.metric.target_value is None:
            return None
        return self.value >= self.metric.target_value
    
    @property
    def meets_minimum(self):
        """Check if measurement meets the minimum acceptable value"""
        if self.metric.minimum_acceptable is None:
            return None
        return self.value >= self.metric.minimum_acceptable