from rest_framework import permissions

from .models import CourseEnrollment, Assessment, AssessmentSubmission


class IsTeacherOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow teachers to create/edit content but others can only read.
    """
    def has_permission(self, request, view):
        # Always allow GET, HEAD or OPTIONS requests
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to teachers or admins
        return request.user.is_authenticated and (
            request.user.user_type == 'teacher' or request.user.is_staff
        )


class IsEnrolledInCourse(permissions.BasePermission):
    """
    Custom permission to only allow students enrolled in a course to access it.
    """
    def has_object_permission(self, request, view, obj):
        # Staff can always access
        if request.user.is_staff:
            return True
        
        # Check if obj is a course or has a course attribute
        if hasattr(obj, 'course'):
            course = obj.course
        else:
            course = obj
        
        # Check if user is enrolled in the course
        return request.user.is_authenticated and CourseEnrollment.objects.filter(
            student=request.user,
            course=course
        ).exists()


class CanSubmitAssessment(permissions.BasePermission):
    """
    Custom permission to check if a user can submit an assessment.
    """
    def has_object_permission(self, request, view, obj):
        # Obj should be an Assessment
        if not isinstance(obj, Assessment):
            return False
        
        # Staff can always access
        if request.user.is_staff:
            return True
        
        # Check if user is enrolled in the course
        try:
            enrollment = CourseEnrollment.objects.get(
                student=request.user,
                course=obj.course
            )
        except CourseEnrollment.DoesNotExist:
            return False
        
        # Check if multiple attempts are allowed
        submissions_count = AssessmentSubmission.objects.filter(
            enrollment=enrollment,
            assessment=obj
        ).count()
        
        if submissions_count > 0 and not obj.allow_multiple_attempts:
            return False
        
        # Check if max attempts reached
        if submissions_count >= obj.max_attempts:
            return False
        
        return True


class IsTeacherForCourse(permissions.BasePermission):
    """
    Custom permission to allow only teachers assigned to a course to grade assessments.
    """
    def has_object_permission(self, request, view, obj):
        # Staff can always access
        if request.user.is_staff:
            return True
        
        # Only teachers can grade
        if request.user.user_type != 'teacher':
            return False
        
        # In a real system, you would check if the teacher is assigned to the course
        # For this example, we'll allow any teacher to grade
        return True