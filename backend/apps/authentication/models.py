from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.core.validators import RegexValidator


class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_admin_created', True)
        
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model with email as the unique identifier"""
    
    USER_TYPES = (
        ('student', _('Student')),
        ('teacher', _('Teacher')),
        ('admin', _('Administrator')),
    )
    
    username = models.CharField(_('username'), max_length=150, unique=True)
    email = models.EmailField(_('email address'), unique=True)
    user_type = models.CharField(_('user type'), max_length=10, choices=USER_TYPES, default='student')
    
    # Authentication fields
    is_active = models.BooleanField(
        _('active'),
        default=True,
        help_text=_('Designates whether this user should be treated as active.'),
    )
    is_superuser = models.BooleanField(
        _('superuser status'),
        default=False,
        help_text=_('Designates that this user has all permissions without explicitly assigning them.'),
    )
    is_admin_created = models.BooleanField(
        _('admin created'),
        default=False,
        help_text=_('Designates whether this user was created by an admin.')
    )
    
    # Profile fields
    profile_picture = models.ImageField(_('profile picture'), upload_to='profile_pictures/', null=True, blank=True)
    phone_number = models.CharField(_('phone number'), max_length=15, blank=True)
    address = models.TextField(_('address'), blank=True)
    
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
    
    # Set the manager
    objects = UserManager()
    
    # Required fields
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
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
        if hasattr(self, 'first_name') and self.first_name:
            return self.first_name
        return self.username
    
    def __str__(self):
        return self.email
    
    @property
    def is_staff(self):
        return self.is_superuser


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