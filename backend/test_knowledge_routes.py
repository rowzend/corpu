#!/usr/bin/env python
"""
Script untuk menguji semua route Knowledge Base
"""

import os
import sys
import django
from django.urls import reverse, NoReverseMatch
from django.test import Client
from django.contrib.auth import get_user_model

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

User = get_user_model()

def test_knowledge_routes():
    print("🧪 TESTING KNOWLEDGE BASE ROUTES...")
    print()
    
    # Test routes yang akan diuji
    test_routes = [
        # Public routes
        ('knowledge:article_list', 'GET', 'Public - Article List'),
        ('knowledge:tag_list', 'GET', 'Public - Tag List'),
        
        # Management routes (perlu login)
        ('knowledge:article_manage_list', 'GET', 'Management - Article List'),
        ('knowledge:category_list', 'GET', 'Management - Category List'),
        ('knowledge:tag_manage_list', 'GET', 'Management - Tag List'),
        ('knowledge:comment_manage_list', 'GET', 'Management - Comment List'),
        
        # Create routes (perlu login)
        ('knowledge:article_create', 'GET', 'Create - Article Form'),
        ('knowledge:category_create', 'GET', 'Create - Category Form'),
        ('knowledge:tag_create', 'GET', 'Create - Tag Form'),
    ]
    
    client = Client()
    
    print("📋 Testing routes without authentication:")
    for route_name, method, description in test_routes:
        try:
            url = reverse(route_name)
            if method == 'GET':
                response = client.get(url)
            else:
                response = client.post(url)
            
            status_code = response.status_code
            if status_code == 200:
                status_icon = "✅"
                status_text = "OK"
            elif status_code == 302:
                status_icon = "🔄"
                status_text = "REDIRECT (Login Required)"
            elif status_code == 403:
                status_icon = "🔒"
                status_text = "FORBIDDEN (Permission Required)"
            elif status_code == 404:
                status_icon = "❌"
                status_text = "NOT FOUND"
            else:
                status_icon = "⚠️"
                status_text = f"HTTP {status_code}"
            
            print(f"   {status_icon} {description}")
            print(f"      Route: {route_name} → {url}")
            print(f"      Status: {status_text}")
            print()
            
        except NoReverseMatch as e:
            print(f"   ❌ {description}")
            print(f"      Route: {route_name} → ERROR: {e}")
            print()
        except Exception as e:
            print(f"   ⚠️ {description}")
            print(f"      Route: {route_name} → ERROR: {e}")
            print()
    
    # Test dengan user login (jika ada)
    try:
        # Coba buat user test atau gunakan yang sudah ada
        test_user = User.objects.filter(is_active=True).first()
        if test_user:
            print("🔐 Testing routes with authenticated user:")
            client.force_login(test_user)
            
            auth_routes = [
                ('knowledge:article_manage_list', 'GET', 'Management - Article List (Auth)'),
                ('knowledge:category_list', 'GET', 'Management - Category List (Auth)'),
                ('knowledge:tag_manage_list', 'GET', 'Management - Tag List (Auth)'),
                ('knowledge:comment_manage_list', 'GET', 'Management - Comment List (Auth)'),
            ]
            
            for route_name, method, description in auth_routes:
                try:
                    url = reverse(route_name)
                    response = client.get(url)
                    
                    status_code = response.status_code
                    if status_code == 200:
                        status_icon = "✅"
                        status_text = "OK"
                    elif status_code == 403:
                        status_icon = "🔒"
                        status_text = "FORBIDDEN (No Permission)"
                    else:
                        status_icon = "⚠️"
                        status_text = f"HTTP {status_code}"
                    
                    print(f"   {status_icon} {description}")
                    print(f"      Status: {status_text}")
                    print()
                    
                except Exception as e:
                    print(f"   ⚠️ {description} → ERROR: {e}")
                    print()
        else:
            print("⚠️ No active user found for authentication testing")
            
    except Exception as e:
        print(f"⚠️ Authentication testing failed: {e}")
    
    print("✅ ROUTE TESTING COMPLETE!")

if __name__ == "__main__":
    test_knowledge_routes()