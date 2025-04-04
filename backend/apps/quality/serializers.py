from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from apps.core.serializers import UserMinimalSerializer
from apps.staff.serializers import StaffMemberSerializer
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

User = get_user_model()


class QuestionOptionSerializer(serializers.ModelSerializer):
    """
    Serializer for the QuestionOption model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    
    class Meta:
        model = QuestionOption
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class QuestionSerializer(serializers.ModelSerializer):
    """
    Serializer for the Question model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    options = QuestionOptionSerializer(many=True, read_only=True)
    question_type_display = serializers.CharField(source='get_question_type_display', read_only=True)
    
    class Meta:
        model = Question
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class SurveySerializer(serializers.ModelSerializer):
    """
    Serializer for the Survey model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    survey_type_display = serializers.CharField(source='get_survey_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Survey
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class SurveyDetailSerializer(SurveySerializer):
    """
    Detailed serializer for the Survey model including questions
    """
    questions = QuestionSerializer(many=True, read_only=True)
    
    class Meta(SurveySerializer.Meta):
        pass


class AnswerSerializer(serializers.ModelSerializer):
    """
    Serializer for the Answer model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    question_details = QuestionSerializer(source='question', read_only=True)
    selected_options_details = QuestionOptionSerializer(source='selected_options', many=True, read_only=True)
    
    class Meta:
        model = Answer
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class SurveyResponseSerializer(serializers.ModelSerializer):
    """
    Serializer for the SurveyResponse model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    respondent_details = UserMinimalSerializer(source='respondent', read_only=True)
    survey_details = SurveySerializer(source='survey', read_only=True)
    answers = AnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = SurveyResponse
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by', 'submission_date')


class SurveyResponseCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a survey response with answers
    """
    answers = serializers.ListField(
        child=serializers.JSONField(),
        write_only=True
    )
    
    class Meta:
        model = SurveyResponse
        fields = ('survey', 'respondent', 'answers')
    
    @transaction.atomic
    def create(self, validated_data):
        answers_data = validated_data.pop('answers')
        
        # Create survey response
        survey_response = SurveyResponse.objects.create(**validated_data)
        
        # Create answers
        for answer_data in answers_data:
            question_id = answer_data.get('question_id')
            
            try:
                question = Question.objects.get(pk=question_id)
            except Question.DoesNotExist:
                continue
            
            # Extract answer based on question type
            text_answer = answer_data.get('text_answer', '')
            numeric_answer = answer_data.get('numeric_answer')
            
            # Create answer
            answer = Answer.objects.create(
                survey_response=survey_response,
                question=question,
                text_answer=text_answer,
                numeric_answer=numeric_answer,
                created_by=validated_data.get('created_by'),
                updated_by=validated_data.get('updated_by')
            )
            
            # Add selected options if provided
            option_ids = answer_data.get('selected_options', [])
            if option_ids:
                options = QuestionOption.objects.filter(id__in=option_ids, question=question)
                answer.selected_options.set(options)
        
        return survey_response


class FeedbackSerializer(serializers.ModelSerializer):
    """
    Serializer for the Feedback model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    submitter_details = UserMinimalSerializer(source='submitter', read_only=True)
    assigned_to_details = UserMinimalSerializer(source='assigned_to', read_only=True)
    feedback_type_display = serializers.CharField(source='get_feedback_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Feedback
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class ImprovementPlanSerializer(serializers.ModelSerializer):
    """
    Serializer for the ImprovementPlan model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    responsible_person_details = UserMinimalSerializer(source='responsible_person', read_only=True)
    approved_by_details = UserMinimalSerializer(source='approved_by', read_only=True)
    improvement_area_display = serializers.CharField(source='get_improvement_area_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ImprovementPlan
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class QualityMetricSerializer(serializers.ModelSerializer):
    """
    Serializer for the QualityMetric model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    responsible_person_details = UserMinimalSerializer(source='responsible_person', read_only=True)
    metric_type_display = serializers.CharField(source='get_metric_type_display', read_only=True)
    latest_measurement = serializers.SerializerMethodField()
    
    class Meta:
        model = QualityMetric
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    def get_latest_measurement(self, obj):
        """Get the latest measurement for this metric"""
        measurement = obj.measurements.order_by('-date').first()
        if measurement:
            return {
                'id': measurement.id,
                'date': measurement.date,
                'value': measurement.value,
                'meets_target': measurement.meets_target,
                'meets_minimum': measurement.meets_minimum
            }
        return None


class MetricMeasurementSerializer(serializers.ModelSerializer):
    """
    Serializer for the MetricMeasurement model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    measured_by_details = UserMinimalSerializer(source='measured_by', read_only=True)
    metric_details = QualityMetricSerializer(source='metric', read_only=True)
    meets_target = serializers.BooleanField(read_only=True)
    meets_minimum = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = MetricMeasurement
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class QualityMetricDetailSerializer(QualityMetricSerializer):
    """
    Detailed serializer for the QualityMetric model including measurements
    """
    measurements = MetricMeasurementSerializer(many=True, read_only=True)
    
    class Meta(QualityMetricSerializer.Meta):
        pass