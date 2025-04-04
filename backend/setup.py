#!/usr/bin/env python
"""
Setup script to initialize the development environment for the School Management System.
This script creates migrations and applies them to set up the database.
"""
import os
import subprocess
import sys

def run_command(command):
    """Run a shell command and print output."""
    print(f"Running: {command}")
    process = subprocess.run(command, shell=True)
    if process.returncode != 0:
        print(f"Command failed with exit code {process.returncode}")
        return False
    return True

def setup():
    """Run setup procedures."""
    print("Setting up the School Management System development environment...")
    
    # Make sure we're in the correct directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    
    # Create migrations
    if not run_command("python manage.py makemigrations"):
        return False
    
    # Apply migrations
    if not run_command("python manage.py migrate"):
        return False
    
    print("\nSetup completed successfully!")
    print("\nNext steps:")
    print("1. Create a superuser: python manage.py createsuperuser")
    print("2. Run the development server: python manage.py runserver")
    
    return True

if __name__ == "__main__":
    success = setup()
    sys.exit(0 if success else 1)
