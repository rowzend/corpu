#!/bin/bash

echo "================================"
echo "Testing Backend Connection"
echo "================================"
echo ""

# Test different ports
BACKEND_IP="192.1.6.24"
PORTS=(8008 8080 3000 3001 5000)

echo "1. Testing connectivity to backend server..."
echo ""

for PORT in "${PORTS[@]}"; do
    echo "Testing port $PORT..."
    timeout 3 bash -c "cat < /dev/null > /dev/tcp/$BACKEND_IP/$PORT" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Port $PORT is OPEN"
        
        # Try to access the API
        echo "   Testing API endpoint..."
        RESPONSE=$(curl -s -w "\n%{http_code}" --connect-timeout 5 "http://$BACKEND_IP:$PORT/api/auth/login" -X POST \
            -H "Content-Type: application/json" \
            -d '{"username":"test","password":"test"}' 2>/dev/null)
        
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        BODY=$(echo "$RESPONSE" | head -n-1)
        
        if [ ! -z "$HTTP_CODE" ]; then
            echo "   HTTP Status: $HTTP_CODE"
            if [ ! -z "$BODY" ]; then
                echo "   Response: $BODY"
            fi
        fi
        echo ""
    else
        echo "❌ Port $PORT is CLOSED or TIMEOUT"
        echo ""
    fi
done

echo ""
echo "2. Testing with different endpoints..."
echo ""

# Test common endpoints
ENDPOINTS=(
    "/api/auth/login"
    "/auth/login"
    "/login"
    "/api/login"
)

for ENDPOINT in "${ENDPOINTS[@]}"; do
    echo "Testing: http://$BACKEND_IP:8008$ENDPOINT"
    RESPONSE=$(curl -s -w "\n%{http_code}" --connect-timeout 5 "http://$BACKEND_IP:8008$ENDPOINT" -X POST \
        -H "Content-Type: application/json" \
        -d '{"username":"test","password":"test"}' 2>/dev/null)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ ! -z "$HTTP_CODE" ] && [ "$HTTP_CODE" != "000" ]; then
        echo "   ✅ Endpoint accessible - HTTP $HTTP_CODE"
    else
        echo "   ❌ Endpoint not accessible"
    fi
    echo ""
done

echo "================================"
echo "Test Complete"
echo "================================"
