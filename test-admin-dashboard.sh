#!/bin/bash

echo "🚀 Testing ASN CORPU Admin Dashboard"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test URLs
BACKEND_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3004"
API_URL="$BACKEND_URL/apicorpu/1.0"
AUTH_URL="$BACKEND_URL/apicorpu/auth/1.0"

echo -e "${BLUE}Testing Backend Services...${NC}"

# Test Django backend health
echo -n "🔍 Django Backend Health: "
if curl -s "$BACKEND_URL/health/" > /dev/null; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# Test API endpoints
echo -n "🔍 Dashboard Stats API: "
if curl -s "$API_URL/dashboard/stats/" > /dev/null; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED (Need authentication)${NC}"
fi

echo -n "🔍 Users API: "
if curl -s "$API_URL/management/users/" > /dev/null; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED (Need authentication)${NC}"
fi

echo -n "🔍 Roles API: "
if curl -s "$API_URL/management/roles/" > /dev/null; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED (Need authentication)${NC}"
fi

echo -e "\n${BLUE}Testing Frontend Services...${NC}"

# Test Next.js frontend
echo -n "🔍 Next.js Frontend: "
if curl -s "$FRONTEND_URL" > /dev/null; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

echo -n "🔍 Login Page: "
if curl -s "$FRONTEND_URL/login" > /dev/null; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

echo -n "🔍 Admin Dashboard: "
if curl -s "$FRONTEND_URL/admin/dashboard" > /dev/null; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

echo -e "\n${BLUE}Testing Authentication Flow...${NC}"

# Test login API
echo -n "🔍 Login API Endpoint: "
LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$AUTH_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -o /dev/null)

if [ "$LOGIN_RESPONSE" = "400" ] || [ "$LOGIN_RESPONSE" = "401" ]; then
    echo -e "${GREEN}✅ OK (Responds to requests)${NC}"
else
    echo -e "${YELLOW}⚠️  Response: $LOGIN_RESPONSE${NC}"
fi

echo -e "\n${BLUE}Service Status Summary:${NC}"
echo "=================================="
echo -e "🌐 Django Backend:     ${BACKEND_URL}"
echo -e "⚛️  Next.js Frontend:   ${FRONTEND_URL}"
echo -e "🔐 API Base URL:       ${API_URL}"
echo -e "🔑 Auth URL:           ${AUTH_URL}"

echo -e "\n${BLUE}Quick Access Links:${NC}"
echo "=================================="
echo -e "📊 Admin Dashboard:    ${FRONTEND_URL}/admin/dashboard"
echo -e "🔐 Login Page:         ${FRONTEND_URL}/login"
echo -e "👥 User Management:    ${FRONTEND_URL}/admin/users"
echo -e "🔑 Role Management:    ${FRONTEND_URL}/admin/roles"
echo -e "🏥 Health Check:       ${BACKEND_URL}/health/"

echo -e "\n${BLUE}Test Instructions:${NC}"
echo "=================================="
echo "1. Open browser and go to: $FRONTEND_URL/login"
echo "2. Login with your credentials"
echo "3. You should be redirected to: $FRONTEND_URL/admin/dashboard"
echo "4. Test user management: $FRONTEND_URL/admin/users"
echo "5. Test role management: $FRONTEND_URL/admin/roles"

echo -e "\n${GREEN}🎉 Test Complete!${NC}"
echo -e "If all services are ${GREEN}✅ OK${NC}, the admin dashboard is ready to use!"

# Check if Docker containers are running
echo -e "\n${BLUE}Docker Container Status:${NC}"
echo "=================================="
docker-compose ps 2>/dev/null || echo "Run 'docker-compose ps' to check container status"

echo -e "\n${YELLOW}💡 Troubleshooting:${NC}"
echo "- If services are down: docker-compose up -d"
echo "- If API fails: Check Django logs: docker-compose logs asncorpu_backend"
echo "- If frontend fails: Check Next.js logs: docker-compose logs asncorpu-frontend"
echo "- If CORS errors: Check CORS_ALLOWED_ORIGINS in Django settings"