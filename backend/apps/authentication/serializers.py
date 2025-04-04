from django.contrib.auth import authenticate
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework.authtoken.models import Token
from .models import User, UserActivity


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model
    """
    password = serializers.CharField(write_only=True, required=False)
    confirm_password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'user_type',
            'profile_picture', 'phone_number', 'password', 'confirm_password',
            'date_joined', 'is_active'
        )
        read_only_fields = ('id', 'date_joined')
    
    def validate(self, data):
        """
        Validate that passwords match when creating a new user or updating password
        """
        password = data.get('password')
        confirm_password = data.get('confirm_password')
        
        if password and confirm_password and password != confirm_password:
            raise serializers.ValidationError({"confirm_password": _("Passwords don't match.")})
        
        return data
    
    def create(self, validated_data):
        """
        Create and return a new user with encrypted password
        """
        # Remove confirm_password from the data
        validated_data.pop('confirm_password', None)
        
        # Create the user
        user = User.objects.create_user(**validated_data)
        return user
    
    def update(self, instance, validated_data):
        """
        Update and return an existing user instance
        """
        # Handle password update
        password = validated_data.pop('password', None)
        validated_data.pop('confirm_password', None)  # Remove confirm_password
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        # Set new password if provided
        if password:
            instance.set_password(password)
            
        instance.save()
        return instance


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login
    """
    email = serializers.EmailField()
    password = serializers.CharField()
    remember = serializers.BooleanField(required=False, default=False)
    
    def validate(self, data):
        """
        Validate user credentials
        """
        email = data.get('email')
        password = data.get('password')
        
        if email and password:
            user = authenticate(request=self.context.get('request'), username=email, password=password)
            
            if not user:
                raise serializers.ValidationError(_("Invalid credentials."))
            
            if not user.is_active:
                raise serializers.ValidationError(_("User account is disabled."))
            
        else:
            raise serializers.ValidationError(_("Must include 'email' and 'password'."))
        
        data['user'] = user
        return data


class TokenSerializer(serializers.ModelSerializer):
    """
    Serializer for authentication tokens
    """
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Token
        fields = ('key', 'user')


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for password reset request
    """
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """
        Validate that the email exists in the system
        """
        try:
            User.objects.get(email=value)
        except User.DoesNotExist:
            # We don't want to reveal whether an email exists or not for security reasons
            pass
        
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for password reset confirmation
    """
    token = serializers.CharField()
    password = serializers.CharField(min_length=8)
    confirm_password = serializers.CharField(min_length=8)
    
    def validate(self, data):
        """
        Validate that passwords match
        """
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": _("Passwords don't match.")})
        
        return data


class UserActivitySerializer(serializers.ModelSerializer):
    """
    Serializer for user activity logs
    """
    user_email = serializers.SerializerMethodField()
    
    class Meta:
        model = UserActivity
        fields = ('id', 'user', 'user_email', 'action', 'ip_address', 'timestamp')
        read_only_fields = fields
    
    def get_user_email(self, obj):
        """
        Get the email of the user
        """
        return obj.user.email if obj.user else None