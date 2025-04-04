from rest_framework.throttling import AnonRateThrottle as DRFAnonRateThrottle
from rest_framework.throttling import UserRateThrottle as DRFUserRateThrottle

class AnonRateThrottle(DRFAnonRateThrottle):
    """
    Limits the rate of API calls that can be made by anonymous users.
    The IP address of the request will be used as the unique cache key.
    """
    scope = 'anon'

class UserRateThrottle(DRFUserRateThrottle):
    """
    Limits the rate of API calls that can be made by authenticated users.
    The user id will be used as the unique cache key.
    """
    scope = 'user'

class LoginRateThrottle(DRFAnonRateThrottle):
    """
    Throttle for login attempts.
    """
    scope = 'login'

class PasswordResetRateThrottle(DRFAnonRateThrottle):
    """
    Throttle for password reset requests.
    """
    scope = 'password_reset'