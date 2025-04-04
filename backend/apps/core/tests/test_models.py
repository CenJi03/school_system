from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.core.models import (
    School,
    SchoolYear,
    Term,
    Department,
    SystemSetting,
    Notification
)

User = get_user_model()


class SchoolModelTest(TestCase):
    """
    Test cases for the School model
    """
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
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
            created_by=self.user,
            updated_by=self.user
        )
    
    def test_school_creation(self):
        """Test that the school is created correctly"""
        self.assertEqual(self.school.name, 'Test School')
        self.assertEqual(self.school.code, 'TS001')
        self.assertEqual(self.school.email, 'school@example.com')
        self.assertTrue(self.school.is_active)
        self.assertEqual(str(self.school), 'Test School')


class SchoolYearModelTest(TestCase):
    """
    Test cases for the SchoolYear model
    """
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
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
            created_by=self.user,
            updated_by=self.user
        )
        
        self.school_year = SchoolYear.objects.create(
            school=self.school,
            name='2024-2025',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timezone.timedelta(days=365),
            created_by=self.user,
            updated_by=self.user
        )
    
    def test_school_year_creation(self):
        """Test that the school year is created correctly"""
        self.assertEqual(self.school_year.name, '2024-2025')
        self.assertEqual(self.school_year.school, self.school)
        self.assertTrue(self.school_year.is_active)
        self.assertEqual(str(self.school_year), 'Test School - 2024-2025')


class TermModelTest(TestCase):
    """
    Test cases for the Term model
    """
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
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
            created_by=self.user,
            updated_by=self.user
        )
        
        self.school_year = SchoolYear.objects.create(
            school=self.school,
            name='2024-2025',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timezone.timedelta(days=365),
            created_by=self.user,
            updated_by=self.user
        )
        
        self.term = Term.objects.create(
            school_year=self.school_year,
            name='Fall Semester',
            term_type='semester',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timezone.timedelta(days=120),
            created_by=self.user,
            updated_by=self.user
        )
    
    def test_term_creation(self):
        """Test that the term is created correctly"""
        self.assertEqual(self.term.name, 'Fall Semester')
        self.assertEqual(self.term.term_type, 'semester')
        self.assertEqual(self.term.school_year, self.school_year)
        self.assertTrue(self.term.is_active)
        self.assertEqual(str(self.term), '2024-2025 - Fall Semester')


class DepartmentModelTest(TestCase):
    """
    Test cases for the Department model
    """
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
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
            created_by=self.user,
            updated_by=self.user
        )
        
        self.department = Department.objects.create(
            school=self.school,
            name='English Department',
            code='ENG',
            description='Department for English studies',
            head=self.user,
            created_by=self.user,
            updated_by=self.user
        )
    
    def test_department_creation(self):
        """Test that the department is created correctly"""
        self.assertEqual(self.department.name, 'English Department')
        self.assertEqual(self.department.code, 'ENG')
        self.assertEqual(self.department.school, self.school)
        self.assertEqual(self.department.head, self.user)
        self.assertTrue(self.department.is_active)
        self.assertEqual(str(self.department), 'Test School - English Department')


class SystemSettingModelTest(TestCase):
    """
    Test cases for the SystemSetting model
    """
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        self.setting = SystemSetting.objects.create(
            key='site_name',
            value='Test School System',
            description='The name of the school system',
            created_by=self.user,
            updated_by=self.user
        )
    
    def test_system_setting_creation(self):
        """Test that the system setting is created correctly"""
        self.assertEqual(self.setting.key, 'site_name')
        self.assertEqual(self.setting.value, 'Test School System')
        self.assertEqual(str(self.setting), 'site_name')


class NotificationModelTest(TestCase):
    """
    Test cases for the Notification model
    """
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        self.notification = Notification.objects.create(
            user=self.user,
            title='Test Notification',
            message='This is a test notification message',
            notification_type='info',
            created_by=self.user,
            updated_by=self.user
        )
    
    def test_notification_creation(self):
        """Test that the notification is created correctly"""
        self.assertEqual(self.notification.title, 'Test Notification')
        self.assertEqual(self.notification.message, 'This is a test notification message')
        self.assertEqual(self.notification.notification_type, 'info')
        self.assertEqual(self.notification.user, self.user)
        self.assertFalse(self.notification.is_read)
        self.assertIsNone(self.notification.read_at)
        self.assertEqual(str(self.notification), f"{self.user.email} - Test Notification ({self.notification.created_at})")