import os
import sys
import subprocess

def reset_migrations():
    """
    Reset migrations by flushing the database and applying migrations in the correct order.
    This is useful when dealing with migration history inconsistencies.
    """
    print("Warning: This will reset all data in the database.")
    confirm = input("Are you sure you want to continue? (y/n): ")
    
    if confirm.lower() != 'y':
        print("Operation cancelled.")
        return
    
    print("Flushing the database...")
    subprocess.run([sys.executable, "manage.py", "flush", "--no-input"])
    
    print("Removing migration records from database...")
    # Use Django's built-in command to fake migrations to zero state
    subprocess.run([sys.executable, "manage.py", "migrate", "--fake", "zero"])
    
    print("Re-applying migrations in the correct order...")
    # Run migrations in correct order
    from migrate import run_migrations
    run_migrations()
    
    print("\nMigration reset completed!")

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings.development")
    reset_migrations()
