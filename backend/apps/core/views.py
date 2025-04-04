from django.utils import timezone
from django.db.models import Q
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    School,
    SchoolYear,
    Term,
    Department,
    SystemSetting,
    Notification
)
from .serializers import (
    SchoolSerializer,
    SchoolYearSerializer,
    TermSerializer,
    DepartmentSerializer,
    SystemSettingSerializer,
    NotificationSerializer
)


class SchoolViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing School instances
    """
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class SchoolYearViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing SchoolYear instances
    """
    queryset = SchoolYear.objects.all()
    serializer_class = SchoolYearSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Optionally restricts the returned school years to a given school,
        by filtering against a `school` query parameter in the URL.
        """
        queryset = SchoolYear.objects.all()
        school_id = self.request.query_params.get('school', None)
        if school_id is not None:
            queryset = queryset.filter(school_id=school_id)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """
        Get the current active school year
        """
        current_date = timezone.now().date()
        try:
            current_year = SchoolYear.objects.filter(
                start_date__lte=current_date,
                end_date__gte=current_date,
                is_active=True
            ).first()
            
            if not current_year:
                return Response(
                    {"detail": "No active school year found for the current date."},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            serializer = self.get_serializer(current_year)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {"detail": f"Error retrieving current school year: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TermViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Term instances
    """
    queryset = Term.objects.all()
    serializer_class = TermSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Optionally restricts the returned terms to a given school year,
        by filtering against a `school_year` query parameter in the URL.
        """
        queryset = Term.objects.all()
        school_year_id = self.request.query_params.get('school_year', None)
        if school_year_id is not None:
            queryset = queryset.filter(school_year_id=school_year_id)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """
        Get the current active term
        """
        current_date = timezone.now().date()
        try:
            current_term = Term.objects.filter(
                start_date__lte=current_date,
                end_date__gte=current_date,
                is_active=True
            ).first()
            
            if not current_term:
                return Response(
                    {"detail": "No active term found for the current date."},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            serializer = self.get_serializer(current_term)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {"detail": f"Error retrieving current term: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DepartmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Department instances
    """
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Optionally restricts the returned departments to a given school,
        by filtering against a `school` query parameter in the URL.
        """
        queryset = Department.objects.all()
        school_id = self.request.query_params.get('school', None)
        if school_id is not None:
            queryset = queryset.filter(school_id=school_id)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class SystemSettingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing SystemSetting instances
    """
    queryset = SystemSetting.objects.all()
    serializer_class = SystemSettingSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def get_by_key(self, request):
        """
        Get a system setting by its key
        """
        key = request.query_params.get('key', None)
        if not key:
            return Response(
                {"detail": "Key parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            setting = SystemSetting.objects.get(key=key)
            serializer = self.get_serializer(setting)
            return Response(serializer.data)
        except SystemSetting.DoesNotExist:
            return Response(
                {"detail": f"Setting with key '{key}' not found."},
                status=status.HTTP_404_NOT_FOUND
            )


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Notification instances
    """
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        This view should return a list of all the notifications
        for the currently authenticated user.
        """
        user = self.request.user
        
        # Admin can see all notifications
        if user.is_staff and self.request.query_params.get('all', 'false').lower() == 'true':
            return Notification.objects.all()
        
        # Regular users can only see their notifications
        return Notification.objects.filter(user=user)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['patch'])
    def mark_as_read(self, request, pk=None):
        """
        Mark a notification as read
        """
        notification = self.get_object()
        
        if notification.user != request.user and not request.user.is_staff:
            return Response(
                {"detail": "You don't have permission to mark this notification as read."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'])
    def mark_all_as_read(self, request):
        """
        Mark all notifications for the current user as read
        """
        notifications = self.get_queryset().filter(is_read=False)
        current_time = timezone.now()
        
        count = notifications.update(is_read=True, read_at=current_time, updated_by=request.user)
        
        return Response(
            {"detail": f"Marked {count} notifications as read."},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        Get the count of unread notifications for the current user
        """
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"count": count})