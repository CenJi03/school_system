from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.core.serializers import UserMinimalSerializer
from .models import (
    Course,
    CourseMaterial,
    Lesson,
    ClassSchedule,
    Assignment,
    Syllabus
)

User = get_user_model()


class CourseSerializer(serializers.ModelSerializer):
    """
    Serializer for the Course model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    department_name = serializers.ReadOnlyField(source='department.name')
    prerequisites_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    def get_prerequisites_details(self, obj):
        return [
            {'id': course.id, 'code': course.code, 'name': course.name}
            for course in obj.prerequisites.all()
        ]


class CourseMaterialSerializer(serializers.ModelSerializer):
    """
    Serializer for the CourseMaterial model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    course_details = serializers.SerializerMethodField()
    
    class Meta:
        model = CourseMaterial
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    def get_course_details(self, obj):
        return {
            'id': obj.course.id,
            'code': obj.course.code,
            'name': obj.course.name
        }


class LessonSerializer(serializers.ModelSerializer):
    """
    Serializer for the Lesson model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    course_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Lesson
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    def get_course_details(self, obj):
        return {
            'id': obj.course.id,
            'code': obj.course.code,
            'name': obj.course.name
        }


class ClassScheduleSerializer(serializers.ModelSerializer):
    """
    Serializer for the ClassSchedule model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    teacher_details = UserMinimalSerializer(source='teacher', read_only=True)
    course_details = serializers.SerializerMethodField()
    term_details = serializers.SerializerMethodField()
    day_of_week_display = serializers.SerializerMethodField()
    
    class Meta:
        model = ClassSchedule
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    def get_course_details(self, obj):
        return {
            'id': obj.course.id,
            'code': obj.course.code,
            'name': obj.course.name
        }
    
    def get_term_details(self, obj):
        return {
            'id': obj.term.id,
            'name': obj.term.name,
            'start_date': obj.term.start_date,
            'end_date': obj.term.end_date
        }
    
    def get_day_of_week_display(self, obj):
        return obj.get_day_of_week_display()


class AssignmentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Assignment model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    course_details = serializers.SerializerMethodField()
    assignment_type_display = serializers.CharField(source='get_assignment_type_display', read_only=True)
    
    class Meta:
        model = Assignment
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    def get_course_details(self, obj):
        return {
            'id': obj.course.id,
            'code': obj.course.code,
            'name': obj.course.name
        }


class SyllabusSerializer(serializers.ModelSerializer):
    """
    Serializer for the Syllabus model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    course_details = serializers.SerializerMethodField()
    term_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Syllabus
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    def get_course_details(self, obj):
        return {
            'id': obj.course.id,
            'code': obj.course.code,
            'name': obj.course.name
        }
    
    def get_term_details(self, obj):
        return {
            'id': obj.term.id,
            'name': obj.term.name,
            'start_date': obj.term.start_date,
            'end_date': obj.term.end_date
        }