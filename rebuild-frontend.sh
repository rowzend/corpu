#!/bin/bash

echo "=========================================="
echo "Rebuilding Frontend Container"
echo "=========================================="
echo ""

cd /home/dev/Documents/vps-settings/all-projects/projects/asncorpu

echo "1. Stopping frontend container..."
docker stop asncorpu-frontend-nextjs

echo ""
echo "2. Removing old container..."
docker rm asncorpu-frontend-nextjs

echo ""
echo "3. Rebuilding and starting..."
docker-compose up -d --build asncorpu-frontend

echo ""
echo "4. Checking logs..."
docker logs asncorpu-frontend-nextjs --tail 30

echo ""
echo "=========================================="
echo "Rebuild completed!"
echo "Please refresh your browser at http://localhost:3000/settings"
echo "And open browser console (F12) to see debug logs"
echo "=========================================="
