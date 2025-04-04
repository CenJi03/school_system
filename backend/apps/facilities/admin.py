from django.contrib import admin
from .models import (
    Building,
    Room,
    Equipment,
    Maintenance,
    Inventory
)


@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'school', 'floors', 'year_built', 'is_active')
    list_filter = ('school', 'is_active')
    search_fields = ('name', 'code', 'address', 'description')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'code', 'school', 'is_active')
        }),
        ('Building Details', {
            'fields': ('address', 'floors', 'year_built', 'total_area', 'description')
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


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'number', 'building', 'floor', 'room_type', 'capacity', 'is_active')
    list_filter = ('building', 'room_type', 'floor', 'is_active')
    search_fields = ('name', 'number', 'description')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'number', 'building', 'floor', 'is_active')
        }),
        ('Room Details', {
            'fields': ('room_type', 'capacity', 'area', 'description')
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


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'equipment_type', 'serial_number', 'room', 'status')
    list_filter = ('equipment_type', 'status', 'room__building')
    search_fields = ('name', 'serial_number', 'notes')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'equipment_type', 'serial_number', 'room', 'status')
        }),
        ('Financial Details', {
            'fields': ('acquisition_date', 'cost', 'warranty_expiry')
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


@admin.register(Maintenance)
class MaintenanceAdmin(admin.ModelAdmin):
    list_display = ('title', 'maintenance_type', 'status', 'priority', 'requester', 'reported_date', 'scheduled_date')
    list_filter = ('maintenance_type', 'status', 'priority', 'reported_date', 'scheduled_date')
    search_fields = ('title', 'description', 'notes')
    readonly_fields = ('reported_date', 'created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'maintenance_type', 'priority', 'status')
        }),
        ('Related Entities', {
            'fields': ('requester', 'assigned_to', 'building', 'room', 'equipment')
        }),
        ('Dates', {
            'fields': ('reported_date', 'scheduled_date', 'completion_date')
        }),
        ('Additional Information', {
            'fields': ('cost', 'parts_used', 'notes')
        }),
        ('Audit Trail', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
            if not obj.requester:
                obj.requester = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'item_type', 'quantity', 'unit', 'unit_cost', 'school', 'reorder_level', 'needs_reorder')
    list_filter = ('item_type', 'school', 'last_restock_date')
    search_fields = ('name', 'description', 'storage_location')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'item_type', 'description', 'school')
        }),
        ('Inventory Details', {
            'fields': ('quantity', 'unit', 'unit_cost', 'reorder_level', 'storage_location', 'last_restock_date')
        }),
        ('Audit Trail', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def needs_reorder(self, obj):
        return obj.needs_reorder
    needs_reorder.boolean = True
    needs_reorder.short_description = 'Needs Reorder'
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)