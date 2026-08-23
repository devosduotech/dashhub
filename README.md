# OSDuo DashHub

A unified, modular, self-hosted dashboard platform combining server monitoring, SSH terminal access, calendar, process management, and media aggregation.

## Features

- **Server Monitoring** — Real-time metrics via Glances (CPU, memory, disk, network)
- **SSH Terminal** — Web-based terminal with xterm.js, multi-tab, saved connections
- **Process List** — Monitor server processes via SSH with sortable table
- **Calendar (CalDAV)** — Month view and upcoming events from Nextcloud/CalDAV servers
- **Notes & Reminders** — Personal notes with priority, task reminders with checkboxes
- **Server Uptime** — Monitor endpoint availability with history bar
- **Status Indicators** — Health dots for endpoints with latency display
- **YouTube** — Latest videos from channels via server-side RSS proxy
- **RSS Feeds** — News and article aggregation
- **Quick Links** — Customizable bookmarks with icons
- **Speedtest** — Network speed test (ping, download, upload)
- **Weather** — Current conditions and forecast
- **Clock** — Live-updating time and date
- **Public IP** — Public IP address and location info
- **IFrame** — Embed any web content
- **Glances** — Server monitoring via Glances iframe

## Quick Start

### Docker (recommended)

```bash
mkdir dashhub && cd dashhub
mkdir data
curl -O https://raw.githubusercontent.com/devosduotech/dashhub/v1/docker-compose.yml
docker compose up -d
```

Open http://localhost:48215

### Run the image directly

```bash
docker run -d \
  --name dashhub \
  -p 48215:80 \
  -v "$PWD/data":/app/data \
  --restart unless-stopped \
  ghcr.io/devosduotech/dashhub:latest
```

### Build from source

```bash
git clone https://github.com/devosduotech/dashhub.git
cd dashhub
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Open http://localhost:48216

## Upgrading

```bash
docker compose pull && docker compose up -d
```

## Configuration

All configuration is done through the web UI:

1. Click **Edit Mode** (pencil icon)
2. Add widgets from the palette
3. Configure each widget via its settings
4. Configuration auto-saves to `data/conf.yml`

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Vue.js 3 (Composition API) |
| Build | Vite |
| State | Pinia |
| Terminal | xterm.js |
| SSH Bridge | Node.js + ssh2 + ws |
| Calendar | CalDAV + ical.js |
| Container | Docker + Docker Compose |
| Web Server | nginx + Express |

## Docker Images

| Tag | Description |
|-----|-------------|
| `latest` | Latest stable release |
| `1.0.14` | Current release |
| `dev` | Development build |

Available on [GitHub Container Registry](https://github.com/devosduotech/dashhub/pkgs/container/dashhub):

```bash
docker pull ghcr.io/devosduotech/dashhub:latest
```

## Project Structure

```
dashhub/
├── src/                    # Vue.js frontend
│   ├── components/
│   │   └── widgets/        # Widget components
│   ├── services/           # API client services
│   ├── stores/             # Pinia stores
│   └── types/              # TypeScript types
├── server/
│   └── api/                # Express API server
│       ├── server.js       # Main server
│       ├── sshBridge.js    # WebSocket SSH bridge
│       ├── caldavClient.js # CalDAV proxy
│       └── processClient.js# Process list via SSH
├── config/
│   └── default.yml         # Default configuration
├── scripts/
│   └── install-glances.sh  # Glances agent installer
└── docker-compose.yml      # Production compose
```

## License

MIT License

## References

- [Glances](https://github.com/nicolargo/glances) — Server monitoring
- [Glance](https://github.com/glanceapp/glance) — Feed aggregation reference
- [Tabby](https://github.com/eugeny/tabby) — SSH management reference
