"""
Authentication views
"""
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout, get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.urls import reverse
from django.db.models import Q

User = get_user_model()


def login_redirect(request):
    """Redirect to landing page for login"""
    return redirect('landing_page')


def logout_view(request):
    """Logout user and log to ms_log_data"""
    if request.user.is_authenticated:
        user_name = request.user.name
        user_to_log = request.user
        
        # Log manual logout to ms_log_data
        try:
            from core.models import MsLogData
            MsLogData.log_logout(
                user=user_to_log,
                request=request,
                via='web',
                description='Manual logout via aplikasi web'
            )
        except Exception as e:
            # Don't fail logout if logging fails
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to log logout: {e}")
        
        auth_logout(request)
        messages.info(request, f'Anda telah logout. Sampai jumpa, {user_name}!')
    # Redirect to Next.js landing page via Nginx
    return redirect('http://localhost:3000/')


@login_required
def profile_view(request):
    """Serve unified profile page under /accounts/profile/ path."""
    # Import here to avoid potential circular imports at module load time
    from apps.manajemen.views_granular import user_profile as unified_user_profile
    return unified_user_profile(request)


@login_required
def force_change_password_view(request):
    """Force change password view - required for users with default password"""
    from django.http import JsonResponse
    
    user = request.user
    
    # Note: app_name, app_long_name, app_instansi now auto-injected by context processor
    # No need to manually add context here!
    
    # Check if user still has default password
    if not user.check_password('Pegawai@Pessel'):
        # Already changed, redirect to dashboard
        return redirect('dashboard:index')
    
    if request.method == 'POST':
        # Check if AJAX request
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        old_password = request.POST.get('old_password')
        new_password = request.POST.get('new_password')
        confirm_password = request.POST.get('confirm_password')
        
        # Validasi old password (must be default)
        if old_password != 'Pegawai@Pessel':
            error_msg = 'Password lama salah!'
            if is_ajax:
                return JsonResponse({'success': False, 'message': error_msg})
            messages.error(request, error_msg)
            return render(request, 'accounts/force_change_password.html')
        
        # Validasi new password
        if new_password != confirm_password:
            error_msg = 'Password baru dan konfirmasi tidak cocok!'
            if is_ajax:
                return JsonResponse({'success': False, 'message': error_msg})
            messages.error(request, error_msg)
            return render(request, 'accounts/force_change_password.html')
        
        if len(new_password) < 8:
            error_msg = 'Password minimal 8 karakter!'
            if is_ajax:
                return JsonResponse({'success': False, 'message': error_msg})
            messages.error(request, error_msg)
            return render(request, 'accounts/force_change_password.html')
        
        if new_password == 'Pegawai@Pessel':
            error_msg = 'Password baru tidak boleh sama dengan password default!'
            if is_ajax:
                return JsonResponse({'success': False, 'message': error_msg})
            messages.error(request, error_msg)
            return render(request, 'accounts/force_change_password.html')
        
        # Update password
        try:
            user.set_password(new_password)
            
            # Ensure date_joined is set (fix for users migrated from Laravel)
            if not user.date_joined:
                from django.utils import timezone
                user.date_joined = timezone.now()
            
            user.save()
            
            # Log password change SUCCESS to ms_log_data
            try:
                from core.models import MsLogData
                MsLogData.objects.create(
                    user_id=user.id,
                    action='password_change',
                    table_name='users',
                    record_id=user.id,
                    old_data={'note': 'Password changed from default (forced)'},
                    new_data={'success': True, 'via': 'web'},
                    ip_address=request.META.get('REMOTE_ADDR', ''),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
            except Exception as log_err:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to log password change: {log_err}")
                
        except Exception as e:
            # Log password change ERROR to ms_log_data
            import traceback
            error_traceback = traceback.format_exc()
            
            try:
                from core.models import MsLogData
                MsLogData.log_error(
                    user=user,
                    action='password_change',
                    error_message=str(e),
                    error_details={
                        'error_type': type(e).__name__,
                        'traceback': error_traceback,
                        'username': user.username,
                        'has_date_joined': bool(user.date_joined)
                    },
                    request=request,
                    via='web'
                )
            except:
                pass  # Ignore error logging failure
            
            # Return error response
            error_msg = f'Gagal mengubah password: {str(e)}'
            if is_ajax:
                return JsonResponse({'success': False, 'message': error_msg})
            messages.error(request, error_msg)
            return render(request, 'accounts/force_change_password.html')
        
        success_msg = 'Password berhasil diubah! Anda sekarang dapat mengakses dashboard.'
        
        if is_ajax:
            return JsonResponse({
                'success': True,
                'message': success_msg,
                'redirect_url': '/dashboard/',
                'username': user.username,
                'full_name': user.get_full_name() or user.username
            })
        
        messages.success(request, success_msg)
        return redirect('dashboard:index')
    
    return render(request, 'accounts/force_change_password.html')


def change_password_view(request):
    """Change password view"""
    if request.method == 'POST':
        old_password = request.POST.get('old_password')
        new_password = request.POST.get('new_password')
        confirm_password = request.POST.get('confirm_password')
        
        user = request.user
        
        # Validasi old password
        if not user.check_password(old_password):
            messages.error(request, 'Password lama salah!')
            return redirect('accounts:profile')
        
        # Validasi new password
        if new_password != confirm_password:
            messages.error(request, 'Password baru tidak cocok!')
            return redirect('accounts:profile')
        
        if len(new_password) < 8:
            messages.error(request, 'Password minimal 8 karakter!')
            return redirect('accounts:profile')
        
        # Update password
        try:
            user.set_password(new_password)
            
            # Ensure date_joined is set (fix for users migrated from Laravel)
            if not user.date_joined:
                from django.utils import timezone
                user.date_joined = timezone.now()
            
            user.save()
            
            # Log password change SUCCESS to ms_log_data
            try:
                from core.models import MsLogData
                MsLogData.objects.create(
                    user_id=user.id,
                    action='password_change',
                    table_name='users',
                    record_id=user.id,
                    old_data={'note': 'Password changed by user'},
                    new_data={'success': True, 'via': 'web'},
                    ip_address=request.META.get('REMOTE_ADDR', ''),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
            except Exception as log_err:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to log password change: {log_err}")
            
            messages.success(request, 'Password berhasil diubah! Silakan login kembali.')
            auth_logout(request)
            return redirect('accounts:login')
            
        except Exception as e:
            # Log password change ERROR to ms_log_data
            import traceback
            error_traceback = traceback.format_exc()
            
            try:
                from core.models import MsLogData
                MsLogData.log_error(
                    user=user,
                    action='password_change',
                    error_message=str(e),
                    error_details={
                        'error_type': type(e).__name__,
                        'traceback': error_traceback,
                        'username': user.username,
                        'has_date_joined': bool(user.date_joined)
                    },
                    request=request,
                    via='web'
                )
            except:
                pass  # Ignore error logging failure
            
            messages.error(request, f'Gagal mengubah password: {str(e)}')
            return redirect('accounts:profile')
    
    return redirect('accounts:profile')
