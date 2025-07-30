#!/bin/bash
# Test script to debug nginx configuration

echo "🔍 Testing Helm chart with nginx configuration..."

# Test with minimal required parameters
echo "📋 Testing required parameters..."
helm template test ./tilburg-woo-ui \
  --set global.domain="test.domain.com" \
  --set env.NGINX_NEXTCLOUD_DOMAIN="nextcloud.test.com" \
  --set env.NGINX_TARGET_HOST="nextcloud.test.com" \
  --debug | grep -A 20 -B 5 "NGINX_"

echo ""
echo ""
echo "🔧 OPTION A - External backend domains:"
echo "helm template test ./tilburg-woo-ui \\"
echo "  --set global.domain=\"rotterdam.accept.opencatalogi.nl\" \\"
echo "  --set env.NGINX_NEXTCLOUD_UPSTREAM=\"https://nextcloud.rotterdam.accept.opencatalogi.nl\" \\"
echo "  --set env.NGINX_OPENCONNECTOR_UPSTREAM=\"https://nextcloud.rotterdam.accept.opencatalogi.nl\" \\"
echo "  --set env.NGINX_NEXTCLOUD_DOMAIN=\"nextcloud.rotterdam.accept.opencatalogi.nl\" \\"
echo "  --set env.NGINX_TARGET_HOST=\"nextcloud.rotterdam.accept.opencatalogi.nl\""

echo ""
echo "🔧 OPTION B - Internal Kubernetes services:"
echo "helm template test ./tilburg-woo-ui \\"
echo "  --set global.domain=\"rotterdam.accept.opencatalogi.nl\" \\"
echo "  --set env.NGINX_NEXTCLOUD_UPSTREAM=\"http://nextcloud-service.default.svc.cluster.local:80\" \\"
echo "  --set env.NGINX_OPENCONNECTOR_UPSTREAM=\"http://openconnector-service.default.svc.cluster.local:80\" \\"
echo "  --set env.NGINX_NEXTCLOUD_DOMAIN=\"nextcloud.rotterdam.accept.opencatalogi.nl\" \\"
echo "  --set env.NGINX_TARGET_HOST=\"nextcloud.rotterdam.accept.opencatalogi.nl\"" 