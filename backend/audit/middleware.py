from .models import ActivityLog
from django.db import connection
import re

class ActivityLogMiddleware:
    """Middleware to log user activities"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        response = self.get_response(request)
        
        # Fix the logic - this was incorrectly returning for authenticated GET requests
        # Only log if the user is authenticated and request is NOT a safe method
        if request.user.is_authenticated and request.method not in ['GET', 'HEAD', 'OPTIONS']:
            # Only log specific URLs and methods
            if self._should_log(request):
                self._log_activity(request, response)
            
        return response
    
    def _should_log(self, request):
        """Determine if the request should be logged"""
        # Don't log static files or admin media requests
        if re.match(r'^/static/', request.path) or re.match(r'^/media/', request.path):
            return False
            
        # Don't log if user is not authenticated
        if not request.user.is_authenticated:
            return False
            
        # Log all write operations (non-GET requests)
        if request.method not in ['GET', 'HEAD', 'OPTIONS']:
            return True
            
        # Log specific GET endpoints that should be tracked
        if re.match(r'^/api/v1/security/', request.path) or \
           re.match(r'^/api/v1/admin/', request.path):
            return True
            
        return False
    
    def _log_activity(self, request, response):
        """Log the activity to the database"""
        try:
            if response.status_code >= 400:
                return  # Don't log errors
                
            # Extract user and request details
            user = request.user
            path = request.path
            method = request.method
            
            # Determine the action based on the request
            action = f"{method} {path}"
            
            # Get client IP address
            ip_address = self._get_client_ip(request)
            
            # Log the activity
            ActivityLog.objects.create(
                user=user,
                action=action,
                ip_address=ip_address,
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                details=self._get_request_details(request)
            )
        except Exception as e:
            # Just silently fail if logging fails
            pass
    
    def _get_client_ip(self, request):
        """Extract the client IP address from the request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _get_request_details(self, request):
        """Get details about the request to log"""
        details = {
            'path': request.path,
            'method': request.method,
        }
        
        # Add query parameters if present
        if request.GET:
            details['query_params'] = dict(request.GET)
            
        return str(details)