from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from apps.core.models import TimeStampedModel, School, Term
from apps.students.models import Student

User = get_user_model()


class FeeStructure(TimeStampedModel):
    """
    Model representing fee structures for different courses or programs
    """
    name = models.CharField(_('Fee Structure Name'), max_length=255)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='fee_structures')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='fee_structures')
    description = models.TextField(_('Description'), blank=True)
    is_active = models.BooleanField(_('Active'), default=True)
    
    class Meta:
        verbose_name = _('Fee Structure')
        verbose_name_plural = _('Fee Structures')
        ordering = ['-term__start_date', 'name']
    
    def __str__(self):
        return f"{self.name} - {self.term.name}"


class FeeItem(TimeStampedModel):
    """
    Model representing individual fee items within a fee structure
    """
    FEE_TYPE_CHOICES = (
        ('tuition', _('Tuition Fee')),
        ('registration', _('Registration Fee')),
        ('exam', _('Examination Fee')),
        ('library', _('Library Fee')),
        ('lab', _('Laboratory Fee')),
        ('activity', _('Activity Fee')),
        ('transportation', _('Transportation Fee')),
        ('accommodation', _('Accommodation Fee')),
        ('materials', _('Learning Materials')),
        ('other', _('Other')),
    )
    
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(_('Fee Item Name'), max_length=255)
    fee_type = models.CharField(_('Fee Type'), max_length=20, choices=FEE_TYPE_CHOICES)
    amount = models.DecimalField(_('Amount'), max_digits=10, decimal_places=2)
    description = models.TextField(_('Description'), blank=True)
    is_optional = models.BooleanField(_('Optional'), default=False)
    due_date = models.DateField(_('Due Date'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('Fee Item')
        verbose_name_plural = _('Fee Items')
        ordering = ['fee_type', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.amount})"


class Invoice(TimeStampedModel):
    """
    Model representing invoices issued to students
    """
    INVOICE_STATUS_CHOICES = (
        ('draft', _('Draft')),
        ('sent', _('Sent')),
        ('partially_paid', _('Partially Paid')),
        ('paid', _('Paid')),
        ('overdue', _('Overdue')),
        ('cancelled', _('Cancelled')),
    )
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='invoices')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='invoices')
    invoice_number = models.CharField(_('Invoice Number'), max_length=50, unique=True)
    issue_date = models.DateField(_('Issue Date'))
    due_date = models.DateField(_('Due Date'))
    
    subtotal = models.DecimalField(_('Subtotal'), max_digits=10, decimal_places=2)
    discount = models.DecimalField(_('Discount'), max_digits=10, decimal_places=2, default=0.00)
    tax = models.DecimalField(_('Tax'), max_digits=10, decimal_places=2, default=0.00)
    total = models.DecimalField(_('Total'), max_digits=10, decimal_places=2)
    
    status = models.CharField(_('Status'), max_length=20, choices=INVOICE_STATUS_CHOICES, default='draft')
    notes = models.TextField(_('Notes'), blank=True)
    
    class Meta:
        verbose_name = _('Invoice')
        verbose_name_plural = _('Invoices')
        ordering = ['-issue_date', '-id']
    
    def __str__(self):
        return f"Invoice #{self.invoice_number} - {self.student.user.get_full_name()}"
    
    def save(self, *args, **kwargs):
        # Calculate the total if not provided
        if not self.total:
            self.total = self.subtotal - self.discount + self.tax
        super().save(*args, **kwargs)


