from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from apps.core.models import TimeStampedModel, School

User = get_user_model()


class Campaign(TimeStampedModel):
    """
    Model representing a marketing campaign
    """
    CAMPAIGN_TYPE_CHOICES = (
        ('email', _('Email Campaign')),
        ('social_media', _('Social Media Campaign')),
        ('event', _('Event')),
        ('advertisement', _('Advertisement')),
        ('referral', _('Referral Program')),
        ('promotion', _('Promotion')),
        ('other', _('Other')),
    )
    
    STATUS_CHOICES = (
        ('draft', _('Draft')),
        ('scheduled', _('Scheduled')),
        ('active', _('Active')),
        ('paused', _('Paused')),
        ('completed', _('Completed')),
        ('cancelled', _('Cancelled')),
    )
    
    name = models.CharField(_('Campaign Name'), max_length=255)
    description = models.TextField(_('Description'), blank=True)
    campaign_type = models.CharField(_('Campaign Type'), max_length=20, choices=CAMPAIGN_TYPE_CHOICES)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='campaigns')
    target_audience = models.TextField(_('Target Audience'), blank=True)
    start_date = models.DateField(_('Start Date'))
    end_date = models.DateField(_('End Date'), null=True, blank=True)
    budget = models.DecimalField(_('Budget'), max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(_('Status'), max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Goals and metrics
    goal = models.TextField(_('Campaign Goal'), blank=True)
    success_metrics = models.TextField(_('Success Metrics'), blank=True)
    expected_roi = models.DecimalField(_('Expected ROI (%)'), max_digits=6, decimal_places=2, null=True, blank=True)
    
    class Meta:
        verbose_name = _('Campaign')
        verbose_name_plural = _('Campaigns')
        ordering = ['-start_date', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_campaign_type_display()})"


class Lead(TimeStampedModel):
    """
    Model representing a marketing lead
    """
    STATUS_CHOICES = (
        ('new', _('New')),
        ('contacted', _('Contacted')),
        ('qualified', _('Qualified')),
        ('converted', _('Converted')),
        ('disqualified', _('Disqualified')),
    )
    
    SOURCE_CHOICES = (
        ('website', _('Website')),
        ('social_media', _('Social Media')),
        ('referral', _('Referral')),
        ('event', _('Event')),
        ('advertisement', _('Advertisement')),
        ('direct', _('Direct Contact')),
        ('other', _('Other')),
    )
    
    first_name = models.CharField(_('First Name'), max_length=100)
    last_name = models.CharField(_('Last Name'), max_length=100)
    email = models.EmailField(_('Email'))
    phone = models.CharField(_('Phone'), max_length=20, blank=True)
    address = models.TextField(_('Address'), blank=True)
    
    # Lead details
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='leads')
    status = models.CharField(_('Status'), max_length=20, choices=STATUS_CHOICES, default='new')
    source = models.CharField(_('Source'), max_length=20, choices=SOURCE_CHOICES)
    campaign = models.ForeignKey(Campaign, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads')
    
    # Interest details
    interest = models.TextField(_('Interest'), blank=True)
    notes = models.TextField(_('Notes'), blank=True)
    
    # Assigned to
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_leads')
    
    # Follow-up data
    followup_date = models.DateField(_('Follow-up Date'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('Lead')
        verbose_name_plural = _('Leads')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"


class Interaction(TimeStampedModel):
    """
    Model representing interactions with a lead
    """
    INTERACTION_TYPE_CHOICES = (
        ('email', _('Email')),
        ('phone', _('Phone Call')),
        ('meeting', _('Meeting')),
        ('website', _('Website Visit')),
        ('social_media', _('Social Media')),
        ('other', _('Other')),
    )
    
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='interactions')
    interaction_type = models.CharField(_('Interaction Type'), max_length=20, choices=INTERACTION_TYPE_CHOICES)
    date = models.DateTimeField(_('Date'))
    summary = models.TextField(_('Summary'))
    conducted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='conducted_interactions')
    
    # Outcome and next steps
    outcome = models.TextField(_('Outcome'), blank=True)
    next_steps = models.TextField(_('Next Steps'), blank=True)
    next_contact_date = models.DateField(_('Next Contact Date'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('Interaction')
        verbose_name_plural = _('Interactions')
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.lead} - {self.get_interaction_type_display()} on {self.date}"


class Promotion(TimeStampedModel):
    """
    Model representing a promotional offer
    """
    STATUS_CHOICES = (
        ('draft', _('Draft')),
        ('active', _('Active')),
        ('expired', _('Expired')),
        ('cancelled', _('Cancelled')),
    )
    
    name = models.CharField(_('Promotion Name'), max_length=255)
    description = models.TextField(_('Description'))
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='promotions')
    campaign = models.ForeignKey(Campaign, on_delete=models.SET_NULL, null=True, blank=True, related_name='promotions')
    code = models.CharField(_('Promotion Code'), max_length=50, unique=True)
    discount_amount = models.DecimalField(_('Discount Amount'), max_digits=10, decimal_places=2, null=True, blank=True)
    discount_percentage = models.DecimalField(_('Discount Percentage'), max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Validity
    start_date = models.DateField(_('Start Date'))
    end_date = models.DateField(_('End Date'))
    max_uses = models.PositiveIntegerField(_('Maximum Uses'), null=True, blank=True)
    current_uses = models.PositiveIntegerField(_('Current Uses'), default=0)
    
    status = models.CharField(_('Status'), max_length=20, choices=STATUS_CHOICES, default='draft')
    terms_conditions = models.TextField(_('Terms and Conditions'), blank=True)
    
    class Meta:
        verbose_name = _('Promotion')
        verbose_name_plural = _('Promotions')
        ordering = ['-start_date', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.code})"
    
    @property
    def is_valid(self):
        """Check if the promotion is still valid"""
        from django.utils import timezone
        today = timezone.now().date()
        
        if self.status != 'active':
            return False
        
        if today < self.start_date or (self.end_date and today > self.end_date):
            return False
        
        if self.max_uses and self.current_uses >= self.max_uses:
            return False
        
        return True


class MarketingAnalytics(TimeStampedModel):
    """
    Model for storing marketing analytics data
    """
    METRIC_TYPE_CHOICES = (
        ('website_visits', _('Website Visits')),
        ('lead_generation', _('Lead Generation')),
        ('conversion_rate', _('Conversion Rate')),
        ('cost_per_lead', _('Cost Per Lead')),
        ('roi', _('ROI')),
        ('social_media_engagement', _('Social Media Engagement')),
        ('email_open_rate', _('Email Open Rate')),
        ('referral_success', _('Referral Success')),
        ('other', _('Other')),
    )
    
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='marketing_analytics')
    date = models.DateField(_('Date'))
    campaign = models.ForeignKey(Campaign, on_delete=models.SET_NULL, null=True, blank=True, related_name='analytics')
    metric_type = models.CharField(_('Metric Type'), max_length=30, choices=METRIC_TYPE_CHOICES)
    value = models.DecimalField(_('Value'), max_digits=10, decimal_places=2)
    notes = models.TextField(_('Notes'), blank=True)
    
    class Meta:
        verbose_name = _('Marketing Analytics')
        verbose_name_plural = _('Marketing Analytics')
        ordering = ['-date', 'metric_type']
        unique_together = ['school', 'date', 'campaign', 'metric_type']
    
    def __str__(self):
        return f"{self.get_metric_type_display()} - {self.date}: {self.value}"