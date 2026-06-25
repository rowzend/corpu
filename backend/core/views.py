from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.db import connections
from django.core.cache import cache
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from django.db.models import Q
from django.utils import timezone
import json
import logging

# JWT imports
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken, TokenError
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from datetime import timedelta
from core.rate_limiter import rate_limit, rate_limit_strict, rate_limit_moderate

logger = logging.getLogger(__name__)
User = get_user_model()


# Custom Permanent Token Class for v4.0
class PermanentAccessToken(AccessToken):
    """
    ⚠️  DEPRECATED - JWT Token with permanent lifetime (100 years)
    For Laravel v4.0 API backward compatibility only.

    WARNING: This class creates tokens that never expire (100 years).
    This is a security risk. Do NOT use for new integrations.
    Will be removed in future versions. Use v5.0 JWT with 24h expiry instead.
    """
    @classmethod
    def for_user(cls, user):
        logger.warning(
            f"⚠️  DEPRECATED: PermanentAccessToken used for user {user.id} ({user.username}). "
            f"Token has 100-year lifetime. Use v5.0 JWT with 24h expiry instead."
        )
        token = super().for_user(user)
        # Set token to expire in 100 years (effectively permanent)
        token.set_exp(lifetime=timedelta(days=36500))  # 100 years
        return token


# JWT Authentication Decorator
def jwt_required(view_func):
    """
    Decorator to require JWT authentication for API endpoints
    Checks Authorization: Bearer <token> header
    """
    from functools import wraps
    
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Get Authorization header
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header:
            return JsonResponse({
                'status': 'error',
                'message': 'Missing Authorization header',
                'code': 'MISSING_AUTH_HEADER',
                'version': '5.0'
            }, status=401)
        
        # Check Bearer format
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid Authorization header format. Use: Bearer <token>',
                'code': 'INVALID_AUTH_FORMAT',
                'version': '5.0'
            }, status=401)
        
        # Extract token
        token_str = auth_header.split(' ')[1]
        
        try:
            # Verify token (support both v4.0 permanent and v5.0 time-based tokens)
            token = AccessToken(token_str)
            user_id = token.get('user_id')
            token_issued_at = token.get('iat')  # Issued at timestamp
            
            # Check if token is blacklisted
            from core.token_blacklist import TokenBlacklist
            if TokenBlacklist.is_blacklisted(token_str):
                return JsonResponse({
                    'status': 'error',
                    'message': 'Token has been revoked',
                    'code': 'TOKEN_REVOKED',
                    'version': '5.0'
                }, status=401)
            
            # Get user
            try:
                user = User.objects.get(id=user_id)
                
                # Check if user is active
                if not user.is_active:
                    return JsonResponse({
                        'status': 'error',
                        'message': 'User account is inactive',
                        'code': 'USER_INACTIVE',
                        'version': '5.0'
                    }, status=403)
                
                # Check if all user tokens are blacklisted (e.g., after password change)
                if TokenBlacklist.is_user_blacklisted(user_id, token_issued_at):
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Token has been revoked (user action)',
                        'code': 'TOKEN_REVOKED_USER',
                        'version': '5.0'
                    }, status=401)
                
                # Attach user and token to request
                request.jwt_user = user
                request.jwt_token = token_str  # Store token for logout
                
                # Call the original view
                return view_func(request, *args, **kwargs)
                
            except User.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'User not found',
                    'code': 'USER_NOT_FOUND',
                    'version': '5.0'
                }, status=404)
                
        except (TokenError, InvalidToken) as e:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid or expired token',
                'code': 'INVALID_TOKEN',
                'version': '5.0'
            }, status=401)
        except Exception as e:
            logger.error(f"JWT authentication error: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': 'Authentication failed',
                'code': 'AUTH_ERROR',
                'version': '5.0'
            }, status=401)
    
    return wrapper

def landing_page(request):
    """
    Landing page = Login page (backend-only system)
    POST handler untuk login dari landing page
    """
    # Redirect jika sudah login
    if request.user.is_authenticated:
        # Check if user wants new dashboard (via query param or setting)
        use_new_dashboard = request.GET.get('new_ui', 'false').lower() == 'true'
        
        if use_new_dashboard:
            # Redirect to Next.js dashboard
            return redirect('http://localhost:3004/dashboard')
        else:
            # Default: Django dashboard
            return redirect('/dashboard/')
    
    # Note: app_name, app_long_name, app_instansi now auto-injected by context processor
    # No need to manually add context here!
    
    # Handle POST (login form submission)
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        remember = request.POST.get('remember', False)
        
        # Check if AJAX request
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        # Check if user exists (by username or email)
        user_exists = User.objects.filter(
            Q(username=username) | Q(email=username)
        ).exists()
        
        if not user_exists:
            # Username tidak ditemukan di database
            error_msg = 'Username tidak ditemukan. Silakan hubungi administrator untuk registrasi akun.'
            
            # Log failed login attempt (username not found)
            try:
                from core.models import MsLogData
                MsLogData.log_login_failed(username, request, via='web', reason='Username not found')
            except Exception as e:
                logger.error(f"Failed to log login failure: {e}")
            
            if is_ajax:
                return JsonResponse({
                    'success': False,
                    'message': error_msg,
                    'type': 'error'
                })
            else:
                messages.error(request, error_msg)
                return render(request, 'landing.html')
        
        # User exists, now authenticate (check password)
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            # CONDITIONAL SINGLE SESSION: Only enforce for NIP/NIK-based usernames
            from core.session_utils import (
                should_enforce_single_session_web,
                force_single_session,
                track_user_session
            )
            
            # Check if single session should be enforced (NIP/NIK usernames only)
            if should_enforce_single_session_web(user):
                # Delete old sessions for this user (logout from other devices)
                deleted = force_single_session(user)
                if deleted > 0:
                    logger.info(f"[NIP/NIK] Logged out {deleted} other session(s) for user {user.username}")
            else:
                logger.info(f"[Non-NIP/NIK] Allowing multiple devices for user {user.username}")
            
            # Login sukses (create new session)
            login(request, user)
            
            # Track this new session (only if single session enforced)
            if should_enforce_single_session_web(user):
                track_user_session(user, request.session.session_key)
            
            # Set session expiry
            if not remember:
                request.session.set_expiry(0)  # Expire saat browser ditutup
            else:
                request.session.set_expiry(2592000)  # 30 days
            
            # Log login activity to ms_log_data
            try:
                from core.models import MsLogData
                MsLogData.log_login(user, request, via='web')
            except Exception as e:
                logger.error(f"Failed to log login activity: {e}")
            
            # CHECK: Force change password if using default password
            if user.check_password('Pegawai@Pessel'):
                logger.info(f"User {user.username} using default password - redirecting to force change password")
                force_change_url = '/accounts/force-change-password/'
                
                if is_ajax:
                    return JsonResponse({
                        'success': True,
                        'message': 'Anda harus mengganti password default terlebih dahulu',
                        'redirect_url': force_change_url,
                        'type': 'warning'
                    })
                else:
                    return redirect('accounts:force_change_password')
            
            success_msg = f'Selamat datang, {user.name}!'
            next_url = request.GET.get('next', '/dashboard/')
            
            if is_ajax:
                return JsonResponse({
                    'success': True,
                    'message': success_msg,
                    'redirect_url': next_url,
                    'type': 'success'
                })
            else:
                messages.success(request, success_msg)
                return redirect(next_url)
        else:
            # User exists but password wrong
            error_msg = 'Username atau password salah!'
            
            # Log failed login attempt (wrong password)
            try:
                from core.models import MsLogData
                MsLogData.log_login_failed(username, request, via='web', reason='Invalid password')
            except Exception as e:
                logger.error(f"Failed to log login failure: {e}")
            
            if is_ajax:
                return JsonResponse({
                    'success': False,
                    'message': error_msg,
                    'type': 'error'
                })
            else:
                messages.error(request, error_msg)
    
    # Render landing page dengan login form
    return render(request, 'landing.html')

