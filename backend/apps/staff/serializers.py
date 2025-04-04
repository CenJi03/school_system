from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.core.serializers import UserMinimalSerializer
from .models import (
    StaffMember,
    TeacherProfile,
    Leave,
    Performance,
    StaffDocument
)

User = get_user_model()


class StaffMemberSerializer(serializers.ModelSerializer):
    """
    Serializer for the StaffMember model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    user_details = UserMinimalSerializer(source='user', read_only=True)
    department_name = serializers.ReadOnlyField(source='department.name')
    school_name = serializers.ReadOnlyField(source='school.name')
    full_name = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    
    class Meta:
        model = StaffMember
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class TeacherProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for the TeacherProfile model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    staff_member_details = StaffMemberSerializer(source='staff_member', read_only=True)
    
    class Meta:
        model = TeacherProfile
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class LeaveSerializer(serializers.ModelSerializer):
    """
    Serializer for the Leave model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    staff_member_details = serializers.SerializerMethodField()
    approved_by_details = UserMinimalSerializer(source='approved_by', read_only=True)
    leave_type_display = serializers.CharField(source='get_leave_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Leave
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    def get_staff_member_details(self, obj):
        return {
            'id': obj.staff_member.id,
            'staff_id': obj.staff_member.staff_id,
            'full_name': obj.staff_member.full_name,
            'designation': obj.staff_member.designation
        }


class PerformanceSerializer(serializers.ModelSerializer):
    """
    Serializer for the Performance model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    staff_member_details = serializers.SerializerMethodField()
    evaluator_details = UserMinimalSerializer(source='evaluator', read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Performance
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    def get_staff_member_details(self, obj):
        return {
            'id': obj.staff_member.id,
            'staff_id': obj.staff_member.staff_id,
            'full_name': obj.staff_member.full_name,
            'designation': obj.staff_member.designation
        }


class StaffDocumentSerializer(serializers.ModelSerializer):
    """
    Serializer for the StaffDocument model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    staff_member_details = serializers.SerializerMethodField()
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    
    class Meta:
        model = StaffDocument
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    def get_staff_member_details(self, obj):
        return {
            'id': obj.staff_member.id,
            'staff_id': obj.staff_member.staff_id,
            'full_name': obj.staff_member.full_name
        }


class StaffDetailSerializer(StaffMemberSerializer):
    """
    Detailed serializer for the StaffMember model with related information
    """
    teacher_profile = TeacherProfileSerializer(read_only=True)
    leaves = LeaveSerializer(many=True, read_only=True)
    performances = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()
    
    class Meta:
        model = StaffMember
        # Use all fields from the model instead of inheriting '__all__' from parent
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    def get_performances(self, obj):
        # Limit to the most recent 5 performance evaluations
        performances = obj.performances.order_by('-evaluation_date')[:5]
        return PerformanceSerializer(performances, many=True).data
    
    def get_documents(self, obj):
        # Filter out confidential documents for non-admin users
        request = self.context.get('request')
        documents = obj.documents.all()
        
        if request and not request.user.is_staff:
            documents = documents.filter(is_confidential=False)
        
        return StaffDocumentSerializer(documents, many=True).data