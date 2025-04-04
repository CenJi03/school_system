"""
Signal handlers for the students app
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Student

User = get_user_model()


@receiver(post_save, sender=User)
def create_student_profile(sender, instance, created, **kwargs):
    """
    Create a student profile when a user with type 'student' is created
    """
    if created and instance.user_type == 'student':
        # Note: This is a basic implementation. In a real system,
        # you may want to handle school assignment and student ID generation more carefully.
        from apps.core.models import School
        
        # Get the default school (assuming there's at least one)
        try:
            default_school = School.objects.first()
            
            # Generate a student ID (simple implementation)
            # In a real system, this would be more sophisticated
            last_student = Student.objects.order_by('-id').first()
            new_id = 'S00001'  # Default for first student
            
            if last_student:
                # Extract numeric part of last ID
                try:
                    last_id_num = int(last_student.student_id[1:])
                    new_id = f'S{(last_id_num + 1):05d}'
                except (ValueError, IndexError):
                    pass  # Use default if there's an error
            
            Student.objects.create(
                user=instance,
                student_id=new_id,
                school=default_school,
                created_by=instance,
                updated_by=instance
            )
        except (School.DoesNotExist, IndexError):
            # Log this error in a real system
            pass