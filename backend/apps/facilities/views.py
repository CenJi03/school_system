from django.utils import timezone
from django.db.models import Q, Count, F
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from .models import (
    Building,
    Room,
    Equipment,
    Maintenance,
    Reservation,
    Inventory
)
from .serializers import (
    BuildingSerializer,
    RoomSerializer,
    EquipmentSerializer,
    MaintenanceSerializer,
    ReservationSerializer,
    InventorySerializer
)

User = get_user_model()


class BuildingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Building instances
    """
    queryset = Building.objects.all()
    serializer_class = BuildingSerializer
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
        Optionally restricts the returned buildings by various filters
        """
        queryset = Building.objects.all()
        
        # Filter by school
        school_id = self.request.query_params.get('school', None)
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        
        # Search by name or code
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(code__icontains=search))
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def rooms(self, request, pk=None):
        """
        Get all rooms in a building
        """
        building = self.get_object()
        rooms = Room.objects.filter(building=building)
        
        # Filter by room type
        room_type = request.query_params.get('room_type', None)
        if room_type:
            rooms = rooms.filter(room_type=room_type)
        
        # Filter by floor
        floor = request.query_params.get('floor', None)
        if floor is not None:
            rooms = rooms.filter(floor=floor)
        
        # Filter by active status
        is_active = request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            rooms = rooms.filter(is_active=is_active_bool)
        
        serializer = RoomSerializer(rooms, many=True)
        return Response(serializer.data)


class RoomViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Room instances
    """
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
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
        Optionally restricts the returned rooms by various filters
        """
        queryset = Room.objects.all()
        
        # Filter by building
        building_id = self.request.query_params.get('building', None)
        if building_id:
            queryset = queryset.filter(building_id=building_id)
        
        # Filter by room type
        room_type = self.request.query_params.get('room_type', None)
        if room_type:
            queryset = queryset.filter(room_type=room_type)
        
        # Filter by floor
        floor = self.request.query_params.get('floor', None)
        if floor is not None:
            queryset = queryset.filter(floor=floor)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        
        # Filter by capacity
        min_capacity = self.request.query_params.get('min_capacity', None)
        if min_capacity:
            queryset = queryset.filter(capacity__gte=min_capacity)
        
        # Search by name or number
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(number__icontains=search))
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def equipment(self, request, pk=None):
        """
        Get all equipment in a room
        """
        room = self.get_object()
        equipment = Equipment.objects.filter(room=room)
        
        # Filter by equipment type
        equipment_type = request.query_params.get('equipment_type', None)
        if equipment_type:
            equipment = equipment.filter(equipment_type=equipment_type)
        
        # Filter by status
        status_param = request.query_params.get('status', None)
        if status_param:
            equipment = equipment.filter(status=status_param)
        
        serializer = EquipmentSerializer(equipment, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def reservations(self, request, pk=None):
        """
        Get all reservations for a room
        """
        room = self.get_object()
        reservations = Reservation.objects.filter(room=room)
        
        # Filter by date range
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        
        if start_date:
            reservations = reservations.filter(end_time__gte=start_date)
        
        if end_date:
            reservations = reservations.filter(start_time__lte=end_date)
        
        # Filter by status
        status_param = request.query_params.get('status', None)
        if status_param:
            reservations = reservations.filter(status=status_param)
        
        serializer = ReservationSerializer(reservations, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        """
        Check if a room is available for a given time period
        """
        room = self.get_object()
        
        # Get date range from request
        start_time = request.query_params.get('start_time', None)
        end_time = request.query_params.get('end_time', None)
        
        if not start_time or not end_time:
            return Response(
                {"detail": "Start time and end time are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for overlapping reservations
        overlapping_reservations = Reservation.objects.filter(
            room=room,
            status__in=['pending', 'approved'],
            start_time__lt=end_time,
            end_time__gt=start_time
        )
        
        is_available = not overlapping_reservations.exists()
        
        return Response({
            "is_available": is_available,
            "conflicting_reservations": ReservationSerializer(overlapping_reservations, many=True).data if not is_available else []
        })


class EquipmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Equipment instances
    """
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
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
        Optionally restricts the returned equipment by various filters
        """
        queryset = Equipment.objects.all()
        
        # Filter by room
        room_id = self.request.query_params.get('room', None)
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        
        # Filter by building (through room)
        building_id = self.request.query_params.get('building', None)
        if building_id:
            queryset = queryset.filter(room__building_id=building_id)
        
        # Filter by equipment type
        equipment_type = self.request.query_params.get('equipment_type', None)
        if equipment_type:
            queryset = queryset.filter(equipment_type=equipment_type)
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Search by name or serial number
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(serial_number__icontains=search))
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def maintenance_history(self, request, pk=None):
        """
        Get maintenance history for a specific equipment
        """
        equipment = self.get_object()
        maintenance_records = Maintenance.objects.filter(equipment=equipment)
        
        serializer = MaintenanceSerializer(maintenance_records, many=True)
        return Response(serializer.data)


class MaintenanceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Maintenance instances
    """
    queryset = Maintenance.objects.all()
    serializer_class = MaintenanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Optionally restricts the returned maintenance records by various filters
        """
        queryset = Maintenance.objects.all()
        
        # Filter by requester (if not admin, only show their own requests)
        if not self.request.user.is_staff:
            queryset = queryset.filter(requester=self.request.user)
        else:
            # Admin can filter by requester
            requester_id = self.request.query_params.get('requester', None)
            if requester_id:
                queryset = queryset.filter(requester_id=requester_id)
        
        # Filter by assigned to
        assigned_to_id = self.request.query_params.get('assigned_to', None)
        if assigned_to_id:
            queryset = queryset.filter(assigned_to_id=assigned_to_id)
        
        # Filter by maintenance type
        maintenance_type = self.request.query_params.get('maintenance_type', None)
        if maintenance_type:
            queryset = queryset.filter(maintenance_type=maintenance_type)
        
        # Filter by priority
        priority = self.request.query_params.get('priority', None)
        if priority:
            queryset = queryset.filter(priority=priority)
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(reported_date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(reported_date__lte=end_date)
        
        # Filter by related entities
        building_id = self.request.query_params.get('building', None)
        if building_id:
            queryset = queryset.filter(building_id=building_id)
        
        room_id = self.request.query_params.get('room', None)
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        
        equipment_id = self.request.query_params.get('equipment', None)
        if equipment_id:
            queryset = queryset.filter(equipment_id=equipment_id)
        
        # Search by title or description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))
        
        return queryset
    
    def perform_create(self, serializer):
        # Set requester to current user if not provided
        if 'requester' not in serializer.validated_data:
            serializer.save(
                requester=self.request.user,
                created_by=self.request.user,
                updated_by=self.request.user
            )
        else:
            serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """
        Assign a maintenance request to a user
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to assign maintenance requests."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        maintenance = self.get_object()
        assigned_to_id = request.data.get('assigned_to')
        
        try:
            assigned_to = User.objects.get(pk=assigned_to_id)
            maintenance.assigned_to = assigned_to
            maintenance.status = 'assigned'
            maintenance.updated_by = request.user
            maintenance.save()
            
            serializer = self.get_serializer(maintenance)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Mark a maintenance request as completed
        """
        maintenance = self.get_object()
        
        # Check if user is the one assigned or an admin
        if maintenance.assigned_to != request.user and not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to complete this maintenance request."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update optional fields
        cost = request.data.get('cost')
        parts_used = request.data.get('parts_used')
        notes = request.data.get('notes')
        
        if cost is not None:
            maintenance.cost = cost
        
        if parts_used is not None:
            maintenance.parts_used = parts_used
        
        if notes is not None:
            maintenance.notes = notes
        
        maintenance.status = 'completed'
        maintenance.completion_date = timezone.now()
        maintenance.updated_by = request.user
        maintenance.save()
        
        # If this was for equipment, update equipment status to operational
        if maintenance.equipment:
            maintenance.equipment.status = 'operational'
            maintenance.equipment.save()
        
        serializer = self.get_serializer(maintenance)
        return Response(serializer.data)


class ReservationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Reservation instances
    """
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Optionally restricts the returned reservations by various filters
        """
        queryset = Reservation.objects.all()
        
        # Filter by reserver (if not admin, only show their own reservations)
        if not self.request.user.is_staff:
            queryset = queryset.filter(reserver=self.request.user)
        else:
            # Admin can filter by reserver
            reserver_id = self.request.query_params.get('reserver', None)
            if reserver_id:
                queryset = queryset.filter(reserver_id=reserver_id)
        
        # Filter by room
        room_id = self.request.query_params.get('room', None)
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        
        # Filter by building (through room)
        building_id = self.request.query_params.get('building', None)
        if building_id:
            queryset = queryset.filter(room__building_id=building_id)
        
        # Filter by purpose
        purpose = self.request.query_params.get('purpose', None)
        if purpose:
            queryset = queryset.filter(purpose=purpose)
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(end_time__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(start_time__lte=end_date)
        
        # Search by title or description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))
        
        return queryset
    
    def perform_create(self, serializer):
        # Set reserver to current user if not provided
        if 'reserver' not in serializer.validated_data:
            serializer.save(
                reserver=self.request.user,
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
        Approve a reservation
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to approve reservations."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reservation = self.get_object()
        
        if reservation.status != 'pending':
            return Response(
                {"detail": f"Reservation is already {reservation.get_status_display()}."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reservation.status = 'approved'
        reservation.approved_by = request.user
        reservation.approved_date = timezone.now()
        reservation.updated_by = request.user
        reservation.save()
        
        serializer = self.get_serializer(reservation)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject a reservation
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to reject reservations."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        reservation = self.get_object()
        
        if reservation.status != 'pending':
            return Response(
                {"detail": f"Reservation is already {reservation.get_status_display()}."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get rejection reason from request data
        rejection_reason = request.data.get('rejection_reason', '')
        if not rejection_reason:
            return Response(
                {"detail": "Rejection reason is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reservation.status = 'rejected'
        reservation.approved_by = request.user
        reservation.approved_date = timezone.now()
        reservation.rejection_reason = rejection_reason
        reservation.updated_by = request.user
        reservation.save()
        
        serializer = self.get_serializer(reservation)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel a reservation
        """
        reservation = self.get_object()
        
        # Users can only cancel their own reservations
        if reservation.reserver != request.user and not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to cancel this reservation."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if reservation.status not in ['pending', 'approved']:
            return Response(
                {"detail": f"Reservation is already {reservation.get_status_display()}."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reservation.status = 'cancelled'
        reservation.updated_by = request.user
        reservation.save()
        
        serializer = self.get_serializer(reservation)
        return Response(serializer.data)


class InventoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Inventory instances
    """
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
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
        Optionally restricts the returned inventory items by various filters
        """
        queryset = Inventory.objects.all()
        
        # Filter by school
        school_id = self.request.query_params.get('school', None)
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        
        # Filter by item type
        item_type = self.request.query_params.get('item_type', None)
        if item_type:
            queryset = queryset.filter(item_type=item_type)
        
        # Filter by reorder status
        needs_reorder = self.request.query_params.get('needs_reorder', None)
        if needs_reorder is not None:
            needs_reorder_bool = needs_reorder.lower() == 'true'
            if needs_reorder_bool:
                queryset = queryset.filter(quantity__lte=F('reorder_level'))
            else:
                queryset = queryset.filter(quantity__gt=F('reorder_level'))
        
        # Search by name, description, or storage location
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search) | 
                Q(storage_location__icontains=search)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def reorder_list(self, request):
        """
        Get a list of inventory items that need to be reordered
        """
        reorder_items = Inventory.objects.filter(quantity__lte=F('reorder_level'))
        
        # Filter by school
        school_id = request.query_params.get('school', None)
        if school_id:
            reorder_items = reorder_items.filter(school_id=school_id)
        
        # Filter by item type
        item_type = request.query_params.get('item_type', None)
        if item_type:
            reorder_items = reorder_items.filter(item_type=item_type)
        
        serializer = self.get_serializer(reorder_items, many=True)
        return Response(serializer.data)