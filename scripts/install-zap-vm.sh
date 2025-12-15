#!/bin/bash

# Script to install OWASP ZAP on Ubuntu/Debian VM
# For SecureScan.vn production deployment

set -e

echo "🚀 Installing OWASP ZAP on VM for SecureScan.vn"
echo "================================================"

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

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root"
        exit 1
    fi
}

# Update system
update_system() {
    print_status "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    print_success "System updated"
}

# Install Java (required for ZAP)
install_java() {
    print_status "Installing Java..."
    
    if java -version 2>&1 | grep -q "openjdk version"; then
        print_warning "Java already installed"
        java -version
    else
        sudo apt install -y openjdk-11-jdk
        print_success "Java installed"
    fi
    
    # Set JAVA_HOME
    echo 'export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64' >> ~/.bashrc
    export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
}

# Install ZAP
install_zap() {
    print_status "Installing OWASP ZAP..."
    
    ZAP_VERSION="2.14.0"
    ZAP_DIR="/opt/zaproxy"
    ZAP_USER="zap"
    
    # Create ZAP user
    if ! id "$ZAP_USER" &>/dev/null; then
        sudo useradd -r -s /bin/false -d "$ZAP_DIR" "$ZAP_USER"
        print_success "Created ZAP user"
    fi
    
    # Download and install ZAP
    cd /tmp
    wget "https://github.com/zaproxy/zaproxy/releases/download/v${ZAP_VERSION}/ZAP_${ZAP_VERSION}_Linux.tar.gz"
    
    sudo mkdir -p "$ZAP_DIR"
    sudo tar -xzf "ZAP_${ZAP_VERSION}_Linux.tar.gz" -C "$ZAP_DIR" --strip-components=1
    sudo chown -R "$ZAP_USER:$ZAP_USER" "$ZAP_DIR"
    
    # Create symlink
    sudo ln -sf "$ZAP_DIR/zap.sh" /usr/local/bin/zap
    
    print_success "ZAP installed to $ZAP_DIR"
}

# Create ZAP service
create_zap_service() {
    print_status "Creating ZAP systemd service..."
    
    # Create service file for ZAP instance 1
    sudo tee /etc/systemd/system/zap@.service > /dev/null <<EOF
[Unit]
Description=OWASP ZAP Instance %i
After=network.target

[Service]
Type=simple
User=zap
Group=zap
WorkingDirectory=/opt/zaproxy
Environment=JAVA_OPTS=-Xmx2g -XX:+UseG1GC
ExecStart=/opt/zaproxy/zap.sh -daemon -host 0.0.0.0 -port %i -config api.addrs.addr.name=.* -config api.addrs.addr.regex=true -config api.key=securescan-zap-key
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd
    sudo systemctl daemon-reload
    
    print_success "ZAP service created"
}

# Start ZAP instances
start_zap_instances() {
    print_status "Starting ZAP instances..."
    
    # Start multiple instances on different ports
    PORTS=(8080 8081 8082)
    
    for port in "${PORTS[@]}"; do
        print_status "Starting ZAP on port $port..."
        sudo systemctl enable "zap@$port"
        sudo systemctl start "zap@$port"
        
        # Wait for ZAP to be ready
        print_status "Waiting for ZAP on port $port to be ready..."
        for i in {1..60}; do
            if curl -s "http://localhost:$port/JSON/core/view/version/?apikey=securescan-zap-key" > /dev/null 2>&1; then
                print_success "ZAP on port $port is ready"
                break
            fi
            
            if [ $i -eq 60 ]; then
                print_error "ZAP on port $port failed to start"
                exit 1
            fi
            
            sleep 2
        done
    done
}

# Install HAProxy for load balancing
install_haproxy() {
    print_status "Installing HAProxy for load balancing..."
    
    sudo apt install -y haproxy
    
    # Backup original config
    sudo cp /etc/haproxy/haproxy.cfg /etc/haproxy/haproxy.cfg.backup
    
    # Create HAProxy config
    sudo tee /etc/haproxy/haproxy.cfg > /dev/null <<EOF
global
    daemon
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms
    option httplog

# Stats page
listen stats
    bind *:8090
    stats enable
    stats uri /stats
    stats refresh 30s
    stats admin if TRUE

# ZAP Load Balancer
frontend zap_frontend
    bind *:8089
    default_backend zap_backend

backend zap_backend
    balance leastconn
    option httpchk GET /JSON/core/view/version/?apikey=securescan-zap-key
    server zap1 127.0.0.1:8080 check
    server zap2 127.0.0.1:8081 check
    server zap3 127.0.0.1:8082 check
EOF

    # Start HAProxy
    sudo systemctl enable haproxy
    sudo systemctl restart haproxy
    
    print_success "HAProxy installed and configured"
}

# Configure firewall
configure_firewall() {
    print_status "Configuring firewall..."
    
    # Install ufw if not present
    sudo apt install -y ufw
    
    # Configure firewall rules
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow ssh
    sudo ufw allow 8080:8082/tcp  # ZAP instances
    sudo ufw allow 8089/tcp       # HAProxy ZAP frontend
    sudo ufw allow 8090/tcp       # HAProxy stats
    
    # Enable firewall
    sudo ufw --force enable
    
    print_success "Firewall configured"
}

# Create monitoring script
create_monitoring() {
    print_status "Creating monitoring scripts..."
    
    # Health check script
    sudo tee /usr/local/bin/zap-health-check.sh > /dev/null <<'EOF'
#!/bin/bash

PORTS=(8080 8081 8082)
FAILED=0

for port in "${PORTS[@]}"; do
    if ! curl -s "http://localhost:$port/JSON/core/view/version/?apikey=securescan-zap-key" > /dev/null; then
        echo "ZAP on port $port is DOWN"
        FAILED=1
        
        # Try to restart
        systemctl restart "zap@$port"
    else
        echo "ZAP on port $port is UP"
    fi
done

if [ $FAILED -eq 1 ]; then
    exit 1
fi
EOF

    sudo chmod +x /usr/local/bin/zap-health-check.sh
    
    # Add to crontab for monitoring
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/zap-health-check.sh") | crontab -
    
    print_success "Monitoring configured"
}

# Display summary
show_summary() {
    print_success "🎉 OWASP ZAP installation completed!"
    echo ""
    echo "📊 Service URLs:"
    echo "   ZAP Instance 1: http://$(hostname -I | awk '{print $1}'):8080"
    echo "   ZAP Instance 2: http://$(hostname -I | awk '{print $1}'):8081"
    echo "   ZAP Instance 3: http://$(hostname -I | awk '{print $1}'):8082"
    echo "   Load Balancer:  http://$(hostname -I | awk '{print $1}'):8089"
    echo "   HAProxy Stats:  http://$(hostname -I | awk '{print $1}'):8090/stats"
    echo ""
    echo "🔑 API Key: securescan-zap-key"
    echo ""
    echo "🛠️ Management Commands:"
    echo "   sudo systemctl status zap@8080"
    echo "   sudo systemctl restart zap@8080"
    echo "   sudo systemctl status haproxy"
    echo "   /usr/local/bin/zap-health-check.sh"
    echo ""
    echo "📝 Logs:"
    echo "   sudo journalctl -u zap@8080 -f"
    echo "   sudo journalctl -u haproxy -f"
    echo ""
    echo "🔧 Configuration:"
    echo "   ZAP Directory: /opt/zaproxy"
    echo "   HAProxy Config: /etc/haproxy/haproxy.cfg"
    echo "   Service Files: /etc/systemd/system/zap@.service"
}

# Main execution
main() {
    check_root
    update_system
    install_java
    install_zap
    create_zap_service
    start_zap_instances
    install_haproxy
    configure_firewall
    create_monitoring
    show_summary
}

# Handle interruption
trap 'print_warning "Installation interrupted"; exit 1' INT

# Run main function
main