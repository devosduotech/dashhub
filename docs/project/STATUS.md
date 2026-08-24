# OSDuo DashHub — Implementation Status

> **Purpose:** Track exactly what is implemented, partially implemented, or planned.
> This document is the source of truth for reconciling the Project Report against the codebase.
>
> Last updated: 2026-08-24 | Version: **1.0.18**

## Legend

- **Implemented** — Working in the current release and verified.
- **Partial** — UI/API exists but functionality is incomplete or backed by a placeholder.
- **Planned** — Specified but not implemented (Phase 2/3/4).

---

## Feature Status

| Feature | Status | Notes |
| --- | --- | --- |
| Multi-page dashboard | Implemented | Pages, icons, renaming, reordering (drag-and-drop), deletion |
| Named routes | Implemented | Clean URLs (`/home`, `/infrastructure`) via HTML5 history |
| Column-based layout | Implemented | 1–6 columns per page, configurable |
| Widget drag & drop | Implemented | Drag between and within columns; drop zones |
| Move widget to page | Implemented | Edit-mode "Move to" button; dropdown lists other pages; auto-switches after move |
| Page reordering | Implemented | Drag-and-drop reorder page tabs in edit mode; visual drop indicator |
| Quick Links widget | Implemented | Grid/list/bar modes, categories, targets, emoji or uploaded image icons, drag-and-drop reorder |
| IFrame widget | Implemented | URL, height, full-width, refresh interval |
| Glances widget | Implemented | IFrame embed of Glances web UI |
| SSH terminal | Implemented | xterm.js + ssh2; password/key/agent auth; resize; host-key verification |
| SSH multi-tab | Implemented | Tab UI with + button in modal; close/rename tabs |
| SSH host-key verification | Implemented | First-connect fingerprint prompt, persisted `known_hosts.json` |
| SSH open in new tab | Implemented | External-link button opens connection in browser tab |
| SSH full-page terminal | Implemented | `/ssh/:connectionId` route with standalone terminal |
| SSH auto-accept | Implemented | Host key auto-acceptance for terminal sessions |
| YouTube widget | Implemented | Shows configured channels + live video thumbnails (RSS proxy, no API key), grid/list, size, cache |
| RSS widget | Implemented | Live feed items with thumbnails (RSS 2.0 + Atom via server proxy), item count, thumbnail toggle, cache |
| Clock widget | Implemented | Live-updating time and date display with timezone selection, format options, hide seconds/date toggles |
| Public IP widget | Implemented | Displays public IP address and location info with refresh; server-side proxy mode |
| GitHub Trending widget | Implemented | Shows trending repositories from GitHub sorted by stars; configurable time period, language filter |
| Notes widget | Implemented | Personal text notes with priority, quick-add, sort by date or priority, delete on hover |
| Reminders widget | Implemented | Task reminders with checkboxes, completion tracking, priority badges, strikethrough for completed items |
| Status Indicators widget | Implemented | Monitor endpoints with color-coded health dots, category grouping, latency display, auto-refresh |
| Speedtest widget | Implemented | Network speed test (ping, jitter, download, upload), live SVG gauge, parallel streams, peak throughput |
| Weather widget | Implemented | Current conditions, 5-day forecast, location search via Open-Meteo, selectable units, auto-refresh |
| Server Uptime widget | Implemented | Monitor multiple endpoints, visual 1h/7-day uptime bar, history modal with check log |
| Calendar widget | Implemented | Month view and upcoming events via CalDAV; create/delete events, day-click panel, rolling 30-day upcoming window |
| System Info widget | Implemented | CPU, RAM, Disk, Network monitoring via SSH with regex-based section extraction |
| Process List widget | Implemented | Monitor server processes through SSH with sortable tables, summary cards, top-3 highlighting, mini usage bars |
| Service Status widget | Implemented | Monitor systemd services through SSH with live status dots |
| System Logs widget | Implemented | View journalctl logs through SSH with service/priority filtering |
| Database Monitor widget | Implemented | MySQL/MariaDB stats via SSH with auto-detect credentials (Frappe, WordPress, Laravel) |
| Docker Compose monitor | Implemented | Service status with inline start/stop/restart controls |
| Latest Versions widget | Implemented | Track package versions from npm, GitHub, and PyPI; expanding list view |
| App settings | Implemented | Title, theme (dark/light/auto), font size, logo upload/library, footer text |
| Runtime theming | Implemented | `data-theme` CSS variables; auto follows OS preference; 14px base font for all themes |
| Media library | Implemented | Uploaded icons/images stored in `data/uploads/`, referenced by path, reusable via MediaPicker |
| Icon system | Implemented | Reusable SVG `AppIcon` (typed registry, no deps); `AppLogo` mark/wordmark |
| Empty states | Implemented | Reusable `AppEmptyState` with brand mark and CTA |
| Edit-mode indication | Implemented | Editing badge, tinted toolbar, subtle background shift |
| Drag & drop targets | Implemented | Visible drop zones + highlighted destination column while dragging |
| Page settings | Implemented | Name, icon, column count via modal |
| Edit mode | Implemented | Palette, settings, remove, drag & drop |
| Config persistence | Implemented | Atomic write (tmp + rename), auto-generated IDs |
| Config API validation | Implemented | Structural validation, limits, duplicate-ID detection |
| Credential sanitization (API) | Implemented | Secrets never returned by `GET /api/config`; `hasCredential` flag; `WIDGET_SECRET_FIELDS` registry |
| Credential persistence (CalDAV) | Implemented | Server-side credential resolution by widget ID via `getWidgetConfig()` |
| GitHub Releases proxy | Implemented | Server-side GitHub API proxy with 24h in-memory cache |
| Client-side version cache | Implemented | localStorage 24h TTL cache with manual refresh bypass |
| Version sync script | Implemented | `scripts/sync-version.sh` syncs version across package.json, README, docker-compose |
| CI/CD pipeline | Implemented | Gate (typecheck, lint, test, build) → buildx multi-arch → smoke test → GHCR push |
| Docker Compose dev override | Implemented | `docker-compose.dev.yml` builds from source, runs on port 48216 |

