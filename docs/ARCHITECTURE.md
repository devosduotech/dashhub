# OSDuo DashHub Architecture

## Overview

OSDuo DashHub uses a **single-container architecture** that combines:
- **Nginx**: Serves static frontend files
- **Node.js Express API**: Configuration management, uploads, YouTube/RSS feed fetching
- **SSH Bridge**: Native WebSocket-based SSH terminal using `ssh2` library

## Container Structure

```
┌─────────────────────────────────────────────┐
│            dashhub container                │
│  ┌─────────────────┐  ┌─────────────────┐  │
│  │     Nginx       │  │   Node.js API   │  │
│  │   (port 80)     │◄─┤   (port 48231)  │  │
│  │                 │  │                 │  │
│  │  - dist/        │  │  - Express      │  │
│  │  - index.html   │  │  - configManager│  │
│  │                 │  │  - sshBridge    │  │
│  │                 │  │  - uploadsManager│ │
│  │                 │  │  - youtube      │  │
│  │                 │  │  - rss          │  │
│  └─────────────────┘  └─────────────────┘  │
│           │                    │            │
│           └──────────┬─────────┘            │
│                      │                      │
│           ┌──────────▼──────────┐          │
│           │     /app/data       │          │
│           │   - conf.yml        │          │
│           │   - known_hosts.json│          │
│           │   - uploads/        │          │
│           └─────────────────────┘          │
└─────────────────────────────────────────────┘
```

## Communication Flow

### Frontend → Backend
```
Browser (Vue.js) 
    ↓ HTTP/HTTPS (port 48215)
Nginx (static files + reverse proxy)
    ↓ proxies /api/* to
Node.js Express API (internal port 48231)
```

### SSH Terminal
```
Browser (xterm.js)
    ↓ WebSocket (ws://host:48215/api/ssh)
Node.js SSH Bridge (ssh2 library)
    ↓ SSH protocol (port 22)
Remote SSH Server
```

### Glances Monitoring
```
Browser (iframe)
    ↓ HTTP
Glances Web UI / Agent (:61208)
```
The Glances widget embeds the agent's web interface directly in an iframe; there is no API proxy.

### External Feeds
```
Node.js API
    ↓ HTTPS
YouTube channel RSS feed
RSS/Atom feed URLs
```

## Technology Decisions

### Why Native SSH Bridge Instead of GoTTY?

**Original Plan:** Use GoTTY as a separate container

**Actual Implementation:** Native Node.js SSH bridge using `ssh2` library

**Reasons for Change:**

| Aspect | GoTTY (Planned) | ssh2 Native (Actual) |
|--------|-----------------|---------------------|
| Containers | 2 (dashhub + gotty) | **1 (dashhub only)** |
| Ports | 2 (48215 + 48216) | **1 (48215)** |
| Credential Access | Shared volume required | **Direct API access** |
| Complexity | Higher (IPC between containers) | **Lower (integrated)** |
| Maintenance | 2 images to update | **1 image** |
| Connection Config | File-based sync | **Live from config API** |

### Benefits of Single-Container Design

1. **Simpler Deployment**: One service to manage
2. **Single Port**: Only port 48215 needs to be exposed
3. **Direct Config Access**: SSH bridge reads connection config from the config API
4. **No IPC Overhead**: No inter-container communication needed
5. **Easier Updates**: Single image to rebuild and deploy

## Network Configuration

### Docker Network
- **Name**: `dashhub-network`
- **Type**: Bridge
- **Services**: dashhub (single service)

### Port Mapping
| Container Port | Host Port | Service |
|----------------|-----------|---------|
| 80 (Nginx) | 48215 | Web UI + API (released image container) |
| 80 (Nginx) | 48216 | Web UI + API (dev build, `dashhub-dev`) |
| 48231 (internal) | - | Node.js API (internal only) |

> The app is distributed as a multi-arch GHCR image built by CI. See
> [distribution.md](./distribution.md) for the pipeline and Compose-file layout.

### External Connections (Outbound)
| Destination | Port | Purpose |
|-------------|------|---------|
| Glances agents | 61208 | Server monitoring (iframe embed) |
| SSH servers | 22 | Terminal access |
| YouTube RSS | 443 | Video aggregation |
| RSS feeds | 80/443 | News aggregation |

## Security Considerations

### Credential Storage
- Passwords and private keys are stored in the plaintext config file (`data/conf.yml`).
- The API never returns secrets: `GET /api/config` sanitizes them and exposes only a `hasCredential` flag; the frontend edits them via write-only fields.
- **Planned (Phase 2)**: AES-256-CBC + PBKDF2 encryption of credentials at rest.

### Network Isolation
- Container runs on isolated Docker network
- Only port 48215 exposed to host
- Internal API (48231) not accessible from outside

### HTTPS/TLS
- Container uses HTTP internally
- TLS termination should be handled by:
  - Reverse proxy (nginx, Traefik) in front of container
  - Or Let's Encrypt certificate via reverse proxy

## Scaling Considerations

### Current Design
- Single-instance, stateless API
- Configuration stored in shared volume
- No horizontal scaling support

### Future Enhancements
- Database-backed configuration (PostgreSQL/MySQL)
- Redis for session management
- Load balancer for multiple instances
- WebSocket sticky sessions for SSH terminals

## Monitoring & Logging

### Container Health Check
```yaml
healthcheck:
  test: ["CMD", "wget", "--spider", "-q", "http://127.0.0.1/api/config"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

### Logs
- **Frontend errors**: Browser console
- **API errors**: `docker logs dashhub`
- **SSH connections**: Logged to stdout with connection metadata

## File Volumes

| Volume | Container Path | Purpose |
|--------|----------------|---------|
| `./data` | `/app/data` | Configuration, known hosts, uploads |

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `NODE_ENV` | `production` | Node.js environment |
| `API_PORT` | `48231` | Internal API port |
| `TZ` | `UTC` | Timezone for logs |
