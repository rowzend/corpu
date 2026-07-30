#!/usr/bin/env python
"""
Script to create default groups/roles for ASNCORPU
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import Group

# Daftar groups yang akan dibuat
groups_to_create = [
    'Visitor',
    'User', 
    'Peserta',
    'Operator',
    'Approval',
    'Narasumber',
    'Dekan',
    'Pimpinan'
]

created = []
existing = []

for group_name in groups_to_create:
    group, created_flag = Group.objects.get_or_create(name=group_name)
    if created_flag:
        created.append(group_name)
        print(f"✓ Created group: {group_name}")
    else:
        existing.append(group_name)
        print(f"- Group already exists: {group_name}")

print(f"\n{'='*50}")
print(f"Groups created: {len(created)}")
print(f"Groups already exist: {len(existing)}")
print(f"Total groups in system: {Group.objects.count()}")
print(f"{'='*50}")
