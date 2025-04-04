from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.core.serializers import UserMinimalSerializer
from .models import (
    Building,
    Room,
    Equipment,
    Maintenance,
    Reservation,
    Inventory
)

User = get_user_model()


class BuildingSerializer(serializers.ModelSerializer):
    """
    Serializer for the Building model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    school_name = serializers.ReadOnlyField(source='school.name')
    
    class Meta:
        model = Building
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class RoomSerializer(serializers.ModelSerializer):
    """
    Serializer for the Room model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    building_name = serializers.ReadOnlyField(source='building.name')
    building_code = serializers.ReadOnlyField(source='building.code')
    room_type_display = serializers.CharField(source='get_room_type_display', read_only=True)
    
    class Meta:
        model = Room
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


class EquipmentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Equipment model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    room_details = serializers.SerializerMethodField(read_only=True)
    equipment_type_display = serializers.CharField(source='get_equipment_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Equipment
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    def get_room_details(self, obj):
        if obj.room:
            return {
                'id': obj.room.id,
                'name': obj.room.name,
                'number': obj.room.number,
                'building': {
                    'id': obj.room.building.id,
                    'name': obj.room.building.name,
                    'code': obj.room.building.code
                }
            }
        return None


class MaintenanceSerializer(serializers.ModelSerializer):
    """
    Serializer for the Maintenance model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    requester_details = UserMinimalSerializer(source='requester', read_only=True)
    assigned_to_details = UserMinimalSerializer(source='assigned_to', read_only=True)
    maintenance_type_display = serializers.CharField(source='get_maintenance_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Maintenance
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by', 'reported_date')


class ReservationSerializer(serializers.ModelSerializer):
    """
    Serializer for the Reservation model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    reserver_details = UserMinimalSerializer(source='reserver', read_only=True)
    approved_by_details = UserMinimalSerializer(source='approved_by', read_only=True)
    room_details = serializers.SerializerMethodField(read_only=True)
    purpose_display = serializers.CharField(source='get_purpose_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Reservation
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    
    def get_room_details(self, obj):
        return {
            'id': obj.room.id,
            'name': obj.room.name,
            'number': obj.room.number,
            'room_type': obj.room.get_room_type_display(),
            'capacity': obj.room.capacity,
            'building': {
                'id': obj.room.building.id,
                'name': obj.room.building.name,
                'code': obj.room.building.code
            }
        }
    
    def validate(self, data):
        """
        Validate that the start time is before the end time
        and that the room is not already reserved for that time period
        """
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        room = data.get('room')
        
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError("End time must be after start time.")
        
        # Check for room availability (ignore the current reservation when updating)
        if start_time and end_time and room:
            overlapping_reservations = Reservation.objects.filter(
                room=room,
                status__in=['pending', 'approved'],
                start_time__lt=end_time,
                end_time__gt=start_time
            )
            
            # If updating, exclude the current instance
            instance = getattr(self, 'instance', None)
            if instance:
                overlapping_reservations = overlapping_reservations.exclude(pk=instance.pk)
            
            if overlapping_reservations.exists():
                raise serializers.ValidationError("Room is already reserved for this time period.")
        
        return data


class InventorySerializer(serializers.ModelSerializer):
    """
    Serializer for the Inventory model
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)
    school_name = serializers.ReadOnlyField(source='school.name')
    item_type_display = serializers.CharField(source='get_item_type_display', read_only=True)
    needs_reorder = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Inventory
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')