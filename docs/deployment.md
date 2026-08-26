# OSDuo DashHub - Deployment Guide

## Architecture Overview

OSDuo DashHub uses a **single-container architecture**:

```
┌─────────────────────────────────────┐
│         dashhub container           │
│  ┌─────────────┐  ┌───────────────┐ │
│  │   Nginx     │  │  Node.js API  │ │
│  │  (static)   │  │  - Express    │ │
│  │  port 80    │  │  - SSH bridge │ │
│  │             │  │  - Config mgr │ │
│  │             │  │  - Uploads    │ │
│  │             │  │  - YouTube/RSS│ │
│  └─────────────┘  └───────────────┘ │
│         │                  │         │
│         └────────┬─────────┘         │
│                  │                   │
│         ┌────────▼────────┐         │
│         │    data vol     │         │
│         │  - conf.yml     │         │
│         │  - known_hosts  │         │
│         │  - uploads/     │         │
│         └─────────────────┘         │
└─────────────────────────────────────┘
           │
           ▼
   External Services:
   - Glances agents (:61208)
   - SSH servers (:22)
   - YouTube RSS / RSS feeds
```

**Benefits:**
- Simpler deployment (1 service vs 2)
- Single port to expose (48215)
- Direct access to configuration via config API
- No inter-container communication overhead

**Note:** The SSH terminal uses a native Node.js bridge (`ssh2` library) integrated into the main container. No separate GoTTY container is required.

## Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 1 core | 2+ cores |
| RAM | 512 MB | 1 GB |
| Disk | 1 GB | 5 GB |
| Docker | 20.10+ | Latest |
| Docker Compose | 2.0+ | Latest |

### Browser Requirements

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

## Installation Methods

> DashHub ships as a pre-built Docker image on GHCR (`ghcr.io/devosduotech/dashhub`).
> No Node.js/npm/source code is required. See [distribution.md](./distribution.md)
> for the full release/CI reference.

### Method 1: Docker Compose (Recommended)

Uses the pinned release image — pulls automatically, no build.

```bash
mkdir dashhub && cd dashhub
mkdir data
curl -O https://raw.githubusercontent.com/devosduotech/dashhub/v1/docker-compose.yml
docker compose up -d
```

Open http://localhost:48215

Upgrade with `docker compose pull && docker compose up -d`.

### Method 2: Manual Docker

```bash
mkdir -p ~/dashhub/data

# Run container from the published image
docker run -d \
  --name dashhub \
  --restart unless-stopped \
  -p 48215:80 \
  -e CONFIG_DIR=/app/data \
  -v ~/dashhub/data:/app/data \
  ghcr.io/devosduotech/dashhub:1.0.1
```

### Method 3: Build from Source (developers)

```bash
git clone https://github.com/devosduotech/dashhub.git
cd dashhub
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Runs as `dashhub-dev` on port 48216 (parallel with a released container on 48215).

## Post-Installation

### Verify Installation

1. **Check containers are running:**
   ```bash
   docker ps | grep dashhub
   ```

2. **Access dashboard:**
   Open http://localhost:48215 in your browser

3. **Test API:**
   ```bash
   curl http://localhost:48215/api/config
   ```

4. **Check logs:**
   ```bash
   docker logs dashhub
   ```

### Initial Configuration

1. **Enter Edit Mode:** Click the pencil icon in the toolbar
2. **Add Widgets:** Select widgets from the palette on the left
3. **Configure Widgets:** Click the gear icon on each widget
4. **Save:** Click Save in the modal, then exit edit mode

### Install Glances on Remote Servers

See [Installing Glances](#installing-glances-on-servers) section below.

## Installing Glances on Servers

Run this on each server you want to monitor:

### Using Installation Script (Recommended)

```bash
curl -sL https://raw.githubusercontent.com/devosduotech/dashhub/v1/scripts/install-glances.sh | bash
```

### Manual Installation

```bash
# Using Docker
docker run -d \
  --name glances \
  --restart unless-stopped \
  -p 61208:61208 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  nicolargo/glances:latest-full

# Using Docker Compose
cat > docker-compose.glances.yml << 'EOF'
services:
  glances:
    image: nicolargo/glances:latest-full
    container_name: glances
    network_mode: host
    pid: host
    ports:
      - "61208:61208"
    environment:
      - GLANCES_OPT="-w"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    restart: unless-stopped
EOF

docker compose -f docker-compose.glances.yml up -d
```

## Configuration

### Basic Configuration

Edit `data/conf.yml`:

```yaml
appConfig:
  title: "My Dashboard"
  theme: dark-navy
```

### Adding Servers

```yaml
pages:
  - name: "Servers"
    items:
      - type: glances
        title: "Web Server"
        config:
          url: "http://192.168.1.10:61208"
          displayMode: embedded
          height: 400
```

### Adding SSH Connections

```yaml
pages:
  - name: "Terminal"
    items:
      - type: ssh
        title: "SSH Connections"
        config:
          connections:
            - name: "Web Server"
              host: "192.168.1.10"
              port: 22
              username: "admin"
              authType: "key"
```

## Reverse Proxy Configuration

### Nginx

```nginx
server {
    listen 80;
    server_name dash.example.com;

    location / {
        proxy_pass http://localhost:48215;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket support for the SSH terminal (/api/ssh)
    location /api/ssh {
        proxy_pass http://localhost:48215;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

### Traefik

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.dashhub.rule=Host(`dash.example.com`)"
  - "traefik.http.routers.dashhub.entrypoints=websecure"
  - "traefik.http.routers.dashhub.tls=true"
```

## SSL/TLS Configuration

### Using Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d dash.example.com
```

## Managing Containers

### View Logs
```bash
# Dashboard
docker logs dashhub

# All services
docker compose logs -f
```

### Restart Services
```bash
docker compose restart
```

### Update Containers
```bash
docker compose pull
docker compose up -d
```

### Stop Services
```bash
docker compose down
```

## Troubleshooting

### Dashboard Not Loading

1. Check container status: `docker ps`
2. Check logs: `docker logs dashhub`
3. Verify port: `curl http://localhost:48215`

### Server Stats Not Showing

1. Verify Glances is running: `docker logs glances`
2. Test API: `curl http://server:61208/api/4/cpu`
3. Check firewall: `sudo ufw status`

### SSH Connection Fails

1. Verify credentials: `docker logs dashhub`
2. Check SSH key permissions: `ls -la ~/.ssh/`
3. Test SSH: `ssh -i ~/.ssh/id_rsa user@host`

## Backup

### Backup Configuration
```bash
# Create backup directory
mkdir -p ~/dashhub-backup

# Backup data directory
cp -r ~/dashhub/data ~/dashhub-backup/

# Create archive
tar -czvf dashhub-backup-$(date +%Y%m%d).tar.gz ~/dashhub-backup/
```

### Restore Configuration
```bash
# Stop services
docker compose down

# Restore data directory
cp -r backup/data ~/dashhub/

# Start services
docker compose up -d
```

## Uninstalling

### Remove Dashboard
```bash
docker compose down
docker rmi ghcr.io/devosduotech/dashhub:1.0.1
rm -rf ~/dashhub
```

### Remove Glances
```bash
docker stop glances
docker rm glances
```

## Next Steps

- [Distribution & Release Pipeline](./distribution.md)
- [Configuration Guide](./configuration.md)
- [Widget Documentation](./widgets.md)
- [Project Report](./project/OSDuo-DashHub-Project-Report.md)