@require_http_methods(["POST"])
def login_view(request):
    """Handle login from landing page"""
    username = request.POST.get('username')
    password = request.POST.get('password')
    
    if username and password:
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, f'✅ Selamat datang, {user.username}!')
            return redirect('/dashboard/')
        else:
            messages.error(request, 'Username atau password salah!')
    else:
        messages.error(request, 'Username dan password harus diisi!')
    
    return redirect('/')


def logout_view(request):
    """Handle logout - supports both GET and POST"""
    logout(request)
    messages.success(request, '✅ Anda telah logout. Sampai jumpa!')
    # Redirect to Next.js landing page
    return redirect('http://localhost:3004/')


@csrf_exempt
def health_check(request):
    """Health check endpoint for Docker healthcheck"""
    try:
        # Check database connection
        db_conn = connections['default']
        db_conn.cursor()
        
        # Check Redis connection
        cache.set('health_check', 'ok', 30)
        cache_status = cache.get('health_check')
        
        return JsonResponse({
            'status': 'healthy',
            'database': 'connected',
            'cache': 'connected' if cache_status == 'ok' else 'disconnected',
            'message': f"{getattr(settings, 'APP_NAME', 'Aplikasi')} is running"
        })
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status=500)


def session_status(request):
    """Return current session status flags for frontend polling"""
    return JsonResponse({
        'authenticated': request.user.is_authenticated,
        'session_superseded': bool(request.session.get('session_superseded', False)),
        'logout_reason': request.session.get('logout_reason', '')
    })


def _dev_allowed(request):
    """Allow access if DEBUG=True or user is superadmin. Used for test error pages."""
    try:
        from apps.manajemen.helpers import is_superadmin
        return bool(getattr(settings, 'DEBUG', False) or (request.user.is_authenticated and is_superadmin(request.user)))
    except Exception:
        return False


@require_http_methods(["GET"])  # Test 400 page
def dev_test_400(request):
    if not _dev_allowed(request):
        return redirect('/')
    return render(request, '400.html', status=400)


@require_http_methods(["GET"])  # Test 404 page
def dev_test_404(request):
    if not _dev_allowed(request):
        return redirect('/')
    return render(request, '404.html', status=404)


@require_http_methods(["GET"])  # Test 500 page
def dev_test_500(request):
    if not _dev_allowed(request):
        return redirect('/')
    return render(request, '500.html', status=500)

@csrf_exempt
@require_http_methods(["GET", "POST"])
@rate_limit(max_requests=10, window=60, key_type='ip')  # 10 login attempts per minute per IP
def api_login_v4(request):
    """
    API Login endpoint v4.0 - Laravel Compatible (OLD VERSION)
    
    URL: /apicorpu/4.0/login/username-corpu
    Method: GET or POST
    Query Params:
        - login_username: Username, email, atau NIP
        - login_password: Password
    
    Response Format (OLD):
        Success: {
            "status": "success",
            "message": "Login berhasil",
            "data": {
                "user_id": 123,
                "username": "username",
                "name": "Nama User",
                "email": "email@example.com",
                "id_pegawai": 456,
                "session_key": "xxx..."
            }
        }
        Error: {
            "status": "error",
            "message": "Error message",
            "code": "ERROR_CODE"
        }
    
    NOTE: This is the old version (v4.0) for backward compatibility.
          New applications should use v5.0
    """
    # Get credentials from query params (support both GET and POST)
    login_username = request.GET.get('login_username') or request.POST.get('login_username')
    login_password = request.GET.get('login_password') or request.POST.get('login_password')
    
    # Validation
    if not login_username or not login_password:
        return JsonResponse({
            'data': None,
            'success_message': None,
            'errors': ['Username dan password harus diisi'],
            'error_message': 'Username dan password harus diisi'
        }, status=400)
    
    # Check if user exists (by username or email)
    user_exists = User.objects.filter(
        Q(username=login_username) | Q(email=login_username)
    ).exists()
    
    if not user_exists:
        return JsonResponse({
            'data': None,
            'success_message': None,
            'errors': ['Username tidak ditemukan. Silakan hubungi administrator untuk registrasi akun.'],
            'error_message': 'Username tidak ditemukan. Silakan hubungi administrator untuk registrasi akun.'
        }, status=404)
    
    # Authenticate user
    user = authenticate(request, username=login_username, password=login_password)
    
    if user is not None:
        # Check if user is active
        if not user.is_active:
            return JsonResponse({
                'data': None,
                'success_message': None,
                'errors': ['Akun tidak aktif. Silakan hubungi administrator.'],
                'error_message': 'Akun tidak aktif. Silakan hubungi administrator.'
            }, status=403)
        
        # Login user (create session)
        login(request, user)
        
        # Track session for single-session enforcement (optional)
        from core.session_utils import should_enforce_single_session, track_user_session
        if should_enforce_single_session(user):
            track_user_session(user, request.session.session_key)
        
        # Success response (Laravel v4.0 format)
        return JsonResponse({
            'data': {
                'username': user.username,
                'name': user.name,
                'email': user.email or user.username,  # Use username if email empty
                'password': user.password,  # Hash password (for compatibility)
                'user_id_opd': user.user_id_opd or 0,
                'usermode': 'user'  # Default usermode
            },
            'success_message': 'Login Success',
            'errors': [],
            'error_message': None
        }, status=200)
    else:
        # Password incorrect
        return JsonResponse({
            'data': None,
            'success_message': None,
            'errors': ['Username atau password salah'],
            'error_message': 'Username atau password salah'
        }, status=401)


