# OSDuo DashHub - Project Structure

This document describes the directory structure and file organization following Docker best practices.

## Directory Structure

```
dashhub/
├── .env.example          # Environment variables template
├── .env                  # Environment variables (gitignored)
├── .dockerignore         # Files excluded from Docker build
├── .github/
│   └── workflows/
│       └── docker.yml    # CI: test gate + multi-arch GHCR image build & publish
├── docker-compose.yml    # End-user compose (pulls released GHCR image)
├── docker-compose.dev.yml# Developer override (builds from source, dashhub-dev:48216)
├── Dockerfile            # Multi-stage Docker build
│
├── config/               # Configuration templates
│   └── default.yml       # Default configuration template
│
├── data/                 # Persistent data (mounted volume, gitignored)
│   ├── conf.yml          # Active configuration (includes credentials)
│   ├── known_hosts.json  # Trusted SSH host fingerprints
│   └── uploads/          # Uploaded icons/images
│
├── docker/               # Docker-specific files
│   ├── entrypoint.sh     # Container startup script
│   └── nginx.conf        # Nginx configuration
│
├── src/                  # Frontend source code
│   ├── components/
│   ├── views/
│   ├── stores/
│   └── ...
│
├── server/               # Backend source code
│   └── api/
│       ├── server.js
│       ├── sshBridge.js
│       ├── youtube.js
│       ├── rss.js
│       └── ...
│
├── tests/                # API tests (Vitest + supertest)
├── dist/                 # Built frontend (gitignored)
└── node_modules/         # Dependencies (gitignored)
```

## File Descriptions

### Configuration Files

| File | Purpose | Editable | Persisted |
|------|---------|----------|-----------|
| `.env` | Environment variables | Yes (before build) | No |
| `.env.example` | Environment template | Yes | Yes |
| `config/default.yml` | Default config template | Yes | Yes |
| `data/conf.yml` | Active configuration | Via UI | Yes |
| `docker-compose.yml` | End-user orchestration (pulls GHCR image) | Yes | Yes |
| `docker-compose.dev.yml` | Developer build-from-source override | Yes | Yes |
| `Dockerfile` | Build instructions | Yes | Yes |

### Data Files

| File | Purpose | Auto-generated | Backup Recommended |
|------|---------|----------------|-------------------|
| `data/conf.yml` | Dashboard configuration (incl. SSH credentials) | On first run | ✅ Yes |
| `data/known_hosts.json` | Trusted SSH host fingerprints | On first SSH accept | ✅ Yes |
| `data/uploads/` | Uploaded icons/images | On upload | ✅ Yes |

## Best Practices Followed

### 1. **Separation of Concerns**
- `config/` - Templates and defaults (read-only in container)
- `data/` - Runtime data (writable, persisted)
- `docker/` - Container-specific configuration

### 2. **Environment Variables**
- Use `.env` file for environment-specific settings
- `.env` is gitignored (add to `.gitignore`)
- `.env.example` is versioned as template
- Variables used in `docker-compose.yml` via `${VAR}`

### 3. **Persistent Volumes**
- `./data:/app/data` - Mounts data directory
- Configuration persists across container recreations
- Credentials live in the persisted `conf.yml` and are sanitized by the API

### 4. **Multi-Stage Build**
- Stage 1: Build frontend (node:24-alpine)
- Stage 2: Build API (node:24-alpine)
- Stage 3: Runtime (node:24-alpine + nginx, non-root `dashhub` user)
- Multi-arch: `linux/amd64` + `linux/arm64` (Buildx + QEMU in CI)

### 5. **Security**
- Non-root runtime user (`dashhub`)
- Credential sanitization: secrets never returned by the API
- No secrets in Dockerfile

### 6. **Logging**
- JSON file driver
- Log rotation: 10MB max, 3 files
- Prevents disk space issues

### 7. **Health Checks**
- HTTP endpoint check
- 30s interval, 10s timeout
- Auto-restart on failure

## Usage

### Initial Setup

#### End user (pre-built image)

```bash
mkdir dashhub && cd dashhub && mkdir data
curl -O https://raw.githubusercontent.com/devosduotech/dashhub/v1/docker-compose.yml
docker compose up -d
open http://localhost:48215
```

#### Developer (build from source)

```bash
git clone https://github.com/devosduotech/dashhub.git
cd dashhub
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
open http://localhost:48216
```

### Backup Configuration

```bash
# Backup data directory
tar -czvf dashhub-backup-$(date +%Y%m%d).tar.gz data/

# Or just configuration
cp data/conf.yml backup-conf.yml
cp data/known_hosts.json backup-known-hosts.json
```

### Restore Configuration

```bash
# Stop container
docker compose down

# Restore data
tar -xzvf dashhub-backup-20260818.tar.gz

# Restart
docker compose up -d
```

### Update Environment

```bash
# Edit .env
nano .env

# Restart container (rebuild not needed for env changes)
docker compose restart
```

### Rebuild After Code Changes

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `API_PORT` | `48231` | Internal API port |
| `TZ` | `UTC` | Timezone |
| `HOST_PORT` | `48215` | Host port mapping (released image container) |
| `HOST_PORT_DEV` | `48216` | Host port mapping (dev container) |

See [distribution.md](../distribution.md) for the release/CI pipeline reference.

## Migration from Old Structure

If you have existing configuration in `user-data/`:

```bash
# Stop container
docker compose down

# Move configuration
mv user-data/conf.yml data/conf.yml

# Update docker-compose.yml (already done)

# Restart
docker compose up -d
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs dashhub

# Check volume permissions
ls -la data/

# Fix permissions if needed
chmod 755 data/
chown 1000:1000 data/conf.yml
```

### Configuration Not Loading

```bash
# Verify file exists
ls -la data/conf.yml

# Check syntax
docker compose exec dashhub cat /app/data/conf.yml

# Reset to default
cp config/default.yml data/conf.yml
docker compose restart
```

### Credentials Lost

```bash
# SSH credentials live inside data/conf.yml
# They are excluded from API responses but stored in the file itself
# If lost, re-enter them in the SSH widget settings and save
# Always backup data/conf.yml!
```
