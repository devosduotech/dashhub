#!/bin/sh
set -e

# OSDuo DashHub Entrypoint Script
# Handles initialization and starts nginx + API

echo "Starting OSDuo DashHub..."

# Ensure data directory exists and is writable by the unprivileged runtime user
mkdir -p /app/data
chown -R dashhub:dashhub /app/data

# Initialize configuration if not present
if [ ! -f /app/data/conf.yml ]; then
    echo "No configuration found. Copying default configuration..."
    cp /app/config/default.yml /app/data/conf.yml
    chown dashhub:dashhub /app/data/conf.yml
    echo "Configuration initialized at /app/data/conf.yml"
    echo "Please customize and restart the container."
fi

# Set environment variables
export NODE_ENV=${NODE_ENV:-production}
export API_PORT=${API_PORT:-48231}
export TZ=${TZ:-UTC}

# Set timezone
if [ -n "$TZ" ]; then
    echo "Setting timezone to $TZ..."
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime
    echo $TZ > /etc/timezone
fi

# Start the Node.js API first (as the unprivileged dashhub user) so it is
# listening before nginx starts serving traffic - avoids a 502 window on
# container start where the page loads but /api/* requests are refused.
echo "Starting API server on port $API_PORT as user dashhub..."
cd /app/server/api
su-exec dashhub node server.js &
API_PID=$!

# Give the API a moment to bind to its port
sleep 1

# Start nginx (master process requires root for port 80)
echo "Starting nginx..."
nginx -g 'daemon off;' &
NGINX_PID=$!

# Forward termination signals to both processes
trap 'kill $API_PID $NGINX_PID 2>/dev/null' TERM INT

wait