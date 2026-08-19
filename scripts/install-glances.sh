#!/bin/bash
#===============================================================================
# OSDuo DashHub - Glances Agent Installation Script
# 
# This script installs Glances monitoring agent on a server.
# Run this on each server you want to monitor.
#
# After installation, the Glances web interface will be accessible at:
#   http://<server-ip>:61208
#
# This URL will be used in the dashboard to embed Glances via iframe.
#
# Usage:
#   curl -sL https://raw.githubusercontent.com/osduo/dashhub/main/scripts/install-glances.sh | bash
#
# Options:
#   -p, --port     Custom port (default: 61208)
#   -h, --help     Show this help message
#===============================================================================

set -e

# Default values
PORT="61208"
CONTAINER_NAME="glances"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_info() {
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

# Show help
show_help() {
    cat << EOF
OSDuo DashHub - Glances Agent Installation Script

Usage:
    ./install-glances.sh [OPTIONS]

Options:
    -p, --port PORT     Glances web server port (default: 61208)
    -h, --help          Show this help message

Examples:
    # Install with default port
    ./install-glances.sh

    # Install on custom port
    ./install-glances.sh -p 61209

Environment Variables:
    GLANCES_OPT         Additional options for Glances
    TZ                   Timezone for container

EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Print banner
echo ""
echo "================================================"
echo "  OSDuo DashHub - Glances Agent Installer"
echo "================================================"
echo ""

# Get hostname
HOSTNAME=$(hostname)
print_info "Installing Glances on: $HOSTNAME"
print_info "Web server port: $PORT"
echo ""

# Check if Docker is installed
print_info "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_warning "Docker is not installed!"
    echo ""
    echo "Installing Docker..."
    
    # Detect OS and install Docker
    if command -v apt-get &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
    elif command -v yum &> /dev/null; then
        sudo yum install -y docker
        sudo systemctl start docker
        sudo systemctl enable docker
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y docker
        sudo systemctl start docker
        sudo systemctl enable docker
    else
        print_error "Could not detect package manager. Please install Docker manually."
        exit 1
    fi
    
    print_success "Docker installed!"
fi

DOCKER_VERSION=$(docker --version 2>/dev/null || echo "unknown")
print_success "Docker version: $DOCKER_VERSION"

# Check if Docker daemon is running
print_info "Checking Docker daemon..."
if ! docker info &> /dev/null; then
    print_warning "Docker daemon is not running. Starting Docker..."
    sudo systemctl start docker 2>/dev/null || sudo service docker start 2>/dev/null
    sleep 2
    
    if ! docker info &> /dev/null; then
        print_error "Failed to start Docker daemon. Please start it manually."
        exit 1
    fi
fi
print_success "Docker daemon is running."

# Stop existing container if exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_info "Removing existing Glances container..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
fi

# Build Glances options
GLANCES_OPT="-w"

# Check for additional options in environment
if [ -n "$GLANCES_OPT_EXTRA" ]; then
    GLANCES_OPT="$GLANCES_OPT $GLANCES_OPT_EXTRA"
fi

# Set timezone
TZ="${TZ:-UTC}"

print_info "Starting Glances container..."
print_info "Glances options: $GLANCES_OPT"
echo ""

# Run Glances container
docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    -p ${PORT}:61208 \
    -e TZ="$TZ" \
    -e GLANCES_OPT="$GLANCES_OPT" \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    -v /run/user/1000/podman/podman.sock:/run/user/1000/podman/podman.sock:ro \
    --network host \
    --pid host \
    nicolargo/glances:latest-full

# Wait for container to start
sleep 3

# Check if container is running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_success "Glances is now running!"
    echo ""
    echo "================================================"
    echo "  Installation Complete!"
    echo "================================================"
    echo ""
    echo "  Web Interface: http://localhost:${PORT}"
    echo "  API Endpoint:  http://localhost:${PORT}/api/4/all"
    echo ""
    echo "  Add this server to your OSDuo DashHub:"
    echo "  - Host: $(hostname -I | awk '{print $1}')"
    echo "  - Port: ${PORT}"
    echo ""
    
    # Test API
    print_info "Testing API endpoint..."
    sleep 2
    if curl -s "http://localhost:${PORT}/api/4/cpu" > /dev/null 2>&1; then
        print_success "API is responding correctly!"
    else
        print_warning "API test failed. Container may still be starting."
    fi
    
    echo ""
    echo "  To view logs: docker logs $CONTAINER_NAME"
    echo "  To restart:    docker restart $CONTAINER_NAME"
    echo "  To stop:       docker stop $CONTAINER_NAME"
    echo "  To uninstall: ./uninstall-glances.sh"
    echo ""
    
else
    print_error "Failed to start Glances container!"
    echo ""
    echo "Check logs with: docker logs $CONTAINER_NAME"
    exit 1
fi
