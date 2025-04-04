from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.core.serializers import UserMinimalSerializer
from apps.curriculum.serializers import CourseSerializer
from .models import (
    Student,
    Enrollment,
    Attendance,
    AssignmentSubmission,
    StudentNote
)

User = get_user_model()


class StudentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Student model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    user_details = UserMinimalSerializer(source='user', read_only=True)
    full_name = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    
    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class StudentDetailSerializer(StudentSerializer):
    """
    Detailed serializer for the Student model
    """
    
    class Meta(StudentSerializer.Meta):
        pass
    
    def to_representation(self, instance):
        """
        Add enrollment count and other summary data
        """
        representation = super().to_representation(instance)
        
        # Get enrollment counts
        active_enrollments = Enrollment.objects.filter(
            student=instance,
            status='enrolled'
        ).count()
        
        completed_enrollments = Enrollment.objects.filter(
            student=instance,
            status='completed'
        ).count()
        
        # Add to representation
        representation['active_enrollments'] = active_enrollments
        representation['completed_enrollments'] = completed_enrollments
        
        return representation


class EnrollmentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Enrollment model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    student_details = StudentSerializer(source='student', read_only=True)
    course_details = CourseSerializer(source='course', read_only=True)
    
    class Meta:
        model = Enrollment
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by', 'enrollment_date')


class AttendanceSerializer(serializers.ModelSerializer):
    """
    Serializer for the Attendance model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    enrollment_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    def get_enrollment_details(self, obj):
        return {
            'id': obj.enrollment.id,
            'student': {
                'id': obj.enrollment.student.id,
                'student_id': obj.enrollment.student.student_id,
                'full_name': obj.enrollment.student.full_name
            },
            'course': {
                'id': obj.enrollment.course.id,
                'code': obj.enrollment.course.code,
                'name': obj.enrollment.course.name
            }
        }


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    """
    Serializer for the AssignmentSubmission model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    enrollment_details = serializers.SerializerMethodField()
    assignment_details = serializers.SerializerMethodField()
    
    class Meta:
        model = AssignmentSubmission
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by', 'submission_date', 'is_late')
    
    def get_enrollment_details(self, obj):
        return {
            'id': obj.enrollment.id,
            'student': {
                'id': obj.enrollment.student.id,
                'student_id': obj.enrollment.student.student_id,
                'full_name': obj.enrollment.student.full_name
            },
            'course': {
                'id': obj.enrollment.course.id,
                'code': obj.enrollment.course.code,
                'name': obj.enrollment.course.name
            }
        }
    
    def get_assignment_details(self, obj):
        return {
            'id': obj.assignment.id,
            'title': obj.assignment.title,
            'due_date': obj.assignment.due_date,
            'points': obj.assignment.points
        }


class StudentNoteSerializer(serializers.ModelSerializer):
    """
    Serializer for the StudentNote model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    student_details = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentNote
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    def get_student_details(self, obj):
        return {
            'id': obj.student.id,
            'student_id': obj.student.student_id,
            'full_name': obj.student.full_name
        }