from django.utils import timezone
from django.db.models import Q, Avg
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    StaffMember,
    TeacherProfile,
    Leave,
    Performance,
    StaffDocument
)
from .serializers import (
    StaffMemberSerializer,
    StaffDetailSerializer,
    TeacherProfileSerializer,
    LeaveSerializer,
    PerformanceSerializer,
    StaffDocumentSerializer
)


class IsAdminOrManagerOrSelf(permissions.BasePermission):
    """
    Custom permission to allow admin, managers, or the staff member themselves
    to access their records
    """
    
    def has_permission(self, request, view):
        # Allow admins and staff members
        if request.user.is_staff:
            return True
        
        # Allow list view only for admins and managers
        if view.action == 'list' and request.user.user_type not in ['admin', 'staff']:
            return False
        
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Allow admins and staff members
        if request.user.is_staff:
            return True
        
        # Allow managers with specific permission (simplified)
        if request.user.user_type == 'staff' and hasattr(request.user, 'staff_profile') and 'Manager' in request.user.staff_profile.designation:
            return True
        
        # Allow the staff member themselves
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        
        if hasattr(obj, 'staff_member') and hasattr(obj.staff_member, 'user') and obj.staff_member.user == request.user:
            return True
        
        return False


class StaffMemberViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing StaffMember instances
    """
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer
    permission_classes = [IsAdminOrManagerOrSelf]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return StaffDetailSerializer
        return StaffMemberSerializer
    
    def get_queryset(self):
        """
        Optionally restricts the returned staff members by various filters
        """
        queryset = StaffMember.objects.all()
        
        # Filter by school
        school_id = self.request.query_params.get('school', None)
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        
        # Filter by department
        department_id = self.request.query_params.get('department', None)
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        
        # Filter by designation
        designation = self.request.query_params.get('designation', None)
        if designation:
            queryset = queryset.filter(designation__icontains=designation)
        
        # Filter by employment type
        employment_type = self.request.query_params.get('employment_type', None)
        if employment_type:
            queryset = queryset.filter(employment_type=employment_type)
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by teacher (has teacher profile)
        is_teacher = self.request.query_params.get('is_teacher', None)
        if is_teacher is not None:
            is_teacher_bool = is_teacher.lower() == 'true'
            if is_teacher_bool:
                queryset = queryset.filter(teacher_profile__isnull=False)
            else:
                queryset = queryset.filter(teacher_profile__isnull=True)
        
        # Search by name, email, or staff_id
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(staff_id__icontains=search)
            )
        
        # If the user is a regular staff member, only allow them to see themselves
        if not self.request.user.is_staff and not (hasattr(self.request.user, 'staff_profile') and 'Manager' in getattr(self.request.user.staff_profile, 'designation', '')):
            try:
                staff_member = StaffMember.objects.get(user=self.request.user)
                return StaffMember.objects.filter(id=staff_member.id)
            except StaffMember.DoesNotExist:
                return StaffMember.objects.none()
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def leaves(self, request, pk=None):
        """
        Get all leaves for a specific staff member
        """
        staff_member = self.get_object()
        leaves = Leave.objects.filter(staff_member=staff_member)
        
        # Filter by status if provided
        status = request.query_params.get('status', None)
        if status:
            leaves = leaves.filter(status=status)
        
        # Filter by date range if provided
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        
        if start_date:
            leaves = leaves.filter(start_date__gte=start_date)
        
        if end_date:
            leaves = leaves.filter(end_date__lte=end_date)
        
        serializer = LeaveSerializer(leaves, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def performances(self, request, pk=None):
        """
        Get performance evaluations for a specific staff member
        """
        staff_member = self.get_object()
        performances = Performance.objects.filter(staff_member=staff_member)
        
        # Filter by date range if provided
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        
        if start_date:
            performances = performances.filter(evaluation_date__gte=start_date)
        
        if end_date:
            performances = performances.filter(evaluation_date__lte=end_date)
        
        serializer = PerformanceSerializer(performances, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        """
        Get documents for a specific staff member
        """
        staff_member = self.get_object()
        
        # Filter out confidential documents for non-admin users
        documents = staff_member.documents.all()
        if not request.user.is_staff:
            documents = documents.filter(is_confidential=False)
        
        # Filter by document type if provided
        document_type = request.query_params.get('document_type', None)
        if document_type:
            documents = documents.filter(document_type=document_type)
        
        serializer = StaffDocumentSerializer(documents, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Get the current user's staff profile
        """
        try:
            staff_member = StaffMember.objects.get(user=request.user)
            serializer = StaffDetailSerializer(staff_member, context={'request': request})
            return Response(serializer.data)
        except StaffMember.DoesNotExist:
            return Response(
                {"detail": "Staff profile not found for current user."},
                status=status.HTTP_404_NOT_FOUND
            )


class TeacherProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing TeacherProfile instances
    """
    queryset = TeacherProfile.objects.all()
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsAdminOrManagerOrSelf]
    
    def get_queryset(self):
        """
        Optionally restricts the returned teacher profiles by various filters
        """
        queryset = TeacherProfile.objects.all()
        
        # Filter by subject
        subject = self.request.query_params.get('subject', None)
        if subject:
            queryset = queryset.filter(subjects__contains=[subject])
        
        # Filter by preferred level
        level = self.request.query_params.get('level', None)
        if level:
            queryset = queryset.filter(preferred_levels__contains=[level])
        
        # Filter by certification
        certification = self.request.query_params.get('certification', None)
        if certification:
            queryset = queryset.filter(certifications__contains=[certification])
        
        # If the user is a regular teacher, only allow them to see their own profile
        if not self.request.user.is_staff and self.request.user.user_type == 'teacher':
            try:
                staff_member = StaffMember.objects.get(user=self.request.user)
                return TeacherProfile.objects.filter(staff_member=staff_member)
            except (StaffMember.DoesNotExist, TeacherProfile.DoesNotExist):
                return TeacherProfile.objects.none()
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class LeaveViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Leave instances
    """
    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer
    permission_classes = [IsAdminOrManagerOrSelf]
    
    def get_queryset(self):
        """
        Optionally restricts the returned leaves by various filters
        """
        queryset = Leave.objects.all()
        
        # Filter by staff member
        staff_member_id = self.request.query_params.get('staff_member', None)
        if staff_member_id:
            queryset = queryset.filter(staff_member_id=staff_member_id)
        
        # Filter by leave type
        leave_type = self.request.query_params.get('leave_type', None)
        if leave_type:
            queryset = queryset.filter(leave_type=leave_type)
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(end_date__lte=end_date)
        
        # If the user is a regular staff member, only allow them to see their own leaves
        if not self.request.user.is_staff and not (hasattr(self.request.user, 'staff_profile') and 'Manager' in getattr(self.request.user.staff_profile, 'designation', '')):
            try:
                staff_member = StaffMember.objects.get(user=self.request.user)
                return queryset.filter(staff_member=staff_member)
            except StaffMember.DoesNotExist:
                return Leave.objects.none()
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve a leave request
        """
        if not request.user.is_staff and not (hasattr(request.user, 'staff_profile') and 'Manager' in getattr(request.user.staff_profile, 'designation', '')):
            return Response(
                {"detail": "You do not have permission to approve leave requests."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        leave = self.get_object()
        
        if leave.status != 'pending':
            return Response(
                {"detail": f"Leave request is already {leave.get_status_display()}."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        leave.status = 'approved'
        leave.approved_by = request.user
        leave.approved_date = timezone.now()
        leave.updated_by = request.user
        leave.save()
        
        serializer = self.get_serializer(leave)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject a leave request
        """
        if not request.user.is_staff and not (hasattr(request.user, 'staff_profile') and 'Manager' in getattr(request.user.staff_profile, 'designation', '')):
            return Response(
                {"detail": "You do not have permission to reject leave requests."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        leave = self.get_object()
        
        if leave.status != 'pending':
            return Response(
                {"detail": f"Leave request is already {leave.get_status_display()}."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get rejection reason from request data
        rejection_reason = request.data.get('rejection_reason', '')
        if not rejection_reason:
            return Response(
                {"detail": "Rejection reason is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        leave.status = 'rejected'
        leave.approved_by = request.user
        leave.approved_date = timezone.now()
        leave.rejection_reason = rejection_reason
        leave.updated_by = request.user
        leave.save()
        
        serializer = self.get_serializer(leave)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_leaves(self, request):
        """
        Get the current staff member's leave requests
        """
        try:
            staff_member = StaffMember.objects.get(user=request.user)
            leaves = Leave.objects.filter(staff_member=staff_member)
            
            # Filter by status if provided
            status_param = request.query_params.get('status', None)
            if status_param:
                leaves = leaves.filter(status=status_param)
            
            serializer = self.get_serializer(leaves, many=True)
            return Response(serializer.data)
        except StaffMember.DoesNotExist:
            return Response(
                {"detail": "Staff profile not found for current user."},
                status=status.HTTP_404_NOT_FOUND
            )


class PerformanceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Performance instances
    """
    queryset = Performance.objects.all()
    serializer_class = PerformanceSerializer
    permission_classes = [IsAdminOrManagerOrSelf]
    
    def get_queryset(self):
        """
        Optionally restricts the returned performance evaluations by various filters
        """
        queryset = Performance.objects.all()
        
        # Filter by staff member
        staff_member_id = self.request.query_params.get('staff_member', None)
        if staff_member_id:
            queryset = queryset.filter(staff_member_id=staff_member_id)
        
        # Filter by evaluator
        evaluator_id = self.request.query_params.get('evaluator', None)
        if evaluator_id:
            queryset = queryset.filter(evaluator_id=evaluator_id)
        
        # Filter by overall rating
        rating = self.request.query_params.get('rating', None)
        if rating:
            queryset = queryset.filter(overall_rating=rating)
        
        # Filter by evaluation date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(evaluation_date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(evaluation_date__lte=end_date)
        
        # If the user is a regular staff member, only allow them to see their own evaluations
        if not self.request.user.is_staff and not (hasattr(self.request.user, 'staff_profile') and 'Manager' in getattr(self.request.user.staff_profile, 'designation', '')):
            try:
                staff_member = StaffMember.objects.get(user=self.request.user)
                return queryset.filter(staff_member=staff_member)
            except StaffMember.DoesNotExist:
                return Performance.objects.none()
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_evaluations(self, request):
        """
        Get the current staff member's performance evaluations
        """
        try:
            staff_member = StaffMember.objects.get(user=request.user)
            performances = Performance.objects.filter(staff_member=staff_member)
            
            serializer = self.get_serializer(performances, many=True)
            return Response(serializer.data)
        except StaffMember.DoesNotExist:
            return Response(
                {"detail": "Staff profile not found for current user."},
                status=status.HTTP_404_NOT_FOUND
            )


class StaffDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing StaffDocument instances
    """
    queryset = StaffDocument.objects.all()
    serializer_class = StaffDocumentSerializer
    permission_classes = [IsAdminOrManagerOrSelf]
    
    def get_queryset(self):
        """
        Optionally restricts the returned documents by various filters
        """
        queryset = StaffDocument.objects.all()
        
        # Filter by staff member
        staff_member_id = self.request.query_params.get('staff_member', None)
        if staff_member_id:
            queryset = queryset.filter(staff_member_id=staff_member_id)
        
        # Filter by document type
        document_type = self.request.query_params.get('document_type', None)
        if document_type:
            queryset = queryset.filter(document_type=document_type)
        
        # Filter by confidentiality
        is_confidential = self.request.query_params.get('is_confidential', None)
        if is_confidential is not None:
            is_confidential_bool = is_confidential.lower() == 'true'
            queryset = queryset.filter(is_confidential=is_confidential_bool)
        
        # If the user is a regular staff member, only allow them to see their own non-confidential documents
        if not self.request.user.is_staff and not (hasattr(self.request.user, 'staff_profile') and 'Manager' in getattr(self.request.user.staff_profile, 'designation', '')):
            try:
                staff_member = StaffMember.objects.get(user=self.request.user)
                return queryset.filter(staff_member=staff_member, is_confidential=False)
            except StaffMember.DoesNotExist:
                return StaffDocument.objects.none()
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_documents(self, request):
        """
        Get the current staff member's documents
        """
        try:
            staff_member = StaffMember.objects.get(user=request.user)
            documents = StaffDocument.objects.filter(staff_member=staff_member, is_confidential=False)
            
            # Filter by document type if provided
            document_type = request.query_params.get('document_type', None)
            if document_type:
                documents = documents.filter(document_type=document_type)
            
            serializer = self.get_serializer(documents, many=True)
            return Response(serializer.data)
        except StaffMember.DoesNotExist:
            return Response(
                {"detail": "Staff profile not found for current user."},
                status=status.HTTP_404_NOT_FOUND
            )