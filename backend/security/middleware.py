import re
import time
from django.http import HttpResponse, HttpResponseForbidden
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache
from django.urls import is_valid_path
from django.db import models

from .models import BlockedIP, SecurityLog


class RateLimitMiddleware:
    """Middleware to implement rate limiting for API endpoints"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        if not getattr(settings, 'RATE_LIMIT_ENABLE', True):
            return self.get_response(request)
        
        # Skip rate limiting for admin paths
        if request.path.startswith('/admin/'):
            return self.get_response(request)
        
        # Apply different rate limits based on path
        rate_limit = self.get_rate_limit(request)
        
        if rate_limit:
            # Check if request should be rate limited
            if self.should_be_rate_limited(request, rate_limit):
                return HttpResponse(
                    "Rate limit exceeded. Please try again later.",
                    status=429
                )
        
        return self.get_response(request)
    
    def get_rate_limit(self, request):
        """
        Determine rate limit based on the path pattern
        Returns (requests, seconds) tuple if applicable, None otherwise
        """
        # Default rate limits for different endpoints
        rate_limits = {
            r'^/api/auth/login': (5, 60),  # 5 requests per 60 seconds for login
            r'^/api/auth/register': (3, 60),  # 3 requests per 60 seconds for registration
            r'^/api/auth/password': (3, 300),  # 3 requests per 5 minutes for password reset
            r'^/api/': (60, 60),  # 60 requests per minute for general API use
        }
        
        # Check each pattern against the request path
        for pattern, limit in rate_limits.items():
            if re.match(pattern, request.path):
                return limit
                
        return None
    
    def should_be_rate_limited(self, request, rate_limit):
        """
        Check if the request should be rate limited based on client IP
        """
        ip = self.get_client_ip(request)
        
        # For authenticated users, use user ID as part of the cache key
        if request.user.is_authenticated:
            key = f"rate_limit_{request.path}_{request.user.id}"
        else:
            key = f"rate_limit_{request.path}_{ip}"
            
        max_requests, seconds = rate_limit
        
        # Get current timestamps for this key
        timestamps = cache.get(key, [])
        now = time.time()
        
        # Filter out timestamps older than the window
        valid_timestamps = [t for t in timestamps if t > now - seconds]
        
        # Check if rate limit is exceeded
        if len(valid_timestamps) >= max_requests:
            return True
            
        # Add current timestamp and update cache
        valid_timestamps.append(now)
        cache.set(key, valid_timestamps, seconds * 2)  # Keep data for twice the window for safety
        
        return False
    
    def get_client_ip(self, request):
        """Extract the client IP address from the request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SecurityMiddleware:
    """Middleware to implement security measures"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Compile common attack patterns
        self.sql_injection_patterns = [
            r"(\%27)|(\')|(\-\-)|(\%23)|(#)",
            r"((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))",
            r"(union).*(select).*(\()",
        ]
        
        self.xss_patterns = [
            r"<[^\w<>]*(?:[^<>\"'\s]*:)?[^\w<>]*(?:\W*s\W*c\W*r\W*i\W*p\W*t|\W*i\W*m\W*g|\W*o\W*n\W*e\W*r\W*r\W*o\W*r|\W*s\W*t\W*y\W*l\W*e|\W*t\W*a\W*b\W*i\W*n\W*d\W*e\W*x|\W*a\W*l\W*e\W*r\W*t|\W*o\W*n\W*f\W*o\W*c\W*u\W*s)",
            r"(javascript|vbscript):",
            r"eval\((.*)\)"
        ]
        
        self.path_traversal_patterns = [
            r"\.{2}/",
            r"\.{2}\\",
        ]
        
    def __call__(self, request):
        # Check if the IP is blocked
        if self.is_ip_blocked(request):
            return HttpResponseForbidden("Access denied: Your IP address has been blocked.")
        
        # Check for suspicious patterns in request
        if self.check_for_attacks(request):
            # Log the attack and potentially block the IP
            self.handle_attack_attempt(request)
            return HttpResponseForbidden("Access denied: Security violation detected.")
        
        # Rate limiting for specific endpoints
        if self.should_rate_limit(request):
            return HttpResponseForbidden("Rate limit exceeded. Please try again later.")
        
        # Add security headers to response
        response = self.get_response(request)
        self.add_security_headers(response)
        
        return response
    
    def is_ip_blocked(self, request):
        """Check if the requesting IP is blocked"""
        ip_address = self.get_client_ip(request)
        
        # Check cache first to avoid database lookup
        cache_key = f"blocked_ip_{ip_address}"
        blocked = cache.get(cache_key)
        if blocked is not None:
            return blocked
        
        # If not in cache, check database
        is_blocked = BlockedIP.objects.filter(
            ip_address=ip_address
        ).filter(
            models.Q(is_permanent=True) | 
            models.Q(blocked_until__gt=timezone.now())
        ).exists()
        
        # Cache the result
        cache.set(cache_key, is_blocked, 300)  # Cache for 5 minutes
        
        return is_blocked
    
    def check_for_attacks(self, request):
        """Check request for signs of common attacks"""
        # Get the path, query string, and request body content
        path = request.path_info
        query_string = request.META.get('QUERY_STRING', '')
        content = ""
        
        # Try to get request body if it's a POST request with form data
        if request.method == 'POST' and request.content_type == 'application/x-www-form-urlencoded':
            content = request.body.decode('utf-8', errors='ignore')
        
        # Check path for valid URL to prevent path traversal
        if not is_valid_path(path):
            return True
        
        # Check for path traversal
        for pattern in self.path_traversal_patterns:
            if re.search(pattern, path) or re.search(pattern, query_string):
                return True
        
        # Check for SQL injection
        for pattern in self.sql_injection_patterns:
            if (re.search(pattern, path) or 
                re.search(pattern, query_string) or 
                re.search(pattern, content)):
                return True
        
        # Check for XSS
        for pattern in self.xss_patterns:
            if (re.search(pattern, path) or 
                re.search(pattern, query_string) or 
                re.search(pattern, content)):
                return True
        
        return False
    
    def handle_attack_attempt(self, request):
        """Log and handle a detected attack attempt"""
        ip_address = self.get_client_ip(request)
        
        # Log the attack using the audit app
        from audit.models import SecurityAlert
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        user = None
        
        if request.user.is_authenticated:
            user = request.user
        
        # Create security alert
        SecurityAlert.objects.create(
            user=user if user else User.objects.filter(is_superuser=True).first(),
            type='ATTACK_ATTEMPT',
            details=f"Potential security attack detected from IP {ip_address}. Path: {request.path}, Method: {request.method}",
            severity='HIGH',
            status='NEW',
            ip_address=ip_address
        )
        
        # Potentially block repeated offenders
        attack_key = f"attack_attempts_{ip_address}"
        attempts = cache.get(attack_key, 0) + 1
        cache.set(attack_key, attempts, 3600)  # Store for 1 hour
        
        # If multiple attacks are detected, block the IP
        if attempts >= getattr(settings, 'ATTACK_ATTEMPT_THRESHOLD', 3):
            BlockedIP.objects.get_or_create(
                ip_address=ip_address,
                defaults={
                    'reason': f"Automated block after {attempts} attack attempts",
                    'blocked_until': timezone.now() + timezone.timedelta(hours=24),
                    'is_permanent': False
                }
            )
            # Clear the counter after blocking
            cache.delete(attack_key)
    
    def should_rate_limit(self, request):
        """Check if the request should be rate-limited"""
        # Only rate limit specific endpoints
        if not self.is_rate_limited_endpoint(request.path):
            return False
        
        ip_address = self.get_client_ip(request)
        
        # Rate limit key is specific to the IP and path
        rate_key = f"rate_limit_{ip_address}_{request.path}"
        
        # Get current count and increment
        count = cache.get(rate_key, 0) + 1
        
        # Different endpoints might have different rate limits
        limit = self.get_rate_limit_for_endpoint(request.path)
        
        if count > limit:
            return True
        
        # Set the new count with TTL
        ttl = 60  # 1 minute window
        cache.set(rate_key, count, ttl)
        
        return False
    
    def is_rate_limited_endpoint(self, path):
        """Check if the endpoint should have rate limiting applied"""
        # Apply rate limiting to login, registration, password reset endpoints
        rate_limited_paths = [
            '/api/auth/login/',
            '/api/auth/register/',
            '/api/auth/password-reset/',
        ]
        
        return any(path.startswith(limited_path) for limited_path in rate_limited_paths)
    
    def get_rate_limit_for_endpoint(self, path):
        """Get the rate limit for a specific endpoint"""
        # Different endpoints might have different limits
        if '/api/auth/login/' in path:
            return getattr(settings, 'LOGIN_RATE_LIMIT', 5)  # 5 attempts per minute
        elif '/api/auth/register/' in path:
            return getattr(settings, 'REGISTER_RATE_LIMIT', 3)  # 3 attempts per minute
        elif '/api/auth/password-reset/' in path:
            return getattr(settings, 'PASSWORD_RESET_RATE_LIMIT', 3)  # 3 attempts per minute
        
        # Default rate limit
        return getattr(settings, 'DEFAULT_RATE_LIMIT', 20)  # 20 requests per minute
    
    def add_security_headers(self, response):
        """Add security headers to the response"""
        # Content Security Policy
        response['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'"
        
        # Other security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Only add HSTS header in production
        if not settings.DEBUG:
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        return response
    
    def get_client_ip(self, request):
        """Extract the client IP address from the request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            # Get the first IP in case of multiple proxies
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SecurityHeadersMiddleware:
    """Middleware to add security headers to responses"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-XSS-Protection'] = '1; mode=block'
        response['X-Frame-Options'] = 'DENY'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # In production, add more strict headers
        if not settings.DEBUG:
            # Enable HSTS (HTTP Strict Transport Security)
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            
            # Content Security Policy
            csp_parts = [
                "default-src 'self'",
                "img-src 'self' data:",
                "style-src 'self' 'unsafe-inline'",
                "script-src 'self'",
                "connect-src 'self'",
                "font-src 'self'",
                "object-src 'none'",
                "frame-ancestors 'none'",
                "form-action 'self'",
                "base-uri 'self'",
            ]
            response['Content-Security-Policy'] = "; ".join(csp_parts)
        
        return response