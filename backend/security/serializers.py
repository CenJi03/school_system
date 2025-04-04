from rest_framework import serializers
from .models import BlockedIP, SecuritySetting, SecurityLog, UserSecurityProfile


class BlockedIPSerializer(serializers.ModelSerializer):
    """Serializer for the BlockedIP model"""
    is_active = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = BlockedIP
        fields = [
            'id', 'ip_address', 'reason', 'blocked_at', 
            'blocked_until', 'is_permanent', 'is_active', 'created_by'
        ]
        read_only_fields = ['blocked_at', 'created_by']


class SecuritySettingSerializer(serializers.ModelSerializer):
    """Serializer for the SecuritySetting model"""
    class Meta:
        model = SecuritySetting
        fields = ['id', 'key', 'value', 'description', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class SecurityLogSerializer(serializers.ModelSerializer):
    """Serializer for the SecurityLog model"""
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    username = serializers.SerializerMethodField()
    
    class Meta:
        model = SecurityLog
        fields = [
            'id', 'event_type', 'event_type_display', 'description', 
            'ip_address', 'user', 'username', 'user_agent', 
            'timestamp', 'severity', 'severity_display', 'additional_data'
        ]
        read_only_fields = ['timestamp']
    
    def get_username(self, obj):
        if obj.user:
            return obj.user.email
        return None


class UserSecurityProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserSecurityProfile model"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserSecurityProfile
        fields = ['id', 'user', 'user_email', 'username', 'two_factor_enabled', 
                  'last_password_change', 'last_security_review', 
                  'failed_login_attempts', 'account_locked', 'lock_reason', 
                  'locked_until']
        read_only_fields = ['id', 'user', 'user_email', 'username', 
                          'last_password_change', 'failed_login_attempts', 
                          'account_locked', 'lock_reason', 'locked_until']