---

## Deployment Boundary

> **DashHub v1.0.18 — Local-First Release.** Intended for a single user on a
> local machine or a trusted private LAN. It is **not** ready for public Internet exposure
> or shared multi-user hosting until Phase 2 (authentication, RBAC, encrypted credential
> vault, CSRF/CORS hardening, audit logging). See [SECURITY.md](./SECURITY.md).

| Deployment | Supported | Notes |
| --- | --- | --- |
| Local machine (`127.0.0.1`) | ✅ | Fully supported |
| Trusted private LAN (`192.168.x.x`) | ✅ | Fully supported |
| Public Internet / VPN | ❌ Phase 2 | No authentication; plaintext credential file |
| Shared multi-user hosting | ❌ Phase 2 | No RBAC or per-user isolation |

---

## Backend API Status

| Endpoint | Status | Notes |
| --- | --- | --- |
| `GET /api/config` | Implemented | Returns sanitized config (no secrets) |
| `PUT /api/config` | Implemented | Validates, preserves stored credentials, atomic write |
| `POST /api/config/validate` | Implemented | Structural validation |
| `GET /api/uploads` | Implemented | Lists uploaded images |
| `POST /api/uploads` | Implemented | Stores an image (magic-byte validated, 2 MB max) |
| `DELETE /api/uploads/:name` | Implemented | Deletes an uploaded image |
| `GET /uploads/*` | Implemented | Serves stored images |
| `GET /api/youtube/feed` | Implemented | RSS proxy returning latest channel videos with server-side TTL cache |
| `GET /api/rss/feed` | Implemented | RSS 2.0 / Atom proxy returning parsed items with server-side TTL cache |
| `WS /api/ssh` | Implemented | Interactive terminal with host-key verification |
| `POST /api/caldav/discover` | Implemented | Discover CalDAV calendars from server |
| `POST /api/caldav/events` | Implemented | Fetch CalDAV events with date range filtering |
| `POST /api/caldav/create-event` | Implemented | Create CalDAV event; server-side credential resolution by widget ID |
| `POST /api/caldav/delete-event` | Implemented | Delete CalDAV event; server-side credential resolution by widget ID |
| `GET /api/system-info` | Implemented | System information via SSH (CPU, RAM, Disk, Network) |
| `POST /api/service-status` | Implemented | systemd service status via SSH |
| `POST /api/system-logs` | Implemented | journalctl logs via SSH |
| `GET /api/processes` | Implemented | Process list via SSH |
| `POST /api/power` | Implemented | Power/shutdown/restart commands |
| `POST /api/database/stats` | Implemented | Database statistics via SSH |
| `POST /api/mongodb/demo` | Implemented | MongoDB demo data seeder |
| `GET /api/config/backups` | Implemented | List config backups |
| `GET /api/github/releases` | Implemented | GitHub releases proxy with 24h cache |
| `/api/feeds` / `/api/youtube` (full aggregation) / `/api/credentials/*` | Planned | Specified in Project Report, not implemented |

