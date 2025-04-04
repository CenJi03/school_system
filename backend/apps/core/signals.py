from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Notification, AuditLog

User = get_user_model()


@receiver(post_save, sender=Notification)
def log_notification_creation(sender, instance, created, **kwargs):
    """
    Log when a notification is created
    """
    if created:
        # Create audit log entry
        AuditLog.objects.create(
            user=instance.created_by,
            action="NOTIFICATION_CREATED",
            model_name="Notification",
            instance_id=str(instance.id),
            changes={
                "title": instance.title,
                "user": instance.user.email if instance.user else None,
                "notification_type": instance.notification_type
            }
        )
