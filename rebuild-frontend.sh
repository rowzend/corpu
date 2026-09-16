#!/bin/bash

echo "Rebuilding Frontend Container..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "1. Stopping frontend container..."
docker stop asncorpu-frontend-nextjs 2>/dev/null

echo ""
echo "2. Removing old container..."
docker rm asncorpu-frontend-nextjs 2>/dev/null

echo ""
echo "3. Rebuilding and starting..."
docker compose up -d --build asncorpu-frontend

echo ""
echo "4. Checking logs..."
docker logs asncorpu-frontend-nextjs --tail 30

echo ""
echo "======================================="
echo "Rebuild completed!"
echo "Please refresh your browser at http://localhost:3000"
echo "======================================="
