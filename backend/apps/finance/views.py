from django.utils import timezone
from django.db.models import Q, Sum, F, Count
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction

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
from .serializers import (
    FeeStructureSerializer,
    FeeStructureDetailSerializer,
    FeeItemSerializer,
    InvoiceSerializer,
    InvoiceCreateSerializer,
    InvoiceItemSerializer,
    PaymentSerializer,
    ExpenseSerializer,
    BudgetSerializer,
    BudgetCreateSerializer,
    BudgetItemSerializer
)


class FeeStructureViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing FeeStructure instances
    """
    queryset = FeeStructure.objects.all()
    serializer_class = FeeStructureSerializer
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
            return FeeStructureDetailSerializer
        return FeeStructureSerializer
    
    def get_queryset(self):
        """
        Optionally restricts the returned fee structures by various filters
        """
        queryset = FeeStructure.objects.all()
        
        # Filter by school
        school_id = self.request.query_params.get('school', None)
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        
        # Filter by term
        term_id = self.request.query_params.get('term', None)
        if term_id:
            queryset = queryset.filter(term_id=term_id)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        
        # Search by name or description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(description__icontains=search))
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class FeeItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing FeeItem instances
    """
    queryset = FeeItem.objects.all()
    serializer_class = FeeItemSerializer
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
        Optionally restricts the returned fee items by various filters
        """
        queryset = FeeItem.objects.all()
        
        # Filter by fee structure
        fee_structure_id = self.request.query_params.get('fee_structure', None)
        if fee_structure_id:
            queryset = queryset.filter(fee_structure_id=fee_structure_id)
        
        # Filter by fee type
        fee_type = self.request.query_params.get('fee_type', None)
        if fee_type:
            queryset = queryset.filter(fee_type=fee_type)
        
        # Filter by optional status
        is_optional = self.request.query_params.get('is_optional', None)
        if is_optional is not None:
            is_optional_bool = is_optional.lower() == 'true'
            queryset = queryset.filter(is_optional=is_optional_bool)
        
        # Search by name or description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(description__icontains=search))
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Invoice instances
    """
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
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
        if self.action == 'create':
            return InvoiceCreateSerializer
        return InvoiceSerializer
    
    def get_queryset(self):
        """
        Optionally restricts the returned invoices by various filters
        """
        queryset = Invoice.objects.all()
        
        # Regular users can only see their own invoices
        if not self.request.user.is_staff:
            try:
                student = self.request.user.student_profile
                queryset = queryset.filter(student=student)
            except:
                return Invoice.objects.none()
        
        # Filter by student
        student_id = self.request.query_params.get('student', None)
        if student_id and self.request.user.is_staff:
            queryset = queryset.filter(student_id=student_id)
        
        # Filter by term
        term_id = self.request.query_params.get('term', None)
        if term_id:
            queryset = queryset.filter(term_id=term_id)
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(issue_date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(issue_date__lte=end_date)
        
        # Search by invoice number
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(invoice_number__icontains=search)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def items(self, request, pk=None):
        """
        Get all items for a specific invoice
        """
        invoice = self.get_object()
        items = InvoiceItem.objects.filter(invoice=invoice)
        serializer = InvoiceItemSerializer(items, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def payments(self, request, pk=None):
        """
        Get all payments for a specific invoice
        """
        invoice = self.get_object()
        payments = Payment.objects.filter(invoice=invoice)
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """
        Add a payment to an invoice
        """
        invoice = self.get_object()
        
        # Only staff can add payments
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to add payments."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate payment data
        serializer = PaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Set default values if not provided
        payment_data = serializer.validated_data
        payment_data['invoice'] = invoice
        if 'received_by' not in payment_data:
            payment_data['received_by'] = request.user
        
        # Create payment
        with transaction.atomic():
            payment = Payment.objects.create(**payment_data, created_by=request.user, updated_by=request.user)
            
            # Update invoice status based on payments
            total_paid = Payment.objects.filter(invoice=invoice, status='completed').aggregate(total=Sum('amount'))['total'] or 0
            
            if total_paid >= invoice.total:
                invoice.status = 'paid'
            elif total_paid > 0:
                invoice.status = 'partially_paid'
            
            invoice.save()
        
        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def my_invoices(self, request):
        """
        Get invoices for the current user
        """
        try:
            student = request.user.student_profile
            invoices = Invoice.objects.filter(student=student)
            
            # Filter by status
            status_param = request.query_params.get('status', None)
            if status_param:
                invoices = invoices.filter(status=status_param)
            
            # Filter by term
            term_id = request.query_params.get('term', None)
            if term_id:
                invoices = invoices.filter(term_id=term_id)
            
            serializer = self.get_serializer(invoices, many=True)
            return Response(serializer.data)
        except:
            return Response([])


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Payment instances
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
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
        Optionally restricts the returned payments by various filters
        """
        queryset = Payment.objects.all()
        
        # Regular users can only see their own payments
        if not self.request.user.is_staff:
            try:
                student = self.request.user.student_profile
                queryset = queryset.filter(invoice__student=student)
            except:
                return Payment.objects.none()
        
        # Filter by invoice
        invoice_id = self.request.query_params.get('invoice', None)
        if invoice_id:
            queryset = queryset.filter(invoice_id=invoice_id)
        
        # Filter by student (for staff only)
        student_id = self.request.query_params.get('student', None)
        if student_id and self.request.user.is_staff:
            queryset = queryset.filter(invoice__student_id=student_id)
        
        # Filter by payment method
        payment_method = self.request.query_params.get('payment_method', None)
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(payment_date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(payment_date__lte=end_date)
        
        # Search by receipt number or transaction ID
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(receipt_number__icontains=search) | 
                Q(transaction_id__icontains=search)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        payment = serializer.save(created_by=self.request.user, updated_by=self.request.user)
        
        # Update invoice status based on payments
        invoice = payment.invoice
        total_paid = Payment.objects.filter(invoice=invoice, status='completed').aggregate(total=Sum('amount'))['total'] or 0
        
        if total_paid >= invoice.total:
            invoice.status = 'paid'
        elif total_paid > 0:
            invoice.status = 'partially_paid'
        
        invoice.save()
    
    def perform_update(self, serializer):
        payment = serializer.save(updated_by=self.request.user)
        
        # Update invoice status based on payments when payment status changes
        if 'status' in serializer.validated_data:
            invoice = payment.invoice
            total_paid = Payment.objects.filter(invoice=invoice, status='completed').aggregate(total=Sum('amount'))['total'] or 0
            
            if total_paid >= invoice.total:
                invoice.status = 'paid'
            elif total_paid > 0:
                invoice.status = 'partially_paid'
            else:
                # If no completed payments, revert to sent status
                invoice.status = 'sent'
            
            invoice.save()
    
    @action(detail=False, methods=['get'])
    def my_payments(self, request):
        """
        Get payments for the current user
        """
        try:
            student = request.user.student_profile
            payments = Payment.objects.filter(invoice__student=student)
            
            # Filter by status
            status_param = request.query_params.get('status', None)
            if status_param:
                payments = payments.filter(status=status_param)
            
            serializer = self.get_serializer(payments, many=True)
            return Response(serializer.data)
        except:
            return Response([])


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Expense instances
    """
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
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
    
    def get_queryset(self):
        """
        Optionally restricts the returned expenses by various filters
        """
        queryset = Expense.objects.all()
        
        # Regular users can only see their own expense requests
        if not self.request.user.is_staff:
            queryset = queryset.filter(requested_by=self.request.user)
        
        # Filter by school
        school_id = self.request.query_params.get('school', None)
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        
        # Filter by expense type
        expense_type = self.request.query_params.get('expense_type', None)
        if expense_type:
            queryset = queryset.filter(expense_type=expense_type)
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by requestor (for staff only)
        requested_by_id = self.request.query_params.get('requested_by', None)
        if requested_by_id and self.request.user.is_staff:
            queryset = queryset.filter(requested_by_id=requested_by_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(expense_date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(expense_date__lte=end_date)
        
        # Search by title, description, or vendor
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search) | 
                Q(vendor__icontains=search)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        # Set requested_by to current user if not provided
        if 'requested_by' not in serializer.validated_data:
            serializer.save(
                requested_by=self.request.user,
                created_by=self.request.user,
                updated_by=self.request.user
            )
        else:
            serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve an expense request
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to approve expense requests."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        expense = self.get_object()
        
        if expense.status != 'pending':
            return Response(
                {"detail": f"Expense request is already {expense.get_status_display()}."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        expense.status = 'approved'
        expense.approved_by = request.user
        expense.approved_date = timezone.now().date()
        expense.updated_by = request.user
        expense.save()
        
        serializer = self.get_serializer(expense)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject an expense request
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to reject expense requests."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        expense = self.get_object()
        
        if expense.status != 'pending':
            return Response(
                {"detail": f"Expense request is already {expense.get_status_display()}."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        expense.status = 'rejected'
        expense.approved_by = request.user
        expense.approved_date = timezone.now().date()
        expense.updated_by = request.user
        expense.save()
        
        serializer = self.get_serializer(expense)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_paid(self, request, pk=None):
        """
        Mark an expense as paid
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to mark expenses as paid."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        expense = self.get_object()
        
        if expense.status != 'approved':
            return Response(
                {"detail": "Only approved expenses can be marked as paid."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get payment details
        payment_method = request.data.get('payment_method')
        payment_reference = request.data.get('payment_reference')
        
        if not payment_method:
            return Response(
                {"detail": "Payment method is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        expense.status = 'paid'
        expense.payment_date = timezone.now().date()
        expense.payment_method = payment_method
        expense.payment_reference = payment_reference
        expense.updated_by = request.user
        expense.save()
        
        serializer = self.get_serializer(expense)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_expenses(self, request):
        """
        Get expenses requested by the current user
        """
        expenses = Expense.objects.filter(requested_by=request.user)
        
        # Filter by status
        status_param = request.query_params.get('status', None)
        if status_param:
            expenses = expenses.filter(status=status_param)
        
        serializer = self.get_serializer(expenses, many=True)
        return Response(serializer.data)


class BudgetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Budget instances
    """
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer
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
        Optionally restricts the returned budgets by various filters
        """
        queryset = Budget.objects.all()
        
        # Filter by fiscal year
        fiscal_year = self.request.query_params.get('fiscal_year', None)
        if fiscal_year:
            queryset = queryset.filter(fiscal_year=fiscal_year)
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Search by title
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(title__icontains=search)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """
        Get a summary of the budget including variances
        """
        budget = self.get_object()
        items = BudgetItem.objects.filter(budget=budget)
        
        total_budgeted = items.aggregate(total=Sum('amount'))['total'] or 0
        total_actual = items.aggregate(total=Sum('actual_amount'))['total'] or 0
        total_variance = total_budgeted - total_actual
        
        # Calculate variance percentage
        variance_percentage = 0
        if total_budgeted > 0:
            variance_percentage = (total_variance / total_budgeted) * 100
        
        # Get top categories by spending
        top_categories = items.values('category').annotate(
            budgeted=Sum('amount'),
            actual=Sum('actual_amount'),
            variance=Sum(F('amount') - F('actual_amount'))
        ).order_by('-actual')[:5]
        
        # Get categories with largest variances
        largest_variances = items.values('category').annotate(
            budgeted=Sum('amount'),
            actual=Sum('actual_amount'),
            variance=Sum(F('amount') - F('actual_amount'))
        ).order_by(F('variance').asc())[:5]  # Ascending for largest negative variances
        
        return Response({
            'id': budget.id,
            'title': budget.title,
            'fiscal_year': budget.fiscal_year,
            'status': budget.status,
            'total_budgeted': total_budgeted,
            'total_actual': total_actual,
            'total_variance': total_variance,
            'variance_percentage': variance_percentage,
            'top_categories': top_categories,
            'largest_variances': largest_variances,
        })


class BudgetItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing BudgetItem instances
    """
    queryset = BudgetItem.objects.all()
    serializer_class = BudgetItemSerializer
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
        Optionally restricts the returned budget items by various filters
        """
        queryset = BudgetItem.objects.all()
        
        # Filter by budget
        budget_id = self.request.query_params.get('budget', None)
        if budget_id:
            queryset = queryset.filter(budget_id=budget_id)
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__icontains=category)
        
        # Search by name or description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(description__icontains=search))
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def update_actual(self, request, pk=None):
        """
        Update the actual amount for a budget item
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to update actual amounts."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        budget_item = self.get_object()
        actual_amount = request.data.get('actual_amount', None)
        
        if actual_amount is None:
            return Response(
                {"detail": "Actual amount is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            actual_amount = float(actual_amount)
        except ValueError:
            return Response(
                {"detail": "Actual amount must be a number."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        budget_item.actual_amount = actual_amount
        budget_item.updated_by = request.user
        budget_item.save()
        
        serializer = self.get_serializer(budget_item)
        return Response(serializer.data)