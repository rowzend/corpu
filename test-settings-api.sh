#!/bin/bash

echo "=========================================="
echo "Testing Settings API"
echo "=========================================="
echo ""

# Test 1: Check database
echo "1. Checking database for settings..."
docker exec asncorpu_backend_app python manage.py shell -c "
from apps.manajemen.models import AppSettings
print(f'Total settings: {AppSettings.objects.count()}')
print(f'Public settings: {AppSettings.objects.filter(is_public=True).count()}')
print('')
print('First 5 settings:')
for s in AppSettings.objects.all()[:5]:
    print(f'  - {s.key}: {s.value[:50] if s.value else \"NULL\"}')
"
echo ""

# Test 2: Check API endpoint (without auth - will fail but shows if endpoint exists)
echo "2. Testing API endpoint (without auth)..."
curl -s -X GET http://localhost:3000/apicorpu/1.0/management/settings/ | head -c 200
echo ""
echo ""

# Test 3: Get a valid token and test with auth
echo "3. Testing with authentication..."
echo "Please run this manually with your token:"
echo "curl -H 'Authorization: Bearer YOUR_TOKEN' http://localhost:3000/apicorpu/1.0/management/settings/"
echo ""

echo "=========================================="
echo "Test completed"
echo "=========================================="
