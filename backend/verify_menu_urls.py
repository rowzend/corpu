#!/usr/bin/env python
"""
Script untuk memverifikasi semua URL menu berfungsi dengan baik
"""

import os
import sys
import django
from django.urls import reverse, NoReverseMatch

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.manajemen.models import MenuItem

def verify_menu_urls():
    print("🔍 MEMVERIFIKASI URL MENU...")
    
    menus = MenuItem.objects.filter(is_active=True, url_name__isnull=False).exclude(url_name='')
    
    valid_urls = 0
    invalid_urls = 0
    
    print(f"\n📋 Memeriksa {menus.count()} menu dengan URL...")
    
    for menu in menus:
        try:
            url = reverse(menu.url_name)
            print(f"   ✅ {menu.name} → {menu.url_name} → {url}")
            valid_urls += 1
        except NoReverseMatch:
            print(f"   ❌ {menu.name} → {menu.url_name} (URL tidak valid)")
            invalid_urls += 1
        except Exception as e:
            print(f"   ⚠️ {menu.name} → {menu.url_name} (Error: {e})")
            invalid_urls += 1
    
    print(f"\n📊 HASIL VERIFIKASI:")
    print(f"   ✅ URL Valid: {valid_urls}")
    print(f"   ❌ URL Invalid: {invalid_urls}")
    print(f"   📈 Success Rate: {(valid_urls/(valid_urls+invalid_urls)*100):.1f}%" if (valid_urls+invalid_urls) > 0 else "   📈 Success Rate: 100%")
    
    if invalid_urls == 0:
        print("\n🎉 SEMUA URL MENU VALID!")
    else:
        print(f"\n⚠️ Ada {invalid_urls} URL yang perlu diperbaiki")

if __name__ == "__main__":
    verify_menu_urls()