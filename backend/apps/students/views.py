from django.utils import timezone
from django.db.models import Q, Count, Avg
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    Student,
    Enrollment,
    Attendance,
    AssignmentSubmission,
    StudentNote
)
from .serializers import (
    StudentSerializer,
    StudentDetailSerializer,
    EnrollmentSerializer,
    AttendanceSerializer,
    AssignmentSubmissionSerializer,
    StudentNoteSerializer
)


class IsAdminOrTeacherOrSelf(permissions.BasePermission):
    """
    Custom permission to allow admin, teachers, or the student themselves
    to access their records
    """
    
    def has_permission(self, request, view):
        # Allow admins and staff members
        if request.user.is_staff:
            return True
        
        # Allow teachers
        if request.user.user_type == 'teacher':
            return True
        
        # For list and other actions, restrict students
        if view.action == 'list' and request.user.user_type == 'student':
            return False
        
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Allow admins and staff members
        if request.user.is_staff:
            return True
        
        # Allow teachers
        if request.user.user_type == 'teacher':
            return True
        
        # Allow the student themselves
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        
        if hasattr(obj, 'student') and hasattr(obj.student, 'user') and obj.student.user == request.user:
            return True
        
        return False


class StudentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Student instances
    """
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAdminOrTeacherOrSelf]
    
    def get_serializer_class(self):
        """
        Return detailed serializer for retrieve action
        """
        if self.action == 'retrieve':
            return StudentDetailSerializer
        return StudentSerializer
    
    def get_queryset(self):
        """
        Optionally restricts the returned students by various filters
        """
        queryset = Student.objects.all()
        
        # Filter by school
        school_id = self.request.query_params.get('school', None)
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Search by name, email, or student_id
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(student_id__icontains=search)
            )
        
        # Filter by user (student themselves can only see their profile)
        if self.request.user.user_type == 'student':
            try:
                student = Student.objects.get(user=self.request.user)
                return Student.objects.filter(id=student.id)
            except Student.DoesNotExist:
                return Student.objects.none()
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def enrollments(self, request, pk=None):
        """
        Get all enrollments for a specific student
        """
        student = self.get_object()
        enrollments = Enrollment.objects.filter(student=student)
        
        # Filter by term or status if provided
        term_id = request.query_params.get('term', None)
        status = request.query_params.get('status', None)
        
        if term_id:
            enrollments = enrollments.filter(term_id=term_id)
        
        if status:
            enrollments = enrollments.filter(status=status)
        
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        """
        Get attendance records for a specific student
        """
        student = self.get_object()
        
        # Get enrollments for this student
        enrollment_ids = Enrollment.objects.filter(student=student).values_list('id', flat=True)
        
        # Get attendance records for these enrollments
        attendance = Attendance.objects.filter(enrollment_id__in=enrollment_ids)
        
        # Filter by date range if provided
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        
        if start_date:
            attendance = attendance.filter(date__gte=start_date)
        
        if end_date:
            attendance = attendance.filter(date__lte=end_date)
        
        serializer = AttendanceSerializer(attendance, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def submissions(self, request, pk=None):
        """
        Get assignment submissions for a specific student
        """
        student = self.get_object()
        
        # Get enrollments for this student
        enrollment_ids = Enrollment.objects.filter(student=student).values_list('id', flat=True)
        
        # Get submissions for these enrollments
        submissions = AssignmentSubmission.objects.filter(enrollment_id__in=enrollment_ids)
        
        # Filter by date range if provided
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        
        if start_date:
            submissions = submissions.filter(submission_date__gte=start_date)
        
        if end_date:
            submissions = submissions.filter(submission_date__lte=end_date)
        
        serializer = AssignmentSubmissionSerializer(submissions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def notes(self, request, pk=None):
        """
        Get notes for a specific student
        """
        student = self.get_object()
        
        # Only show private notes to admins
        notes = StudentNote.objects.filter(student=student)
        if not request.user.is_staff:
            notes = notes.filter(is_private=False)
        
        serializer = StudentNoteSerializer(notes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Get the logged-in student's profile
        """
        try:
            student = Student.objects.get(user=request.user)
            serializer = self.get_serializer(student)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response(
                {"detail": "Student profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )


class EnrollmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Enrollment instances
    """
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAdminOrTeacherOrSelf]
    
    def get_queryset(self):
        """
        Optionally restricts the returned enrollments by various filters
        """
        queryset = Enrollment.objects.all()
        
        # Filter by student
        student_id = self.request.query_params.get('student', None)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        # Filter by course
        course_id = self.request.query_params.get('course', None)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        # Filter by term
        term_id = self.request.query_params.get('term', None)
        if term_id:
            queryset = queryset.filter(term_id=term_id)
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by grade
        grade = self.request.query_params.get('grade', None)
        if grade:
            queryset = queryset.filter(grade=grade)
        
        # If the user is a student, only show their enrollments
        if self.request.user.user_type == 'student':
            try:
                student = Student.objects.get(user=self.request.user)
                return queryset.filter(student=student)
            except Student.DoesNotExist:
                return Enrollment.objects.none()
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        """
        Get attendance records for a specific enrollment
        """
        enrollment = self.get_object()
        attendance = Attendance.objects.filter(enrollment=enrollment)
        
        # Filter by date range if provided
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        
        if start_date:
            attendance = attendance.filter(date__gte=start_date)
        
        if end_date:
            attendance = attendance.filter(date__lte=end_date)
        
        serializer = AttendanceSerializer(attendance, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def submissions(self, request, pk=None):
        """
        Get assignment submissions for a specific enrollment
        """
        enrollment = self.get_object()
        submissions = AssignmentSubmission.objects.filter(enrollment=enrollment)
        serializer = AssignmentSubmissionSerializer(submissions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_enrollments(self, request):
        """
        Get the current student's enrollments
        """
        try:
            student = Student.objects.get(user=request.user)
            enrollments = Enrollment.objects.filter(student=student)
            
            # Filter by term or status if provided
            term_id = request.query_params.get('term', None)
            status = request.query_params.get('status', None)
            
            if term_id:
                enrollments = enrollments.filter(term_id=term_id)
            
            if status:
                enrollments = enrollments.filter(status=status)
            
            serializer = self.get_serializer(enrollments, many=True)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response(
                {"detail": "Student profile not found for current user."},
                status=status.HTTP_404_NOT_FOUND
            )


class AttendanceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Attendance instances
    """
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAdminOrTeacherOrSelf]
    
    def get_queryset(self):
        """
        Optionally restricts the returned attendance records by various filters
        """
        queryset = Attendance.objects.all()
        
        # Filter by enrollment
        enrollment_id = self.request.query_params.get('enrollment', None)
        if enrollment_id:
            queryset = queryset.filter(enrollment_id=enrollment_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # If the user is a student, only show their attendance
        if self.request.user.user_type == 'student':
            try:
                student = Student.objects.get(user=self.request.user)
                enrollment_ids = Enrollment.objects.filter(student=student).values_list('id', flat=True)
                return queryset.filter(enrollment_id__in=enrollment_ids)
            except Student.DoesNotExist:
                return Attendance.objects.none()
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Create multiple attendance records at once
        """
        if not request.user.is_staff and request.user.user_type != 'teacher':
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def my_attendance(self, request):
        """
        Get the current student's attendance records
        """
        try:
            student = Student.objects.get(user=request.user)
            enrollment_ids = Enrollment.objects.filter(student=student).values_list('id', flat=True)
            attendance = Attendance.objects.filter(enrollment_id__in=enrollment_ids)
            
            # Filter by date range if provided
            start_date = request.query_params.get('start_date', None)
            end_date = request.query_params.get('end_date', None)
            
            if start_date:
                attendance = attendance.filter(date__gte=start_date)
            
            if end_date:
                attendance = attendance.filter(date__lte=end_date)
            
            serializer = self.get_serializer(attendance, many=True)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response(
                {"detail": "Student profile not found for current user."},
                status=status.HTTP_404_NOT_FOUND
            )


class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing AssignmentSubmission instances
    """
    queryset = AssignmentSubmission.objects.all()
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter submissions based on user's role:
        - Staff/teachers can see all submissions or filter by student/course
        - Students can only see their own submissions
        """
        queryset = AssignmentSubmission.objects.all()
        
        # If the user is a student, only show their submissions
        if not self.request.user.is_staff:
            # Get the student profile for the current user
            try:
                student = Student.objects.get(user=self.request.user)
                enrollments = Enrollment.objects.filter(student=student)
                queryset = queryset.filter(enrollment__in=enrollments)
            except Student.DoesNotExist:
                return AssignmentSubmission.objects.none()
        else:
            # Staff can filter by student
            student_id = self.request.query_params.get('student', None)
            if student_id:
                queryset = queryset.filter(enrollment__student_id=student_id)
            
            # Filter by course
            course_id = self.request.query_params.get('course', None)
            if course_id:
                queryset = queryset.filter(assignment__course_id=course_id)
        
        # Filter by assignment
        assignment_id = self.request.query_params.get('assignment', None)
        if assignment_id:
            queryset = queryset.filter(assignment_id=assignment_id)
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by grading status
        graded = self.request.query_params.get('graded', None)
        if graded is not None:
            if graded.lower() == 'true':
                queryset = queryset.filter(grade__isnull=False)
            else:
                queryset = queryset.filter(grade__isnull=True)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(submission_date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(submission_date__lte=end_date)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Set the submission date and submitter automatically
        """
        # Ensure the user can only submit for their own enrollments
        if not self.request.user.is_staff:
            enrollment_id = serializer.validated_data.get('enrollment').id
            try:
                student = Student.objects.get(user=self.request.user)
                enrollment = Enrollment.objects.get(id=enrollment_id, student=student)
            except (Student.DoesNotExist, Enrollment.DoesNotExist):
                raise permissions.PermissionDenied("You can only submit for your own enrollments.")
        
        serializer.save(
            submission_date=timezone.now(),
            submitted_by=self.request.user,
            status='submitted'
        )
    
    def perform_update(self, serializer):
        """
        Ensure proper permissions for updates
        """
        submission = self.get_object()
        
        # Only staff can grade submissions
        if 'grade' in serializer.validated_data and not self.request.user.is_staff:
            raise permissions.PermissionDenied("Only staff can grade submissions.")
        
        # If being graded, update the graded_by and graded_date fields
        if 'grade' in serializer.validated_data:
            serializer.save(
                graded_by=self.request.user,
                graded_date=timezone.now()
            )
        else:
            serializer.save()
    
    @action(detail=False, methods=['get'])
    def my_submissions(self, request):
        """
        Get submissions for the current user
        """
        try:
            student = Student.objects.get(user=request.user)
            enrollments = Enrollment.objects.filter(student=student)
            submissions = AssignmentSubmission.objects.filter(enrollment__in=enrollments)
            
            # Filter by status, date, etc. if provided
            status_param = request.query_params.get('status', None)
            if status_param:
                submissions = submissions.filter(status=status_param)
            
            serializer = self.get_serializer(submissions, many=True)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response([])
    
    @action(detail=False, methods=['get'])
    def pending_grading(self, request):
        """
        Get submissions that need grading (staff only)
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to view this data."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get submissions that have been submitted but not graded
        submissions = AssignmentSubmission.objects.filter(
            status='submitted',
            grade__isnull=True
        )
        
        # Additional filters
        course_id = request.query_params.get('course', None)
        if course_id:
            submissions = submissions.filter(assignment__course_id=course_id)
        
        serializer = self.get_serializer(submissions, many=True)
        return Response(serializer.data)


class StudentNoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing StudentNote instances
    """
    queryset = StudentNote.objects.all()
    serializer_class = StudentNoteSerializer
    permission_classes = [IsAdminOrTeacherOrSelf]
    
    def get_queryset(self):
        """
        Optionally restricts the returned notes by various filters
        """
        queryset = StudentNote.objects.all()
        
        # Filter by student
        student_id = self.request.query_params.get('student', None)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        # Filter by note type
        note_type = self.request.query_params.get('note_type', None)
        if note_type:
            queryset = queryset.filter(note_type=note_type)
        
        # Filter by privacy
        is_private = self.request.query_params.get('is_private', None)
        if is_private is not None:
            is_private_bool = is_private.lower() == 'true'
            queryset = queryset.filter(is_private=is_private_bool)
            
        # Search by title or content
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(content__icontains=search)
            )
        
        # Regular users (non-admin/non-staff) can only see notes for their student profile
        # Teachers can see non-private notes for students they teach
        if not self.request.user.is_staff:
            if self.request.user.user_type == 'student':
                try:
                    student = Student.objects.get(user=self.request.user)
                    queryset = queryset.filter(student=student)
                except Student.DoesNotExist:
                    return StudentNote.objects.none()
            elif self.request.user.user_type == 'teacher':
                # Teachers can see non-private notes
                queryset = queryset.filter(is_private=False)
            else:
                return StudentNote.objects.none()
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)