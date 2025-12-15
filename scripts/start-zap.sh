#!/bin/bash

# Script to start OWASP ZAP for SecureScan.vn
# This script will download and start ZAP in daemon mode

set -e

echo "🚀 Starting OWASP ZAP for SecureScan.vn..."

# Configuration
ZAP_VERSION="2.14.0"
ZAP_PORT="8080"
ZAP_API_KEY="securescan-zap-key"
ZAP_DIR="$HOME/.zap"
ZAP_LOG_FILE="$ZAP_DIR/zap.log"

# Create ZAP directory if it doesn't exist
mkdir -p "$ZAP_DIR"

# Function to check if ZAP is running
check_zap_running() {
    curl -s "http://localhost:$ZAP_PORT/JSON/core/view/version/?apikey=$ZAP_API_KEY" > /dev/null 2>&1
}

# Function to download ZAP if not exists
download_zap() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        ZAP_URL="https://github.com/zaproxy/zaproxy/releases/download/v$ZAP_VERSION/ZAP_$ZAP_VERSION_mac.dmg"
        echo "📥 Downloading ZAP for macOS..."
        echo "Please download ZAP manually from: $ZAP_URL"
        echo "Or install via Homebrew: brew install --cask owasp-zap"
        exit 1
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        ZAP_URL="https://github.com/zaproxy/zaproxy/releases/download/v$ZAP_VERSION/ZAP_${ZAP_VERSION}_Linux.tar.gz"
        ZAP_TAR="$ZAP_DIR/zap.tar.gz"
        
        if [ ! -f "$ZAP_DIR/ZAP_$ZAP_VERSION/zap.sh" ]; then
            echo "📥 Downloading ZAP for Linux..."
            curl -L "$ZAP_URL" -o "$ZAP_TAR"
            
            echo "📦 Extracting ZAP..."
            cd "$ZAP_DIR"
            tar -xzf "$ZAP_TAR"
            rm "$ZAP_TAR"
        fi
        
        ZAP_SCRIPT="$ZAP_DIR/ZAP_$ZAP_VERSION/zap.sh"
    else
        echo "❌ Unsupported operating system: $OSTYPE"
        exit 1
    fi
}

# Function to start ZAP
start_zap() {
    echo "🔧 Starting ZAP daemon..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # Try to find ZAP installation on macOS
        ZAP_SCRIPT="/Applications/OWASP ZAP.app/Contents/Java/zap.sh"
        if [ ! -f "$ZAP_SCRIPT" ]; then
            ZAP_SCRIPT="/usr/local/bin/zap.sh"
        fi
        
        if [ ! -f "$ZAP_SCRIPT" ]; then
            echo "❌ ZAP not found. Please install OWASP ZAP first."
            echo "Install via Homebrew: brew install --cask owasp-zap"
            exit 1
        fi
    fi
    
    # Start ZAP in daemon mode
    "$ZAP_SCRIPT" -daemon \
        -host 0.0.0.0 \
        -port "$ZAP_PORT" \
        -config api.addrs.addr.name=.* \
        -config api.addrs.addr.regex=true \
        -config api.key="$ZAP_API_KEY" \
        -config api.disablekey=false \
        > "$ZAP_LOG_FILE" 2>&1 &
    
    ZAP_PID=$!
    echo "ZAP_PID=$ZAP_PID" > "$ZAP_DIR/zap.pid"
    
    echo "⏳ Waiting for ZAP to start..."
    
    # Wait for ZAP to be ready (max 60 seconds)
    for i in {1..60}; do
        if check_zap_running; then
            echo "✅ ZAP is running on port $ZAP_PORT"
            echo "🔑 API Key: $ZAP_API_KEY"
            echo "📊 ZAP UI: http://localhost:$ZAP_PORT"
            echo "📝 Log file: $ZAP_LOG_FILE"
            return 0
        fi
        
        echo "Waiting... ($i/60)"
        sleep 1
    done
    
    echo "❌ ZAP failed to start within 60 seconds"
    echo "📝 Check log file: $ZAP_LOG_FILE"
    exit 1
}

# Function to stop ZAP
stop_zap() {
    echo "🛑 Stopping ZAP..."
    
    if [ -f "$ZAP_DIR/zap.pid" ]; then
        ZAP_PID=$(cat "$ZAP_DIR/zap.pid")
        if kill -0 "$ZAP_PID" 2>/dev/null; then
            kill "$ZAP_PID"
            rm "$ZAP_DIR/zap.pid"
            echo "✅ ZAP stopped"
        else
            echo "⚠️ ZAP process not found"
            rm -f "$ZAP_DIR/zap.pid"
        fi
    else
        echo "⚠️ ZAP PID file not found"
    fi
}

# Function to show ZAP status
status_zap() {
    if check_zap_running; then
        echo "✅ ZAP is running on port $ZAP_PORT"
        echo "🔑 API Key: $ZAP_API_KEY"
        echo "📊 ZAP UI: http://localhost:$ZAP_PORT"
    else
        echo "❌ ZAP is not running"
    fi
}

# Main script logic
case "${1:-start}" in
    "start")
        if check_zap_running; then
            echo "✅ ZAP is already running on port $ZAP_PORT"
        else
            download_zap
            start_zap
        fi
        ;;
    "stop")
        stop_zap
        ;;
    "restart")
        stop_zap
        sleep 2
        download_zap
        start_zap
        ;;
    "status")
        status_zap
        ;;
    "logs")
        if [ -f "$ZAP_LOG_FILE" ]; then
            tail -f "$ZAP_LOG_FILE"
        else
            echo "❌ Log file not found: $ZAP_LOG_FILE"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start ZAP daemon"
        echo "  stop    - Stop ZAP daemon"
        echo "  restart - Restart ZAP daemon"
        echo "  status  - Check ZAP status"
        echo "  logs    - Show ZAP logs"
        exit 1
        ;;
esac