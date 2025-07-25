#!/bin/bash

echo "🔍 Manual Linting Check for Tilburg WOO UI"
echo "=========================================="

# Check if we're in a container or host
if [ -f /.dockerenv ]; then
    echo "📦 Running inside Docker container"
    YARN_CMD="yarn"
else
    echo "🖥️  Running on host system"
    YARN_CMD="docker-compose -f docker-compose.dev.yml exec tilburg-woo-ui-dev yarn"
fi

echo ""
echo "🔧 Installing ESLint if not present..."
$YARN_CMD add -D eslint@^8.57.0 eslint-plugin-react@^7.34.0 eslint-plugin-react-hooks@^4.6.0 eslint-plugin-import@^2.29.0 2>/dev/null || true

echo ""
echo "📋 Running ESLint check..."
echo "========================="

# Run ESLint on specific problematic file to demonstrate
echo "Checking src/hooks/con-nextcloud-requests.js (where the useNavigate issue was):"
$YARN_CMD eslint src/hooks/con-nextcloud-requests.js --format compact || echo "⚠️ ESLint found issues"

echo ""
echo "📝 Checking a few more critical files:"
$YARN_CMD eslint src/views/ac-beheer/ac-applicaties/pages/ac-applicaties.js --format compact || echo "⚠️ ESLint found issues"

echo ""
echo "🎨 Running Prettier check on sample files..."
echo "============================================"
$YARN_CMD prettier --check src/hooks/con-nextcloud-requests.js || echo "⚠️ Prettier formatting issues found"

echo ""
echo "✅ Linting check complete!"
echo ""
echo "💡 To fix issues automatically:"
echo "   - ESLint: yarn lint:fix"  
echo "   - Prettier: yarn format"
echo ""
echo "🚀 To run full project linting:"
echo "   - yarn lint:check (all files)"
echo "   - yarn validate (lint + format check)" 