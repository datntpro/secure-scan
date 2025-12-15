#!/bin/bash

# Test Cloudflare Pages deployment
echo "🧪 Testing SecureScan.vn Deployment"
echo "=================================="

# Test URLs
STAGING_URL="https://securescan-vn.pages.dev"
PRODUCTION_URL="https://securescan.vn"

echo "📡 Testing staging deployment..."
if curl -s --head "$STAGING_URL" | head -n 1 | grep -q "200 OK"; then
    echo "✅ Staging deployment is live: $STAGING_URL"
else
    echo "❌ Staging deployment failed or not ready"
fi

echo ""
echo "📡 Testing production deployment..."
if curl -s --head "$PRODUCTION_URL" | head -n 1 | grep -q "200 OK"; then
    echo "✅ Production deployment is live: $PRODUCTION_URL"
else
    echo "⚠️ Production domain not configured yet"
    echo "   Configure custom domain in Cloudflare Pages"
fi

echo ""
echo "🔍 Testing key pages..."
for path in "" "/auth/login" "/auth/register" "/dashboard"; do
    url="${STAGING_URL}${path}"
    if curl -s --head "$url" | head -n 1 | grep -q "200"; then
        echo "✅ $path"
    else
        echo "❌ $path"
    fi
done

echo ""
echo "📊 Performance test..."
echo "Run Lighthouse test: https://pagespeed.web.dev/analysis?url=${STAGING_URL}"