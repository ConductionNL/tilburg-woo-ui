#!/bin/bash
# Test script for runtime configuration implementation
# This script helps verify that the runtime config system is working correctly

set -e

echo "🧪 Runtime Configuration Test Script"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if generate-runtime-config.js exists
echo "Test 1: Checking if generate-runtime-config.js exists..."
if [ -f "scripts/generate-runtime-config.js" ]; then
    echo -e "${GREEN}✅ PASS${NC} - generate-runtime-config.js exists"
else
    echo -e "${RED}❌ FAIL${NC} - generate-runtime-config.js not found"
    exit 1
fi

# Test 2: Check if the script can run
echo ""
echo "Test 2: Running generate-runtime-config.js..."
if node scripts/generate-runtime-config.js /tmp/test-runtime-config.js 2>&1 | grep -q "Runtime configuration generated successfully"; then
    echo -e "${GREEN}✅ PASS${NC} - Script runs successfully"
else
    echo -e "${RED}❌ FAIL${NC} - Script failed to run"
    exit 1
fi

# Test 3: Check if the generated file is valid JavaScript
echo ""
echo "Test 3: Validating generated runtime-config.js..."
if [ -f "/tmp/test-runtime-config.js" ]; then
    if grep -q "window.RUNTIME_CONFIG" /tmp/test-runtime-config.js; then
        echo -e "${GREEN}✅ PASS${NC} - Generated file contains window.RUNTIME_CONFIG"
    else
        echo -e "${RED}❌ FAIL${NC} - Generated file doesn't contain window.RUNTIME_CONFIG"
        exit 1
    fi
else
    echo -e "${RED}❌ FAIL${NC} - Generated file not found"
    exit 1
fi

# Test 4: Check if index.html includes the script tag
echo ""
echo "Test 4: Checking if index.html includes runtime-config.js..."
if grep -q "runtime-config.js" public/index.html; then
    echo -e "${GREEN}✅ PASS${NC} - index.html includes runtime-config.js"
else
    echo -e "${RED}❌ FAIL${NC} - index.html doesn't include runtime-config.js"
    exit 1
fi

# Test 5: Check if container.constants.js reads from window.RUNTIME_CONFIG
echo ""
echo "Test 5: Checking if container.constants.js uses window.RUNTIME_CONFIG..."
if grep -q "window.RUNTIME_CONFIG" src/constants/container.constants.js; then
    echo -e "${GREEN}✅ PASS${NC} - container.constants.js reads from window.RUNTIME_CONFIG"
else
    echo -e "${RED}❌ FAIL${NC} - container.constants.js doesn't use window.RUNTIME_CONFIG"
    exit 1
fi

# Test 6: Check if Dockerfile includes runtime config generation
echo ""
echo "Test 6: Checking if Dockerfile generates runtime config..."
if grep -q "generate-runtime-config.js" Dockerfile; then
    echo -e "${GREEN}✅ PASS${NC} - Dockerfile includes runtime config generation"
else
    echo -e "${RED}❌ FAIL${NC} - Dockerfile doesn't generate runtime config"
    exit 1
fi

# Test 7: Check if Dockerfile.dev includes runtime config generation
echo ""
echo "Test 7: Checking if Dockerfile.dev generates runtime config..."
if grep -q "generate-runtime-config.js" Dockerfile.dev; then
    echo -e "${GREEN}✅ PASS${NC} - Dockerfile.dev includes runtime config generation"
else
    echo -e "${RED}❌ FAIL${NC} - Dockerfile.dev doesn't generate runtime config"
    exit 1
fi

# Test 8: Validate generated config structure
echo ""
echo "Test 8: Validating generated config structure..."
if grep -q "SITE_TITLE" /tmp/test-runtime-config.js && \
   grep -q "BASE_URL" /tmp/test-runtime-config.js && \
   grep -q "THEME_VARIANT" /tmp/test-runtime-config.js; then
    echo -e "${GREEN}✅ PASS${NC} - Generated config has expected properties"
else
    echo -e "${RED}❌ FAIL${NC} - Generated config missing expected properties"
    exit 1
fi

# Cleanup
rm -f /tmp/test-runtime-config.js

echo ""
echo "===================================="
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Build the Docker image: docker build -t tilburg-woo-ui:test ."
echo "2. Run locally: docker-compose up tilburg-woo-ui-hot"
echo "3. Open http://localhost:3000 and check console for 'window.RUNTIME_CONFIG'"
echo "4. Deploy to Kubernetes and verify with: kubectl logs -f deployment/tilburg-woo-ui"
echo ""

