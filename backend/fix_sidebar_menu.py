#!/usr/bin/env python
"""
Script untuk memperbaiki masalah sidebar menu:
1. Menghapus duplikasi menu
2. Memperbaiki URL yang mengarah ke pagar (#)
3. Memastikan struktur kategori konsisten
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.manajemen.models import MenuItem, MenuCategory

def fix_sidebar_menu():
    print("🔧 MEMPERBAIKI SIDEBAR MENU...")
    
    # 1. Hapus menu yang bermasalah atau duplikasi
    print("\n1️⃣ Menghapus menu duplikasi dan bermasalah...")
    
    # Cari menu dengan URL kosong atau bermasalah
    problematic_menus = MenuItem.objects.filter(
        is_active=True,
        url_name__isnull=True,
        external_url__isnull=True,
        parent__isnull=False  # Hanya child menu yang tidak boleh kosong URL-nya
    )
    
    for menu in problematic_menus:
        print(f"   ❌ Menghapus menu bermasalah: {menu.name} (ID: {menu.id})")
        menu.delete()
    
    # 2. Perbaiki struktur kategori Knowledge Base
    print("\n2️⃣ Memperbaiki struktur kategori...")
    
    try:
        knowledge_base = MenuItem.objects.get(name="Knowledge Base", is_active=True)
        knowledge_children = MenuItem.objects.filter(parent_id=knowledge_base.id, is_active=True)
        
        print(f"   📚 Knowledge Base (ID: {knowledge_base.id}) - Kategori: {knowledge_base.category}")
        
        for child in knowledge_children:
            if child.category != knowledge_base.category:
                print(f"   🔄 Update kategori {child.name}: {child.category} → {knowledge_base.category}")
                child.category = knowledge_base.category
                child.save()
    except MenuItem.DoesNotExist:
        print("   ⚠️ Knowledge Base menu tidak ditemukan")
    
    # 3. Pastikan semua menu parent memiliki URL kosong (untuk dropdown)
    print("\n3️⃣ Memperbaiki URL menu parent...")
    
    parent_menus = MenuItem.objects.filter(
        is_active=True,
        parent__isnull=True
    ).exclude(
        id__in=MenuItem.objects.filter(parent__isnull=False).values_list('parent_id', flat=True)
    )
    
    # Menu yang memiliki children harus memiliki URL kosong
    menus_with_children = MenuItem.objects.filter(
        is_active=True,
        id__in=MenuItem.objects.filter(parent__isnull=False).values_list('parent_id', flat=True)
    )
    
    for menu in menus_with_children:
        if menu.url_name and menu.url_name.strip():
            print(f"   🔄 Mengosongkan URL parent menu: {menu.name}")
            menu.url_name = None
            menu.external_url = None
            menu.save()
    
    # 4. Tampilkan struktur menu final
    print("\n4️⃣ Struktur menu setelah perbaikan:")
    
    categories = MenuCategory.objects.filter(is_active=True).order_by('order')
    for category in categories:
        menus_in_category = MenuItem.objects.filter(
            is_active=True,
            category=category.code,
            parent__isnull=True
        ).order_by('order', 'name')
        
        if menus_in_category.exists():
            print(f"\n   📂 {category.name} (Code: {category.code})")
            
            for menu in menus_in_category:
                url_info = menu.url_name or menu.external_url or "No URL"
                print(f"      📄 {menu.name} → {url_info}")
                
                # Tampilkan children
                children = MenuItem.objects.filter(parent_id=menu.id, is_active=True).order_by('order', 'name')
                for child in children:
                    child_url = child.url_name or child.external_url or "No URL"
                    print(f"         └── {child.name} → {child_url}")
    
    print("\n✅ PERBAIKAN SIDEBAR MENU SELESAI!")

if __name__ == "__main__":
    fix_sidebar_menu()