@csrf_exempt
@require_http_methods(["GET", "POST"])
@rate_limit(max_requests=10, window=60, key_type='ip')  # 10 login attempts per minute per IP
def api_jwt_login_v4(request):
    """
    JWT Login endpoint v4.0 - Laravel Compatible with PERMANENT Token
    
    URL: /apiaplikasi-test/4.0/login/get-token
    Method: GET or POST
    Query Params or Body:
        - login_email: Username atau email
        - login_password: Password
    
    Response (Laravel v4.0 Format):
        Success: {
            "data": {
                "name": "User Name",
                "email": "email@example.com",
                "image": "img.jpg",
                "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
            },
            "success_message": "",
            "errors": [],
            "error_message": null
        }
    
    WARNING: Token has 100 years lifetime (effectively permanent)
    """
    try:
        # Get credentials from query params or body
        if request.method == 'GET':
            login_email = request.GET.get('login_email', '')
            login_password = request.GET.get('login_password', '')
        else:
            if request.content_type == 'application/json':
                data = json.loads(request.body)
                login_email = data.get('login_email', '')
                login_password = data.get('login_password', '')
            else:
                login_email = request.POST.get('login_email', '')
                login_password = request.POST.get('login_password', '')
        
        # Validation
        if not login_email or not login_password:
            return JsonResponse({
                'data': None,
                'success_message': '',
                'errors': ['Username dan password harus diisi'],
                'error_message': 'Username dan password harus diisi'
            }, status=400)
        
        # Check if user exists (by username or email)
        user_exists = User.objects.filter(
            Q(username=login_email) | Q(email=login_email)
        ).exists()
        
        if not user_exists:
            return JsonResponse({
                'data': None,
                'success_message': '',
                'errors': ['Username tidak ditemukan'],
                'error_message': 'Username tidak ditemukan'
            }, status=404)
        
        # Authenticate user
        user = authenticate(request, username=login_email, password=login_password)
        
        if user is not None:
            # Check if user is active
            if not user.is_active:
                return JsonResponse({
                    'data': None,
                    'success_message': '',
                    'errors': ['Akun tidak aktif'],
                    'error_message': 'Akun tidak aktif'
                }, status=403)
            
            # Generate PERMANENT JWT token (100 years lifetime)
            permanent_token = PermanentAccessToken.for_user(user)
            token_string = str(permanent_token)
            
            # Update last login
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            # Log login activity to ms_log_data
            try:
                from core.models import MsLogData
                MsLogData.log_login(user, request, via='api_v4')
            except Exception as e:
                logger.error(f"Failed to log login activity: {e}")
            
            # Success response (Laravel v4.0 format)
            return JsonResponse({
                'data': {
                    'name': user.name,
                    'email': user.email or user.username,
                    'image': user.image or 'img.jpg',
                    'token': token_string
                },
                'success_message': '',
                'errors': [],
                'error_message': None
            }, status=200)
        else:
            # Log failed login attempt
            try:
                from core.models import MsLogData
                MsLogData.log_login_failed(login_email, request, via='api_v4', reason='Invalid credentials')
            except Exception as e:
                logger.error(f"Failed to log login failure: {e}")
            
            # Invalid credentials
            return JsonResponse({
                'data': None,
                'success_message': '',
                'errors': ['Username atau password salah'],
                'error_message': 'Username atau password salah'
            }, status=401)
            
    except json.JSONDecodeError:
        return JsonResponse({
            'data': None,
            'success_message': '',
            'errors': ['Invalid JSON format'],
            'error_message': 'Invalid JSON format'
        }, status=400)
    except Exception as e:
        logger.error(f"JWT v4.0 login error: {str(e)}")
        return JsonResponse({
            'data': None,
            'success_message': '',
            'errors': ['Internal server error'],
            'error_message': 'Internal server error'
        }, status=500)


@csrf_exempt
@require_http_methods(["GET", "POST"])
@rate_limit(max_requests=10, window=60, key_type='ip')  # 10 login attempts per minute per IP
def api_login_v5(request):
    """
    API Login endpoint v5.0 - NEW VERSION
    
    URL: /apiaplikasi-test/5.0/login/username-aplikasi-test
    Method: GET or POST
    Query Params:
        - login_username: Username, email, atau NIP
        - login_password: Password
    
    Response Format (NEW - dapat dikustomisasi):
        Success: {
            "status": "success",
            "message": "Login berhasil",
            "data": {
                "user_id": 123,
                "username": "username",
                "name": "Nama User",
                "email": "email@example.com",
                "id_pegawai": 456,
                "session_key": "xxx...",
                "is_active": true
            },
            "version": "5.0"
        }
        Error: {
            "status": "error",
            "message": "Error message",
            "code": "ERROR_CODE",
            "version": "5.0"
        }
    
    NOTE: This is the new version (v5.0).
          Response format bisa dikustomisasi sesuai kebutuhan.
    """
    # Get credentials from query params (support both GET and POST)
    login_username = request.GET.get('login_username') or request.POST.get('login_username')
    login_password = request.GET.get('login_password') or request.POST.get('login_password')
    
    # Validation
    if not login_username or not login_password:
        return JsonResponse({
            'status': 'error',
            'message': 'Username dan password harus diisi',
            'code': 'MISSING_CREDENTIALS',
            'version': '5.0'
        }, status=400)
    
    # Check if user exists locally first
    local_user_exists = User.objects.filter(
        Q(username=login_username) | Q(email=login_username)
    ).exists()
    
    # Authenticate user (supports local + ESIMPEG fallback)
    user = authenticate(request, username=login_username, password=login_password)
    
    if user is not None:
        # Check if user is active
        if not user.is_active:
            return JsonResponse({
                'status': 'error',
                'message': 'Akun tidak aktif. Silakan hubungi administrator.',
                'code': 'USER_INACTIVE',
                'version': '5.0'
            }, status=403)
        
        # Login user (create session)
        login(request, user)
        
        # Track session for single-session enforcement (optional)
        from core.session_utils import should_enforce_single_session, track_user_session
        if should_enforce_single_session(user):
            track_user_session(user, request.session.session_key)
        
        # Success response (NEW FORMAT - dapat dikustomisasi)
        return JsonResponse({
            'status': 'success',
            'message': 'Login berhasil',
            'data': {
                'user_id': user.id,
                'username': user.username,
                'name': user.name,
                'email': user.email or '',
                'id_pegawai': user.id_pegawai,
                'session_key': request.session.session_key,
                'is_active': user.is_active
            },
            'version': '5.0'
        }, status=200)
    else:
        # Determine error response based on whether user exists locally
        if local_user_exists:
            # User exists locally but password wrong
            return JsonResponse({
                'status': 'error',
                'message': 'Username atau password salah',
                'code': 'INVALID_CREDENTIALS',
                'version': '5.0'
            }, status=401)
        else:
            # User doesn't exist locally, check if ESIMPEG is reachable
            # If ESIMPEG fallback failed, it means user not found there either
            return JsonResponse({
                'status': 'error',
                'message': 'Username tidak ditemukan',
                'code': 'USER_NOT_FOUND',
                'version': '5.0'
            }, status=404)


