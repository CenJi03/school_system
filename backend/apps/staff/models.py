from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from apps.core.models import TimeStampedModel, School, Department

User = get_user_model()


class StaffMember(TimeStampedModel):
    """
    Model representing a staff member
    """
    GENDER_CHOICES = (
        ('male', _('Male')),
        ('female', _('Female')),
        ('other', _('Other')),
    )
    
    EMPLOYMENT_TYPE_CHOICES = (
        ('full_time', _('Full Time')),
        ('part_time', _('Part Time')),
        ('contract', _('Contract')),
        ('temporary', _('Temporary')),
        ('intern', _('Intern')),
    )
    
    STATUS_CHOICES = (
        ('active', _('Active')),
        ('on_leave', _('On Leave')),
        ('suspended', _('Suspended')),
        ('terminated', _('Terminated')),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    staff_id = models.CharField(_('Staff ID'), max_length=20, unique=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='staff_members')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_members')
    designation = models.CharField(_('Designation/Title'), max_length=100)
    employment_type = models.CharField(_('Employment Type'), max_length=20, choices=EMPLOYMENT_TYPE_CHOICES, default='full_time')
    date_of_birth = models.DateField(_('Date of Birth'), null=True, blank=True)
    gender = models.CharField(_('Gender'), max_length=10, choices=GENDER_CHOICES, null=True, blank=True)
    address = models.TextField(_('Address'), blank=True)
    city = models.CharField(_('City'), max_length=100, blank=True)
    state = models.CharField(_('State/Province'), max_length=100, blank=True)
    country = models.CharField(_('Country'), max_length=100, blank=True)
    postal_code = models.CharField(_('Postal Code'), max_length=20, blank=True)
    status = models.CharField(_('Status'), max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Employment details
    joining_date = models.DateField(_('Joining Date'))
    termination_date = models.DateField(_('Termination Date'), null=True, blank=True)
    salary = models.DecimalField(_('Base Salary'), max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Emergency contact
    emergency_contact_name = models.CharField(_('Emergency Contact Name'), max_length=255, blank=True)
    emergency_contact_relationship = models.CharField(_('Relationship'), max_length=50, blank=True)
    emergency_contact_phone = models.CharField(_('Emergency Contact Phone'), max_length=20, blank=True)
    
    # Additional info
    qualifications = models.TextField(_('Qualifications'), blank=True)
    skills = models.TextField(_('Skills'), blank=True)
    experience = models.TextField(_('Experience'), blank=True)
    notes = models.TextField(_('Notes'), blank=True)
    
    class Meta:
        verbose_name = _('Staff Member')
        verbose_name_plural = _('Staff Members')
        ordering = ['staff_id']
    
    def __str__(self):
        return f"{self.staff_id} - {self.user.get_full_name()}"
    
    @property
    def full_name(self):
        return self.user.get_full_name()
    
    @property
    def email(self):
        return self.user.email


class TeacherProfile(TimeStampedModel):
    """
    Model representing a teacher's specific profile details
    """
    staff_member = models.OneToOneField(StaffMember, on_delete=models.CASCADE, related_name='teacher_profile')
    subjects = models.JSONField(_('Subjects'), default=list)
    preferred_levels = models.JSONField(_('Preferred Teaching Levels'), default=list)
    max_hours_per_week = models.PositiveIntegerField(_('Maximum Hours per Week'), default=40)
    certifications = models.JSONField(_('Certifications'), default=list)
    
    class Meta:
        verbose_name = _('Teacher Profile')
        verbose_name_plural = _('Teacher Profiles')
    
    def __str__(self):
        return f"Teacher Profile: {self.staff_member.full_name}"


class Leave(TimeStampedModel):
    """
    Model representing staff leave requests and records
    """
    LEAVE_TYPE_CHOICES = (
        ('annual', _('Annual Leave')),
        ('sick', _('Sick Leave')),
        ('unpaid', _('Unpaid Leave')),
        ('maternity', _('Maternity Leave')),
        ('paternity', _('Paternity Leave')),
        ('bereavement', _('Bereavement Leave')),
        ('other', _('Other')),
    )
    
    STATUS_CHOICES = (
        ('pending', _('Pending')),
        ('approved', _('Approved')),
        ('rejected', _('Rejected')),
        ('cancelled', _('Cancelled')),
    )
    
    staff_member = models.ForeignKey(StaffMember, on_delete=models.CASCADE, related_name='leaves')
    leave_type = models.CharField(_('Leave Type'), max_length=20, choices=LEAVE_TYPE_CHOICES)
    start_date = models.DateField(_('Start Date'))
    end_date = models.DateField(_('End Date'))
    reason = models.TextField(_('Reason'), blank=True)
    status = models.CharField(_('Status'), max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Approval details
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves')
    approved_date = models.DateTimeField(_('Approved Date'), null=True, blank=True)
    rejection_reason = models.TextField(_('Rejection Reason'), blank=True)
    
    class Meta:
        verbose_name = _('Leave')
        verbose_name_plural = _('Leaves')
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.staff_member.full_name} - {self.get_leave_type_display()} ({self.start_date} to {self.end_date})"


class Performance(TimeStampedModel):
    """
    Model representing staff performance evaluations
    """
    RATING_CHOICES = (
        (1, _('Poor')),
        (2, _('Needs Improvement')),
        (3, _('Meets Expectations')),
        (4, _('Exceeds Expectations')),
        (5, _('Outstanding')),
    )
    
    staff_member = models.ForeignKey(StaffMember, on_delete=models.CASCADE, related_name='performances')
    evaluation_date = models.DateField(_('Evaluation Date'))
    evaluator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='conducted_evaluations')
    teaching_skill = models.PositiveSmallIntegerField(_('Teaching Skill'), choices=RATING_CHOICES, null=True, blank=True)
    classroom_management = models.PositiveSmallIntegerField(_('Classroom Management'), choices=RATING_CHOICES, null=True, blank=True)
    student_engagement = models.PositiveSmallIntegerField(_('Student Engagement'), choices=RATING_CHOICES, null=True, blank=True)
    curriculum_adherence = models.PositiveSmallIntegerField(_('Curriculum Adherence'), choices=RATING_CHOICES, null=True, blank=True)
    punctuality = models.PositiveSmallIntegerField(_('Punctuality'), choices=RATING_CHOICES, null=True, blank=True)
    teamwork = models.PositiveSmallIntegerField(_('Teamwork'), choices=RATING_CHOICES, null=True, blank=True)
    communication = models.PositiveSmallIntegerField(_('Communication'), choices=RATING_CHOICES, null=True, blank=True)
    overall_rating = models.PositiveSmallIntegerField(_('Overall Rating'), choices=RATING_CHOICES)
    strengths = models.TextField(_('Strengths'), blank=True)
    areas_for_improvement = models.TextField(_('Areas for Improvement'), blank=True)
    goals = models.TextField(_('Goals for Next Period'), blank=True)
    comments = models.TextField(_('Additional Comments'), blank=True)
    
    class Meta:
        verbose_name = _('Performance Evaluation')
        verbose_name_plural = _('Performance Evaluations')
        ordering = ['-evaluation_date']
    
    def __str__(self):
        return f"{self.staff_member.full_name} - Evaluation on {self.evaluation_date}"
    
    @property
    def average_rating(self):
        """Calculate the average rating across all evaluated categories"""
        ratings = [
            self.teaching_skill, self.classroom_management, self.student_engagement,
            self.curriculum_adherence, self.punctuality, self.teamwork, self.communication
        ]
        valid_ratings = [r for r in ratings if r is not None]
        if valid_ratings:
            return sum(valid_ratings) / len(valid_ratings)
        return None


class StaffDocument(TimeStampedModel):
    """
    Model for storing staff-related documents
    """
    DOCUMENT_TYPE_CHOICES = (
        ('contract', _('Contract')),
        ('id', _('Identification')),
        ('resume', _('Resume/CV')),
        ('certificate', _('Certificate')),
        ('evaluation', _('Evaluation')),
        ('other', _('Other')),
    )
    
    staff_member = models.ForeignKey(StaffMember, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(_('Title'), max_length=255)
    document_type = models.CharField(_('Document Type'), max_length=20, choices=DOCUMENT_TYPE_CHOICES)
    file = models.FileField(_('File'), upload_to='staff_documents/')
    description = models.TextField(_('Description'), blank=True)
    is_confidential = models.BooleanField(_('Confidential'), default=False)
    expiry_date = models.DateField(_('Expiry Date'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('Staff Document')
        verbose_name_plural = _('Staff Documents')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.staff_member.full_name} - {self.title}"