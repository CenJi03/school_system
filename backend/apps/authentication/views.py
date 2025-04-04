import uuid
import datetime
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView

from .models import User, UserActivity
from .serializers import (
    UserSerializer, 
    LoginSerializer, 
    TokenSerializer, 
    PasswordResetRequestSerializer, 
    PasswordResetConfirmSerializer,
    UserActivitySerializer
)
from .adapters import get_client_ip

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing user instances.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == 'create':
            permission_classes = [permissions.IsAdminUser]
        elif self.action in ['list', 'retrieve', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter queryset based on user's permissions
        """
        user = self.request.user
        
        # Admin can see all users
        if user.is_staff:
            return User.objects.all()
        
        # Regular users can only see themselves
        return User.objects.filter(id=user.id)
    
    def perform_create(self, serializer):
        """Create a new user"""
        user = serializer.save()
        
        # Log the activity
        ip_address = get_client_ip(self.request)
        UserActivity.objects.create(
            user=self.request.user,
            action=f"Created user {user.email}",
            ip_address=ip_address,
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def perform_update(self, serializer):
        """Update a user"""
        user = serializer.save()
        
        # Log the activity
        ip_address = get_client_ip(self.request)
        UserActivity.objects.create(
            user=self.request.user,
            action=f"Updated user {user.email}",
            ip_address=ip_address,
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response(serializer.data)
    
    def perform_destroy(self, instance):
        """Delete a user"""
        email = instance.email
        instance.delete()
        
        # Log the activity
        ip_address = get_client_ip(self.request)
        UserActivity.objects.create(
            user=self.request.user,
            action=f"Deleted user {email}",
            ip_address=ip_address,
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get the current user profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class LoginView(APIView):
    """
    API View for user login
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        remember = serializer.validated_data.get('remember', False)
        
        # Get or create token
        token, created = Token.objects.get_or_create(user=user)
        
        # If remember me is not checked, set token to expire in 24 hours
        if not remember and hasattr(token, 'expires'):
            token.expires = timezone.now() + timezone.timedelta(hours=24)
            token.save()
        
        # Update user's last login information
        user.last_login = timezone.now()
        
        # Check if fields exist before updating
        if hasattr(user, 'last_login_ip'):
            user.last_login_ip = get_client_ip(request)
        
        if hasattr(user, 'last_login_user_agent'):
            user.last_login_user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Save without specifying update_fields to avoid the error
        user.save()
        
        # Log the activity
        UserActivity.objects.create(
            user=user,
            action=f"User login",
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Return the token and user info
        token_serializer = TokenSerializer(token)
        return Response(token_serializer.data)


class LogoutView(APIView):
    """
    API View for user logout
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Log the activity before deleting the token
        UserActivity.objects.create(
            user=request.user,
            action=f"User logout",
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Delete the user's token
        try:
            request.user.auth_token.delete()
        except:
            pass
        
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    """
    API View for requesting a password reset
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
            
            # Generate reset token
            token = str(uuid.uuid4())
            expiry = timezone.now() + datetime.timedelta(hours=24)
            
            # Save token to user
            user.reset_token = token
            user.reset_token_expiry = expiry
            user.save(update_fields=['reset_token', 'reset_token_expiry'])
            
            # Send email with reset link
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
            send_mail(
                subject="Password Reset Request",
                message=f"Please click the following link to reset your password: {reset_url}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            
            # Log the activity
            UserActivity.objects.create(
                user=user,
                action=f"Password reset requested",
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
        except User.DoesNotExist:
            # We don't want to reveal whether an email exists or not
            pass
        
        return Response({"detail": "Password reset email sent if the email exists."}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """
    API View for confirming a password reset
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        password = serializer.validated_data['password']
        
        try:
            user = User.objects.get(reset_token=token, reset_token_expiry__gt=timezone.now())
            
            # Set new password
            user.set_password(password)
            
            # Clear reset token fields
            user.reset_token = None
            user.reset_token_expiry = None
            user.save()
            
            # Log the activity
            UserActivity.objects.create(
                user=user,
                action=f"Password reset completed",
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({"detail": "Password has been reset successfully."}, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)


class UserActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing user activity logs
    """
    queryset = UserActivity.objects.all()
    serializer_class = UserActivitySerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        """
        Filter queryset based on query parameters
        """
        queryset = UserActivity.objects.all().order_by('-timestamp')
        
        # Filter by user ID
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by action (changed from activity_type)
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action__icontains=action)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            start_datetime = datetime.datetime.strptime(start_date, '%Y-%m-%d').replace(tzinfo=timezone.utc)
            queryset = queryset.filter(timestamp__gte=start_datetime)
        
        if end_date:
            end_datetime = datetime.datetime.strptime(end_date, '%Y-%m-%d').replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
            queryset = queryset.filter(timestamp__lte=end_datetime)
        
        return queryset