@csrf_exempt
@require_http_methods(["GET"])
@jwt_required
@rate_limit(max_requests=100, window=60, key_type='user_or_ip')  # 100 requests per minute
def api_users_list_v5(request):
    """
    API Users List endpoint v5.0 - REQUIRES JWT AUTHENTICATION
    
    URL: /apiaplikasi-test/5.0/users/list
    Method: GET
    Headers:
        Authorization: Bearer <token>  (REQUIRED)
    Query Params (optional):
        - page: Page number (default: 1)
        - per_page: Items per page (default: 50, max: 100)
        - search: Search by username/name/email
        - is_active: Filter by active status (true/false)
    
    Response:
        {
            "status": "success",
            "message": "Users retrieved successfully",
            "data": {
                "users": [...],
                "pagination": {
                    "total": 100,
                    "page": 1,
                    "per_page": 50,
                    "total_pages": 2
                }
            },
            "version": "5.0"
        }
    """
    try:
        # Get query parameters
        page = int(request.GET.get('page', 1))
        per_page = min(int(request.GET.get('per_page', 50)), 100)  # Max 100
        search = request.GET.get('search', '').strip()
        is_active_filter = request.GET.get('is_active', '').strip()
        
        # Base queryset
        users = User.objects.all()
        
        # Apply search filter
        if search:
            users = users.filter(
                Q(username__icontains=search) |
                Q(name__icontains=search) |
                Q(email__icontains=search)
            )
        
        # Apply active status filter
        if is_active_filter:
            if is_active_filter.lower() in ['true', '1', 'yes']:
                users = users.filter(is_active=True)
            elif is_active_filter.lower() in ['false', '0', 'no']:
                users = users.filter(is_active=False)
        
        # Get total count before pagination
        total_users = users.count()
        
        # Calculate pagination
        total_pages = (total_users + per_page - 1) // per_page  # Ceiling division
        
        # Validate page number
        if page < 1:
            page = 1
        if page > total_pages and total_pages > 0:
            page = total_pages
        
        # Apply pagination
        start = (page - 1) * per_page
        end = start + per_page
        users_page = users[start:end]
        
        # Build users list
        users_data = []
        for user in users_page:
            users_data.append({
                'user_id': user.id,
                'username': user.username,
                'name': user.name,
                'email': user.email or '',
                'id_pegawai': user.id_pegawai or 0,
                'user_id_opd': user.user_id_opd or 0,
                'is_active': user.is_active,
                'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                'last_login': user.last_login.isoformat() if user.last_login else None
            })
        
        # Success response
        return JsonResponse({
            'status': 'success',
            'message': f'Retrieved {len(users_data)} users successfully',
            'data': {
                'users': users_data,
                'pagination': {
                    'total': total_users,
                    'page': page,
                    'per_page': per_page,
                    'total_pages': total_pages
                }
            },
            'version': '5.0'
        }, status=200)
        
    except ValueError as e:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid pagination parameters',
            'code': 'INVALID_PARAMETERS',
            'version': '5.0'
        }, status=400)
    except Exception as e:
        logger.error(f"Users list error: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': 'Internal server error',
            'code': 'SERVER_ERROR',
            'version': '5.0'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
@rate_limit(max_requests=10, window=60, key_type='ip')  # 10 login attempts per minute per IP
def api_jwt_login_v5(request):
    """
    JWT Login endpoint v5.0
    
    URL: /apiaplikasi-test/5.0/auth/login
    Method: POST
    Body (JSON or form-data):
        - username: Username, email, atau NIP
        - password: Password
    
    Response:
        Success: {
            "status": "success",
            "message": "Login successful",
            "data": {
                "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                "token_type": "Bearer",
                "expires_in": 86400,
                "user": {
                    "user_id": 1,
                    "username": "username",
                    "name": "Full Name",
                    "email": "email@example.com"
                }
            },
            "version": "5.0"
        }
    """
    try:
        # Get credentials from JSON body or form-data
        if request.content_type == 'application/json':
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
        else:
            username = request.POST.get('username')
            password = request.POST.get('password')
        
        # Validation
        if not username or not password:
            return JsonResponse({
                'status': 'error',
                'message': 'Username dan password harus diisi',
                'code': 'MISSING_CREDENTIALS',
                'version': '5.0'
            }, status=400)
        
        # Check if user exists locally first
        local_user_exists = User.objects.filter(
            Q(username=username) | Q(email=username)
        ).exists()
        
        # Authenticate user (supports local + ESIMPEG fallback)
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            # Check if user is active
            if not user.is_active:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Akun tidak aktif',
                    'code': 'USER_INACTIVE',
                    'version': '5.0'
                }, status=403)
            
            # Enforce single-device for NIP/NIK users (API-only flag)
            try:
                from core.session_utils import should_enforce_single_session_api
                if should_enforce_single_session_api(user):
                    from core.token_blacklist import TokenBlacklist
                    TokenBlacklist.blacklist_all_user_tokens(user.id, reason='login_new_device')
                    # Also mark existing web session as superseded (if any)
                    from core.session_utils import force_single_session
                    force_single_session(user)
            except Exception as _e:
                logger.error(f"Failed to enforce single-device for API login: {_e}")
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            # Update last login
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            # Create Django session for web dashboard access
            login(request, user)
            
            # Log login activity to ms_log_data
            try:
                from core.models import MsLogData
                MsLogData.log_login(user, request, via='api_v5')
            except Exception as e:
                logger.error(f"Failed to log login activity: {e}")
            
            # Success response
            return JsonResponse({
                'status': 'success',
                'message': 'Login successful',
                'data': {
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'token_type': 'Bearer',
                    'expires_in': 86400,  # 24 hours in seconds
                    'user': {
                        'user_id': user.id,
                        'username': user.username,
                        'name': user.name or '',
                        'email': user.email or '',
                        'id_pegawai': user.id_pegawai or 0,
                        'user_id_opd': user.user_id_opd or 0,
                        'is_active': user.is_active,
                        'is_staff': getattr(user, 'is_staff', False),
                        'is_superuser': getattr(user, 'is_superuser', False),
                        'role_name': user.role.name if hasattr(user, 'role') and user.role else ''
                    }
                },
                'version': '5.0'
            }, status=200)
        else:
            # Log failed login attempt
            try:
                from core.models import MsLogData
                MsLogData.log_login_failed(username, request, via='api_v5', reason='Invalid credentials')
            except Exception as e:
                logger.error(f"Failed to log login failure: {e}")
            
            # Determine error response based on whether user exists locally
            if local_user_exists:
                # User exists locally but password wrong
                return JsonResponse({
                    'status': 'error',
                    'message': 'Username atau password salah',
                    'code': 'INVALID_CREDENTIALS',
                    'version': '5.0'
                }, status=401)
            else:
                # User doesn't exist locally, check if ESIMPEG is reachable
                # If ESIMPEG fallback failed, it means user not found there either
                return JsonResponse({
                    'status': 'error',
                    'message': 'Username tidak ditemukan',
                    'code': 'USER_NOT_FOUND',
                    'version': '5.0'
                }, status=404)
            
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON format',
            'code': 'INVALID_JSON',
            'version': '5.0'
        }, status=400)
    except Exception as e:
        logger.error(f"JWT login error: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': 'Internal server error',
            'code': 'SERVER_ERROR',
            'version': '5.0'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_jwt_verify_v5(request):
    """
    JWT Token Verification endpoint v5.0
    
    URL: /apiaplikasi-test/5.0/auth/verify
    Method: POST
    Headers:
        Authorization: Bearer <access_token>
    OR Body:
        - token: <access_token>
    
    Response:
        Valid: {
            "status": "success",
            "message": "Token is valid",
            "data": {
                "user_id": 1,
                "username": "username",
                "token_type": "access",
                "exp": 1234567890
            },
            "version": "5.0"
        }
    """
    try:
        # Get token from Authorization header or body
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token_str = auth_header.split(' ')[1]
        else:
            if request.content_type == 'application/json':
                data = json.loads(request.body)
                token_str = data.get('token', '')
            else:
                token_str = request.POST.get('token', '')
        
        if not token_str:
            return JsonResponse({
                'status': 'error',
                'message': 'Token tidak ditemukan',
                'code': 'MISSING_TOKEN',
                'version': '5.0'
            }, status=400)
        
        # Verify token
        try:
            token = AccessToken(token_str)
            user_id = token.get('user_id')
            # Blacklist checks
            try:
                from core.token_blacklist import TokenBlacklist
                if TokenBlacklist.is_blacklisted(token_str):
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Token telah dicabut',
                        'code': 'TOKEN_REVOKED',
                        'version': '5.0'
                    }, status=401)
                token_issued_at = token.get('iat')
                if TokenBlacklist.is_user_blacklisted(user_id, token_issued_at):
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Token tidak berlaku (user diblacklist)',
                        'code': 'TOKEN_REVOKED_USER',
                        'version': '5.0'
                    }, status=401)
            except Exception as _e:
                logger.error(f"Blacklist verification error: {_e}")
            
            # Get user
            user = User.objects.get(id=user_id)
            
            return JsonResponse({
                'status': 'success',
                'message': 'Token is valid',
                'data': {
                    'user_id': user.id,
                    'username': user.username,
                    'name': user.name,
                    'email': user.email or '',
                    'token_type': token.get('token_type'),
                    'exp': token.get('exp')
                },
                'version': '5.0'
            }, status=200)
            
        except (TokenError, InvalidToken) as e:
            return JsonResponse({
                'status': 'error',
                'message': 'Token tidak valid atau sudah expired',
                'code': 'INVALID_TOKEN',
                'version': '5.0'
            }, status=401)
        except User.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'User tidak ditemukan',
                'code': 'USER_NOT_FOUND',
                'version': '5.0'
            }, status=404)
            
    except Exception as e:
        logger.error(f"JWT verify error: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': 'Internal server error',
            'code': 'SERVER_ERROR',
            'version': '5.0'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_jwt_refresh_v5(request):
    """
    JWT Token Refresh endpoint v5.0
    
    URL: /apiaplikasi-test/5.0/auth/refresh
    Method: POST
    Body (JSON or form-data):
        - refresh_token: <refresh_token>
    
    Response:
        Success: {
            "status": "success",
            "message": "Token refreshed successfully",
            "data": {
                "access_token": "new_access_token",
                "token_type": "Bearer",
                "expires_in": 86400
            },
            "version": "5.0"
        }
    """
    try:
        # Get refresh token from body
        if request.content_type == 'application/json':
            data = json.loads(request.body)
            refresh_token = data.get('refresh_token', '')
        else:
            refresh_token = request.POST.get('refresh_token', '')
        
        if not refresh_token:
            return JsonResponse({
                'status': 'error',
                'message': 'Refresh token harus diisi',
                'code': 'MISSING_REFRESH_TOKEN',
                'version': '5.0'
            }, status=400)
        
        try:
            # Validate and check blacklist
            refresh = RefreshToken(refresh_token)
            user_id = refresh.get('user_id')
            token_issued_at = refresh.get('iat')
            try:
                from core.token_blacklist import TokenBlacklist
                if TokenBlacklist.is_user_blacklisted(user_id, token_issued_at):
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Refresh token ditolak (user diblacklist)',
                        'code': 'REFRESH_REVOKED',
                        'version': '5.0'
                    }, status=401)
            except Exception as _e:
                logger.error(f"Refresh blacklist check failed: {_e}")
            # Issue new access token
            access_token = str(refresh.access_token)
            return JsonResponse({
                'status': 'success',
                'message': 'Token refreshed successfully',
                'data': {
                    'access_token': access_token,
                    'token_type': 'Bearer',
                    'expires_in': 86400
                },
                'version': '5.0'
            }, status=200)
            
        except (TokenError, InvalidToken):
            return JsonResponse({
                'status': 'error',
                'message': 'Refresh token tidak valid atau sudah expired',
                'code': 'INVALID_REFRESH_TOKEN',
                'version': '5.0'
            }, status=401)
            
    except Exception as e:
        logger.error(f"JWT refresh error: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': 'Internal server error',
            'code': 'SERVER_ERROR',
            'version': '5.0'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
@jwt_required
def api_logout_v5(request):
    """
    Logout endpoint - Blacklist current token
    
    URL: /apiaplikasi-test/5.0/auth/logout
    Method: POST
    Headers:
        Authorization: Bearer <token>  (REQUIRED)
    
    Response:
        Success: {
            "status": "success",
            "message": "Logged out successfully",
            "version": "5.0"
        }
    """
    try:
        from core.token_blacklist import TokenBlacklist
        
        # Get token from request (set by @jwt_required decorator)
        token_str = request.jwt_token
        user = request.jwt_user
        
        # Add token to blacklist
        if TokenBlacklist.add(token_str):
            logger.info(f"User {user.username} logged out. Token blacklisted.")
            return JsonResponse({
                'status': 'success',
                'message': 'Logged out successfully',
                'version': '5.0'
            }, status=200)
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'Failed to revoke token',
                'code': 'LOGOUT_FAILED',
                'version': '5.0'
            }, status=500)
            
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': 'Internal server error',
            'code': 'SERVER_ERROR',
            'version': '5.0'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
