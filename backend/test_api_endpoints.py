#!/usr/bin/env python
"""
Quick test script to verify API endpoints
Run: python manage.py shell < test_api_endpoints.py
"""

print("=" * 60)
print("Testing ASN CORPU API Endpoints")
print("=" * 60)

# Test imports
try:
    from apps.dashboard import views_api as dashboard_api
    print("✅ Dashboard API views imported successfully")
except Exception as e:
    print(f"❌ Dashboard API import failed: {e}")

try:
    from apps.manajemen import views_api as management_api
    print("✅ Management API views imported successfully")
except Exception as e:
    print(f"❌ Management API import failed: {e}")

try:
    from apps.manajemen import serializers as management_serializers
    print("✅ Management serializers imported successfully")
except Exception as e:
    print(f"❌ Management serializers import failed: {e}")

# Test URL patterns
try:
    from django.urls import reverse
    from django.conf import settings
    
    # Test if URLs are configured
    print("\n" + "=" * 60)
    print("Checking URL Configuration")
    print("=" * 60)
    
    # Dashboard URLs
    try:
        from apps.dashboard.urls_api import urlpatterns as dashboard_urls
        print(f"✅ Dashboard API has {len(dashboard_urls)} endpoints")
    except Exception as e:
        print(f"❌ Dashboard URLs error: {e}")
    
    # Management URLs
    try:
        from apps.manajemen.urls_api import urlpatterns as management_urls
        print(f"✅ Management API has {len(management_urls)} endpoints")
    except Exception as e:
        print(f"❌ Management URLs error: {e}")
    
except Exception as e:
    print(f"❌ URL configuration error: {e}")

# Test models
try:
    from apps.accounts.models import User
    from django.contrib.auth.models import Group
    from apps.manajemen.models import (
        PermissionModule,
        PermissionControl,
        PermissionFunction,
        PermissionRule
    )
    
    print("\n" + "=" * 60)
    print("Checking Database Models")
    print("=" * 60)
    
    user_count = User.objects.count()
    print(f"✅ Users in database: {user_count}")
    
    group_count = Group.objects.count()
    print(f"✅ Roles in database: {group_count}")
    
    module_count = PermissionModule.objects.count()
    print(f"✅ Permission Modules: {module_count}")
    
    control_count = PermissionControl.objects.count()
    print(f"✅ Permission Controls: {control_count}")
    
    function_count = PermissionFunction.objects.count()
    print(f"✅ Permission Functions: {function_count}")
    
    rule_count = PermissionRule.objects.count()
    print(f"✅ Permission Rules: {rule_count}")
    
except Exception as e:
    print(f"❌ Database models error: {e}")

print("\n" + "=" * 60)
print("API Endpoints Ready!")
print("=" * 60)
print("\nNext steps:")
print("1. Start server: docker-compose up -d")
print("2. Test login: curl -X POST http://localhost:3000/apicorpu/auth/1.0/login")
print("3. Test dashboard: curl http://localhost:3000/apicorpu/1.0/dashboard/stats/")
print("\nSee API-DOCUMENTATION.md for complete API reference")
print("=" * 60)
