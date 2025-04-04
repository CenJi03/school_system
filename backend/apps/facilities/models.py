from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from django.conf import settings
from apps.core.models import TimeStampedModel, School

User = get_user_model()


class Building(TimeStampedModel):
    """
    Model representing a building in the school
    """
    name = models.CharField(_('Building Name'), max_length=100)
    code = models.CharField(_('Building Code'), max_length=20)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='buildings')
    address = models.TextField(_('Address'), blank=True)
    floors = models.PositiveSmallIntegerField(_('Number of Floors'), default=1)
    year_built = models.PositiveIntegerField(_('Year Built'), null=True, blank=True)
    total_area = models.DecimalField(_('Total Area (sqm)'), max_digits=10, decimal_places=2, null=True, blank=True)
    description = models.TextField(_('Description'), blank=True)
    is_active = models.BooleanField(_('Active'), default=True)
    
    class Meta:
        verbose_name = _('Building')
        verbose_name_plural = _('Buildings')
        ordering = ['name']
        unique_together = ['school', 'code']
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class Room(TimeStampedModel):
    """
    Model representing a room in a building
    """
    ROOM_TYPE_CHOICES = (
        ('classroom', _('Classroom')),
        ('office', _('Office')),
        ('lab', _('Laboratory')),
        ('library', _('Library')),
        ('hall', _('Hall')),
        ('cafeteria', _('Cafeteria')),
        ('gym', _('Gymnasium')),
        ('bathroom', _('Bathroom')),
        ('storage', _('Storage')),
        ('other', _('Other')),
    )
    
    name = models.CharField(_('Room Name'), max_length=100)
    number = models.CharField(_('Room Number'), max_length=20)
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name='rooms')
    floor = models.PositiveSmallIntegerField(_('Floor Number'), default=1)
    room_type = models.CharField(_('Room Type'), max_length=20, choices=ROOM_TYPE_CHOICES)
    capacity = models.PositiveSmallIntegerField(_('Capacity'), null=True, blank=True)
    area = models.DecimalField(_('Area (sqm)'), max_digits=8, decimal_places=2, null=True, blank=True)
    description = models.TextField(_('Description'), blank=True)
    is_active = models.BooleanField(_('Active'), default=True)
    
    class Meta:
        verbose_name = _('Room')
        verbose_name_plural = _('Rooms')
        ordering = ['building', 'floor', 'number']
        unique_together = ['building', 'number']
    
    def __str__(self):
        return f"{self.building.code}-{self.number} ({self.name})"


class Equipment(TimeStampedModel):
    """
    Model representing equipment in a room
    """
    EQUIPMENT_TYPE_CHOICES = (
        ('furniture', _('Furniture')),
        ('electronics', _('Electronics')),
        ('teaching', _('Teaching Aid')),
        ('sports', _('Sports Equipment')),
        ('lab', _('Laboratory Equipment')),
        ('safety', _('Safety Equipment')),
        ('other', _('Other')),
    )
    
    STATUS_CHOICES = (
        ('operational', _('Operational')),
        ('maintenance', _('Under Maintenance')),
        ('broken', _('Broken')),
        ('disposed', _('Disposed')),
    )
    
    name = models.CharField(_('Equipment Name'), max_length=255)
    equipment_type = models.CharField(_('Equipment Type'), max_length=20, choices=EQUIPMENT_TYPE_CHOICES)
    serial_number = models.CharField(_('Serial Number'), max_length=100, blank=True)
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='equipment')
    acquisition_date = models.DateField(_('Acquisition Date'), null=True, blank=True)
    cost = models.DecimalField(_('Cost'), max_digits=10, decimal_places=2, null=True, blank=True)
    warranty_expiry = models.DateField(_('Warranty Expiry'), null=True, blank=True)
    status = models.CharField(_('Status'), max_length=20, choices=STATUS_CHOICES, default='operational')
    notes = models.TextField(_('Notes'), blank=True)
    
    class Meta:
        verbose_name = _('Equipment')
        verbose_name_plural = _('Equipment')
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_equipment_type_display()})"