---

## Deployment / Runtime Status

| Area | Status | Notes |
| --- | --- | --- |
| Single container (nginx + Node API) | Implemented | No external dependencies |
| Non-root runtime | Implemented | Node runs as `dashhub` user via `su-exec` |
| Node.js runtime | Implemented | Node 24 LTS (alpine) |
| Reproducible installs | Implemented | `npm ci` with committed lockfiles |
| Health check | Implemented | nginx endpoint via wget |
| Automated tests | Implemented | Vitest + supertest suite (`npm test`, 59 tests) |
| Lint / typecheck | Implemented | `npm run lint`, `npm run typecheck` |
| CI/CD pipeline | Implemented | GitHub Actions: gate → buildx multi-arch → smoke test → GHCR push |
| Multi-arch images | Implemented | linux/amd64 + linux/arm64 via buildx |
| Docker image registry | Implemented | `ghcr.io/devosduotech/dashhub` with versioned + latest tags |

---

## Phase 2 Roadmap

### Security
- Credential encryption at rest (AES-256 + PBKDF2 vault)
- Authentication (session / OIDC)
- Role-based access control (Admin/Operator/Viewer)
- CSRF protection
- Restricted CORS
- Audit logging
- Rate limiting
- API tokens

### Features
- Export/Import/Reset configuration
- Auto-save option
- Undo/redo support
- SSH jump host / bastion support
- IFrame sandbox restrictions + load timeout
- Move `ssh2` from `devDependencies` to `dependencies`

### New Widgets
- Disk Usage (mount points, alert thresholds)
- Network Interfaces (IP, traffic, status)
- Cron Job Monitor (list crons, last/next run)
- Markdown Notes (rich editor, code blocks, checklists)
- Port Scanner (quick host port check)

## Phase 3 Roadmap

### Widgets
- Docker Stats (live container CPU/RAM/network)
- SSL Certificate Monitor (expiry tracking)
- HTTP Health Check (uptime %, response time)
- News Feed (HN/Lobsters/r/selfhosted)
- Quick Links+ (visual grid, favicon, categories)

### Enhancements
- YouTube view count display
- Quick Links status indicator (optional ping check)
- RSS mark as read + search within feeds

## Phase 4 Roadmap

### Widgets
- Proxmox/VMware (VM status, CPU/RAM)
- Pi-hole Stats (ads blocked, queries)
- Home Assistant (device status, toggles)
- IP Geolocation (mini map)
- WHOIS Lookup
- Webhook Receiver

### Infrastructure
- Database-backed config (PostgreSQL/MySQL)
- Redis session management
- Load balancer for multi-instance
