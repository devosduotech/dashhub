# ==============================================================================
# OSDuo DashHub - Multi-Stage Dockerfile
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build the Vue frontend
# ------------------------------------------------------------------------------
FROM node:24-alpine AS frontend-builder

WORKDIR /build
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json tsconfig.node.json vite.config.ts index.html ./
COPY src/ ./src/
COPY public/ ./public/
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Build the API
# ------------------------------------------------------------------------------
FROM node:24-alpine AS api-builder

WORKDIR /api-build
COPY server/api/package.json server/api/package-lock.json* ./
RUN npm ci --omit=dev

# ------------------------------------------------------------------------------
# Stage 3: Runtime (Nginx + Node API)
# ------------------------------------------------------------------------------
FROM node:24-alpine AS runtime

# Install nginx and su-exec (to drop privileges for the Node process)
RUN apk add --no-cache nginx su-exec

# Create app directories and an unprivileged runtime user
RUN mkdir -p /app/data /app/config \
    && addgroup -S dashhub \
    && adduser -S -G dashhub dashhub

# Nginx configuration (complete main config; replaces distro default)
COPY docker/nginx.conf /etc/nginx/nginx.conf
RUN rm -f /etc/nginx/http.d/default.conf \
    && mkdir -p /var/lib/nginx/logs \
    && ln -sf /dev/stderr /var/lib/nginx/logs/error.log

# Copy built frontend
COPY --from=frontend-builder /build/dist /usr/share/nginx/html

# Copy API server
WORKDIR /app/server/api
COPY --from=api-builder /api-build/node_modules ./node_modules
COPY server/api/ ./

# Copy configuration template
COPY config/default.yml /app/config/default.yml

# Copy entrypoint script
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port
EXPOSE 80

# Health check (checks the API so readiness reflects the full stack, not just nginx)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --spider -q http://127.0.0.1/api/config || exit 1

# Start application
CMD ["/entrypoint.sh"]