class Maintenance(TimeStampedModel):
    """
    Model representing maintenance requests and records
    """
    PRIORITY_CHOICES = (
        ('low', _('Low')),
        ('medium', _('Medium')),
        ('high', _('High')),
        ('urgent', _('Urgent')),
    )
    
    STATUS_CHOICES = (
        ('pending', _('Pending')),
        ('assigned', _('Assigned')),
        ('in_progress', _('In Progress')),
        ('completed', _('Completed')),
        ('cancelled', _('Cancelled')),
    )
    
    MAINTENANCE_TYPE_CHOICES = (
        ('repair', _('Repair')),
        ('replacement', _('Replacement')),
        ('preventive', _('Preventive Maintenance')),
        ('inspection', _('Inspection')),
        ('cleaning', _('Cleaning')),
        ('other', _('Other')),
    )
    
    title = models.CharField(_('Title'), max_length=255)
    description = models.TextField(_('Description'))
    maintenance_type = models.CharField(_('Maintenance Type'), max_length=20, choices=MAINTENANCE_TYPE_CHOICES)
    priority = models.CharField(_('Priority'), max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(_('Status'), max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Related entities
    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='maintenance_requests')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_maintenance')
    building = models.ForeignKey(Building, on_delete=models.SET_NULL, null=True, blank=True, related_name='maintenance_requests')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='maintenance_requests')
    equipment = models.ForeignKey(Equipment, on_delete=models.SET_NULL, null=True, blank=True, related_name='maintenance_records')
    
    # Dates
    reported_date = models.DateTimeField(_('Reported Date'), auto_now_add=True)
    scheduled_date = models.DateField(_('Scheduled Date'), null=True, blank=True)
    completion_date = models.DateTimeField(_('Completion Date'), null=True, blank=True)
    
    # Additional info
    cost = models.DecimalField(_('Cost'), max_digits=10, decimal_places=2, null=True, blank=True)
    parts_used = models.TextField(_('Parts Used'), blank=True)
    notes = models.TextField(_('Notes'), blank=True)
    
    class Meta:
        verbose_name = _('Maintenance')
        verbose_name_plural = _('Maintenance')
        ordering = ['-reported_date']
    
    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"


class Inventory(TimeStampedModel):
    """
    Model representing inventory items in the school
    """
    ITEM_TYPE_CHOICES = (
        ('stationery', _('Stationery')),
        ('equipment', _('Equipment')),
        ('furniture', _('Furniture')),
        ('books', _('Books')),
        ('electronics', _('Electronics')),
        ('cleaning', _('Cleaning Supplies')),
        ('sports', _('Sports Equipment')),
        ('medical', _('Medical Supplies')),
        ('other', _('Other')),
    )
    
    name = models.CharField(_('Item Name'), max_length=255)
    item_type = models.CharField(_('Item Type'), max_length=20, choices=ITEM_TYPE_CHOICES)
    description = models.TextField(_('Description'), blank=True, null=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='inventory_items')
    quantity = models.PositiveIntegerField(_('Quantity'), default=0)
    unit = models.CharField(_('Unit'), max_length=50)
    unit_cost = models.DecimalField(_('Unit Cost'), max_digits=10, decimal_places=2)
    reorder_level = models.PositiveIntegerField(_('Reorder Level'), default=10)
    storage_location = models.CharField(_('Storage Location'), max_length=255, blank=True, null=True)
    last_restock_date = models.DateField(_('Last Restock Date'), blank=True, null=True)
    
    class Meta:
        verbose_name = _('Inventory Item')
        verbose_name_plural = _('Inventory Items')
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.quantity} {self.unit})"
    
    @property
    def needs_reorder(self):
        return self.quantity <= self.reorder_level


class Reservation(models.Model):
    """Model for room reservations"""
    PURPOSES = [
        ('class', 'Regular Class'),
        ('event', 'Event'),
        ('meeting', 'Meeting'),
        ('exam', 'Examination'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    
    room = models.ForeignKey('Room', on_delete=models.CASCADE, related_name='reservations')
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    reserver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='room_reservations')
    purpose = models.CharField(max_length=20, choices=PURPOSES, default='meeting')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True, null=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_reservations')
    approved_date = models.DateTimeField(null=True, blank=True)
    attendees_count = models.PositiveIntegerField(default=1)
    notes = models.TextField(blank=True, null=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_reservations')
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='updated_reservations')
    
    class Meta:
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['room', 'start_time', 'end_time']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.room} ({self.start_time.strftime('%Y-%m-%d %H:%M')})"
    
    @property
    def duration_hours(self):
        """Calculate duration in hours"""
        delta = self.end_time - self.start_time
        return delta.total_seconds() / 3600