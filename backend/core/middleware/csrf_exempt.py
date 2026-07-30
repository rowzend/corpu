"""
CSRF Exempt Middleware for API endpoints
"""
from django.utils.deprecation import MiddlewareMixin
from django.views.decorators.csrf import csrf_exempt


class CSRFExemptMiddleware(MiddlewareMixin):
    """
    Middleware to exempt API endpoints from CSRF validation
    """
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        """
        Exempt API endpoints from CSRF validation
        """
        # List of URL patterns to exempt from CSRF
        exempt_patterns = [
            '/apicorpu/',  # All API endpoints
            '/api/',       # DRF browsable API
        ]
        
        # Check if request path matches any exempt pattern
        for pattern in exempt_patterns:
            if request.path.startswith(pattern):
                # Mark view as CSRF exempt
                return csrf_exempt(view_func)(request, *view_args, **view_kwargs)
        
        # Continue with normal CSRF validation
        return None