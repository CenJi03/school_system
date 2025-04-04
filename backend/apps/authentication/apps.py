from django.apps import AppConfig


class AuthenticationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.authentication'
    verbose_name = 'Authentication'

    def ready(self):
        try:
            import apps.authentication.signals  # noqa
        except ImportError:
            pass  # Module doesn't exist yet, that's okay