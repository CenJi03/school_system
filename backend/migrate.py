import os
import sys
import subprocess

def run_migrations():
    """
    Run migrations in the correct order to handle dependencies between apps
    """
    # First, make migrations for all apps
    print("Making migrations...")
    subprocess.run([sys.executable, "manage.py", "makemigrations", "core"])
    subprocess.run([sys.executable, "manage.py", "makemigrations", "authentication"])
    subprocess.run([sys.executable, "manage.py", "makemigrations", "security"])
    subprocess.run([sys.executable, "manage.py", "makemigrations", "audit"])
    subprocess.run([sys.executable, "manage.py", "makemigrations", "curriculum"])
    subprocess.run([sys.executable, "manage.py", "makemigrations", "staff"])
    subprocess.run([sys.executable, "manage.py", "makemigrations", "students"])
    subprocess.run([sys.executable, "manage.py", "makemigrations", "facilities"])
    subprocess.run([sys.executable, "manage.py", "makemigrations", "finance"])
    subprocess.run([sys.executable, "manage.py", "makemigrations", "marketing"])
    subprocess.run([sys.executable, "manage.py", "makemigrations", "quality"])
    
    # Then, apply migrations in the correct order - fixing the dependency order
    print("\nApplying migrations...")
    subprocess.run([sys.executable, "manage.py", "migrate", "contenttypes"])
    subprocess.run([sys.executable, "manage.py", "migrate", "auth"])
    subprocess.run([sys.executable, "manage.py", "migrate", "authentication"])
    subprocess.run([sys.executable, "manage.py", "migrate", "core"])
    subprocess.run([sys.executable, "manage.py", "migrate", "security"])
    subprocess.run([sys.executable, "manage.py", "migrate", "audit"])
    subprocess.run([sys.executable, "manage.py", "migrate", "curriculum"])
    subprocess.run([sys.executable, "manage.py", "migrate", "staff"])
    subprocess.run([sys.executable, "manage.py", "migrate", "students"])
    subprocess.run([sys.executable, "manage.py", "migrate", "facilities"])
    subprocess.run([sys.executable, "manage.py", "migrate", "finance"])
    subprocess.run([sys.executable, "manage.py", "migrate", "marketing"])
    subprocess.run([sys.executable, "manage.py", "migrate", "quality"])
    
    # Finally, migrate any remaining apps
    subprocess.run([sys.executable, "manage.py", "migrate"])
    
    print("\nMigrations completed!")

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings.development")
    run_migrations()
