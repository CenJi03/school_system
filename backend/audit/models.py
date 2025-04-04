from django.db import models
from django.utils import timezone
from django.conf import settings

class ActivityLog(models.Model):
    user = models.ForeignKey('authentication.User', on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=50)  # Ensure this is consistent
    timestamp = models.DateTimeField(default=timezone.now)
    ip_address = models.CharField(max_length=50)
    user_agent = models.TextField(blank=True, null=True)
    details = models.TextField(blank=True, null=True)  # Match the field name used in views
    
    def __str__(self):
        return f"{self.action} - {self.timestamp}"
    
    class Meta:
        verbose_name = "Activity Log"
        verbose_name_plural = "Activity Logs"

class SecurityAlert(models.Model):
    """Model to track security alerts"""
    
    SEVERITY_CHOICES = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    )
    
    STATUS_CHOICES = (
        ('NEW', 'New'),
        ('ACKNOWLEDGED', 'Acknowledged'),
        ('RESOLVED', 'Resolved'),
        ('FALSE_POSITIVE', 'False Positive'),
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='security_alerts'
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=100)
    details = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='NEW')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_alerts'
    )
    resolution_note = models.TextField(null=True, blank=True)
    resolution_timestamp = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Security Alert'
        verbose_name_plural = 'Security Alerts'
    
    def __str__(self):
        return f"{self.type} alert for {self.user.email} - {self.severity}"