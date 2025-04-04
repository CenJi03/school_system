"""
Signal handlers for the staff app
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import StaffMember, TeacherProfile

User = get_user_model()


@receiver(post_save, sender=User)
def create_staff_profile(sender, instance, created, **kwargs):
    """
    Create a staff profile when a user with type 'staff' or 'teacher' is created
    """
    if created and (instance.user_type == 'staff' or instance.user_type == 'teacher'):
        # Note: This is a basic implementation. In a real system,
        # you may want to handle school assignment and staff ID generation more carefully.
        from apps.core.models import School
        
        # Get the default school (assuming there's at least one)
        try:
            default_school = School.objects.first()
            
            # Generate a staff ID (simple implementation)
            # In a real system, this would be more sophisticated
            last_staff = StaffMember.objects.order_by('-id').first()
            new_id = 'E00001'  # Default for first staff member
            
            if last_staff:
                # Extract numeric part of last ID
                try:
                    last_id_num = int(last_staff.staff_id[1:])
                    new_id = f'E{(last_id_num + 1):05d}'
                except (ValueError, IndexError):
                    pass  # Use default if there's an error
            
            # Create staff member profile
            staff_member = StaffMember.objects.create(
                user=instance,
                staff_id=new_id,
                school=default_school,
                designation='Teacher' if instance.user_type == 'teacher' else 'Staff',
                joining_date=instance.date_joined.date(),
                created_by=instance,
                updated_by=instance
            )
            
            # If user is a teacher, create a teacher profile
            if instance.user_type == 'teacher':
                TeacherProfile.objects.create(
                    staff_member=staff_member,
                    subjects=[],
                    preferred_levels=[],
                    max_hours_per_week=40,
                    certifications=[],
                    created_by=instance,
                    updated_by=instance
                )
                
        except (School.DoesNotExist, IndexError):
            # Log this error in a real system
            pass