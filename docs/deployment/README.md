# DashHub — Installation & Deployment Guide

Deploy DashHub on your own infrastructure with Docker. Everything persists in one `data/` directory on the host.

## Requirements

- Docker Engine 24+ (Docker Compose v2 for the compose path)
- A local machine or trusted private-LAN host

> **Deployment boundary:** DashHub v1.x is designed for **local and trusted private-LAN** use. It has no authentication yet — do not expose it directly to the public internet. See [SECURITY.md](../project/SECURITY.md) for the Phase 1 boundary and the Phase 2 hardening plan.

## Option A — Docker Compose (recommended)

```bash
mkdir dashhub && cd dashhub
mkdir data
curl -O https://raw.githubusercontent.com/devosduotech/dashhub/v1.0.18/docker-compose.yml
docker compose up -d
```

Open `http://localhost:48215`.

The shipped compose file includes production hardening: read-only root filesystem, dropped capabilities (with a minimal bootstrap set), `no-new-privileges`, tmpfs for writable paths, and log rotation. **Use the compose file from the release tag you deploy** — older copies predate the current startup requirements.

## Option B — Docker run

```bash
docker run -d \
  --name dashhub \
  -p 48215:80 \
  -v "$PWD/data":/app/data \
  --restart unless-stopped \
  ghcr.io/devosduotech/dashhub:1.0.18
```

> This plain run skips the compose hardening (read-only rootfs, cap drops). Prefer Option A where possible.

## Option C — Build from source

```bash
git clone https://github.com/devosduotech/dashhub.git
cd dashhub
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

The dev override builds locally and serves on port **48216** so it can run beside a released install.

## Images

Published to GHCR: `ghcr.io/devosduotech/dashhub`

| Tag | Meaning |
|-----|---------|
| `1.0.18` | Pinned release (matches git tag `v1.0.18`) |
| `latest` | Newest stable release |
| `dev` | Development builds |

## Configuration

All deployment knobs live in `.env` next to the compose file (see `.env.example`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `HOST_PORT` | `48215` | Published web port |
| `TZ` | `UTC` | Container timezone |
| `API_PORT` | `48231` | Internal API port (rarely changed) |
| `GITHUB_TOKEN` | *(empty)* | Optional GitHub PAT for higher Latest Versions rate limits |

## Persistent data

Everything user-created lives in the mounted `data/` directory:

```text
data/
├── conf.yml               # pages, layout, widget config, credentials
├── known_hosts.json       # pinned SSH host keys
├── uptime-history.json    # uptime check history
└── uploads/               # uploaded logos and images
```

Back it up — see [Backup & Restore](backup-restore.md).

## Deployment boundary

| Environment | Supported |
|-------------|-----------|
| Local machine (`127.0.0.1`) | ✅ |
| Trusted private LAN | ✅ |
| Public internet / shared multi-user | ❌ Phase 2 (authentication, RBAC, encrypted credential vault) |

## Health & logs

```bash
docker compose ps                 # expect "Up (healthy)"
docker compose logs -f dashhub    # follow logs
```

The image ships a healthcheck probing the API through nginx; `healthy` means the full stack is serving.
