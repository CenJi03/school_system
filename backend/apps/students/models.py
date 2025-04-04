from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from apps.core.models import TimeStampedModel, School, Term
from apps.curriculum.models import Course, Assignment

User = get_user_model()


class Student(TimeStampedModel):
    """
    Model representing student information
    """
    GENDER_CHOICES = (
        ('male', _('Male')),
        ('female', _('Female')),
        ('other', _('Other')),
    )
    
    STATUS_CHOICES = (
        ('active', _('Active')),
        ('inactive', _('Inactive')),
        ('graduated', _('Graduated')),
        ('suspended', _('Suspended')),
        ('withdrawn', _('Withdrawn')),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    student_id = models.CharField(_('Student ID'), max_length=20, unique=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='students')
    date_of_birth = models.DateField(_('Date of Birth'), null=True, blank=True)
    gender = models.CharField(_('Gender'), max_length=10, choices=GENDER_CHOICES, null=True, blank=True)
    address = models.TextField(_('Address'), blank=True)
    city = models.CharField(_('City'), max_length=100, blank=True)
    state = models.CharField(_('State/Province'), max_length=100, blank=True)
    country = models.CharField(_('Country'), max_length=100, blank=True)
    postal_code = models.CharField(_('Postal Code'), max_length=20, blank=True)
    status = models.CharField(_('Status'), max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Emergency contact info
    emergency_contact_name = models.CharField(_('Emergency Contact Name'), max_length=255, blank=True)
    emergency_contact_relationship = models.CharField(_('Relationship'), max_length=50, blank=True)
    emergency_contact_phone = models.CharField(_('Emergency Contact Phone'), max_length=20, blank=True)
    
    # Additional info
    admission_date = models.DateField(_('Admission Date'), null=True, blank=True)
    graduation_date = models.DateField(_('Graduation Date'), null=True, blank=True)
    notes = models.TextField(_('Notes'), blank=True)
    
    class Meta:
        verbose_name = _('Student')
        verbose_name_plural = _('Students')
        ordering = ['student_id']
    
    def __str__(self):
        return f"{self.student_id} - {self.user.get_full_name()}"
    
    @property
    def full_name(self):
        return self.user.get_full_name()
    
    @property
    def email(self):
        return self.user.email


class Enrollment(TimeStampedModel):
    """
    Model representing a student's enrollment in a course for a specific term
    """
    STATUS_CHOICES = (
        ('enrolled', _('Enrolled')),
        ('completed', _('Completed')),
        ('dropped', _('Dropped')),
        ('failed', _('Failed')),
        ('incomplete', _('Incomplete')),
    )
    
    GRADE_CHOICES = (
        ('A', 'A'),
        ('B', 'B'),
        ('C', 'C'),
        ('D', 'D'),
        ('F', 'F'),
        ('P', _('Pass')),
        ('NP', _('Not Pass')),
        ('I', _('Incomplete')),
        ('W', _('Withdrawn')),
        ('', _('Not Graded')),
    )
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='enrollments')
    status = models.CharField(_('Status'), max_length=20, choices=STATUS_CHOICES, default='enrolled')
    grade = models.CharField(_('Grade'), max_length=2, choices=GRADE_CHOICES, blank=True, default='')
    enrollment_date = models.DateField(_('Enrollment Date'), auto_now_add=True)
    completion_date = models.DateField(_('Completion Date'), null=True, blank=True)
    notes = models.TextField(_('Notes'), blank=True)
    
    class Meta:
        verbose_name = _('Enrollment')
        verbose_name_plural = _('Enrollments')
        ordering = ['-enrollment_date']
        unique_together = ['student', 'course', 'term']
    
    def __str__(self):
        return f"{self.student.student_id} - {self.course.code} - {self.term.name}"


class Attendance(TimeStampedModel):
    """
    Model for tracking student attendance
    """
    STATUS_CHOICES = (
        ('present', _('Present')),
        ('absent', _('Absent')),
        ('late', _('Late')),
        ('excused', _('Excused Absence')),
    )
    
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField(_('Date'))
    status = models.CharField(_('Status'), max_length=10, choices=STATUS_CHOICES)
    minutes_late = models.PositiveIntegerField(_('Minutes Late'), default=0)
    notes = models.TextField(_('Notes'), blank=True)
    
    class Meta:
        verbose_name = _('Attendance')
        verbose_name_plural = _('Attendance Records')
        ordering = ['-date']
        unique_together = ['enrollment', 'date']
    
    def __str__(self):
        return f"{self.enrollment.student.student_id} - {self.enrollment.course.code} - {self.date}"


class AssignmentSubmission(TimeStampedModel):
    """
    Model for tracking student assignment submissions
    """
    STATUS_CHOICES = (
        ('submitted', _('Submitted')),
        ('graded', _('Graded')),
        ('resubmit', _('Needs Resubmission')),
        ('late', _('Late Submission')),
    )
    
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='submissions')
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    submission_date = models.DateTimeField(_('Submission Date'), auto_now_add=True)
    file = models.FileField(_('File Submission'), upload_to='submissions/', null=True, blank=True)
    content = models.TextField(_('Content Submission'), blank=True)
    status = models.CharField(_('Status'), max_length=20, choices=STATUS_CHOICES, default='submitted')
    score = models.DecimalField(_('Score'), max_digits=5, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(_('Feedback'), blank=True)
    is_late = models.BooleanField(_('Is Late Submission'), default=False)
    
    class Meta:
        verbose_name = _('Assignment Submission')
        verbose_name_plural = _('Assignment Submissions')
        ordering = ['-submission_date']
        unique_together = ['enrollment', 'assignment']
    
    def __str__(self):
        return f"{self.enrollment.student.student_id} - {self.assignment.title}"
    
    def save(self, *args, **kwargs):
        if not self.pk:  # New submission
            # Check if submission is late
            if self.assignment.due_date and self.submission_date > self.assignment.due_date:
                self.is_late = True
        
        super().save(*args, **kwargs)


class StudentNote(TimeStampedModel):
    """
    Model for storing notes about students
    """
    NOTE_TYPE_CHOICES = (
        ('academic', _('Academic')),
        ('behavioral', _('Behavioral')),
        ('general', _('General')),
        ('medical', _('Medical')),
        ('other', _('Other')),
    )
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='student_notes')
    title = models.CharField(_('Title'), max_length=255)
    note_type = models.CharField(_('Note Type'), max_length=20, choices=NOTE_TYPE_CHOICES, default='general')
    content = models.TextField(_('Content'))
    is_private = models.BooleanField(_('Private Note'), default=False)
    
    class Meta:
        verbose_name = _('Student Note')
        verbose_name_plural = _('Student Notes')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.student.student_id} - {self.title}"