from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from apps.core.serializers import UserMinimalSerializer
from apps.students.serializers import StudentSerializer
from .models import (
    FeeStructure,
    FeeItem,
    Invoice,
    InvoiceItem,
    Payment,
    Expense,
    Budget,
    BudgetItem
)

User = get_user_model()


class FeeItemSerializer(serializers.ModelSerializer):
    """
    Serializer for the FeeItem model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    fee_type_display = serializers.CharField(source='get_fee_type_display', read_only=True)
    
    class Meta:
        model = FeeItem
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class FeeStructureSerializer(serializers.ModelSerializer):
    """
    Serializer for the FeeStructure model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    items = FeeItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = FeeStructure
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class FeeStructureDetailSerializer(FeeStructureSerializer):
    """
    Detailed serializer for the FeeStructure model
    """
    items = FeeItemSerializer(many=True, read_only=True)
    
    class Meta(FeeStructureSerializer.Meta):
        pass


class InvoiceItemSerializer(serializers.ModelSerializer):
    """
    Serializer for the InvoiceItem model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    fee_item_details = FeeItemSerializer(source='fee_item', read_only=True)
    
    class Meta:
        model = InvoiceItem
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Payment model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    received_by_details = UserMinimalSerializer(source='received_by', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class InvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for the Invoice model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    student_details = StudentSerializer(source='student', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    items = InvoiceItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class InvoiceCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating an invoice with its items
    """
    items = InvoiceItemSerializer(many=True)
    
    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        # Calculate the subtotal, total if not provided
        if 'subtotal' not in validated_data:
            subtotal = sum(item['subtotal'] for item in items_data)
            validated_data['subtotal'] = subtotal
        
        if 'total' not in validated_data:
            validated_data['total'] = validated_data['subtotal'] - validated_data.get('discount', 0) + validated_data.get('tax', 0)
        
        # Create invoice
        invoice = Invoice.objects.create(**validated_data)
        
        # Create invoice items
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)
        
        return invoice


class ExpenseSerializer(serializers.ModelSerializer):
    """
    Serializer for the Expense model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    requested_by_details = UserMinimalSerializer(source='requested_by', read_only=True)
    approved_by_details = UserMinimalSerializer(source='approved_by', read_only=True)
    expense_type_display = serializers.CharField(source='get_expense_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class BudgetItemSerializer(serializers.ModelSerializer):
    """
    Serializer for the BudgetItem model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    variance = serializers.DecimalField(read_only=True, max_digits=10, decimal_places=2)
    variance_percentage = serializers.DecimalField(read_only=True, max_digits=10, decimal_places=2)
    
    class Meta:
        model = BudgetItem
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class BudgetSerializer(serializers.ModelSerializer):
    """
    Serializer for the Budget model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    prepared_by_details = UserMinimalSerializer(source='prepared_by', read_only=True)
    approved_by_details = UserMinimalSerializer(source='approved_by', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    items = BudgetItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Budget
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class BudgetCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a budget with its items
    """
    items = BudgetItemSerializer(many=True)
    
    class Meta:
        model = Budget
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        # Create budget
        budget = Budget.objects.create(**validated_data)
        
        # Create budget items
        for item_data in items_data:
            BudgetItem.objects.create(budget=budget, **item_data)
        
        return budget