@jwt_required
def api_revoke_all_tokens_v5(request):
    """
    Revoke all tokens for current user
    Useful for: password change, security breach
    
    URL: /apiaplikasi-test/5.0/auth/revoke-all-tokens
    Method: POST
    Headers:
        Authorization: Bearer <token>  (REQUIRED)
    
    Response:
        Success: {
            "status": "success",
            "message": "All tokens revoked",
            "version": "5.0"
        }
    """
    try:
        from core.token_blacklist import TokenBlacklist
        
        user = request.jwt_user
        
        # Blacklist all tokens for this user
        if TokenBlacklist.blacklist_all_user_tokens(user.id, reason="user_revoke_all"):
            logger.info(f"All tokens revoked for user {user.username}")
            return JsonResponse({
                'status': 'success',
                'message': 'All your tokens have been revoked',
                'info': 'You need to login again',
                'version': '5.0'
            }, status=200)
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'Failed to revoke all tokens',
                'code': 'REVOKE_FAILED',
                'version': '5.0'
            }, status=500)
            
    except Exception as e:
        logger.error(f"Revoke all tokens error: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': 'Internal server error',
            'code': 'SERVER_ERROR',
            'version': '5.0'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
@jwt_required
def api_revoke_by_username_v5(request):
    """
    Revoke all tokens for a specific user (by username)
    Admin action: Revoke tokens for another user
    
    URL: /apiaplikasi-test/5.0/auth/revoke-by-username
    Method: POST
    Headers:
        Authorization: Bearer <token>  (REQUIRED)
    Body (JSON or form-data):
        - username: Username to revoke
        - reason: Reason for revocation (optional)
    
    Response:
        Success: {
            "status": "success",
            "message": "All tokens for user 'username' have been revoked",
            "version": "5.0"
        }
    """
    try:
        from core.token_blacklist import TokenBlacklist
        
        # Get requesting user (from @jwt_required)
        admin_user = request.jwt_user
        
        # Get target username from request
        if request.content_type == 'application/json':
            try:
                data = json.loads(request.body)
                target_username = data.get('username', '').strip()
                reason = data.get('reason', 'admin_revoke')
            except json.JSONDecodeError:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Invalid JSON format',
                    'code': 'INVALID_JSON',
                    'version': '5.0'
                }, status=400)
        else:
            target_username = request.POST.get('username', '').strip()
            reason = request.POST.get('reason', 'admin_revoke')
        
        # Validation
        if not target_username:
            return JsonResponse({
                'status': 'error',
                'message': 'Username is required',
                'code': 'MISSING_USERNAME',
                'version': '5.0'
            }, status=400)
        
        # Find target user
        try:
            target_user = User.objects.get(username=target_username)
        except User.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': f'User "{target_username}" not found',
                'code': 'USER_NOT_FOUND',
                'version': '5.0'
            }, status=404)
        
        # Prevent self-revoke (use /auth/revoke-all-tokens instead)
        if target_user.id == admin_user.id:
            return JsonResponse({
                'status': 'error',
                'message': 'Cannot revoke your own tokens. Use /auth/revoke-all-tokens instead',
                'code': 'SELF_REVOKE_NOT_ALLOWED',
                'version': '5.0'
            }, status=400)
        
        # Revoke all tokens for target user
        if TokenBlacklist.blacklist_all_user_tokens(target_user.id, reason=reason):
            logger.info(f"User {admin_user.username} revoked all tokens for user {target_username}. Reason: {reason}")
            return JsonResponse({
                'status': 'success',
                'message': f'All tokens for user "{target_username}" have been revoked',
                'info': {
                    'target_user': target_username,
                    'target_user_id': target_user.id,
                    'revoked_by': admin_user.username,
                    'reason': reason
                },
                'version': '5.0'
            }, status=200)
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'Failed to revoke tokens',
                'code': 'REVOKE_FAILED',
                'version': '5.0'
            }, status=500)
    
    except Exception as e:
        logger.error(f"Admin revoke user tokens error: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': 'Internal server error',
            'code': 'SERVER_ERROR',
            'version': '5.0'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_logout_v4(request):
    """
    Logout endpoint v4.0 (Laravel compatible)
    Log logout to ms_log_data
    
    URL: /apiaplikasi-test/4.0/logout
    Method: POST
    Headers: Authorization: Bearer <token>
    
    Response:
        {
            "data": {
                "message": "Logout successful"
            },
            "success_message": "Logout berhasil",
            "errors": [],
            "error_message": null
        }
    """
    try:
        # Get token from header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'data': None,
                'success_message': '',
                'errors': ['Token tidak ditemukan'],
                'error_message': 'Token tidak ditemukan'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        
        # Verify token and get user
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            user = User.objects.get(id=user_id)
        except Exception:
            return JsonResponse({
                'data': None,
                'success_message': '',
                'errors': ['Token tidak valid'],
                'error_message': 'Token tidak valid'
            }, status=401)
        
        # Log logout to ms_log_data
        try:
            from core.models import MsLogData
            MsLogData.log_logout(
                user=user,
                request=request,
                via='api_v4',
                description='Manual logout via API v4.0'
            )
        except Exception as e:
            logger.error(f"Failed to log logout: {e}")
        
        # Blacklist token
        try:
            from core.token_blacklist import TokenBlacklist
            TokenBlacklist.add(token_str)
        except Exception as e:
            logger.warning(f"Failed to blacklist token: {e}")
        
        return JsonResponse({
            'data': {
                'message': 'Logout successful',
                'username': user.username
            },
            'success_message': 'Logout berhasil',
            'errors': [],
            'error_message': None
        }, status=200)
        
    except Exception as e:
        logger.error(f"Logout v4 error: {str(e)}")
        return JsonResponse({
            'data': None,
            'success_message': '',
            'errors': ['Server error'],
            'error_message': 'Server error'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_logout_v5(request):
    """
    Logout endpoint v5.0
    Log logout to ms_log_data
    
    URL: /apiaplikasi-test/5.0/auth/logout
    Method: POST
    Headers: Authorization: Bearer <token>
    
    Response:
        {
            "status": "success",
            "message": "Logout successful",
            "data": {
                "username": "user@example.com"
            },
            "version": "5.0"
        }
    """
    try:
        # Get token from header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'status': 'error',
                'message': 'Token tidak ditemukan',
                'code': 'TOKEN_MISSING',
                'version': '5.0'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        
        # Verify token and get user
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            user = User.objects.get(id=user_id)
        except Exception:
            return JsonResponse({
                'status': 'error',
                'message': 'Token tidak valid atau sudah expired',
                'code': 'INVALID_TOKEN',
                'version': '5.0'
            }, status=401)
        
        # Log logout to ms_log_data
        try:
            from core.models import MsLogData
            MsLogData.log_logout(
                user=user,
                request=request,
                via='api_v5',
                description='Manual logout via API v5.0'
            )
        except Exception as e:
            logger.error(f"Failed to log logout: {e}")
        
        # Blacklist token
        try:
            from core.token_blacklist import TokenBlacklist
            TokenBlacklist.add(token_str)
        except Exception as e:
            logger.warning(f"Failed to blacklist token: {e}")
        
        return JsonResponse({
            'status': 'success',
            'message': 'Logout successful',
            'data': {
                'username': user.username,
                'logout_at': timezone.now().isoformat()
            },
            'version': '5.0'
        }, status=200)
        
    except Exception as e:
        logger.error(f"Logout v5 error: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': 'Internal server error',
            'code': 'SERVER_ERROR',
            'version': '5.0'
        }, status=500)
            
    except Exception as e:
        logger.error(f"Revoke by username error: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': 'Internal server error',
            'code': 'SERVER_ERROR',
            'version': '5.0'
        }, status=500)

# ========================================
# Additional API v5.0 Functions (ESIMPEG Compatible)
# ========================================

@require_http_methods(["GET"])
def api_routes_list_v5(request):
    """
    List all API routes (v4.0 and v5.0)
    Public endpoint - no authentication required
    Compatible with ESIMPEG format
    """
    
    routes = {
        'status': 'success',
        'message': 'API routes list',
        'data': {
            'v5.0': {
                'auth': [
                    {
                        'method': 'POST',
                        'path': '/apicorpu/5.0/login/username-corpu',
                        'name': 'api_login_v5',
                        'description': 'Session-based login',
                        'auth_required': False,
                    },
                    {
                        'method': 'POST',
                        'path': '/apicorpu/5.0/auth/login',
                        'name': 'api_jwt_login_v5',
                        'description': 'JWT Login',
                        'auth_required': False,
                    },
                    {
                        'method': 'POST',
                        'path': '/apicorpu/5.0/auth/verify',
                        'name': 'api_jwt_verify_v5',
                        'description': 'JWT Token Verification',
                        'auth_required': True,
                    },
                    {
                        'method': 'POST',
                        'path': '/apicorpu/5.0/auth/refresh',
                        'name': 'api_jwt_refresh_v5',
                        'description': 'JWT Token Refresh',
                        'auth_required': True,
                    },
                    {
                        'method': 'POST',
                        'path': '/apicorpu/5.0/auth/logout',
                        'name': 'api_logout_v5',
                        'description': 'JWT Logout',
                        'auth_required': True,
                    },
                    {
                        'method': 'POST',
                        'path': '/apicorpu/5.0/auth/change-password',
                        'name': 'api_change_password_v5',
                        'description': 'Change Password',
                        'auth_required': True,
                    },
                    {
                        'method': 'POST',
                        'path': '/apicorpu/5.0/auth/revoke-all-tokens',
                        'name': 'api_revoke_all_tokens_v5',
                        'description': 'Revoke all user tokens',
                        'auth_required': True,
                    },
                    {
                        'method': 'POST',
                        'path': '/apicorpu/5.0/auth/revoke-by-username',
                        'name': 'api_revoke_by_username_v5',
                        'description': 'Revoke token by username',
                        'auth_required': True,
                    },
                ],
                'resources': [
                    {
                        'method': 'GET',
                        'path': '/apicorpu/5.0/users/list',
                        'name': 'api_users_list_v5',
                        'description': 'List all users',
                        'auth_required': True,
                    },
                    {
                        'method': 'GET',
                        'path': '/apicorpu/5.0/routes',
                        'name': 'api_routes_list_v5',
                        'description': 'List all API routes',
                        'auth_required': False,
                    },
                ],
                'webhooks': [
                    {
                        'method': 'POST',
                        'path': '/apicorpu/5.0/webhooks/register',
                        'name': 'webhook_register_v5',
                        'description': 'Register webhook',
                        'auth_required': True,
                    },
                    {
                        'method': 'GET',
                        'path': '/apicorpu/5.0/webhooks/list',
                        'name': 'webhook_list_v5',
                        'description': 'List webhooks',
                        'auth_required': True,
                    },
                    {
                        'method': 'DELETE',
                        'path': '/apicorpu/5.0/webhooks/unregister/{app_name}',
                        'name': 'webhook_unregister_v5',
                        'description': 'Unregister webhook',
                        'auth_required': True,
                    },
                    {
                        'method': 'POST',
                        'path': '/apicorpu/5.0/webhooks/sync-password-manual',
                        'name': 'webhook_sync_password_manual_v5',
                        'description': 'Manual password sync',
                        'auth_required': True,
                    },
                ],
                'knowledge_base': [
                    {
                        'method': 'GET',
                        'path': '/knowledge/api/articles/',
                        'name': 'knowledge_articles_list',
                        'description': 'List all articles',
                        'auth_required': False,
                    },
                    {
                        'method': 'POST',
                        'path': '/knowledge/api/articles/',
                        'name': 'knowledge_articles_create',
                        'description': 'Create new article',
                        'auth_required': True,
                    },
                    {
                        'method': 'GET',
                        'path': '/knowledge/api/articles/{slug}/',
                        'name': 'knowledge_articles_detail',
                        'description': 'Get article detail',
                        'auth_required': False,
                    },
                    {
                        'method': 'POST',
                        'path': '/knowledge/api/articles/{slug}/like/',
                        'name': 'knowledge_articles_like',
                        'description': 'Like article',
                        'auth_required': True,
                    },
                    {
                        'method': 'POST',
                        'path': '/knowledge/api/comments/',
                        'name': 'knowledge_comments_create',
                        'description': 'Create comment',
                        'auth_required': True,
                    },
                ]
            }
        },
        'version': '5.0'
    }
    
    return JsonResponse(routes, status=200)


@require_http_methods(["POST"])
@csrf_exempt
@jwt_required
@rate_limit(max_requests=5, window=300, key_type='user')  # 5 attempts per 5 minutes per user
def api_change_password_v5(request):
    """
    Change password via API v5.0
    Requires JWT authentication
    Compatible with ESIMPEG format
    """
    try:
        # Get current user from JWT (set by @jwt_required decorator)
        user = request.jwt_user
        
        # Parse request body
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid JSON',
                'code': 'INVALID_JSON',
                'version': '5.0'
            }, status=400)
        
        old_password = data.get('old_password')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')
        
        # Validate required fields
        if not old_password or not new_password or not confirm_password:
            return JsonResponse({
                'status': 'error',
                'message': 'Missing required fields',
                'code': 'MISSING_FIELDS',
                'required_fields': ['old_password', 'new_password', 'confirm_password'],
                'version': '5.0'
            }, status=400)
        
        # Verify old password
        if not user.check_password(old_password):
            return JsonResponse({
                'status': 'error',
                'message': 'Old password is incorrect',
                'code': 'INVALID_OLD_PASSWORD',
                'version': '5.0'
            }, status=400)
        
        # Validate new password
        if new_password != confirm_password:
            return JsonResponse({
                'status': 'error',
                'message': 'New password and confirm password do not match',
                'code': 'PASSWORD_MISMATCH',
                'version': '5.0'
            }, status=400)
        
        # Check password strength (basic validation)
        if len(new_password) < 6:
            return JsonResponse({
                'status': 'error',
                'message': 'Password must be at least 6 characters long',
                'code': 'PASSWORD_TOO_SHORT',
                'version': '5.0'
            }, status=400)
        
        # Change password
        user.set_password(new_password)
        user.save()
        
        # Log password change event for sync pipeline
        try:
            from apps.integrations.models import PasswordChangeEvent
            PasswordChangeEvent.objects.create(
                username=user.username,
                password_hash=user.password,
                changed_by=user.username,
                changed_at=timezone.now()
            )
        except Exception as e:
            logger.error(f"Failed to log password change event: {e}")
        
        # Log password change activity
        try:
            from core.models import MsLogData
            MsLogData.log_password_change(user, request, via='api_v5')
        except Exception as e:
            logger.error(f"Failed to log password change activity: {e}")
        
        # Revoke all existing tokens (force re-login)
        try:
            from core.token_blacklist import TokenBlacklist
            TokenBlacklist.blacklist_all_user_tokens(user.id, reason='password_changed')
        except Exception as e:
            logger.error(f"Failed to revoke tokens after password change: {e}")
        
        # Trigger webhook sync (async)
        try:
            from django.core.management import call_command
            call_command('sync_password_to_apps', username=user.username)
        except Exception as e:
            logger.error(f"Failed to trigger password sync: {e}")
        
        return JsonResponse({
            'status': 'success',
            'message': 'Password changed successfully. Please login again.',
            'data': {
                'user_id': user.id,
                'username': user.username,
                'tokens_revoked': True,
                'sync_triggered': True
            },
            'version': '5.0'
        }, status=200)
        
    except Exception as e:
        logger.error(f"Change password v5 error: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': 'Internal server error',
            'code': 'SERVER_ERROR',
            'version': '5.0'
        }, status=500)

