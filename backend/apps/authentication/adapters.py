"""
Helper functions and adapters for the authentication app
"""

def get_client_ip(request):
    """
    Get the client's IP address from the request
    
    Args:
        request: The HTTP request object
        
    Returns:
        str: The client's IP address
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # Get the first IP in case of multiple proxies
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_user_profile_url(user):
    """
    Get the full URL for a user's profile picture
    
    Args:
        user: The user instance
        
    Returns:
        str: The full URL to the user's profile picture or None
    """
    if not user.profile_picture:
        return None
    
    if hasattr(user.profile_picture, 'url'):
        return user.profile_picture.url
    
    return None