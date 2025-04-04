from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import user_logged_in, user_logged_out, user_login_failed
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.cache import cache

from .models import UserSecurityProfile, BlockedIP

User = get_user_model()

@receiver(post_save, sender=User)
def create_security_profile(sender, instance, created, **kwargs):
    """Create a security profile when a new user is created"""
    if created:
        UserSecurityProfile.objects.create(user=instance)

@receiver(user_logged_in)
def on_user_login(sender, request, user, **kwargs):
    """Handle successful login"""
    if hasattr(user, 'security_profile'):
        # Reset failed login attempts and update last login time
        security_profile = user.security_profile
        security_profile.failed_login_attempts = 0
        security_profile.last_login = timezone.now()
        security_profile.save(update_fields=['failed_login_attempts'])

@receiver(user_login_failed)
def on_user_login_failed(sender, credentials, request, **kwargs):
    """Handle failed login attempt"""
    username = credentials.get('username', '')
    
    try:
        user = User.objects.get(username=username)
        if hasattr(user, 'security_profile'):
            # Increment failed login attempts and record the timestamp
            security_profile = user.security_profile
            security_profile.increment_failed_attempts()
            security_profile.last_failed_login = timezone.now()
            security_profile.save(update_fields=['failed_login_attempts', 'last_failed_login'])
    except User.DoesNotExist:
        # User doesn't exist, but we won't give that information away
        pass

@receiver(post_save, sender=BlockedIP)
def update_blocked_ip_cache(sender, instance, **kwargs):
    """
    Update the cache when a BlockedIP instance is created or updated
    """
    cache_key = f"blocked_ip_{instance.ip_address}"
    # Cache the blocked status for quick lookups
    if instance.is_active:
        cache.set(cache_key, True, timeout=86400)  # Cache for 24 hours
    else:
        # If no longer blocked, delete from cache
        cache.delete(cache_key)
