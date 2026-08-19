# OSDuo DashHub

A unified, modular, self-hosted dashboard platform combining server monitoring, SSH terminal access, and media aggregation.

## Project Status

| Item | Status |
|------|--------|
| Specification | ✅ Complete |
| Implementation | ✅ Complete |
| Documentation | ✅ Complete |

## Quick Links

- [Project Report](./docs/project/OSDuo-DashHub-Project-Report.md) - Full technical specification
- [Configuration Template](./config/default.yml) - Example configuration
- [Glances Installation](./scripts/install-glances.sh) - Server agent setup script

## Overview

OSDuo DashHub provides:

- **Server Monitoring** - Real-time metrics via Glances agents (CPU, memory, disk, network, processes)
- **SSH Terminal** - Web-based terminal with xterm.js, saved connections, password/key auth
- **YouTube Aggregation** - Latest videos from channels
- **RSS Feeds** - News and article aggregation
- **Quick Links** - Customizable bookmarks
- **Full UI Configuration** - Configure everything from the web interface
- **Multi-Page Support** - Organize widgets into logical pages
- **Themes** - Dark Navy, Dark, Light, or Auto (follows OS preference)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     OSDuo DashHub                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │   Pages         │    │   Widgets       │                 │
│  │                 │    │                 │                 │
│  │ • Dashboard     │    │ • QuickLinks    │                 │
│  │ • Production    │    │ • Glances       │                 │
│  │ • Development   │    │ • SSH Terminal  │                 │
│  │ • Infrastructure│    │ • YouTube       │                 │
│  │ • Media & Feeds │    │ • RSS Feed      │                 │
│  │                 │    │ • IFrame        │                 │
│  └─────────────────┘    └─────────────────┘                 │
│                                                              │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │   Settings      │    │   API Bridge    │                 │
│  │                 │    │                 │                 │
│  │ • Theme         │    │ • /api/config   │                 │
│  │ • Config        │    │ • /api/ssh      │                 │
│  │ • Credentials   │    │ • /api/youtube/ │                 │
│  │                 │    │ • /api/rss/     │                 │
│  └─────────────────┘    └─────────────────┘                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Vue.js 3 (Composition API) |
| Build | Vite |
| State | Pinia |
| Terminal | xterm.js |
| SSH Bridge | Node.js + ssh2 + ws (native, no GoTTY) |
| Monitoring | Glances REST API |
| Container | Docker + Docker Compose |
| Web Server | nginx (static) + Express (API) |

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Glances on each monitored server (optional)

### Quick Start (Docker - recommended)

No Node.js, npm, or source code required. The published image is pulled from the GitHub Container Registry.

```bash
mkdir dashhub && cd dashhub
mkdir data
curl -O https://raw.githubusercontent.com/devosduotech/dashhub/v1/docker-compose.yml
docker compose up -d
```

Open http://localhost:48215

The container stores its persistent configuration in `./data/` (`conf.yml`, `known_hosts.json`). To upgrade:

```bash
docker compose pull && docker compose up -d
```

### Alternative: run the image directly

```bash
docker run -d \
  --name dashhub \
  -p 48215:80 \
  -v "$PWD/data":/app/data \
  --restart unless-stopped \
  ghcr.io/devosduotech/dashhub:1.0.1
```

### Option 3: build from source (developers/contributors)

```bash
git clone https://github.com/devosduotech/dashhub.git
cd dashhub
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Open http://localhost:48215

### Configuration via UI

- Click "Edit Mode" (pencil icon)
- Add widgets from palette
- Configure each widget via settings
- Save configuration (auto-saves to data/conf.yml)

See [Deployment Guide](./docs/deployment.md) for detailed setup instructions.

## Features

### Multi-Page Dashboard
Organize widgets into logical pages:
- Dashboard (overview)
- Production Servers (per-customer)
- Development Environment
- Infrastructure
- Media & Feeds

### Server Monitoring (Glances Widget)
- Embedded Glances web interface (iframe)
- Configurable display modes (embedded/full-window)
- Custom refresh intervals
- Open in new tab

### SSH Terminal Widget
- Saved connections with groups
- One-click connect
- Password & private key & agent authentication
- Host-key verification with fingerprint confirmation
- Full xterm.js terminal emulation
- Configurable font size and theme

### Media Aggregation
- YouTube widget: live video thumbnails per channel via a server-side RSS proxy (no API key required), grid/list layout, size and cache settings
- RSS widget: live feed items with thumbnails (RSS 2.0 + Atom), item count, thumbnail toggle, cache settings
- Server-side feed caching with configurable TTL

### Quick Links
- Custom bookmarks
- Grouped links
- SVG icons or uploaded images
- External/internal URLs

## Documentation

- [Project Report](./docs/project/OSDuo-DashHub-Project-Report.md) - Full technical specification
- [Configuration Guide](./docs/configuration.md) - Configuration reference
- [Widget Documentation](./docs/widgets.md) - Widget-specific guides
- [Deployment Guide](./docs/deployment.md) - Installation and setup
- [Docs README](./docs/README.md) - Documentation overview
- [Changelog](./docs/project/CHANGELOG.md) - Version history
- [Status / Feature Matrix](./docs/project/STATUS.md) - What is implemented vs. planned

## License

MIT License

## References

- [Dashy](https://github.com/Lissy93/dashy) - Feature reference (not forked)
- [Glances](https://github.com/nicolargo/glances) - Server monitoring
- [Glance](https://github.com/glanceapp/glance) - Feed aggregation reference
- [Termix](https://github.com/Termix-SSH/Termix) - SSH terminal reference
- [Tabby](https://github.com/eugeny/tabby) - SSH management reference
