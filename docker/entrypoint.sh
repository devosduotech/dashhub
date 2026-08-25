#!/bin/sh
set -e

# OSDuo DashHub Entrypoint Script
# Handles initialization and starts nginx + API

echo "Starting OSDuo DashHub..."

# Ensure data directory exists and is writable by the unprivileged runtime
# user. chown can fail legitimately (CAP_CHOWN dropped, read-only mount);
# never let that kill the container.
mkdir -p /app/data 2>/dev/null || true
if ! chown -R dashhub:dashhub /app/data 2>/dev/null; then
    echo "[entrypoint] WARNING: could not chown /app/data (restricted capabilities or read-only volume)."
    echo "[entrypoint] Assuming existing ownership is correct. If the app hits permission"
    echo "[entrypoint] errors, fix ownership on the host, e.g.:"
    echo "[entrypoint]   sudo chown -R $(id -u dashhub):$(id -g dashhub) <host-data-dir>"
fi

# Initialize configuration if not present
if [ ! -f /app/data/conf.yml ] && [ -w /app/data ]; then
    echo "No configuration found. Copying default configuration..."
    cp /app/config/default.yml /app/data/conf.yml
    chown dashhub:dashhub /app/data/conf.yml 2>/dev/null || true
    echo "Configuration initialized at /app/data/conf.yml"
    echo "Please customize and restart the container."
fi

# Set environment variables
export NODE_ENV=${NODE_ENV:-production}
export API_PORT=${API_PORT:-48231}
export TZ=${TZ:-UTC}

# Set timezone (skip silently when /etc is read-only, e.g. read_only: true)
if [ -n "$TZ" ]; then
    if ln -snf "/usr/share/zoneinfo/$TZ" /etc/localtime 2>/dev/null && echo "$TZ" > /etc/timezone 2>/dev/null; then
        echo "Setting timezone to $TZ..."
    else
        echo "Skipping TZ setup: /etc is read-only (using image default)"
    fi
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