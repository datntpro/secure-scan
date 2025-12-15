#!/bin/bash

# Deploy SecureScan.vn Frontend to Cloudflare Pages
# This script builds and deploys the Next.js app

set -e

echo "🚀 Deploying SecureScan.vn Frontend to Cloudflare Pages"
echo "======================================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
check_directory() {
    if [ ! -f "frontend/package.json" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    cd frontend
    
    if [ ! -d "node_modules" ]; then
        npm install
    else
        npm ci
    fi
    
    print_success "Dependencies installed"
}

# Build for production
build_production() {
    print_status "Building for production..."
    
    # Set production environment
    export NODE_ENV=production
    
    # Build the app
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Build completed successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Deploy to Cloudflare Pages
deploy_cloudflare() {
    print_status "Deploying to Cloudflare Pages..."
    
    # Check if wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        print_status "Installing Wrangler CLI..."
        npm install -g wrangler
    fi
    
    # Deploy using wrangler
    if [ "$1" = "production" ]; then
        print_status "Deploying to PRODUCTION..."
        wrangler pages deploy out --project-name securescan-vn --env production
    else
        print_status "Deploying to STAGING..."
        wrangler pages deploy out --project-name securescan-vn --env staging
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Deployment completed successfully"
    else
        print_error "Deployment failed"
        exit 1
    fi
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    if [ "$1" = "production" ]; then
        URL="https://securescan.vn"
    else
        URL="https://staging.securescan.vn"
    fi
    
    # Wait a bit for deployment to propagate
    sleep 10
    
    # Check if site is accessible
    if curl -s --head "$URL" | head -n 1 | grep -q "200 OK"; then
        print_success "Site is accessible at $URL"
    else
        print_warning "Site might still be propagating. Check manually: $URL"
    fi
}

# Show deployment info
show_info() {
    print_success "🎉 Frontend deployment completed!"
    echo ""
    echo "📊 Deployment URLs:"
    if [ "$1" = "production" ]; then
        echo "   Production: https://securescan.vn"
        echo "   Admin:      https://securescan.vn/admin"
    else
        echo "   Staging:    https://staging.securescan.vn"
        echo "   Admin:      https://staging.securescan.vn/admin"
    fi
    echo ""
    echo "🔧 Next Steps:"
    echo "   1. Configure custom domain in Cloudflare Pages"
    echo "   2. Set up environment variables in Cloudflare dashboard"
    echo "   3. Configure DNS records for securescan.vn"
    echo "   4. Deploy backend API to api.securescan.vn"
    echo ""
    echo "📝 Cloudflare Pages Dashboard:"
    echo "   https://dash.cloudflare.com/pages"
}

# Main execution
main() {
    local environment=${1:-staging}
    
    print_status "Deploying to: $environment"
    
    check_directory
    install_dependencies
    build_production
    deploy_cloudflare "$environment"
    verify_deployment "$environment"
    show_info "$environment"
    
    cd ..
}

# Handle command line arguments
case "${1:-help}" in
    "production"|"prod")
        main "production"
        ;;
    "staging"|"stage")
        main "staging"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [production|staging]"
        echo ""
        echo "Commands:"
        echo "  production  Deploy to production (securescan.vn)"
        echo "  staging     Deploy to staging (staging.securescan.vn)"
        echo "  help        Show this help message"
        exit 0
        ;;
    *)
        print_warning "Unknown environment: $1"
        print_status "Defaulting to staging deployment"
        main "staging"
        ;;
esac