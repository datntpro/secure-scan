#!/bin/bash

# Test frontend build for Cloudflare Pages deployment
# This script validates the build before deploying

set -e

echo "🧪 Testing Frontend Build for Cloudflare Pages"
echo "=============================================="

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

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version must be 18 or higher (current: $(node --version))"
        exit 1
    fi
    
    print_success "Node.js $(node --version) ✓"
    
    # Check if we're in the right directory
    if [ ! -f "frontend/package.json" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    print_success "Project structure ✓"
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
    
    print_success "Dependencies installed ✓"
}

# Run type checking
run_type_check() {
    print_status "Running TypeScript type check..."
    
    if npm run type-check; then
        print_success "Type check passed ✓"
    else
        print_error "Type check failed ✗"
        exit 1
    fi
}

# Run linting
run_linting() {
    print_status "Running ESLint..."
    
    if npm run lint; then
        print_success "Linting passed ✓"
    else
        print_error "Linting failed ✗"
        exit 1
    fi
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    if npm run test -- --passWithNoTests; then
        print_success "Tests passed ✓"
    else
        print_error "Tests failed ✗"
        exit 1
    fi
}

# Build for production
build_production() {
    print_status "Building for production..."
    
    # Set production environment
    export NODE_ENV=production
    export NEXT_PUBLIC_API_URL=https://api.securescan.vn
    export NEXT_PUBLIC_WS_URL=wss://api.securescan.vn
    export NEXT_PUBLIC_APP_URL=https://securescan.vn
    export NEXT_PUBLIC_ENVIRONMENT=production
    
    if npm run build; then
        print_success "Build completed ✓"
    else
        print_error "Build failed ✗"
        exit 1
    fi
}

# Validate build output
validate_build() {
    print_status "Validating build output..."
    
    # Check if out directory exists
    if [ ! -d "out" ]; then
        print_error "Build output directory 'out' not found"
        exit 1
    fi
    
    # Check if index.html exists
    if [ ! -f "out/index.html" ]; then
        print_error "index.html not found in build output"
        exit 1
    fi
    
    # Check build size
    BUILD_SIZE=$(du -sh out | cut -f1)
    print_success "Build output size: $BUILD_SIZE"
    
    # List important files
    print_status "Build output structure:"
    ls -la out/ | head -10
    
    print_success "Build validation passed ✓"
}

# Test build locally
test_local_server() {
    print_status "Testing build with local server..."
    
    # Install serve if not available
    if ! command -v serve &> /dev/null; then
        print_status "Installing serve..."
        npm install -g serve
    fi
    
    # Start server in background
    serve -s out -l 3001 &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 3
    
    # Test if server is responding
    if curl -s http://localhost:3001 > /dev/null; then
        print_success "Local server test passed ✓"
        print_status "Server running at: http://localhost:3001"
    else
        print_error "Local server test failed ✗"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
    
    # Stop server
    kill $SERVER_PID 2>/dev/null || true
    print_success "Local server stopped ✓"
}

# Check for common issues
check_common_issues() {
    print_status "Checking for common deployment issues..."
    
    # Check for dynamic imports that might cause issues
    if grep -r "import(" out/ 2>/dev/null | grep -v ".map" | head -5; then
        print_warning "Dynamic imports found - verify they work in production"
    fi
    
    # Check for localhost references
    if grep -r "localhost" out/ 2>/dev/null | grep -v ".map" | head -5; then
        print_warning "Localhost references found - verify environment variables"
    fi
    
    # Check for console.log statements
    if grep -r "console.log" out/ 2>/dev/null | grep -v ".map" | head -5; then
        print_warning "Console.log statements found - consider removing for production"
    fi
    
    print_success "Common issues check completed ✓"
}

# Performance analysis
analyze_performance() {
    print_status "Analyzing build performance..."
    
    # Bundle size analysis
    if [ -d "out/_next/static" ]; then
        STATIC_SIZE=$(du -sh out/_next/static | cut -f1)
        print_status "Static assets size: $STATIC_SIZE"
    fi
    
    # Count files
    FILE_COUNT=$(find out -type f | wc -l)
    print_status "Total files: $FILE_COUNT"
    
    # Largest files
    print_status "Largest files:"
    find out -type f -exec du -h {} + | sort -rh | head -5
    
    print_success "Performance analysis completed ✓"
}

# Show deployment info
show_deployment_info() {
    print_success "🎉 Frontend build test completed successfully!"
    echo ""
    echo "📊 Build Summary:"
    echo "   Build size: $(du -sh out | cut -f1)"
    echo "   File count: $(find out -type f | wc -l)"
    echo "   Build time: $(date)"
    echo ""
    echo "🚀 Ready for deployment to:"
    echo "   Staging:    https://staging.securescan.vn"
    echo "   Production: https://securescan.vn"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Deploy to staging: ./scripts/deploy-frontend.sh staging"
    echo "   2. Test staging deployment"
    echo "   3. Deploy to production: ./scripts/deploy-frontend.sh production"
    echo ""
    echo "🔧 Cloudflare Pages:"
    echo "   Dashboard: https://dash.cloudflare.com/pages"
    echo "   Docs: https://developers.cloudflare.com/pages"
}

# Cleanup
cleanup() {
    print_status "Cleaning up..."
    
    # Kill any remaining processes
    pkill -f "serve" 2>/dev/null || true
    
    cd ..
}

# Main execution
main() {
    check_prerequisites
    install_dependencies
    run_type_check
    run_linting
    run_tests
    build_production
    validate_build
    test_local_server
    check_common_issues
    analyze_performance
    show_deployment_info
    cleanup
}

# Handle interruption
trap 'print_warning "Test interrupted"; cleanup; exit 1' INT

# Run main function
main