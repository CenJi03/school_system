# School Management System

A comprehensive school management system built with Django REST Framework and Vue.js.

## Features

- User authentication and authorization
- School and department management
- Student management and enrollment
- Course curriculum and materials
- Class schedules and attendance tracking
- Assignment submissions and grading
- Administrative dashboard

## Tech Stack

### Backend
- Django 5.0 and Django REST Framework
- PostgreSQL for database
- Redis for caching and message queuing
- JWT for authentication

### Frontend
- Vue.js 3 with Composition API
- Vite for build tooling
- Pinia for state management
- Vue Router for routing
- Tailwind CSS for styling

### Infrastructure
- Docker and Docker Compose for containerization
- Nginx for reverse proxy
- Gunicorn for WSGI server

## Project Structure

The project follows a modern microservices-inspired architecture:

```
rebuild_system/
│
├── .env                   # Environment variables (not committed to version control)
├── .gitignore             # Git ignore file
├── docker-compose.yml     # Docker Compose configuration
├── README.md              # Project documentation
│
├── backend/               # Django backend application
│   ├── backend/           # Django project configuration
│   ├── apps/              # Django apps package
│   │   ├── authentication/    # User authentication app
│   │   ├── core/              # Core functionality app
│   │   ├── curriculum/        # Curriculum management app
│   │   ├── students/          # Student management app
│   │   └── ...                # Other application modules
│   ├── manage.py          # Django management script
│   └── Dockerfile         # Backend Dockerfile
│
├── frontend/              # Vue.js frontend application
│   ├── public/            # Public assets
│   ├── src/               # Source code
│   │   ├── api/           # API integration
│   │   ├── assets/        # Static assets
│   │   ├── components/    # Vue components
│   │   ├── composables/   # Vue composables
│   │   ├── router/        # Vue Router
│   │   ├── stores/        # Pinia stores
│   │   ├── utils/         # Utility functions
│   │   └── views/         # Vue views
│   ├── package.json       # NPM package file
│   └── Dockerfile         # Frontend Dockerfile
│
└── docker/                # Docker configuration
    ├── nginx/             # Nginx configuration
    ├── postgres/          # PostgreSQL initialization
    └── redis/             # Redis configuration
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git

### Installation and Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/rebuild_system.git
   cd rebuild_system
   ```

2. Create environment file:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration.

3. Start the application:
   ```bash
   docker-compose up -d
   ```

4. Create database migrations and apply them:
   ```bash
   # Option 1: Using the helper script
   python migrations_fix.py

   # Option 2: Generate migrations manually for all apps
   python manage.py makemigrations apps.core apps.authentication apps.curriculum apps.students apps.staff apps.facilities apps.finance apps.marketing apps.quality security audit

   # Option 3: Generate migrations for each app separately
   python manage.py makemigrations apps.core
   python manage.py makemigrations apps.authentication
   # ... and so on for each app

   # Apply migrations
   python manage.py migrate
   ```

   Note: If you see "no such table" errors, it means migrations haven't been applied yet.

5. Create a superuser:
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

6. Access the application:
   - Frontend: http://localhost
   - Backend API: http://localhost/api/v1/
   - Admin Panel: http://localhost/admin/

## Development

### Backend Development

```bash
# Run backend migrations
python manage.py migrate

# Create new app
python manage.py startapp new_app apps/new_app

# Run tests
pytest
```

### Frontend Development

```bash
# Install dependencies
npm install

# Serve with hot reload
npm run dev

# Build for production
npm run build
```

## Troubleshooting

1. **"no such table" errors**:
   - These typically appear when migrations haven't been run or didn't create the tables correctly
   - Run `python migrations_fix.py` to create and apply all migrations

2. **Missing modules**:
   - Ensure all required apps are in INSTALLED_APPS in settings.py
   - Check for circular imports in your code

3. **Signal module issues**:
   - If you see ModuleNotFoundError for signal modules, make sure the signals.py file exists in each app directory

## License

[MIT License](LICENSE)

## Acknowledgements

- Django - https://www.djangoproject.com/
- Django REST Framework - https://www.django-rest-framework.org/
- Vue.js - https://vuejs.org/
- Tailwind CSS - https://tailwindcss.com/