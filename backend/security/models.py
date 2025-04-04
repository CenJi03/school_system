from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class BlockedIP(models.Model):
    """Model to store blocked IP addresses"""
    ip_address = models.GenericIPAddressField(unique=True, verbose_name="IP Address")
    reason = models.TextField(blank=True, null=True)
    blocked_at = models.DateTimeField(auto_now_add=True)
    blocked_until = models.DateTimeField(null=True, blank=True)
    is_permanent = models.BooleanField(default=False)
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='created_ip_blocks',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    class Meta:
        verbose_name = "Blocked IP"
        verbose_name_plural = "Blocked IPs"
        ordering = ['-blocked_at']
    
    def __str__(self):
        return self.ip_address
    
    @property
    def is_active(self):
        """Check if the block is currently active"""
        if self.is_permanent:
            return True
        if self.blocked_until and self.blocked_until > timezone.now():
            return True
        return False


class SecuritySetting(models.Model):
    """Model to store security-related settings"""
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Security Setting"
        verbose_name_plural = "Security Settings"
        ordering = ['key']
    
    def __str__(self):
        return self.key


class SecurityLog(models.Model):
    """Model to store security-related events"""
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    EVENT_TYPES = [
        ('auth_failure', 'Authentication Failure'),
        ('auth_success', 'Authentication Success'),
        ('ip_blocked', 'IP Blocked'),
        ('suspicious_activity', 'Suspicious Activity'),
        ('permission_denied', 'Permission Denied'),
        ('rate_limited', 'Rate Limited'),
        ('other', 'Other'),
    ]
    
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, 
        blank=True,
        on_delete=models.SET_NULL
    )
    user_agent = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    additional_data = models.JSONField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Security Log"
        verbose_name_plural = "Security Logs"
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.get_event_type_display()} at {self.timestamp}"


class UserSecurityProfile(models.Model):
    """Model to store user-specific security settings"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='security_profile'
    )
    two_factor_enabled = models.BooleanField(default=False)
    last_password_change = models.DateTimeField(null=True, blank=True)
    last_security_review = models.DateTimeField(null=True, blank=True)
    last_login = models.DateTimeField(null=True, blank=True)
    failed_login_attempts = models.PositiveIntegerField(default=0)
    account_locked = models.BooleanField(default=False)
    lock_reason = models.TextField(blank=True)
    locked_until = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = _("User Security Profile")
        verbose_name_plural = _("User Security Profiles")
    
    def __str__(self):
        return f"Security profile for {self.user.email}"
    
    def reset_failed_attempts(self):
        """Reset failed login attempts counter"""
        self.failed_login_attempts = 0
        self.save(update_fields=['failed_login_attempts'])
    
    def increment_failed_attempts(self):
        """Increment failed login attempts and lock account if necessary"""
        self.failed_login_attempts += 1
        
        # Check if account should be locked (threshold configurable via settings)
        from django.conf import settings
        threshold = getattr(settings, 'MAX_LOGIN_ATTEMPTS', 5)
        
        if self.failed_login_attempts >= threshold:
            self.account_locked = True
            self.lock_reason = f"Exceeded maximum failed login attempts ({threshold})"
            # Lock for 30 minutes by default
            self.locked_until = timezone.now() + timezone.timedelta(minutes=30)
        
        self.save()
        
    def is_locked(self):
        """Check if the account is currently locked"""
        if not self.account_locked:
            return False
        
        # Check if lock has expired
        if self.locked_until and timezone.now() > self.locked_until:
            self.account_locked = False
            self.locked_until = None
            self.failed_login_attempts = 0
            self.save()
            return False
            
        return True