# ========================================
# Webhook Functions (ESIMPEG Compatible)
# ========================================

@require_http_methods(["POST"])
@csrf_exempt
@jwt_required
def webhook_register_v5(request):
    """
    Register aplikasi eksternal untuk terima webhook
    Compatible with ESIMPEG format
    """
    try:
        data = json.loads(request.body)
        app_name = data.get('app_name')
        webhook_url = data.get('webhook_url')
        secret_key = data.get('secret_key', '')
        event_type = data.get('event_type', 'password_changed')
        
        if not app_name or not webhook_url:
            return JsonResponse({
                'status': 'error',
                'message': 'Missing required fields',
                'code': 'MISSING_FIELDS',
                'required_fields': ['app_name', 'webhook_url'],
                'version': '5.0'
            }, status=400)
        
        # Generate secret key if not provided
        if not secret_key:
            import secrets
            secret_key = secrets.token_hex(32)
        
        # Create or update webhook registration
        from apps.integrations.models import WebhookRegistration
        
        registration, created = WebhookRegistration.objects.update_or_create(
            app_name=app_name,
            defaults={
                'webhook_url': webhook_url,
                'secret_key': secret_key,
                'event_type': event_type,
                'is_active': True
            }
        )
        
        return JsonResponse({
            'status': 'success',
            'message': f'Webhook {"registered" if created else "updated"} successfully',
            'data': {
                'app_name': registration.app_name,
                'webhook_url': registration.webhook_url,
                'secret_key': registration.secret_key,
                'event_type': registration.event_type,
                'registered_at': registration.created_at.isoformat(),
                'is_new': created
            },
            'version': '5.0'
        }, status=200)
        
    except Exception as e:
        logger.error(f"Webhook register error: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': 'Internal server error',
            'code': 'SERVER_ERROR',
            'version': '5.0'
        }, status=500)


