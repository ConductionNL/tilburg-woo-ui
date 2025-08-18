#!/bin/bash

# Test script for Nextcloud session debugging
BASE_URL="https://softwarecatalogus.accept.opencatalogi.nl"
USERNAME="info@conduction.nl"
PASSWORD="YguxP(7bl=5v@N6u"
COOKIE_JAR="cookies.txt"

echo "🔐 Testing Nextcloud session..."
echo "================================"

# Clean up any existing cookies
rm -f $COOKIE_JAR

echo "1. Testing login..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}\n%{header_json}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -c $COOKIE_JAR \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" \
  "$BASE_URL/api/apps/openconnector/api/user/login")

echo "Login Response:"
echo "$LOGIN_RESPONSE"
echo ""

echo "2. Cookies saved:"
if [ -f $COOKIE_JAR ]; then
    cat $COOKIE_JAR
else
    echo "No cookies saved!"
fi
echo ""

echo "3. Testing /me endpoint..."
ME_RESPONSE=$(curl -s -w "\n%{http_code}\n%{header_json}\n" \
  -X GET \
  -H "Accept: application/json" \
  -b $COOKIE_JAR \
  "$BASE_URL/api/apps/openconnector/api/user/me")

echo "Me Response:"
echo "$ME_RESPONSE"
echo ""

echo "4. Final cookies:"
if [ -f $COOKIE_JAR ]; then
    cat $COOKIE_JAR
else
    echo "No cookies found!"
fi

# Clean up
rm -f $COOKIE_JAR
