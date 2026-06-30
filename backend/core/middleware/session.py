"""
Session management middleware
"""
from django.conf import settings
from django.contrib.auth import logout
from django.shortcuts import redirect
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
import time


class SessionInactivityMiddleware:
    """
    Middleware untuk auto-logout user jika inactive
    Track last activity time dan logout jika melebihi timeout
    Log auto-logout to ms_log_data
    
    Session timeout is dynamically read from AppSettings (session_timeout)
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        # Default timeout: 30 minutes (in seconds)
        self.default_timeout = 1800
    
    def get_session_timeout(self):
        """
        Get session timeout from database settings
        Returns timeout in seconds
        """
        try:
            from apps.manajemen.helpers import get_app_setting
            # Get session_timeout from database (stored in minutes)
            timeout_minutes = get_app_setting('session_timeout', default=30, as_type='int')
            # Convert to seconds
            return timeout_minutes * 60
        except Exception:
            # Fallback to default if database read fails
            return self.default_timeout
    
    def __call__(self, request):
        # Skip untuk anonymous users
        if request.user.is_authenticated:
            # Get current time
            current_time = time.time()
            
            # Get last activity time dari session
            last_activity = request.session.get('last_activity')
            
            if last_activity:
                # Get dynamic timeout from database
                timeout = self.get_session_timeout()
                
                # Calculate inactive time
                inactive_time = current_time - last_activity
                
                # Check if user has been inactive too long
                if inactive_time > timeout:
                    # Save user info before logout
                    user_to_log = request.user
                    
                    # Log auto-logout to ms_log_data
                    try:
                        from core.models import MsLogData
                        MsLogData.log_logout(
                            user=user_to_log,
                            request=request,
                            via='web',
                            description=f'Auto-logout: Session expired after {int(inactive_time/60)} minutes inactive (timeout: {int(timeout/60)} minutes)'
                        )
                    except Exception as e:
                        # Don't fail logout if logging fails
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.error(f"Failed to log auto-logout: {e}")
                    
                    # Logout user
                    logout(request)
                    # Set logout reason di session (untuk message)
                    request.session['logout_reason'] = 'inactivity'
            
            # Update last activity time
            request.session['last_activity'] = current_time
        
        response = self.get_response(request)
        return response


class ForceChangePasswordMiddleware:
    """
    Middleware to force users with default password to change it
    Users cannot access any page except force change password page until they change it
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # URLs that are allowed even with default password
        self.allowed_paths = [
            '/accounts/force-change-password/',
            '/accounts/logout/',
            '/static/',
            '/media/',
        ]
        
        # API paths that should be skipped (no redirect for API endpoints)
        self.api_paths = [
            '/apicorpu/',
            '/api/',
            '/admin/',
            '/health/',
        ]
    
    def __call__(self, request):
        # Skip for anonymous users
        if not request.user.is_authenticated:
            return self.get_response(request)
        
        # Skip for API endpoints - no redirect for API calls
        current_path = request.path
        is_api_path = any(current_path.startswith(path) for path in self.api_paths)
        
        if is_api_path:
            return self.get_response(request)
        
        # Check if current path is allowed
        is_allowed = any(current_path.startswith(path) for path in self.allowed_paths)
        
        if is_allowed:
            return self.get_response(request)
        
        # Check if user has default password
        if request.user.check_password('Pegawai@Pessel'):
            # Redirect to force change password page
            return redirect('accounts:force_change_password')
        
        response = self.get_response(request)
        return response
