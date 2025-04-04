from django.contrib import admin
from .models import (
    FeeStructure,
    FeeItem,
    Invoice,  # Add Invoice to imports
    InvoiceItem,
    Payment,
    Expense,
    Budget,
    BudgetItem
)


class FeeItemInline(admin.TabularInline):
    model = FeeItem
    extra = 1


@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ('name', 'school', 'term', 'is_active')
    list_filter = ('school', 'term', 'is_active')
    search_fields = ('name', 'description')
    inlines = [FeeItemInline]
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'school', 'term', 'is_active')
        }),
        ('Additional Information', {
            'fields': ('description',)
        }),
        ('Audit Trail', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(FeeItem)
class FeeItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'fee_structure', 'fee_type', 'amount', 'is_optional')
    list_filter = ('fee_type', 'is_optional', 'fee_structure__term')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('fee_structure', 'name', 'fee_type', 'amount', 'is_optional')
        }),
        ('Additional Information', {
            'fields': ('description', 'due_date')
        }),
        ('Audit Trail', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'student', 'term', 'issue_date', 'due_date', 'total', 'status')
    list_filter = ('status', 'issue_date', 'due_date', 'term')
    search_fields = ('invoice_number', 'student__student_id', 'student__user__first_name', 'student__user__last_name')
    inlines = [InvoiceItemInline, PaymentInline]
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('student', 'term', 'invoice_number', 'issue_date', 'due_date', 'status')
        }),
        ('Financial Information', {
            'fields': ('subtotal', 'discount', 'tax', 'total')
        }),
        ('Additional Information', {
            'fields': ('notes',)
        }),
        ('Audit Trail', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(InvoiceItem)
class InvoiceItemAdmin(admin.ModelAdmin):
    list_display = ('invoice', 'description', 'quantity', 'unit_price', 'subtotal')
    list_filter = ('invoice__status',)
    search_fields = ('description', 'invoice__invoice_number')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('invoice', 'fee_item', 'description')
        }),
        ('Financial Information', {
            'fields': ('quantity', 'unit_price', 'subtotal')
        }),
        ('Audit Trail', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('invoice', 'amount', 'payment_date', 'payment_method', 'status', 'receipt_number')
    list_filter = ('status', 'payment_method', 'payment_date')
    search_fields = ('receipt_number', 'transaction_id', 'invoice__invoice_number', 'notes')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('invoice', 'amount', 'payment_date', 'payment_method', 'status')
        }),
        ('Payment Details', {
            'fields': ('transaction_id', 'receipt_number', 'received_by')
        }),
        ('Additional Information', {
            'fields': ('notes',)
        }),
        ('Audit Trail', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('title', 'school', 'expense_type', 'amount', 'expense_date', 'status')
    list_filter = ('expense_type', 'status', 'expense_date', 'school')
    search_fields = ('title', 'description', 'vendor')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('school', 'title', 'description', 'expense_type', 'amount', 'expense_date', 'status')
        }),
        ('Vendor Information', {
            'fields': ('vendor', 'receipt')
        }),
        ('Approval Information', {
            'fields': ('requested_by', 'approved_by', 'approved_date')
        }),
        ('Payment Information', {
            'fields': ('payment_date', 'payment_method', 'payment_reference')
        }),
        ('Audit Trail', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
            if not obj.requested_by:
                obj.requested_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


class BudgetItemInline(admin.TabularInline):
    model = BudgetItem
    extra = 1


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ('title', 'school', 'fiscal_year', 'start_date', 'end_date', 'total_amount', 'status')
    list_filter = ('status', 'fiscal_year', 'school')
    search_fields = ('title', 'description', 'department', 'project')
    inlines = [BudgetItemInline]
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('school', 'title', 'description', 'fiscal_year', 'start_date', 'end_date', 'total_amount', 'status')
        }),
        ('Department/Project Information', {
            'fields': ('department', 'project')
        }),
        ('Approval Information', {
            'fields': ('prepared_by', 'approved_by', 'approved_date')
        }),
        ('Audit Trail', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
            if not obj.prepared_by:
                obj.prepared_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(BudgetItem)
class BudgetItemAdmin(admin.ModelAdmin):
    list_display = ('budget', 'category', 'amount', 'actual_amount', 'variance')
    list_filter = ('budget__fiscal_year', 'budget__status', 'category')
    search_fields = ('category', 'description', 'notes')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by', 'variance')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('budget', 'category', 'description')
        }),
        ('Financial Information', {
            'fields': ('amount', 'actual_amount', 'notes')
        }),
        ('Audit Trail', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def variance(self, obj):
        return obj.variance
    variance.short_description = 'Variance'
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)