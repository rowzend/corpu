#!/bin/bash

echo "Reloading Static Files for ASNCORPU..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# Step 1: Collect static files
echo "Step 1: Collecting static files..."
docker compose exec asncorpu_backend python manage.py collectstatic --noinput --clear

# Step 2: Restart container
echo ""
echo "Step 2: Restarting container..."
docker compose restart asncorpu_backend

# Step 3: Wait for health check
echo ""
echo "Step 3: Waiting for container to be healthy..."
sleep 5

# Step 4: Check status
echo ""
echo "Container status:"
docker compose ps asncorpu_backend

echo ""
echo "Done!"
echo "  1. Open browser"
echo "  2. Press Ctrl+Shift+R (hard refresh) or Ctrl+F5"
echo ""
echo "URL: http://localhost:3000"
