from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.core.serializers import UserMinimalSerializer
from .models import (
    Campaign,
    Lead,
    Interaction,
    Promotion,
    MarketingAnalytics
)

User = get_user_model()


class CampaignSerializer(serializers.ModelSerializer):
    """
    Serializer for the Campaign model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    school_name = serializers.ReadOnlyField(source='school.name')
    campaign_type_display = serializers.CharField(source='get_campaign_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Campaign
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class LeadSerializer(serializers.ModelSerializer):
    """
    Serializer for the Lead model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    assigned_to_details = UserMinimalSerializer(source='assigned_to', read_only=True)
    school_name = serializers.ReadOnlyField(source='school.name')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    campaign_details = serializers.SerializerMethodField(read_only=True)
    full_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Lead
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    def get_campaign_details(self, obj):
        if obj.campaign:
            return {
                'id': obj.campaign.id,
                'name': obj.campaign.name,
                'campaign_type': obj.campaign.get_campaign_type_display()
            }
        return None
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"


class InteractionSerializer(serializers.ModelSerializer):
    """
    Serializer for the Interaction model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    conducted_by_details = UserMinimalSerializer(source='conducted_by', read_only=True)
    lead_details = LeadSerializer(source='lead', read_only=True)
    interaction_type_display = serializers.CharField(source='get_interaction_type_display', read_only=True)
    
    class Meta:
        model = Interaction
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class PromotionSerializer(serializers.ModelSerializer):
    """
    Serializer for the Promotion model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    school_name = serializers.ReadOnlyField(source='school.name')
    campaign_details = serializers.SerializerMethodField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_valid = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Promotion
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by', 'current_uses')
    
    def get_campaign_details(self, obj):
        if obj.campaign:
            return {
                'id': obj.campaign.id,
                'name': obj.campaign.name
            }
        return None


class MarketingAnalyticsSerializer(serializers.ModelSerializer):
    """
    Serializer for the MarketingAnalytics model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    school_name = serializers.ReadOnlyField(source='school.name')
    campaign_details = serializers.SerializerMethodField(read_only=True)
    metric_type_display = serializers.CharField(source='get_metric_type_display', read_only=True)
    
    class Meta:
        model = MarketingAnalytics
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    def get_campaign_details(self, obj):
        if obj.campaign:
            return {
                'id': obj.campaign.id,
                'name': obj.campaign.name
            }
        return None


class LeadDetailSerializer(LeadSerializer):
    """
    Detailed serializer for the Lead model with all interactions
    """
    interactions = InteractionSerializer(many=True, read_only=True)
    
    class Meta(LeadSerializer.Meta):
        pass


class CampaignDetailSerializer(CampaignSerializer):
    """
    Detailed serializer for the Campaign model with analytics and leads
    """
    leads = LeadSerializer(many=True, read_only=True)
    analytics = MarketingAnalyticsSerializer(many=True, read_only=True)
    promotions = PromotionSerializer(many=True, read_only=True)
    
    class Meta(CampaignSerializer.Meta):
        pass