#!/bin/bash

echo "Starting ASNCORPU Fullstack Application..."
echo ""

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if shared-network exists
if ! docker network inspect shared-network > /dev/null 2>&1; then
    echo "shared-network not found. Creating..."
    docker network create shared-network
fi

# Start services
echo "Starting containers..."
docker compose up -d

# Wait for services to be ready
echo ""
echo "Waiting for services to be ready..."
sleep 5

# Check health
echo ""
echo "Checking service health..."
echo ""

# Check nginx
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "Nginx: healthy"
else
    echo "Nginx: not responding"
fi

# Check backend
if docker compose exec -T asncorpu_backend curl -s http://localhost:8000/health/ > /dev/null 2>&1; then
    echo "Backend: healthy"
else
    echo "Backend: starting... (may take a moment)"
fi

# Check frontend
if curl -s http://localhost:3000/ > /dev/null 2>&1; then
    echo "Frontend: healthy"
else
    echo "Frontend: starting... (may take a moment)"
fi

echo ""
echo "======================================="
echo "ASNCORPU is starting!"
echo "======================================="
echo ""
echo "Access URLs:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:3000/apicorpu"
echo "  Health:    http://localhost:3000/health"
echo ""
echo "Useful commands:"
echo "  make logs      # View logs"
echo "  make down      # Stop"
echo "  make restart   # Restart"
echo "  make status    # Status"
echo ""
echo "======================================="
