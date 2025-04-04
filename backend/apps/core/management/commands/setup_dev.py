from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import connection
import time

class Command(BaseCommand):
    help = 'Sets up the development environment by creating and applying migrations, and optionally creating sample data'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--sample-data',
            action='store_true',
            help='Create sample data for development',
        )

    def handle(self, *args, **options):
        # Check database connection
        self.stdout.write('Checking database connection...')
        try:
            connection.ensure_connection()
            self.stdout.write(self.style.SUCCESS('Database connection successful'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Database connection failed: {e}'))
            return
        
        # Make migrations
        self.stdout.write('Creating migrations...')
        call_command('makemigrations')
        
        # Apply migrations
        self.stdout.write('Applying migrations...')
        call_command('migrate')
        
        # Create sample data if requested
        if options['sample_data']:
            self.stdout.write('Creating sample data...')
            try:
                # Import here to avoid circular imports
                from apps.core.utils.sample_data import create_sample_data
                create_sample_data()
                self.stdout.write(self.style.SUCCESS('Sample data created successfully'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed to create sample data: {e}'))
        
        self.stdout.write(self.style.SUCCESS('Development environment setup complete!'))
        self.stdout.write('\nNext steps:')
        self.stdout.write('1. Create a superuser: python manage.py createsuperuser')
        self.stdout.write('2. Run the development server: python manage.py runserver')
