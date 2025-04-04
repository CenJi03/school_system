from django.db.models.signals import post_save, m2m_changed, pre_save
from django.dispatch import receiver
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model

from .models import (
    CourseEnrollment, LessonCompletion, Assessment, AssessmentSubmission
)
from apps.core.models import SystemNotification, AuditLog

User = get_user_model()


@receiver(post_save, sender=CourseEnrollment)
def notify_enrollment(sender, instance, created, **kwargs):
    """
    Signal that sends a notification when a student enrolls in a course
    """
    if created:
        # Create notification for the student
        SystemNotification.objects.create(
            user=instance.student,
            title="Course Enrollment",
            message=f"You have been enrolled in {instance.course.name}. You can start learning now!",
            link=f"/courses/{instance.course.id}"
        )
        
        # Log the enrollment in the audit log
        AuditLog.objects.create(
            user=instance.student,
            action="ENROLLMENT_CREATED",
            model_name="CourseEnrollment",
            instance_id=str(instance.id),
            changes={
                "course": instance.course.name,
                "enrollment_date": instance.enrollment_date.isoformat()
            }
        )


@receiver(post_save, sender=LessonCompletion)
def update_course_progress(sender, instance, created, **kwargs):
    """
    Signal that updates course completion status when all lessons are completed
    """
    if created:
        enrollment = instance.enrollment
        course = enrollment.course
        
        # Count completed lessons
        completed_lessons = LessonCompletion.objects.filter(enrollment=enrollment).count()
        total_lessons = course.lessons.count()
        
        # If all lessons are completed, mark the course as completed
        if completed_lessons == total_lessons and total_lessons > 0:
            enrollment.status = 'completed'
            enrollment.completion_date = timezone.now()
            enrollment.save()
            
            # Create notification
            SystemNotification.objects.create(
                user=enrollment.student,
                title="Course Completed",
                message=f"Congratulations! You have completed the course '{course.name}'.",
                link=f"/courses/{course.id}"
            )
            
            # Log in audit log
            AuditLog.objects.create(
                user=enrollment.student,
                action="COURSE_COMPLETED",
                model_name="CourseEnrollment",
                instance_id=str(enrollment.id),
                changes={
                    "course": course.name,
                    "completion_date": enrollment.completion_date.isoformat()
                }
            )


@receiver(post_save, sender=AssessmentSubmission)
def notify_assessment_submission(sender, instance, created, **kwargs):
    """
    Signal that sends notifications when an assessment is submitted or graded
    """
    if created:
        # Notify student of submission
        SystemNotification.objects.create(
            user=instance.enrollment.student,
            title="Assessment Submitted",
            message=f"Your submission for '{instance.assessment.title}' has been received.",
            link=f"/courses/{instance.assessment.course.id}/assessments/{instance.assessment.id}"
        )
        
        # Notify teachers (if it needs manual grading)
        assessment = instance.assessment
        if instance.score is None:
            # Get teachers for this course
            teachers = User.objects.filter(user_type='teacher')
            
            for teacher in teachers:
                SystemNotification.objects.create(
                    user=teacher,
                    title="Assessment Needs Grading",
                    message=f"A new submission for '{assessment.title}' needs grading.",
                    link=f"/admin/submissions/{instance.id}"
                )
    
    # If the submission has been graded
    elif instance.graded_date and instance.score is not None:
        # Notify student of grading
        SystemNotification.objects.create(
            user=instance.enrollment.student,
            title="Assessment Graded",
            message=f"Your submission for '{instance.assessment.title}' has been graded. Your score: {instance.score}/{instance.assessment.total_points}.",
            link=f"/courses/{instance.assessment.course.id}/assessments/{instance.assessment.id}"
        )


@receiver(pre_save, sender=Assessment)
def validate_total_points(sender, instance, **kwargs):
    """
    Signal that ensures the assessment's total points matches the sum of its questions
    """
    # Only run if the assessment already exists (has questions)
    if instance.pk:
        with transaction.atomic():
            questions = instance.questions.all()
            if questions.exists():
                total_question_points = sum(q.points for q in questions)
                if total_question_points != instance.total_points:
                    instance.total_points = total_question_points