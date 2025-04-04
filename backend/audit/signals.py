from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import user_logged_in, user_logged_out, user_login_failed
from django.utils import timezone
from django.db import connection

from .models import ActivityLog, SecurityAlert

def table_exists(table_name):
    """Check if a table exists in the database"""
    with connection.cursor() as cursor:
        tables = connection.introspection.table_names()
        return table_name in tables

@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    """Log successful login"""
    if request and table_exists('audit_activitylog'):
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        ActivityLog.objects.create(
            user=user,
            action='LOGIN',
            ip_address=ip_address,
            user_agent=user_agent,
            details=f"User {user.email} logged in"
        )

@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    """Log user logout"""
    if request and user and table_exists('audit_activitylog'):
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        ActivityLog.objects.create(
            user=user,
            action='LOGOUT',
            ip_address=ip_address,
            user_agent=user_agent,
            details=f"User {user.email} logged out"
        )

@receiver(user_login_failed)
def log_user_login_failed(sender, credentials, request, **kwargs):
    """Log failed login attempts"""
    if request and table_exists('audit_activitylog'):
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Extract username from credentials
        username = credentials.get('username', credentials.get('email', 'unknown'))
        
        ActivityLog.objects.create(
            user=None,
            action='LOGIN_FAILED',
            ip_address=ip_address,
            user_agent=user_agent,
            details=f"Failed login attempt for {username}"
        )
        
        # Check for multiple failed attempts from same IP
        if table_exists('audit_securityalert'):
            recent_failed_attempts = ActivityLog.objects.filter(
                action='LOGIN_FAILED',
                ip_address=ip_address,
                timestamp__gte=timezone.now() - timezone.timedelta(hours=1)
            ).count()
            
            # Create a security alert if there are too many failed attempts
            if recent_failed_attempts >= 5:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                
                try:
                    user = User.objects.get(email=username)
                    
                    # Create security alert
                    SecurityAlert.objects.create(
                        user=user,
                        type='MULTIPLE_FAILED_LOGINS',
                        details=f"{recent_failed_attempts} failed login attempts in the last hour from IP {ip_address}",
                        severity='MEDIUM',
                        ip_address=ip_address
                    )
                except User.DoesNotExist:
                    # User doesn't exist, but we still want to track this
                    pass

def get_client_ip(request):
    """Helper function to get client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip