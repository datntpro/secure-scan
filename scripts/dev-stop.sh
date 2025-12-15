#!/bin/bash

# Development stop script for SecureScan.vn
# This script stops all development services

set -e

echo "🛑 Stopping SecureScan.vn Development Environment"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Stop application services
stop_services() {
    print_status "Stopping application services..."
    
    # Stop backend
    if [ -f "logs/backend.pid" ]; then
        BACKEND_PID=$(cat logs/backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID
            print_success "Backend stopped"
        else
            print_warning "Backend process not found"
        fi
        rm -f logs/backend.pid
    fi
    
    # Stop frontend
    if [ -f "logs/frontend.pid" ]; then
        FRONTEND_PID=$(cat logs/frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID
            print_success "Frontend stopped"
        else
            print_warning "Frontend process not found"
        fi
        rm -f logs/frontend.pid
    fi
    
    # Kill any remaining Node.js processes (Next.js dev server)
    pkill -f "next-server" 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true
    
    # Kill any remaining Python processes (uvicorn)
    pkill -f "uvicorn app.main:app" 2>/dev/null || true
}

# Stop Docker containers
stop_containers() {
    print_status "Stopping Docker containers..."
    
    # Stop and remove containers
    containers=("securescan_postgres" "securescan_redis" "securescan_zap")
    
    for container in "${containers[@]}"; do
        if docker ps -q -f name=$container | grep -q .; then
            docker stop $container
            docker rm $container
            print_success "$container stopped and removed"
        else
            print_warning "$container not running"
        fi
    done
}

# Clean up logs
cleanup_logs() {
    print_status "Cleaning up logs..."
    
    if [ -d "logs" ]; then
        rm -f logs/*.log
        rm -f logs/*.pid
        print_success "Logs cleaned up"
    fi
}

# Main execution
main() {
    stop_services
    stop_containers
    cleanup_logs
    
    print_success "🎉 All services stopped successfully!"
    echo ""
    echo "💡 To start again, run: ./scripts/dev-start.sh"
}

# Run main function
main