@require_http_methods(["GET"])
@jwt_required
def webhook_list_v5(request):
    """
    List all registered webhooks
    Compatible with ESIMPEG format
    """
    try:
        from apps.integrations.models import WebhookRegistration
        
        registrations = WebhookRegistration.objects.all().order_by('app_name')
        
        webhooks = []
        for reg in registrations:
            webhooks.append({
                'app_name': reg.app_name,
                'webhook_url': reg.webhook_url,
                'event_type': reg.event_type,
                'is_active': reg.is_active,
                'total_sent': reg.total_sent,
                'total_success': reg.total_success,
                'total_failed': reg.total_failed,
                'success_rate': round((reg.total_success / reg.total_sent * 100) if reg.total_sent > 0 else 0, 2),
                'last_sent_at': reg.last_sent_at.isoformat() if reg.last_sent_at else None,
                'created_at': reg.created_at.isoformat()
            })
        
        return JsonResponse({
            'status': 'success',
            'message': 'Webhook list retrieved successfully',
            'data': {
                'webhooks': webhooks,
                'total': len(webhooks)
            },
            'version': '5.0'
        }, status=200)
        
    except Exception as e:
        logger.error(f"Webhook list error: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': 'Internal server error',
            'code': 'SERVER_ERROR',
            'version': '5.0'
        }, status=500)


