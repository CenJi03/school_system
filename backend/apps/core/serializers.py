from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    School,
    SchoolYear,
    Term,
    Department,
    SystemSetting,
    Notification
)

User = get_user_model()


class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name')


class SchoolSerializer(serializers.ModelSerializer):
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    
    class Meta:
        model = School
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class SchoolYearSerializer(serializers.ModelSerializer):
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    school_name = serializers.ReadOnlyField(source='school.name')
    
    class Meta:
        model = SchoolYear
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class TermSerializer(serializers.ModelSerializer):
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    school_year_name = serializers.ReadOnlyField(source='school_year.name')
    
    class Meta:
        model = Term
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class DepartmentSerializer(serializers.ModelSerializer):
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    school_name = serializers.ReadOnlyField(source='school.name')
    head_details = UserMinimalSerializer(source='head', read_only=True)
    
    class Meta:
        model = Department
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class SystemSettingSerializer(serializers.ModelSerializer):
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    
    class Meta:
        model = SystemSetting
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class NotificationSerializer(serializers.ModelSerializer):
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')