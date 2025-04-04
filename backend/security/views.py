from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.shortcuts import render
from django.http import HttpResponseForbidden

from .models import BlockedIP, SecuritySetting, SecurityLog, UserSecurityProfile
from .serializers import (
    BlockedIPSerializer, 
    SecuritySettingSerializer, 
    SecurityLogSerializer, 
    UserSecurityProfileSerializer
)


class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to admin users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_staff


class BlockedIPViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing blocked IP addresses
    """
    queryset = BlockedIP.objects.all()
    serializer_class = BlockedIPSerializer
    permission_classes = [IsAdminUser]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class SecuritySettingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing security settings
    """
    queryset = SecuritySetting.objects.all()
    serializer_class = SecuritySettingSerializer
    permission_classes = [IsAdminUser]
    

class SecurityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing security logs
    """
    queryset = SecurityLog.objects.all()
    serializer_class = SecurityLogSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = SecurityLog.objects.all()
        
        # Filter by event type
        event_type = self.request.query_params.get('event_type', None)
        if event_type:
            queryset = queryset.filter(event_type=event_type)
            
        # Filter by severity
        severity = self.request.query_params.get('severity', None)
        if severity:
            queryset = queryset.filter(severity=severity)
            
        # Filter by IP address
        ip_address = self.request.query_params.get('ip_address', None)
        if ip_address:
            queryset = queryset.filter(ip_address=ip_address)
            
        # Filter by user
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
            
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
            
        end_date = self.request.query_params.get('end_date', None)
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
            
        return queryset


@api_view(['GET'])
@permission_classes([IsAdminUser])
def check_ip_status(request, ip_address):
    """
    Check if an IP address is blocked
    """
    try:
        blocked_ip = BlockedIP.objects.get(ip_address=ip_address)
        return Response({
            'is_blocked': blocked_ip.is_active,
            'details': BlockedIPSerializer(blocked_ip).data
        })
    except BlockedIP.DoesNotExist:
        return Response({
            'is_blocked': False,
            'details': None
        })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def security_summary(request):
    """
    Get a summary of security-related data
    """
    # Count of currently blocked IPs
    active_blocks = BlockedIP.objects.filter(
        Q(is_permanent=True) | 
        Q(blocked_until__gt=timezone.now())
    ).count()
    
    # Recent security logs grouped by type
    recent_logs = SecurityLog.objects.filter(
        timestamp__gte=timezone.now() - timezone.timedelta(days=7)
    )
    
    logs_by_type = recent_logs.values('event_type').annotate(
        count=Count('id')
    ).order_by('-count')
    
    logs_by_severity = recent_logs.values('severity').annotate(
        count=Count('id')
    ).order_by('-severity')
    
    return Response({
        'active_ip_blocks': active_blocks,
        'total_blocked_ips': BlockedIP.objects.count(),
        'recent_events_by_type': logs_by_type,
        'recent_events_by_severity': logs_by_severity,
        'total_security_logs': SecurityLog.objects.count()
    })


class UserSecurityProfileViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user security profiles
    """
    serializer_class = UserSecurityProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter queryset based on user permissions
        """
        user = self.request.user
        
        # Admin can see all profiles
        if user.is_staff:
            return UserSecurityProfile.objects.all()
        
        # Regular users can only see their own profile
        return UserSecurityProfile.objects.filter(user=user)
    
    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """
        Get the security profile for the current user
        """
        try:
            profile, created = UserSecurityProfile.objects.get_or_create(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def unlock_account(self, request, pk=None):
        """
        Unlock a user account (admin only)
        """
        profile = self.get_object()
        profile.account_locked = False
        profile.locked_until = None
        profile.failed_login_attempts = 0
        profile.save()
        
        # Log the unlock action
        from audit.models import ActivityLog
        ActivityLog.objects.create(
            user=request.user,
            action='UNLOCK_ACCOUNT',  # Make sure this matches the field in ActivityLog model
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            details=f"Account unlocked for {profile.user.email} by {request.user.email}"
        )
        
        return Response({'status': 'Account unlocked'})
    
    def get_client_ip(self, request):
        """Extract client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


def csrf_failure(request, reason=""):
    """
    View function for CSRF failure protection
    """
    from .models import SecurityLog
    
    # Log the CSRF failure
    SecurityLog.objects.create(
        event_type='suspicious_activity',
        description=f"CSRF verification failed: {reason}",
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        severity='high',
        user=request.user if request.user.is_authenticated else None
    )
    
    return HttpResponseForbidden("CSRF verification failed. Request aborted.")

def get_client_ip(request):
    """Extract client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
