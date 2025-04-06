from django.test import TestCase
from apps.authentication.models import YourModel

class YourModelTestCase(TestCase):
    def setUp(self):
        self.model_instance = YourModel.objects.create(field1='value1', field2='value2')

    def test_model_creation(self):
        self.assertEqual(self.model_instance.field1, 'value1')
        self.assertEqual(self.model_instance.field2, 'value2')

    def test_model_constraints(self):
        with self.assertRaises(ValueError):
            YourModel.objects.create(field1=None, field2='value2')