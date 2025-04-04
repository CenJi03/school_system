from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from apps.core.models import TimeStampedModel, Department, School, Term

User = get_user_model()


class Course(TimeStampedModel):
    """
    Model representing a course in the curriculum
    """
    LEVEL_CHOICES = (
        ('beginner', _('Beginner')),
        ('intermediate', _('Intermediate')),
        ('advanced', _('Advanced')),
    )
    
    code = models.CharField(_('Course Code'), max_length=20, unique=True)
    name = models.CharField(_('Course Name'), max_length=255)
    description = models.TextField(_('Description'), blank=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='courses')
    level = models.CharField(_('Level'), max_length=15, choices=LEVEL_CHOICES, default='beginner')
    credits = models.PositiveSmallIntegerField(_('Credits'), default=3)
    is_active = models.BooleanField(_('Active'), default=True)
    
    # Additional fields
    prerequisites = models.ManyToManyField(
        'self', 
        symmetrical=False, 
        blank=True,
        related_name='is_prerequisite_for'
    )
    
    class Meta:
        verbose_name = _('Course')
        verbose_name_plural = _('Courses')
        ordering = ['department', 'code']
        
    def __str__(self):
        return f"{self.code} - {self.name}"


class CourseMaterial(TimeStampedModel):
    """
    Model representing learning materials for a course
    """
    MATERIAL_TYPE_CHOICES = (
        ('textbook', _('Textbook')),
        ('handout', _('Handout')),
        ('presentation', _('Presentation')),
        ('video', _('Video')),
        ('audio', _('Audio')),
        ('quiz', _('Quiz')),
        ('assignment', _('Assignment')),
        ('other', _('Other')),
    )
    
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='materials')
    title = models.CharField(_('Title'), max_length=255)
    description = models.TextField(_('Description'), blank=True)
    material_type = models.CharField(_('Material Type'), max_length=20, choices=MATERIAL_TYPE_CHOICES)
    file = models.FileField(_('File'), upload_to='course_materials/', null=True, blank=True)
    url = models.URLField(_('URL'), max_length=1000, null=True, blank=True)
    is_active = models.BooleanField(_('Active'), default=True)
    
    class Meta:
        verbose_name = _('Course Material')
        verbose_name_plural = _('Course Materials')
        ordering = ['course', 'title']
        
    def __str__(self):
        return f"{self.course.code} - {self.title}"


class Lesson(TimeStampedModel):
    """
    Model representing a lesson within a course
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(_('Title'), max_length=255)
    description = models.TextField(_('Description'), blank=True)
    content = models.TextField(_('Content'), blank=True)
    order = models.PositiveIntegerField(_('Order'), default=1)
    is_active = models.BooleanField(_('Active'), default=True)
    
    class Meta:
        verbose_name = _('Lesson')
        verbose_name_plural = _('Lessons')
        ordering = ['course', 'order', 'title']
        
    def __str__(self):
        return f"{self.course.code} - Lesson {self.order}: {self.title}"


class ClassSchedule(TimeStampedModel):
    """
    Model representing a scheduled class session
    """
    DAY_CHOICES = (
        (0, _('Monday')),
        (1, _('Tuesday')),
        (2, _('Wednesday')),
        (3, _('Thursday')),
        (4, _('Friday')),
        (5, _('Saturday')),
        (6, _('Sunday')),
    )
    
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='schedules')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='schedules')
    teacher = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='teaching_schedules'
    )
    room = models.CharField(_('Room/Location'), max_length=50, blank=True)
    day_of_week = models.IntegerField(_('Day of Week'), choices=DAY_CHOICES)
    start_time = models.TimeField(_('Start Time'))
    end_time = models.TimeField(_('End Time'))
    is_active = models.BooleanField(_('Active'), default=True)
    
    class Meta:
        verbose_name = _('Class Schedule')
        verbose_name_plural = _('Class Schedules')
        ordering = ['term', 'day_of_week', 'start_time']
        
    def __str__(self):
        day_name = dict(self.DAY_CHOICES)[self.day_of_week]
        return f"{self.course.code} - {day_name} {self.start_time.strftime('%H:%M')} to {self.end_time.strftime('%H:%M')}"


class Assignment(TimeStampedModel):
    """
    Model representing a course assignment
    """
    ASSIGNMENT_TYPE_CHOICES = (
        ('homework', _('Homework')),
        ('quiz', _('Quiz')),
        ('project', _('Project')),
        ('exam', _('Exam')),
        ('other', _('Other')),
    )
    
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(_('Title'), max_length=255)
    description = models.TextField(_('Description'), blank=True)
    assignment_type = models.CharField(_('Assignment Type'), max_length=20, choices=ASSIGNMENT_TYPE_CHOICES)
    due_date = models.DateTimeField(_('Due Date'))
    points = models.PositiveIntegerField(_('Total Points'), default=100)
    file_attachment = models.FileField(_('File Attachment'), upload_to='assignments/', null=True, blank=True)
    is_active = models.BooleanField(_('Active'), default=True)
    
    class Meta:
        verbose_name = _('Assignment')
        verbose_name_plural = _('Assignments')
        ordering = ['course', 'due_date']
        
    def __str__(self):
        return f"{self.course.code} - {self.title}"


class Syllabus(TimeStampedModel):
    """
    Model representing a course syllabus
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='syllabi')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='syllabi')
    title = models.CharField(_('Title'), max_length=255)
    description = models.TextField(_('Description'), blank=True)
    content = models.TextField(_('Content'))
    file = models.FileField(_('File'), upload_to='syllabi/', null=True, blank=True)
    is_active = models.BooleanField(_('Active'), default=True)
    
    class Meta:
        verbose_name = _('Syllabus')
        verbose_name_plural = _('Syllabi')
        ordering = ['course', 'term']
        unique_together = ['course', 'term']
        
    def __str__(self):
        return f"{self.course.code} - {self.term} Syllabus"