class InvoiceItem(TimeStampedModel):
    """
    Model representing individual items within an invoice
    """
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    fee_item = models.ForeignKey(FeeItem, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.CharField(_('Description'), max_length=255)
    quantity = models.PositiveSmallIntegerField(_('Quantity'), default=1)
    unit_price = models.DecimalField(_('Unit Price'), max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(_('Subtotal'), max_digits=10, decimal_places=2)
    
    class Meta:
        verbose_name = _('Invoice Item')
        verbose_name_plural = _('Invoice Items')
        ordering = ['invoice', 'id']
    
    def __str__(self):
        return f"{self.description} - {self.subtotal}"
    
    def save(self, *args, **kwargs):
        # Calculate the subtotal if not provided
        if not self.subtotal:
            self.subtotal = self.quantity * self.unit_price
        super().save(*args, **kwargs)


class Payment(TimeStampedModel):
    """
    Model representing payments made against invoices
    """
    PAYMENT_METHOD_CHOICES = (
        ('cash', _('Cash')),
        ('bank_transfer', _('Bank Transfer')),
        ('credit_card', _('Credit Card')),
        ('debit_card', _('Debit Card')),
        ('mobile_money', _('Mobile Money')),
        ('cheque', _('Cheque')),
        ('other', _('Other')),
    )
    
    PAYMENT_STATUS_CHOICES = (
        ('pending', _('Pending')),
        ('completed', _('Completed')),
        ('failed', _('Failed')),
        ('refunded', _('Refunded')),
    )
    
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(_('Amount'), max_digits=10, decimal_places=2)
    payment_date = models.DateField(_('Payment Date'))
    payment_method = models.CharField(_('Payment Method'), max_length=20, choices=PAYMENT_METHOD_CHOICES)
    received_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='payments_received')
    
    transaction_id = models.CharField(_('Transaction ID'), max_length=100, blank=True)
    receipt_number = models.CharField(_('Receipt Number'), max_length=50, blank=True)
    status = models.CharField(_('Status'), max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    notes = models.TextField(_('Notes'), blank=True)
    
    class Meta:
        verbose_name = _('Payment')
        verbose_name_plural = _('Payments')
        ordering = ['-payment_date', '-id']
    
    def __str__(self):
        return f"Payment {self.receipt_number} - {self.amount} ({self.get_payment_method_display()})"


class Expense(TimeStampedModel):
    """
    Model representing various expenses
    """
    EXPENSE_TYPE_CHOICES = (
        ('utilities', _('Utilities')),
        ('salaries', _('Salaries & Wages')),
        ('maintenance', _('Maintenance')),
        ('supplies', _('Supplies & Materials')),
        ('equipment', _('Equipment')),
        ('transport', _('Transportation')),
        ('events', _('Events & Activities')),
        ('services', _('Professional Services')),
        ('rent', _('Rent & Leases')),
        ('marketing', _('Marketing & Advertising')),
        ('insurance', _('Insurance')),
        ('taxes', _('Taxes & Licenses')),
        ('other', _('Other')),
    )
    
    EXPENSE_STATUS_CHOICES = (
        ('pending', _('Pending Approval')),
        ('approved', _('Approved')),
        ('rejected', _('Rejected')),
        ('paid', _('Paid')),
        ('cancelled', _('Cancelled')),
    )
    
    PAYMENT_METHOD_CHOICES = (
        ('cash', _('Cash')),
        ('bank_transfer', _('Bank Transfer')),
        ('credit_card', _('Credit Card')),
        ('debit_card', _('Debit Card')),
        ('mobile_money', _('Mobile Money')),
        ('cheque', _('Cheque')),
        ('other', _('Other')),
    )
    
    title = models.CharField(_('Title'), max_length=255)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='expenses')
    expense_type = models.CharField(_('Expense Type'), max_length=20, choices=EXPENSE_TYPE_CHOICES)
    description = models.TextField(_('Description'), blank=True)
    amount = models.DecimalField(_('Amount'), max_digits=10, decimal_places=2)
    expense_date = models.DateField(_('Expense Date'))
    
    vendor = models.CharField(_('Vendor/Payee'), max_length=255, blank=True)
    receipt = models.FileField(_('Receipt/Invoice'), upload_to='expenses/receipts/', null=True, blank=True)
    
    requested_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                    related_name='expenses_requested')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='expenses_approved')
    approved_date = models.DateField(_('Approval Date'), null=True, blank=True)
    
    status = models.CharField(_('Status'), max_length=20, choices=EXPENSE_STATUS_CHOICES, default='pending')
    
    payment_date = models.DateField(_('Payment Date'), null=True, blank=True)
    payment_method = models.CharField(_('Payment Method'), max_length=20, choices=PAYMENT_METHOD_CHOICES,
                                    null=True, blank=True)
    payment_reference = models.CharField(_('Payment Reference'), max_length=100, blank=True)
    
    class Meta:
        verbose_name = _('Expense')
        verbose_name_plural = _('Expenses')
        ordering = ['-expense_date', '-id']
    
    def __str__(self):
        return f"{self.title} - {self.amount} ({self.get_expense_type_display()})"


class Budget(TimeStampedModel):
    """
    Model representing budgets
    """
    BUDGET_STATUS_CHOICES = (
        ('draft', _('Draft')),
        ('review', _('Under Review')),
        ('approved', _('Approved')),
        ('rejected', _('Rejected')),
        ('active', _('Active')),
        ('closed', _('Closed')),
    )
    
    title = models.CharField(_('Title'), max_length=255)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='budgets')
    fiscal_year = models.CharField(_('Fiscal Year'), max_length=9, help_text=_("Format: YYYY-YYYY"))
    
    description = models.TextField(_('Description'), blank=True)
    department = models.CharField(_('Department'), max_length=255, blank=True)
    project = models.CharField(_('Project'), max_length=255, blank=True)
    
    start_date = models.DateField(_('Start Date'))
    end_date = models.DateField(_('End Date'))
    
    total_amount = models.DecimalField(_('Total Budget Amount'), max_digits=12, decimal_places=2)
    
    prepared_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='budgets_prepared')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='budgets_approved')
    approved_date = models.DateField(_('Approval Date'), null=True, blank=True)
    
    status = models.CharField(_('Status'), max_length=20, choices=BUDGET_STATUS_CHOICES, default='draft')
    
    class Meta:
        verbose_name = _('Budget')
        verbose_name_plural = _('Budgets')
        ordering = ['-fiscal_year', 'title']
    
    def __str__(self):
        return f"{self.title} - {self.fiscal_year}"


class BudgetItem(TimeStampedModel):
    """
    Model representing individual items within a budget
    """
    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='items')
    category = models.CharField(_('Category'), max_length=255)
    description = models.TextField(_('Description'), blank=True)
    amount = models.DecimalField(_('Budgeted Amount'), max_digits=10, decimal_places=2)
    actual_amount = models.DecimalField(_('Actual Amount'), max_digits=10, decimal_places=2, default=0.00)
    notes = models.TextField(_('Notes'), blank=True)
    
    class Meta:
        verbose_name = _('Budget Item')
        verbose_name_plural = _('Budget Items')
        ordering = ['budget', 'category']
    
    def __str__(self):
        return f"{self.category} - {self.amount}"
    
    @property
    def variance(self):
        """Calculate the difference between budgeted and actual amount"""
        return self.amount - self.actual_amount
    
    @property
    def variance_percentage(self):
        """Calculate the variance as a percentage of the budgeted amount"""
        if self.amount > 0:
            return (self.variance / self.amount) * 100
        return 0