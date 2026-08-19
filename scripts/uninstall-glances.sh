#!/bin/bash
#===============================================================================
# OSDuo DashHub - Glances Agent Uninstall Script
# 
# This script removes the Glances monitoring agent from a server.
#
# Usage:
#   curl -sL https://raw.githubusercontent.com/osduo/dashhub/main/scripts/uninstall-glances.sh | bash
#===============================================================================

set -e

CONTAINER_NAME="glances"

echo ""
echo "================================================"
echo "  OSDuo DashHub - Glances Uninstall"
echo "================================================"
echo ""

# Check if container exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Stopping Glances container..."
    docker stop $CONTAINER_NAME
    
    echo "Removing Glances container..."
    docker rm $CONTAINER_NAME
    
    echo ""
    echo "Glances has been uninstalled successfully!"
else
    echo "Glances container not found. Nothing to uninstall."
fi

echo ""
echo "Note: Docker and any other installed dependencies remain installed."
echo "To remove Docker completely, run: sudo apt-get remove docker docker-engine docker.io docker-ce"
echo ""
