#!/bin/bash

# Development startup script for SecureScan.vn
# This script starts all necessary services for development

set -e

echo "🚀 Starting SecureScan.vn Development Environment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_success "Docker is running"
}

# Start PostgreSQL and Redis
start_databases() {
    print_status "Starting databases..."
    
    # Check if containers are already running
    if docker ps | grep -q "securescan_postgres"; then
        print_warning "PostgreSQL container already running"
    else
        docker run -d \
            --name securescan_postgres \
            -e POSTGRES_DB=securescan_dev \
            -e POSTGRES_USER=securescan \
            -e POSTGRES_PASSWORD=password \
            -p 5432:5432 \
            postgres:15-alpine
        print_success "PostgreSQL started"
    fi
    
    if docker ps | grep -q "securescan_redis"; then
        print_warning "Redis container already running"
    else
        docker run -d \
            --name securescan_redis \
            -p 6379:6379 \
            redis:7-alpine
        print_success "Redis started"
    fi
}

# Start ZAP instance
start_zap() {
    print_status "Starting OWASP ZAP..."
    
    if docker ps | grep -q "securescan_zap"; then
        print_warning "ZAP container already running"
    else
        docker run -d \
            --name securescan_zap \
            -p 8080:8080 \
            owasp/zap2docker-stable \
            zap.sh -daemon -host 0.0.0.0 -port 8080 \
            -config api.addrs.addr.name=.* \
            -config api.addrs.addr.regex=true \
            -config api.key=securescan-zap-key
        
        print_status "Waiting for ZAP to be ready..."
        
        # Wait for ZAP to be ready (max 60 seconds)
        for i in {1..60}; do
            if curl -s "http://localhost:8080/JSON/core/view/version/?apikey=securescan-zap-key" > /dev/null 2>&1; then
                print_success "ZAP is ready"
                break
            fi
            
            if [ $i -eq 60 ]; then
                print_error "ZAP failed to start within 60 seconds"
                exit 1
            fi
            
            sleep 1
        done
    fi
}

# Install backend dependencies
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment and install dependencies
    source venv/bin/activate
    pip install -r requirements.txt
    
    print_success "Backend setup complete"
    cd ..
}

# Install frontend dependencies
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install Node.js dependencies
    if [ ! -d "node_modules" ]; then
        npm install
    else
        print_warning "Node modules already installed"
    fi
    
    print_success "Frontend setup complete"
    cd ..
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    cd backend
    source venv/bin/activate
    
    # Wait for PostgreSQL to be ready
    print_status "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if pg_isready -h localhost -p 5432 -U securescan > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done
    
    # Run migrations (tables will be created automatically by FastAPI)
    python -c "
import asyncio
from app.core.database import engine
from app.models import Base

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('Database tables created successfully')

asyncio.run(create_tables())
"
    
    print_success "Database migrations complete"
    cd ..
}

# Test ZAP integration
test_integration() {
    print_status "Testing ZAP integration..."
    
    cd backend
    source venv/bin/activate
    
    # Run integration tests
    python ../scripts/test-zap-integration.py
    
    cd ..
}

# Start services
start_services() {
    print_status "Starting services..."
    
    # Start backend
    print_status "Starting backend API server..."
    cd backend
    source venv/bin/activate
    nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../logs/backend.pid
    cd ..
    
    # Wait a bit for backend to start
    sleep 3
    
    # Start frontend
    print_status "Starting frontend development server..."
    cd frontend
    nohup npm run dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../logs/frontend.pid
    cd ..
    
    print_success "Services started successfully"
}

# Create logs directory
mkdir -p logs

# Main execution
main() {
    print_status "Checking prerequisites..."
    check_docker
    
    print_status "Starting infrastructure..."
    start_databases
    start_zap
    
    print_status "Setting up application..."
    setup_backend
    setup_frontend
    run_migrations
    
    print_status "Testing integration..."
    test_integration
    
    print_status "Starting application services..."
    start_services
    
    echo ""
    print_success "🎉 SecureScan.vn development environment is ready!"
    echo ""
    echo "📊 Service URLs:"
    echo "   Frontend:  http://localhost:3000"
    echo "   Backend:   http://localhost:8000"
    echo "   API Docs:  http://localhost:8000/docs"
    echo "   ZAP UI:    http://localhost:8080"
    echo ""
    echo "📝 Logs:"
    echo "   Backend:   tail -f logs/backend.log"
    echo "   Frontend:  tail -f logs/frontend.log"
    echo ""
    echo "🛑 To stop services:"
    echo "   ./scripts/dev-stop.sh"
    echo ""
}

# Handle interruption
trap 'print_warning "Setup interrupted"; exit 1' INT

# Run main function
main