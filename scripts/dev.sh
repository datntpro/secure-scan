#!/bin/bash

# Development script for SecureScan.vn
echo "🛡️ Starting SecureScan.vn in development mode..."

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    fi
    return 0
}

# Check required ports
check_port 3000 || exit 1
check_port 8000 || exit 1
check_port 5432 || exit 1
check_port 6379 || exit 1

# Start infrastructure services
echo "🚀 Starting infrastructure services..."
docker-compose up -d postgres redis zap

# Wait for services
echo "⏳ Waiting for infrastructure services..."
sleep 10

# Start backend in development mode
echo "🐍 Starting backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

# Run database migrations
echo "🗄️ Running database migrations..."
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

cd ..

# Start frontend in development mode
echo "⚛️ Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "🎉 Development servers started!"
echo ""
echo "📍 Access points:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo "🛑 Stopping services..."; kill $BACKEND_PID $FRONTEND_PID; docker-compose down; exit' INT
wait