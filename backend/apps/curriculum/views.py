from django.utils import timezone
from django.db.models import Q
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    Course,
    CourseMaterial,
    Lesson,
    ClassSchedule,
    Assignment,
    Syllabus
)
from .serializers import (
    CourseSerializer,
    CourseMaterialSerializer,
    LessonSerializer,
    ClassScheduleSerializer,
    AssignmentSerializer,
    SyllabusSerializer
)


class CourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Course instances
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
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
        Optionally restricts the returned courses by various filters
        """
        queryset = Course.objects.all()
        
        # Filter by department
        department_id = self.request.query_params.get('department', None)
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        
        # Filter by level
        level = self.request.query_params.get('level', None)
        if level:
            queryset = queryset.filter(level=level)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        
        # Search by name or code
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(code__icontains=search))
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def materials(self, request, pk=None):
        """
        Get all materials for a specific course
        """
        course = self.get_object()
        materials = CourseMaterial.objects.filter(course=course)
        serializer = CourseMaterialSerializer(materials, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def lessons(self, request, pk=None):
        """
        Get all lessons for a specific course
        """
        course = self.get_object()
        lessons = Lesson.objects.filter(course=course).order_by('order')
        serializer = LessonSerializer(lessons, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def schedules(self, request, pk=None):
        """
        Get all schedules for a specific course
        """
        course = self.get_object()
        term_id = request.query_params.get('term', None)
        
        schedules = ClassSchedule.objects.filter(course=course)
        if term_id:
            schedules = schedules.filter(term_id=term_id)
        
        serializer = ClassScheduleSerializer(schedules, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def assignments(self, request, pk=None):
        """
        Get all assignments for a specific course
        """
        course = self.get_object()
        assignments = Assignment.objects.filter(course=course).order_by('due_date')
        serializer = AssignmentSerializer(assignments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def syllabus(self, request, pk=None):
        """
        Get the syllabus for a specific course and term
        """
        course = self.get_object()
        term_id = request.query_params.get('term', None)
        
        if not term_id:
            return Response({
                "detail": "Term parameter is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            syllabus = Syllabus.objects.get(course=course, term_id=term_id, is_active=True)
            serializer = SyllabusSerializer(syllabus)
            return Response(serializer.data)
        except Syllabus.DoesNotExist:
            return Response({
                "detail": "Syllabus not found for this course and term"
            }, status=status.HTTP_404_NOT_FOUND)


class CourseMaterialViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing CourseMaterial instances
    """
    queryset = CourseMaterial.objects.all()
    serializer_class = CourseMaterialSerializer
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
        Optionally restricts the returned materials by various filters
        """
        queryset = CourseMaterial.objects.all()
        
        # Filter by course
        course_id = self.request.query_params.get('course', None)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        # Filter by material type
        material_type = self.request.query_params.get('material_type', None)
        if material_type:
            queryset = queryset.filter(material_type=material_type)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        
        # Search by title
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(title__icontains=search)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class LessonViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Lesson instances
    """
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
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
        Optionally restricts the returned lessons by various filters
        """
        queryset = Lesson.objects.all()
        
        # Filter by course
        course_id = self.request.query_params.get('course', None)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        
        # Search by title
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(title__icontains=search)
        
        return queryset.order_by('course', 'order')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class ClassScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing ClassSchedule instances
    """
    queryset = ClassSchedule.objects.all()
    serializer_class = ClassScheduleSerializer
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
        Optionally restricts the returned schedules by various filters
        """
        queryset = ClassSchedule.objects.all()
        
        # Filter by course
        course_id = self.request.query_params.get('course', None)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        # Filter by term
        term_id = self.request.query_params.get('term', None)
        if term_id:
            queryset = queryset.filter(term_id=term_id)
        
        # Filter by teacher
        teacher_id = self.request.query_params.get('teacher', None)
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        
        # Filter by day of week
        day = self.request.query_params.get('day', None)
        if day is not None and day.isdigit():
            queryset = queryset.filter(day_of_week=int(day))
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        
        return queryset.order_by('day_of_week', 'start_time')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_schedule(self, request):
        """
        Get the schedule for the current user (teacher)
        """
        user = request.user
        schedules = ClassSchedule.objects.filter(teacher=user, is_active=True)
        
        # Filter by term
        term_id = request.query_params.get('term', None)
        if term_id:
            schedules = schedules.filter(term_id=term_id)
        
        serializer = self.get_serializer(schedules, many=True)
        return Response(serializer.data)


class AssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Assignment instances
    """
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
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
        Optionally restricts the returned assignments by various filters
        """
        queryset = Assignment.objects.all()
        
        # Filter by course
        course_id = self.request.query_params.get('course', None)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        # Filter by assignment type
        assignment_type = self.request.query_params.get('assignment_type', None)
        if assignment_type:
            queryset = queryset.filter(assignment_type=assignment_type)
        
        # Filter by due date range
        due_after = self.request.query_params.get('due_after', None)
        if due_after:
            queryset = queryset.filter(due_date__gte=due_after)
        
        due_before = self.request.query_params.get('due_before', None)
        if due_before:
            queryset = queryset.filter(due_date__lte=due_before)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        
        # Search by title
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(title__icontains=search)
        
        return queryset.order_by('due_date')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """
        Get upcoming assignments for enrolled courses
        """
        user = request.user
        today = timezone.now()
        
        # Get courses where user is enrolled (assuming a student)
        # This depends on the student enrollment model which is in another app
        # For now, just return a message
        return Response({
            "detail": "This endpoint will return upcoming assignments for enrolled courses."
        })


class SyllabusViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Syllabus instances
    """
    queryset = Syllabus.objects.all()
    serializer_class = SyllabusSerializer
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
        Optionally restricts the returned syllabi by various filters
        """
        queryset = Syllabus.objects.all()
        
        # Filter by course
        course_id = self.request.query_params.get('course', None)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        # Filter by term
        term_id = self.request.query_params.get('term', None)
        if term_id:
            queryset = queryset.filter(term_id=term_id)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        
        # Search by title
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(title__icontains=search)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)