"""
Migration helper script - run this to generate initial migrations for all apps
"""

import os
import sys
import subprocess

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings.development')

# List of all the apps to make migrations for
APPS = [
    'apps.core',
    'apps.authentication',
    'apps.curriculum',
    'apps.students',
    'apps.staff',
    'apps.facilities',
    'apps.finance',
    'apps.marketing',
    'apps.quality',
    'security',
    'audit'
]

def run_command(command):
    """Run a command and print output"""
    print(f"Running: {' '.join(command)}")
    result = subprocess.run(command, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(f"Error: {result.stderr}")
    return result.returncode

def main():
    # Generate migrations for each app
    for app in APPS:
        print(f"\n=== Generating migrations for {app} ===")
        run_command(['python', 'manage.py', 'makemigrations', app])
    
    # Apply all migrations
    print("\n=== Applying all migrations ===")
    run_command(['python', 'manage.py', 'migrate'])
    
    print("\nMigration process complete. If you encountered any errors, resolve them and run again.")

if __name__ == '__main__':
    main()
