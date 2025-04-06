from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User

class AuthTokenTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')

    def test_obtain_auth_token(self):
        response = self.client.post('/api/auth/token/login/', {'username': 'testuser', 'password': 'testpass'})
        self.assertEqual(response.status_code, 200)
        self.assertIn('auth_token', response.data)

    def test_obtain_auth_token_invalid_credentials(self):
        response = self.client.post('/api/auth/token/login/', {'username': 'testuser', 'password': 'wrongpass'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('non_field_errors', response.data)