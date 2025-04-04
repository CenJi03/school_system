from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.models import (
    School,
    SchoolYear,
    Term,
    Department,
    SystemSetting,
    Notification
)

User = get_user_model()


class SchoolViewSetTest(TestCase):
    """
    Test case for the School API views
    """
    
    def setUp(self):
        # Create a superuser for admin operations
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            password='admin123',
            first_name='Admin',
            last_name='User'
        )
        
        # Create a regular user
        self.user = User.objects.create_user(
            email='user@example.com',
            password='user123',
            first_name='Regular',
            last_name='User'
        )
        
        # Create a school
        self.school = School.objects.create(
            name='Test School',
            code='TS001',
            address='123 Test Street',
            city='Test City',
            state='Test State',
            country='Test Country',
            postal_code='12345',
            phone='123-456-7890',
            email='school@example.com',
            created_by=self.admin_user,
            updated_by=self.admin_user
        )
        
        # Setup API client
        self.client = APIClient()

    def test_get_schools_authenticated(self):
        """
        Test retrieving schools as an authenticated user
        """
        self.client.force_authenticate(user=self.user)
        url = reverse('school-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Test School')

    def test_get_schools_unauthenticated(self):
        """
        Test that unauthenticated users cannot retrieve schools
        """
        url = reverse('school-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_school_as_admin(self):
        """
        Test creating a school as an admin user
        """
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('school-list')
        data = {
            'name': 'New School',
            'code': 'NS001',
            'address': '456 New Street',
            'city': 'New City',
            'state': 'New State',
            'country': 'New Country',
            'postal_code': '54321',
            'phone': '987-654-3210',
            'email': 'newschool@example.com',
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(School.objects.count(), 2)
        self.assertEqual(response.data['name'], 'New School')

    def test_create_school_as_regular_user(self):
        """
        Test that regular users cannot create schools
        """
        self.client.force_authenticate(user=self.user)
        url = reverse('school-list')
        data = {
            'name': 'New School',
            'code': 'NS001',
            'address': '456 New Street',
            'city': 'New City',
            'state': 'New State',
            'country': 'New Country',
            'postal_code': '54321',
            'phone': '987-654-3210',
            'email': 'newschool@example.com',
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(School.objects.count(), 1)  # No new school created

    def test_update_school_as_admin(self):
        """
        Test updating a school as an admin user
        """
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('school-detail', kwargs={'pk': self.school.pk})
        data = {
            'name': 'Updated School Name',
        }
        
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.school.refresh_from_db()
        self.assertEqual(self.school.name, 'Updated School Name')

    def test_update_school_as_regular_user(self):
        """
        Test that regular users cannot update schools
        """
        self.client.force_authenticate(user=self.user)
        url = reverse('school-detail', kwargs={'pk': self.school.pk})
        data = {
            'name': 'Updated School Name',
        }
        
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.school.refresh_from_db()
        self.assertEqual(self.school.name, 'Test School')  # Name unchanged


class NotificationViewSetTest(TestCase):
    """
    Test case for the Notification API views
    """
    
    def setUp(self):
        # Create users
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            password='admin123',
            first_name='Admin',
            last_name='User'
        )
        
        self.user1 = User.objects.create_user(
            email='user1@example.com',
            password='user123',
            first_name='User',
            last_name='One'
        )
        
        self.user2 = User.objects.create_user(
            email='user2@example.com',
            password='user123',
            first_name='User',
            last_name='Two'
        )
        
        # Create notifications
        self.notification1 = Notification.objects.create(
            user=self.user1,
            title='Notification for User1',
            message='This is a notification for User1',
            notification_type='info',
            created_by=self.admin_user,
            updated_by=self.admin_user
        )
        
        self.notification2 = Notification.objects.create(
            user=self.user2,
            title='Notification for User2',
            message='This is a notification for User2',
            notification_type='warning',
            created_by=self.admin_user,
            updated_by=self.admin_user
        )
        
        # Setup API client
        self.client = APIClient()

    def test_get_notifications_as_user(self):
        """
        Test that users can only see their own notifications
        """
        self.client.force_authenticate(user=self.user1)
        url = reverse('notification-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Notification for User1')

    def test_get_all_notifications_as_admin(self):
        """
        Test that admin can see all notifications when 'all' parameter is provided
        """
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('notification-list') + '?all=true'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_mark_notification_as_read(self):
        """
        Test marking a notification as read
        """
        self.client.force_authenticate(user=self.user1)
        url = reverse('notification-mark-as-read', kwargs={'pk': self.notification1.pk})
        response = self.client.patch(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notification1.refresh_from_db()
        self.assertTrue(self.notification1.is_read)
        self.assertIsNotNone(self.notification1.read_at)

    def test_mark_another_users_notification_as_read(self):
        """
        Test that users cannot mark another user's notifications as read
        """
        self.client.force_authenticate(user=self.user1)
        url = reverse('notification-mark-as-read', kwargs={'pk': self.notification2.pk})
        response = self.client.patch(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)  # Should not be visible
        self.notification2.refresh_from_db()
        self.assertFalse(self.notification2.is_read)  # Still unread

    def test_mark_all_notifications_as_read(self):
        """
        Test marking all notifications as read
        """
        # Create another notification for user1
        notification3 = Notification.objects.create(
            user=self.user1,
            title='Another Notification for User1',
            message='This is another notification for User1',
            notification_type='success',
            created_by=self.admin_user,
            updated_by=self.admin_user
        )
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('notification-mark-all-as-read')
        response = self.client.patch(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that both notifications for user1 are read
        self.notification1.refresh_from_db()
        notification3.refresh_from_db()
        self.assertTrue(self.notification1.is_read)
        self.assertTrue(notification3.is_read)
        
        # Check that user2's notification is still unread
        self.notification2.refresh_from_db()
        self.assertFalse(self.notification2.is_read)

    def test_unread_count(self):
        """
        Test getting the count of unread notifications
        """
        # Create two more notifications for user1
        Notification.objects.create(
            user=self.user1,
            title='Notification 2 for User1',
            message='This is notification 2 for User1',
            notification_type='info',
            created_by=self.admin_user,
            updated_by=self.admin_user
        )
        
        notification3 = Notification.objects.create(
            user=self.user1,
            title='Notification 3 for User1',
            message='This is notification 3 for User1',
            notification_type='info',
            created_by=self.admin_user,
            updated_by=self.admin_user
        )
        
        # Mark one as read
        notification3.is_read = True
        notification3.read_at = timezone.now()
        notification3.save()
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('notification-unread-count')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)  # Two unread notifications