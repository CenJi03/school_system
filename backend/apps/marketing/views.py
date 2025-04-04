from django.utils import timezone
from django.db.models import Q, Count, Sum, F
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    Campaign,
    Lead,
    Interaction,
    Promotion,
    MarketingAnalytics
)
from .serializers import (
    CampaignSerializer,
    CampaignDetailSerializer,
    LeadSerializer,
    LeadDetailSerializer,
    InteractionSerializer,
    PromotionSerializer,
    MarketingAnalyticsSerializer
)


class CampaignViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Campaign instances
    """
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer
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
            return CampaignDetailSerializer
        return CampaignSerializer
    
    def get_queryset(self):
        """
        Optionally restricts the returned campaigns by various filters
        """
        queryset = Campaign.objects.all()
        
        # Filter by school
        school_id = self.request.query_params.get('school', None)
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        
        # Filter by campaign type
        campaign_type = self.request.query_params.get('campaign_type', None)
        if campaign_type:
            queryset = queryset.filter(campaign_type=campaign_type)
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(Q(end_date__lte=end_date) | Q(end_date__isnull=True))
        
        # Search by name or description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(description__icontains=search))
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def leads(self, request, pk=None):
        """
        Get all leads for a specific campaign
        """
        campaign = self.get_object()
        leads = Lead.objects.filter(campaign=campaign)
        
        # Filter by status
        status_param = request.query_params.get('status', None)
        if status_param:
            leads = leads.filter(status=status_param)
        
        serializer = LeadSerializer(leads, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """
        Get analytics for a specific campaign
        """
        campaign = self.get_object()
        analytics = MarketingAnalytics.objects.filter(campaign=campaign)
        
        # Filter by metric type
        metric_type = request.query_params.get('metric_type', None)
        if metric_type:
            analytics = analytics.filter(metric_type=metric_type)
        
        # Filter by date range
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        
        if start_date:
            analytics = analytics.filter(date__gte=start_date)
        
        if end_date:
            analytics = analytics.filter(date__lte=end_date)
        
        serializer = MarketingAnalyticsSerializer(analytics, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def promotions(self, request, pk=None):
        """
        Get all promotions for a specific campaign
        """
        campaign = self.get_object()
        promotions = Promotion.objects.filter(campaign=campaign)
        
        # Filter by status
        status_param = request.query_params.get('status', None)
        if status_param:
            promotions = promotions.filter(status=status_param)
        
        serializer = PromotionSerializer(promotions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """
        Change the status of a campaign
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to change campaign status."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        campaign = self.get_object()
        
        # Get status from request data
        new_status = request.data.get('status', None)
        if not new_status:
            return Response(
                {"detail": "Status is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status
        valid_statuses = [status for status, _ in Campaign.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {"detail": f"Invalid status. Valid statuses are: {', '.join(valid_statuses)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        campaign.status = new_status
        campaign.updated_by = request.user
        campaign.save()
        
        serializer = self.get_serializer(campaign)
        return Response(serializer.data)


class LeadViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Lead instances
    """
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == 'create':
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        """
        Return appropriate serializer class based on action
        """
        if self.action == 'retrieve':
            return LeadDetailSerializer
        return LeadSerializer
    
    def get_queryset(self):
        """
        Optionally restricts the returned leads by various filters
        """
        queryset = Lead.objects.all()
        
        # Filter by assignee (if not admin, only show leads assigned to the user)
        if not self.request.user.is_staff:
            queryset = queryset.filter(Q(assigned_to=self.request.user) | Q(assigned_to__isnull=True))
        else:
            assigned_to_id = self.request.query_params.get('assigned_to', None)
            if assigned_to_id:
                queryset = queryset.filter(assigned_to_id=assigned_to_id)
        
        # Filter by school
        school_id = self.request.query_params.get('school', None)
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by source
        source = self.request.query_params.get('source', None)
        if source:
            queryset = queryset.filter(source=source)
        
        # Filter by campaign
        campaign_id = self.request.query_params.get('campaign', None)
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        
        # Filter by date range (created_at)
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
        
        # Search by name, email, or phone
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) | 
                Q(last_name__icontains=search) | 
                Q(email__icontains=search) | 
                Q(phone__icontains=search)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def interactions(self, request, pk=None):
        """
        Get all interactions for a specific lead
        """
        lead = self.get_object()
        interactions = Interaction.objects.filter(lead=lead)
        
        # Filter by interaction type
        interaction_type = request.query_params.get('interaction_type', None)
        if interaction_type:
            interactions = interactions.filter(interaction_type=interaction_type)
        
        # Filter by date range
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        
        if start_date:
            interactions = interactions.filter(date__date__gte=start_date)
        
        if end_date:
            interactions = interactions.filter(date__date__lte=end_date)
        
        serializer = InteractionSerializer(interactions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_interaction(self, request, pk=None):
        """
        Add an interaction to a lead
        """
        lead = self.get_object()
        
        # Validate interaction data
        serializer = InteractionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Set default values if not provided
        interaction_data = serializer.validated_data
        interaction_data['lead'] = lead
        
        if 'conducted_by' not in interaction_data:
            interaction_data['conducted_by'] = request.user
        
        if 'date' not in interaction_data:
            interaction_data['date'] = timezone.now()
        
        # Create interaction
        interaction = Interaction.objects.create(
            **interaction_data,
            created_by=request.user,
            updated_by=request.user
        )
        
        # Update lead status if necessary
        if 'status' in request.data:
            lead.status = request.data['status']
            lead.save()
        
        # Update followup date if next_contact_date is provided
        if interaction.next_contact_date:
            lead.followup_date = interaction.next_contact_date
            lead.save()
        
        return Response(InteractionSerializer(interaction).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """
        Assign a lead to a user
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to assign leads."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        lead = self.get_object()
        
        # Get user from request data
        assigned_to_id = request.data.get('assigned_to', None)
        if not assigned_to_id:
            return Response(
                {"detail": "Assigned user ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            assigned_to = User.objects.get(pk=assigned_to_id)
            lead.assigned_to = assigned_to
            lead.updated_by = request.user
            lead.save()
            
            serializer = self.get_serializer(lead)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """
        Change the status of a lead
        """
        lead = self.get_object()
        
        # Get status from request data
        new_status = request.data.get('status', None)
        if not new_status:
            return Response(
                {"detail": "Status is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status
        valid_statuses = [status for status, _ in Lead.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {"detail": f"Invalid status. Valid statuses are: {', '.join(valid_statuses)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        lead.status = new_status
        lead.updated_by = request.user
        lead.save()
        
        # Create an interaction for this status change
        Interaction.objects.create(
            lead=lead,
            interaction_type='other',
            date=timezone.now(),
            summary=f"Status changed to {lead.get_status_display()}",
            conducted_by=request.user,
            created_by=request.user,
            updated_by=request.user
        )
        
        serializer = self.get_serializer(lead)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_leads(self, request):
        """
        Get leads assigned to the current user
        """
        leads = Lead.objects.filter(assigned_to=request.user)
        
        # Filter by status
        status_param = request.query_params.get('status', None)
        if status_param:
            leads = leads.filter(status=status_param)
        
        # Filter by followup date
        followup_date = request.query_params.get('followup_date', None)
        if followup_date:
            leads = leads.filter(followup_date=followup_date)
        
        serializer = self.get_serializer(leads, many=True)
        return Response(serializer.data)


class InteractionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Interaction instances
    """
    queryset = Interaction.objects.all()
    serializer_class = InteractionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Optionally restricts the returned interactions by various filters
        """
        queryset = Interaction.objects.all()
        
        # Filter based on user permissions
        if not self.request.user.is_staff:
            # Regular users can only see interactions for leads assigned to them
            queryset = queryset.filter(lead__assigned_to=self.request.user)
        
        # Filter by lead
        lead_id = self.request.query_params.get('lead', None)
        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)
        
        # Filter by interaction type
        interaction_type = self.request.query_params.get('interaction_type', None)
        if interaction_type:
            queryset = queryset.filter(interaction_type=interaction_type)
        
        # Filter by conducted by
        conducted_by_id = self.request.query_params.get('conducted_by', None)
        if conducted_by_id:
            queryset = queryset.filter(conducted_by_id=conducted_by_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(date__date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(date__date__lte=end_date)
        
        # Search by summary, outcome, or next steps
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(summary__icontains=search) | 
                Q(outcome__icontains=search) | 
                Q(next_steps__icontains=search)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        if 'conducted_by' not in serializer.validated_data:
            serializer.save(
                conducted_by=self.request.user,
                created_by=self.request.user,
                updated_by=self.request.user
            )
        else:
            serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_interactions(self, request):
        """
        Get interactions conducted by the current user
        """
        interactions = Interaction.objects.filter(conducted_by=request.user)
        
        # Filter by date range
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        
        if start_date:
            interactions = interactions.filter(date__date__gte=start_date)
        
        if end_date:
            interactions = interactions.filter(date__date__lte=end_date)
        
        serializer = self.get_serializer(interactions, many=True)
        return Response(serializer.data)


class PromotionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Promotion instances
    """
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer
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
        Optionally restricts the returned promotions by various filters
        """
        queryset = Promotion.objects.all()
        
        # Filter by school
        school_id = self.request.query_params.get('school', None)
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        
        # Filter by campaign
        campaign_id = self.request.query_params.get('campaign', None)
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by validity
        is_valid = self.request.query_params.get('is_valid', None)
        if is_valid is not None:
            is_valid_bool = is_valid.lower() == 'true'
            
            today = timezone.now().date()
            
            if is_valid_bool:
                queryset = queryset.filter(
                    Q(status='active') &
                    Q(start_date__lte=today,) &
                    Q(end_date__gte=today) | Q(end_date__isnull=True)
                )
                # Filter further by max_uses
                queryset = queryset.filter(
                    Q(max_uses__isnull=True) | Q(current_uses__lt=F('max_uses'))
                )
            else:
                expired_by_date = queryset.filter(
                    Q(start_date__gt=today) | Q(end_date__lt=today, end_date__isnull=False)
                )
                expired_by_uses = queryset.filter(
                    max_uses__isnull=False, current_uses__gte=F('max_uses')
                )
                expired_by_status = queryset.exclude(status='active')
                
                queryset = expired_by_date | expired_by_uses | expired_by_status
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(Q(end_date__lte=end_date) | Q(end_date__isnull=True))
        
        # Search by name, code, or description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(code__icontains=search) | 
                Q(description__icontains=search)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def use_promotion(self, request, pk=None):
        """
        Use a promotion (increment current_uses)
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to use promotions."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        promotion = self.get_object()
        
        # Check if promotion is valid
        if not promotion.is_valid:
            return Response(
                {"detail": "Promotion is not valid."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Increment current uses
        promotion.current_uses += 1
        promotion.updated_by = request.user
        promotion.save()
        
        # Check if max uses reached and update status if necessary
        if promotion.max_uses and promotion.current_uses >= promotion.max_uses:
            promotion.status = 'expired'
            promotion.save()
        
        serializer = self.get_serializer(promotion)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """
        Change the status of a promotion
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to change promotion status."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        promotion = self.get_object()
        
        # Get status from request data
        new_status = request.data.get('status', None)
        if not new_status:
            return Response(
                {"detail": "Status is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status
        valid_statuses = [status for status, _ in Promotion.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {"detail": f"Invalid status. Valid statuses are: {', '.join(valid_statuses)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        promotion.status = new_status
        promotion.updated_by = request.user
        promotion.save()
        
        serializer = self.get_serializer(promotion)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def validate_code(self, request):
        """
        Validate a promotion code
        """
        code = request.query_params.get('code', None)
        if not code:
            return Response(
                {"detail": "Promotion code is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            promotion = Promotion.objects.get(code=code)
            
            # Check if promotion is valid
            is_valid = promotion.is_valid
            
            return Response({
                "promotion": PromotionSerializer(promotion).data,
                "is_valid": is_valid,
                "message": "Valid promotion code." if is_valid else "Invalid promotion code."
            })
        except Promotion.DoesNotExist:
            return Response(
                {"detail": "Promotion code not found."},
                status=status.HTTP_404_NOT_FOUND
            )


class MarketingAnalyticsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing MarketingAnalytics instances
    """
    queryset = MarketingAnalytics.objects.all()
    serializer_class = MarketingAnalyticsSerializer
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
        Optionally restricts the returned analytics by various filters
        """
        queryset = MarketingAnalytics.objects.all()
        
        # Filter by school
        school_id = self.request.query_params.get('school', None)
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        
        # Filter by campaign
        campaign_id = self.request.query_params.get('campaign', None)
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        
        # Filter by metric type
        metric_type = self.request.query_params.get('metric_type', None)
        if metric_type:
            queryset = queryset.filter(metric_type=metric_type)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get a summary of analytics for a specific period
        """
        # Filter queryset
        queryset = self.get_queryset()
        
        # Group by metric type and calculate sum
        summary = {}
        metric_types = [mt for mt, _ in MarketingAnalytics.METRIC_TYPE_CHOICES]
        
        for metric_type in metric_types:
            metric_data = queryset.filter(metric_type=metric_type)
            total = metric_data.aggregate(Sum('value'))['value__sum']
            summary[metric_type] = total or 0
        
        # Get total leads by source
        leads_by_source = {}
        for source, label in Lead.SOURCE_CHOICES:
            count = Lead.objects.filter(source=source).count()
            leads_by_source[source] = count
        
        # Get conversion rates
        total_leads = Lead.objects.count()
        converted_leads = Lead.objects.filter(status='converted').count()
        
        # Calculate conversion rate safely
        conversion_rate = 0
        if total_leads > 0:
            conversion_rate = (converted_leads / total_leads) * 100
        
        # Return all data
        return Response({
            "summary": summary,
            "leads_by_source": leads_by_source,
            "total_leads": total_leads,
            "converted_leads": converted_leads,
            "conversion_rate": conversion_rate
        })