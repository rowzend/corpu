"""
Utility functions for Knowledge Base app
"""


def get_client_ip(request):
    """
    Get client IP address from request
    Handles proxy headers (X-Forwarded-For, X-Real-IP)
    
    Args:
        request: Django HttpRequest object
    
    Returns:
        str: IP address of the client
    """
    # Check for proxy headers first
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # X-Forwarded-For can contain multiple IPs (client, proxy1, proxy2, ...)
        # Take the first one (original client IP)
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        # Check X-Real-IP header (used by some proxies like nginx)
        ip = request.META.get('HTTP_X_REAL_IP')
        if not ip:
            # Fallback to REMOTE_ADDR
            ip = request.META.get('REMOTE_ADDR')
    
    return ip


def get_user_agent(request):
    """
    Get user agent string from request
    
    Args:
        request: Django HttpRequest object
    
    Returns:
        str: User agent string (browser/device info)
    """
    return request.META.get('HTTP_USER_AGENT', '')
