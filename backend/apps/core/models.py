from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model

User = get_user_model()


class TimeStampedModel(models.Model):
    """
    An abstract base class model that provides self-updating
    created_at, updated_at, created_by and updated_by fields.
    """
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='%(class)s_created',
        verbose_name=_('Created By')
    )
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='%(class)s_updated',
        verbose_name=_('Updated By')
    )

    class Meta:
        abstract = True


class School(TimeStampedModel):
    """
    Model representing a school
    """
    name = models.CharField(_('School Name'), max_length=255)
    code = models.CharField(_('School Code'), max_length=50, unique=True)
    logo = models.ImageField(_('Logo'), upload_to='school_logos/', null=True, blank=True)
    
    # Contact Information
    address = models.TextField(_('Address'))
    city = models.CharField(_('City'), max_length=100)
    state = models.CharField(_('State/Province'), max_length=100)
    country = models.CharField(_('Country'), max_length=100)
    postal_code = models.CharField(_('Postal Code'), max_length=20)
    phone = models.CharField(_('Phone'), max_length=20)
    email = models.EmailField(_('Email'))
    website = models.URLField(_('Website'), max_length=200, blank=True)
    
    # Additional Information
    established_date = models.DateField(_('Established Date'), null=True, blank=True)
    description = models.TextField(_('Description'), blank=True)
    mission = models.TextField(_('Mission'), blank=True)
    vision = models.TextField(_('Vision'), blank=True)
    
    is_active = models.BooleanField(_('Active'), default=True)
    
    class Meta:
        verbose_name = _('School')
        verbose_name_plural = _('Schools')
        ordering = ['name']
    
    def __str__(self):
        return self.name


class SchoolYear(TimeStampedModel):
    """
    Model representing a school year
    """
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='school_years')
    name = models.CharField(_('School Year'), max_length=50)
    start_date = models.DateField(_('Start Date'))
    end_date = models.DateField(_('End Date'))
    description = models.TextField(_('Description'), blank=True)
    is_active = models.BooleanField(_('Active'), default=True)
    
    class Meta:
        verbose_name = _('School Year')
        verbose_name_plural = _('School Years')
        ordering = ['-start_date']
        unique_together = ['school', 'name']
    
    def __str__(self):
        return f"{self.school} - {self.name}"


class Term(TimeStampedModel):
    """
    Model representing a term/semester
    """
    TERM_TYPE_CHOICES = (
        ('semester', _('Semester')),
        ('trimester', _('Trimester')),
        ('quarter', _('Quarter')),
    )
    
    school_year = models.ForeignKey(SchoolYear, on_delete=models.CASCADE, related_name='terms')
    name = models.CharField(_('Term Name'), max_length=50)
    term_type = models.CharField(_('Term Type'), max_length=20, choices=TERM_TYPE_CHOICES)
    start_date = models.DateField(_('Start Date'))
    end_date = models.DateField(_('End Date'))
    description = models.TextField(_('Description'), blank=True)
    is_active = models.BooleanField(_('Active'), default=True)
    
    class Meta:
        verbose_name = _('Term')
        verbose_name_plural = _('Terms')
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.school_year.name} - {self.name}"


class Department(TimeStampedModel):
    """
    Model representing a department in the school
    """
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(_('Department Name'), max_length=100)
    code = models.CharField(_('Department Code'), max_length=20)
    description = models.TextField(_('Description'), blank=True)
    head = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='headed_departments'
    )
    is_active = models.BooleanField(_('Active'), default=True)
    
    class Meta:
        verbose_name = _('Department')
        verbose_name_plural = _('Departments')
        ordering = ['name']
        unique_together = ['school', 'code']
    
    def __str__(self):
        return f"{self.school} - {self.name}"


class SystemSetting(TimeStampedModel):
    """
    Model for storing system-wide settings
    """
    key = models.CharField(_('Key'), max_length=50, unique=True)
    value = models.TextField(_('Value'))
    description = models.TextField(_('Description'), blank=True)
    
    class Meta:
        verbose_name = _('System Setting')
        verbose_name_plural = _('System Settings')
        ordering = ['key']
    
    def __str__(self):
        return self.key


class Notification(TimeStampedModel):
    """
    Model for storing notifications for users
    """
    NOTIFICATION_TYPE_CHOICES = (
        ('info', _('Information')),
        ('success', _('Success')),
        ('warning', _('Warning')),
        ('error', _('Error')),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(_('Title'), max_length=255)
    message = models.TextField(_('Message'))
    link = models.CharField(_('Link'), max_length=255, blank=True)
    notification_type = models.CharField(
        _('Notification Type'),
        max_length=20,
        choices=NOTIFICATION_TYPE_CHOICES,
        default='info'
    )
    is_read = models.BooleanField(_('Read'), default=False)
    read_at = models.DateTimeField(_('Read At'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('Notification')
        verbose_name_plural = _('Notifications')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.title} ({self.created_at})"


class AuditLog(models.Model):
    """
    Model to track audit logs for actions in the system
    """
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action = models.CharField(_('Action'), max_length=50)
    model_name = models.CharField(_('Model'), max_length=50)
    instance_id = models.CharField(_('Instance ID'), max_length=50)
    changes = models.JSONField(_('Changes'), default=dict)
    timestamp = models.DateTimeField(_('Timestamp'), auto_now_add=True)
    ip_address = models.GenericIPAddressField(_('IP Address'), null=True, blank=True)
    user_agent = models.TextField(_('User Agent'), blank=True)
    
    class Meta:
        verbose_name = _('Audit Log')
        verbose_name_plural = _('Audit Logs')
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user} - {self.action} - {self.model_name} - {self.timestamp}"
