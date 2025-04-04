from django.utils import timezone
from django.db.models import Q, Count, Avg
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    Survey,
    Question,
    QuestionOption,
    SurveyResponse,
    Answer,
    Feedback,
    ImprovementPlan,
    QualityMetric,
    MetricMeasurement
)
from .serializers import (
    SurveySerializer,
    SurveyDetailSerializer,
    QuestionSerializer,
    QuestionOptionSerializer,
    SurveyResponseSerializer,
    SurveyResponseCreateSerializer,
    AnswerSerializer,
    FeedbackSerializer,
    ImprovementPlanSerializer,
    QualityMetricSerializer,
    QualityMetricDetailSerializer,
    MetricMeasurementSerializer
)


class SurveyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Survey instances
    """
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer
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
    
    def get_serializer_class(self):
        """
        Return appropriate serializer class based on action
        """
        if self.action == 'retrieve':
            return SurveyDetailSerializer
        return SurveySerializer
    
    def get_queryset(self):
        """
        Optionally restricts the returned surveys by various filters
        """
        queryset = Survey.objects.all()
        
        # Filter by school
        school_id = self.request.query_params.get('school', None)
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        
        # Filter by survey type
        survey_type = self.request.query_params.get('survey_type', None)
        if survey_type:
            queryset = queryset.filter(survey_type=survey_type)
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by target audience
        department_id = self.request.query_params.get('department', None)
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        
        course_id = self.request.query_params.get('course', None)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        instructor_id = self.request.query_params.get('instructor', None)
        if instructor_id:
            queryset = queryset.filter(instructor_id=instructor_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(end_date__lte=end_date)
        
        # Search by title or description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """
        Get all questions for a specific survey
        """
        survey = self.get_object()
        questions = Question.objects.filter(survey=survey).order_by('order')
        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def responses(self, request, pk=None):
        """
        Get all responses for a specific survey
        """
        survey = self.get_object()
        responses = SurveyResponse.objects.filter(survey=survey)
        serializer = SurveyResponseSerializer(responses, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """
        Get statistics for a specific survey
        """
        survey = self.get_object()
        
        # Get total responses
        total_responses = SurveyResponse.objects.filter(survey=survey).count()
        
        # Get responses per question type
        question_stats = []
        for question in Question.objects.filter(survey=survey).order_by('order'):
            question_data = {
                'id': question.id,
                'text': question.text,
                'question_type': question.question_type,
                'is_required': question.is_required,
                'order': question.order,
            }
            
            # Get statistics based on question type
            if question.question_type in ['single_choice', 'multiple_choice']:
                # Get distribution of answers for choice questions
                options = QuestionOption.objects.filter(question=question).order_by('order')
                option_stats = []
                
                for option in options:
                    count = Answer.objects.filter(
                        question=question,
                        selected_options=option
                    ).count()
                    
                    percentage = (count / total_responses * 100) if total_responses > 0 else 0
                    
                    option_stats.append({
                        'id': option.id,
                        'text': option.text,
                        'count': count,
                        'percentage': round(percentage, 2)
                    })
                
                question_data['options'] = option_stats
                
            elif question.question_type in ['rating', 'likert']:
                # Get statistics for rating questions
                answers = Answer.objects.filter(question=question)
                if answers.exists():
                    avg_rating = answers.aggregate(Avg('numeric_answer'))['numeric_answer__avg']
                    question_data['average_rating'] = round(avg_rating, 2) if avg_rating else None
                    
                    # Get distribution of ratings
                    rating_distribution = {}
                    for answer in answers:
                        if answer.numeric_answer is not None:
                            rating = int(answer.numeric_answer)
                            rating_distribution[rating] = rating_distribution.get(rating, 0) + 1
                    
                    question_data['rating_distribution'] = rating_distribution
            
            elif question.question_type == 'yes_no':
                # Get statistics for yes/no questions
                yes_count = Answer.objects.filter(
                    question=question, 
                    text_answer__iexact='yes'
                ).count()
                
                no_count = Answer.objects.filter(
                    question=question, 
                    text_answer__iexact='no'
                ).count()
                
                yes_percentage = (yes_count / total_responses * 100) if total_responses > 0 else 0
                no_percentage = (no_count / total_responses * 100) if total_responses > 0 else 0
                
                question_data['yes_no_stats'] = {
                    'yes_count': yes_count,
                    'no_count': no_count,
                    'yes_percentage': round(yes_percentage, 2),
                    'no_percentage': round(no_percentage, 2)
                }
            
            elif question.question_type in ['text', 'textarea']:
                # Get count of text responses
                text_count = Answer.objects.filter(
                    question=question
                ).exclude(
                    text_answer=''
                ).count()
                
                question_data['response_count'] = text_count
            
            question_stats.append(question_data)
        
        return Response({
            'id': survey.id,
            'title': survey.title,
            'total_responses': total_responses,
            'questions': question_stats
        })


class QuestionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Question instances
    """
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
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
        Optionally restricts the returned questions by various filters
        """
        queryset = Question.objects.all()
        
        # Filter by survey
        survey_id = self.request.query_params.get('survey', None)
        if survey_id:
            queryset = queryset.filter(survey_id=survey_id)
        
        # Filter by question type
        question_type = self.request.query_params.get('question_type', None)
        if question_type:
            queryset = queryset.filter(question_type=question_type)
        
        # Filter by required flag
        is_required = self.request.query_params.get('is_required', None)
        if is_required is not None:
            is_required_bool = is_required.lower() == 'true'
            queryset = queryset.filter(is_required=is_required_bool)
        
        # Search by text or help text
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(Q(text__icontains=search) | Q(help_text__icontains=search))
        
        return queryset.order_by('survey', 'order')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def options(self, request, pk=None):
        """
        Get all options for a specific question
        """
        question = self.get_object()
        options = QuestionOption.objects.filter(question=question).order_by('order')
        serializer = QuestionOptionSerializer(options, many=True)
        return Response(serializer.data)


class QuestionOptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing QuestionOption instances
    """
    queryset = QuestionOption.objects.all()
    serializer_class = QuestionOptionSerializer
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
        Optionally restricts the returned options by various filters
        """
        queryset = QuestionOption.objects.all()
        
        # Filter by question
        question_id = self.request.query_params.get('question', None)
        if question_id:
            queryset = queryset.filter(question_id=question_id)
        
        # Search by text
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(text__icontains=search)
        
        return queryset.order_by('question', 'order')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class SurveyResponseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and creating SurveyResponse instances
    """
    queryset = SurveyResponse.objects.all()
    serializer_class = SurveyResponseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        """
        Return appropriate serializer class based on action
        """
        if self.action == 'create':
            return SurveyResponseCreateSerializer
        return SurveyResponseSerializer
    
    def get_queryset(self):
        """
        Optionally restricts the returned responses by various filters
        """
        queryset = SurveyResponse.objects.all()
        
        # For regular users, only show their own responses
        if not self.request.user.is_staff:
            queryset = queryset.filter(Q(respondent=self.request.user) | Q(survey__is_anonymous=True))
        
        # Filter by survey
        survey_id = self.request.query_params.get('survey', None)
        if survey_id:
            queryset = queryset.filter(survey_id=survey_id)
        
        # Filter by respondent
        respondent_id = self.request.query_params.get('respondent', None)
        if respondent_id and self.request.user.is_staff:
            queryset = queryset.filter(respondent_id=respondent_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(submission_date__date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(submission_date__date__lte=end_date)
        
        return queryset
    
    def perform_create(self, serializer):
        # Add IP address and user agent
        ip_address = self.request.META.get('REMOTE_ADDR', None)
        user_agent = self.request.META.get('HTTP_USER_AGENT', '')
        
        # For anonymous surveys, don't save respondent
        survey_id = serializer.validated_data.get('survey').id
        try:
            survey = Survey.objects.get(pk=survey_id)
            if survey.is_anonymous:
                serializer.validated_data['respondent'] = None
            elif 'respondent' not in serializer.validated_data:
                serializer.validated_data['respondent'] = self.request.user
        except Survey.DoesNotExist:
            pass
        
        serializer.save(
            ip_address=ip_address,
            user_agent=user_agent,
            created_by=self.request.user,
            updated_by=self.request.user
        )
    
    def perform_update(self, serializer):
        # Only admins can update responses
        if not self.request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to update survey responses."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_responses(self, request):
        """
        Get responses submitted by the current user
        """
        responses = SurveyResponse.objects.filter(respondent=request.user)
        
        # Filter by survey
        survey_id = request.query_params.get('survey', None)
        if survey_id:
            responses = responses.filter(survey_id=survey_id)
        
        serializer = self.get_serializer(responses, many=True)
        return Response(serializer.data)


class FeedbackViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Feedback instances
    """
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Optionally restricts the returned feedback by various filters
        """
        queryset = Feedback.objects.all()
        
        # Regular users can only see their own feedback
        if not self.request.user.is_staff:
            queryset = queryset.filter(submitter=self.request.user)
        
        # Filter by school
        school_id = self.request.query_params.get('school', None)
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        
        # Filter by feedback type
        feedback_type = self.request.query_params.get('feedback_type', None)
        if feedback_type:
            queryset = queryset.filter(feedback_type=feedback_type)
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by assigned to
        assigned_to_id = self.request.query_params.get('assigned_to', None)
        if assigned_to_id and self.request.user.is_staff:
            queryset = queryset.filter(assigned_to_id=assigned_to_id)
        
        # Filter by submitter
        submitter_id = self.request.query_params.get('submitter', None)
        if submitter_id and self.request.user.is_staff:
            queryset = queryset.filter(submitter_id=submitter_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
        
        # Search by subject or content
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(Q(subject__icontains=search) | Q(content__icontains=search))
        
        return queryset
    
    def perform_create(self, serializer):
        # For anonymous feedback, don't save submitter
        if serializer.validated_data.get('is_anonymous', False):
            serializer.validated_data['submitter'] = None
        elif 'submitter' not in serializer.validated_data:
            serializer.validated_data['submitter'] = self.request.user
        
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        # Regular users can only update their own feedback if it's still new
        if not self.request.user.is_staff:
            feedback = self.get_object()
            if feedback.submitter != self.request.user:
                return Response(
                    {"detail": "You do not have permission to update this feedback."},
                    status=status.HTTP_403_FORBIDDEN
                )
            if feedback.status != 'new':
                return Response(
                    {"detail": "You can only update feedback that is in 'new' status."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """
        Assign feedback to a user
        """
        if not self.request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to assign feedback."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        feedback = self.get_object()
        
        # Get assigned_to from request data
        assigned_to_id = request.data.get('assigned_to', None)
        if not assigned_to_id:
            return Response(
                {"detail": "Assigned user ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            assigned_to = User.objects.get(pk=assigned_to_id)
            
            feedback.assigned_to = assigned_to
            feedback.status = 'under_review'
            feedback.updated_by = request.user
            feedback.save()
            
            serializer = self.get_serializer(feedback)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """
        Change the status of feedback
        """
        if not self.request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to change feedback status."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        feedback = self.get_object()
        
        # Get status from request data
        new_status = request.data.get('status', None)
        if not new_status:
            return Response(
                {"detail": "Status is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status
        valid_statuses = [status for status, _ in Feedback.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {"detail": f"Invalid status. Valid statuses are: {', '.join(valid_statuses)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update status
        feedback.status = new_status
        
        # If resolving, add resolution details
        if new_status == 'resolved':
            resolution = request.data.get('resolution', '')
            if not resolution:
                return Response(
                    {"detail": "Resolution is required when setting status to resolved."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            feedback.resolution = resolution
            feedback.resolved_date = timezone.now()
        
        feedback.updated_by = request.user
        feedback.save()
        
        serializer = self.get_serializer(feedback)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_feedback(self, request):
        """
        Get feedback submitted by the current user
        """
        feedback = Feedback.objects.filter(submitter=request.user)
        
        # Filter by status
        status_param = request.query_params.get('status', None)
        if status_param:
            feedback = feedback.filter(status=status_param)
        
        serializer = self.get_serializer(feedback, many=True)
        return Response(serializer.data)


class ImprovementPlanViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing ImprovementPlan instances
    """
    queryset = ImprovementPlan.objects.all()
    serializer_class = ImprovementPlanSerializer
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
        Optionally restricts the returned improvement plans by various filters
        """
        queryset = ImprovementPlan.objects.all()
        
        # Filter by school
        school_id = self.request.query_params.get('school', None)
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        
        # Filter by department
        department_id = self.request.query_params.get('department', None)
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        
        # Filter by improvement area
        improvement_area = self.request.query_params.get('improvement_area', None)
        if improvement_area:
            queryset = queryset.filter(improvement_area=improvement_area)
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by responsible person
        responsible_person_id = self.request.query_params.get('responsible_person', None)
        if responsible_person_id:
            queryset = queryset.filter(responsible_person_id=responsible_person_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(start_date__lte=end_date)
        
        # Search by title, description, or objectives
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search) | 
                Q(objectives__icontains=search)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve an improvement plan
        """
        if not self.request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to approve improvement plans."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        plan = self.get_object()
        
        if plan.status != 'draft':
            return Response(
                {"detail": f"Improvement plan is already {plan.get_status_display()}."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        plan.status = 'approved'
        plan.approved_by = request.user
        plan.approved_date = timezone.now().date()
        plan.updated_by = request.user
        plan.save()
        
        serializer = self.get_serializer(plan)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Mark an improvement plan as completed
        """
        if not self.request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to complete improvement plans."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        plan = self.get_object()
        
        if plan.status not in ['approved', 'in_progress']:
            return Response(
                {"detail": "Only approved or in-progress plans can be marked as completed."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        evaluation_results = request.data.get('evaluation_results', '')
        
        plan.status = 'completed'
        plan.actual_completion_date = timezone.now().date()
        
        if evaluation_results:
            plan.evaluation_results = evaluation_results
            plan.evaluation_date = timezone.now().date()
            plan.status = 'evaluated'
        
        plan.updated_by = request.user
        plan.save()
        
        serializer = self.get_serializer(plan)
        return Response(serializer.data)


class QualityMetricViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing QualityMetric instances
    """
    queryset = QualityMetric.objects.all()
    serializer_class = QualityMetricSerializer
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
    
    def get_serializer_class(self):
        """
        Return appropriate serializer class based on action
        """
        if self.action == 'retrieve':
            return QualityMetricDetailSerializer
        return QualityMetricSerializer
    
    def get_queryset(self):
        """
        Optionally restricts the returned metrics by various filters
        """
        queryset = QualityMetric.objects.all()
        
        # Filter by school
        school_id = self.request.query_params.get('school', None)
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        
        # Filter by department
        department_id = self.request.query_params.get('department', None)
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        
        # Filter by metric type
        metric_type = self.request.query_params.get('metric_type', None)
        if metric_type:
            queryset = queryset.filter(metric_type=metric_type)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        
        # Filter by responsible person
        responsible_person_id = self.request.query_params.get('responsible_person', None)
        if responsible_person_id:
            queryset = queryset.filter(responsible_person_id=responsible_person_id)
        
        # Search by name or description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search))