@require_http_methods(["DELETE"])
@csrf_exempt
@jwt_required
def webhook_unregister_v5(request, app_name):
    """
    Unregister webhook by app name
    Compatible with ESIMPEG format
    """
    try:
        from apps.integrations.models import WebhookRegistration
        
        try:
            registration = WebhookRegistration.objects.get(app_name=app_name)
            registration.delete()
            
            return JsonResponse({
                'status': 'success',
                'message': f'Webhook for {app_name} unregistered successfully',
                'data': {
                    'app_name': app_name,
                    'unregistered_at': timezone.now().isoformat()
                },
                'version': '5.0'
            }, status=200)
            
        except WebhookRegistration.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': f'Webhook for {app_name} not found',
                'code': 'WEBHOOK_NOT_FOUND',
                'version': '5.0'
            }, status=404)
        
    except Exception as e:
        logger.error(f"Webhook unregister error: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': 'Internal server error',
            'code': 'SERVER_ERROR',
            'version': '5.0'
        }, status=500)


@require_http_methods(["POST"])
@csrf_exempt
@jwt_required
def webhook_sync_password_manual_v5(request):
    """
    Manual password sync via webhook
    Compatible with ESIMPEG format
    """
    try:
        data = json.loads(request.body)
        username = data.get('username')
        
        # Build command arguments
        cmd_args = []
        if username:
            cmd_args.extend(['--username', username])
        
        # Run sync command
        from django.core.management import call_command
        from io import StringIO
        
        out = StringIO()
        call_command('sync_password_to_apps', *cmd_args, stdout=out)
        output = out.getvalue()
        
        # Parse output for stats (simple parsing)
        success_count = output.count('✅')
        failed_count = output.count('❌')
        
        return JsonResponse({
            'status': 'success',
            'message': f'Password sync completed: {success_count} success, {failed_count} failed',
            'data': {
                'username': username if username else 'all_changed_users',
                'sync_initiated_at': timezone.now().isoformat(),
                'success_count': success_count,
                'failed_count': failed_count,
                'output': output.split('\n')[-10:]  # Last 10 lines
            },
            'version': '5.0'
        }, status=200)
        
    except Exception as e:
        logger.error(f"Webhook sync password error: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': 'Internal server error',
            'code': 'SERVER_ERROR',
            'version': '5.0'
        }, status=500)


def redirect_to_nextjs_dashboard(request):
    """
    Redirect to Next.js dashboard
    """
    if not request.user.is_authenticated:
        return redirect('/login/')
    
    # Redirect to Next.js dashboard
    return redirect('http://localhost:3004/dashboard')


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Notification


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_notifications_list(request):
    notifications = Notification.objects.filter(user=request.user)[:20]
    data = [{
        'id': n.id,
        'notification_type': n.notification_type,
        'title': n.title,
        'message': n.message,
        'link': n.link,
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat(),
    } for n in notifications]
    return Response({
        'results': data,
        'unread_count': Notification.objects.filter(user=request.user, is_read=False).count()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_notifications_read(request, notification_id):
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({'status': 'ok'})
    except Notification.DoesNotExist:
        return Response({'detail': 'Notifikasi tidak ditemukan'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_notifications_read_all(request):
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({'status': 'ok'})