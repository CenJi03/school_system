from django.apps import AppConfig

class AuditConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'audit'
    
    def ready(self):
        try:
            import audit.signals  # Import signals
        except Exception as e:
            # Log the error but don't prevent app from loading
            print(f"Error importing audit signals: {e}")