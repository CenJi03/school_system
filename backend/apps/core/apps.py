from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.core'
    verbose_name = 'Core'

    def ready(self):
        # Import signals only if the module exists
        try:
            import apps.core.signals  # noqa
        except ImportError:
            pass  # Module doesn't exist yet, that's okay