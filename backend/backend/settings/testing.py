"""
Settings for running tests.
"""
from .settings import *

# Turn off debug mode for tests
DEBUG = False

# SECURITY WARNING: use a proper secret key in production
SECRET_KEY = 'django-insecure-testing-key-not-for-production'

# Use SQLite database for tests for speed
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'test_db.sqlite3',
    }
}

# Speed up password hashing in tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable migrations during tests
class DisableMigrations:
    def __contains__(self, item):
        return True

    def __getitem__(self, item):
        # Return 'nomigrations' instead of None for better compatibility
        return 'nomigrations'

MIGRATION_MODULES = DisableMigrations()

# Cache settings for tests
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Use console email backend for tests
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Media storage in memory for tests
DEFAULT_FILE_STORAGE = 'django.core.files.storage.InMemoryStorage'