from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.core.validators import RegexValidator


class User(AbstractUser):
    """Custom User model with email as the unique identifier"""
    
    USER_TYPE_CHOICES = (
        ('admin', _('Administrator')),
        ('teacher', _('Teacher')),
        ('student', _('Student')),
        ('parent', _('Parent')),
        ('staff', _('Staff')),
    )
    
    # AbstractUser already has username, first_name, last_name, is_active, is_staff, and last_login
    
    # Make email required and unique
    email = models.EmailField(_('email address'), unique=True)
    
    # Profile fields
    profile_picture = models.ImageField(_('profile picture'), upload_to='profile_pictures/', null=True, blank=True)
    phone_number = models.CharField(_('phone number'), max_length=15, blank=True)
    address = models.TextField(_('address'), blank=True)
    user_type = models.CharField(_('user type'), max_length=50, choices=USER_TYPE_CHOICES, default='standard')
    
    # Security fields
    failed_login_attempts = models.IntegerField(default=0)
    last_failed_login = models.DateTimeField(null=True, blank=True)
    
    # Password reset fields
    reset_password_token = models.CharField(max_length=100, null=True, blank=True)
    reset_password_expires = models.DateTimeField(null=True, blank=True)
    
    # Additional login tracking
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    last_login_user_agent = models.TextField(blank=True, null=True)
    
    # Email verification
    email_verification_token = models.CharField(max_length=100, null=True, blank=True)
    
    # AbstractUser already provides a default UserManager
    
    # Keep email as the USERNAME_FIELD if you want to login with email
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']  # Username is still required when creating a user
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['username']
    
    def get_full_name(self):
        """Return the full name of the user."""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.email
    
    def get_short_name(self):
        """Return the short name of the user."""
        return self.first_name if self.first_name else self.username


class UserActivity(models.Model):
    """Model to track user activities"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    action = models.CharField(max_length=50)  # Changed from activity_type to action
    details = models.TextField(blank=True)  # Add blank=True to make it optional
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('user activity')
        verbose_name_plural = _('user activities')
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user.email} - {self.action} - {self.timestamp}"