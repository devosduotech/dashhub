# OSDuo DashHub — Implementation Status

> **Purpose:** Track exactly what is implemented, partially implemented, or planned.
> This document is the source of truth for reconciling the Project Report against the codebase.
>
> Last updated: 2026-08-26 | Version: **1.0.19**
>
> Audited directly against the codebase (widget registry, server routes, tests) — phantom entries previously listed here (GitHub Trending widget, Docker Compose Monitor widget, `/api/power`, `/api/database/stats`, `/api/mongodb/demo`, `/api/config/backups`) were **not present in the code** and have been removed.

## Legend

- **Implemented** — Working in the current release and verified.
- **Partial** — UI/API exists but functionality is incomplete or backed by a placeholder.
- **Planned** — Specified but not implemented (Phase 2/3/4).

---

## Feature Status

### Dashboard & Layout

| Feature | Status | Notes |
| --- | --- | --- |
| Multi-page dashboard | Implemented | Pages, icons, renaming, reordering (drag-and-drop), deletion |
| Named routes | Implemented | Clean URLs (`/home`, `/infrastructure`) via HTML5 history |
| Column-based layout | Implemented | 1–6 columns per page, configurable |
| Widget drag & drop | Implemented | Drag between and within columns; drop zones |
| Move widget to page | Implemented | Edit-mode "Move to" button; dropdown lists other pages; auto-switches after move |
| Page reordering | Implemented | Drag-and-drop reorder page tabs in edit mode; visual drop indicator |
| Page settings | Implemented | Name, icon, column count via modal |
| Edit mode | Implemented | Palette, settings, remove, drag & drop |
| Drag & drop targets | Implemented | Visible drop zones + highlighted destination column while dragging |
| Edit-mode indication | Implemented | Editing badge, tinted toolbar, subtle background shift |
| Empty states | Implemented | Reusable `AppEmptyState` with brand mark and CTA |

### Widgets (21 types, verified against `src/components/widgets/registry.ts`)

| Widget | Status | Category | Notes |
| --- | --- | --- | --- |
| Quick Links | Implemented | General | Grid/list/bar modes, categories, targets, emoji or uploaded image icons, drag-and-drop reorder |
| Glances Server | Implemented | Infrastructure | IFrame embed of Glances web UI |
| SSH Terminal | Implemented | Infrastructure | xterm.js + ssh2; password/key/agent auth; resize; host-key verification |
| YouTube | Implemented | Content | Latest channel videos via RSS proxy (no API key), grid/list, size, cache |
| RSS Feed | Implemented | Content | RSS 2.0 / Atom proxy, item count, thumbnail toggle, cache |
| IFrame | Implemented | Content | URL, height, full-width, refresh interval, sandbox |
| Latest Versions | Implemented | Infrastructure | Track versions from npm, GitHub, PyPI; expanding list view |
| Clock | Implemented | General | Live time/date, timezone, format options, hide seconds/date |
| Public IP | Implemented | Network | Public IP + location with refresh; server-side proxy mode |
| Notes | Implemented | Productivity | Personal text notes with priority; inline editing |
| Reminders | Implemented | Productivity | Task reminders with checkboxes, completion, priority badges; inline editing |
| Status Indicators | Implemented | Network | Color-coded health dots, category grouping, latency, auto-refresh |
| Speedtest | Implemented | Network | Ping, jitter, download, upload; live SVG gauge; parallel streams |
| Weather | Implemented | General | Current conditions, 5-day forecast, Open-Meteo, units, auto-refresh |
| Server Uptime | Implemented | Network | Multi-endpoint monitor, 1h bar + 7-day uptime, history modal |
| Calendar | Implemented | Productivity | CalDAV month view + upcoming events; create/delete; day panel |
| Process List | Implemented | Infrastructure | Processes via SSH; sortable tables, summary cards, top-3 highlight |
| System Info | Implemented | Infrastructure | CPU, RAM, Disk, Network via SSH |
| Service Status | Implemented | Infrastructure | systemd services via SSH with live status dots |
| System Logs | Implemented | Infrastructure | journalctl logs via SSH with service/priority filtering |
| Database Monitor | Implemented | Infrastructure | MySQL/MariaDB stats via SSH; auto-detect creds (Frappe/WP/Laravel) |

> **No** GitHub Trending widget and **no** Docker Compose Monitor widget exist in the codebase. Earlier status docs listed these in error.

### App Settings & Theming

| Feature | Status | Notes |
| --- | --- | --- |
| App settings | Implemented | Title, theme (dark/light/auto), font size, logo upload/library, footer text |
| Runtime theming | Implemented | `data-theme` CSS variables; auto follows OS; base font sizing |
| Media library | Implemented | Uploaded icons/images in `data/uploads/`, reusable via MediaPicker |
| Icon system | Implemented | Reusable SVG `AppIcon` (typed registry); `AppLogo`; branded favicon synced to logo |
| Branded favicon | Implemented | Browser tab icon follows uploaded logo |

### In-App Documentation (new in 1.0.19)

| Feature | Status | Notes |
| --- | --- | --- |
| Help viewer | Implemented | Route `/help/:chapter?`; 12-chapter manual rendered from `docs/user-manual/*.md` via `import.meta.glob` + `marked` + `DOMPurify` |
| Sidebar navigation | Implemented | Chapter list, active state, prev/next chapter flow, deep-linkable |
| Screenshot embedding | Implemented | Manual images bundled from `docs/images/` and rewritten to asset URLs |
| Cross-link rewriting | Implemented | In-manual links route to `/help/{chapter}`; external docs (Deployment Guide, SECURITY.md, SHOTLIST.md) open GitHub source in a new tab |
| Help entry points | Implemented | Toolbar Help button + footer link, both open in a new browser tab |

### Config & Credentials

| Feature | Status | Notes |
| --- | --- | --- |
| Config persistence | Implemented | Atomic write (tmp + rename), auto-generated IDs |
| Config API validation | Implemented | Structural validation, limits, duplicate-ID detection |
| Credential sanitization (API) | Implemented | Secrets never returned by `GET /api/config`; `hasCredential` flag; `WIDGET_SECRET_FIELDS` registry |
| Credential persistence (CalDAV) | Implemented | Server-side credential resolution by widget ID via `getWidgetConfig()` |

### Integrations / Proxies

| Feature | Status | Notes |
| --- | --- | --- |
| RSS / YouTube proxy | Implemented | Server-side fetch with TTL cache |
| CalDAV client | Implemented | discover / events / create-event / delete-event (server-side creds) |
| Speedtest | Implemented | ping/download/upload endpoints |
| Uptime history | Implemented | Per-endpoint check log + history API |
| GitHub Releases proxy | Implemented | Server-side GitHub API proxy, 24h in-memory cache |
| Client-side version cache | Implemented | localStorage 24h TTL with manual refresh bypass |
| SSH bridge (WebSocket) | Implemented | Interactive terminal, host-key verification, multi-tab |

---

## Deployment Boundary

> **DashHub v1.0.19 — Local-First Release.** Intended for a single user on a
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

All routes are implemented in `server/api/server.js` (25 HTTP routes + 1 WebSocket).

| Endpoint | Method | Status | Notes |
| --- | --- | --- | --- |
| `/api/config` | GET | Implemented | Returns sanitized config (no secrets) |
| `/api/config` | PUT | Implemented | Validates, preserves stored credentials, atomic write |
| `/api/config/validate` | POST | Implemented | Structural validation |
| `/api/uploads` | GET | Implemented | Lists uploaded images |
| `/api/uploads` | POST | Implemented | Stores image (magic-byte validated, 2 MB max) |
| `/api/uploads/:name` | DELETE | Implemented | Deletes an uploaded image |
| `/uploads/*` | GET (static) | Implemented | Serves stored images |
| `/api/rss/feed` | GET | Implemented | RSS 2.0 / Atom proxy with TTL cache |
| `/api/youtube/feed` | GET | Implemented | RSS proxy returning latest channel videos |
| `/api/public-ip` | POST | Implemented | Public IP + geolocation |
| `/api/status-check` | POST | Implemented | Endpoint health check |
| `/api/speedtest/ping` | GET | Implemented | ICMP-style ping |
| `/api/speedtest/download` | GET | Implemented | Download throughput test |
| `/api/speedtest/upload` | POST | Implemented | Upload throughput test |
| `/api/processes` | GET | Implemented | Process list via SSH |
| `/api/caldav/discover` | POST | Implemented | Discover CalDAV calendars |
| `/api/caldav/events` | POST | Implemented | Fetch events with date-range filter |
| `/api/caldav/create-event` | POST | Implemented | Create event; server-side creds by widget ID |
| `/api/caldav/delete-event` | POST | Implemented | Delete event; server-side creds by widget ID |
| `/api/uptime/history` | GET | Implemented | Per-endpoint check log |
| `/api/uptime/check` | POST | Implemented | Trigger uptime check |
| `/api/system-info` | GET | Implemented | System info via SSH |
| `/api/service-status` | GET | Implemented | systemd service status via SSH |
| `/api/system-logs` | GET | Implemented | journalctl logs via SSH |
| `/api/database-monitor` | POST | Implemented | MySQL/MariaDB stats via SSH |
| `/api/github/releases` | GET | Implemented | GitHub releases proxy, 24h cache |
| `WS /api/ssh` | WS | Implemented | Interactive terminal with host-key verification |

> Note: endpoints such as `/api/power`, `/api/database/stats`, `/api/mongodb/demo`, and `/api/config/backups` were listed in an earlier status doc but **do not exist** in `server.js`.

---

## Deployment / Runtime Status

| Area | Status | Notes |
| --- | --- | --- |
| Single container (nginx + Node API) | Implemented | No external dependencies at runtime |
| Non-root runtime | Implemented | Node runs as `dashhub` user via `su-exec` |
| Node.js runtime | Implemented | Node 24 LTS (alpine) |
| Reproducible installs | Implemented | `npm ci` with committed lockfiles |
| Health check | Implemented | nginx `/api/config` probe via wget |
| Automated tests | Implemented | Vitest + supertest suite (`npm test`) — **65 tests passing** |
| Lint / typecheck | Implemented | `npm run lint`, `npm run typecheck` |
| Read-only rootfs compatible | Implemented | nginx temp paths in `/tmp`; CI smoke test runs `--read-only` |
| CI/CD pipeline | Implemented | GitHub Actions: gate → buildx multi-arch → smoke test → GHCR push |
| Multi-arch images | Implemented | linux/amd64 + linux/arm64 via buildx |
| Docker image registry | Implemented | `ghcr.io/devosduotech/dashhub` (`1.0.19` + `latest`) |
| Host SSH access from container | Implemented | `extra_hosts: host.docker.internal:host-gateway` in compose; use `host.docker.internal` (not `127.0.0.1`) as the SSH Host — stable across DHCP IP changes |
| Version sync script | Implemented | `scripts/sync-version.sh` syncs version to README + compose |
| Documentation | Implemented | In-app help (`/help`) + `docs/user-manual/`, `docs/deployment/`, `docs/project/` |

---

## Documentation Map

| Path | Purpose |
| --- | --- |
| `docs/user-manual/` | 12-chapter end-user manual (rendered in-app at `/help`) |
| `docs/deployment/` | Installation & Deployment, Upgrade, Backup & Restore guides |
| `docs/images/` | Manual screenshots (bundled into the image) |
| `docs/demo/conf.yml` | Sanitized demo configuration |
| `docs/project/STATUS.md` | This file |
| `docs/project/CHANGELOG.md` | Release history |
| `docs/project/SECURITY.md` | Phase 1 boundary + Phase 2 plan |
| `docs/project/PHASE2.md` | Prioritized security & feature roadmap |
| `docs/project/STRUCTURE.md` | Directory structure & operations |
| `docs/project/MIGRATION.md` | Migration notes |

---

## Phase 2 Roadmap

> **Detailed prioritized work plan with acceptance criteria and milestones: [PHASE2.md](./PHASE2.md)**
> Derived from the v1.0.18 security & code-quality audit.

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
- Move `ssh2` from `devDependencies` to `dependencies` (currently in `devDependencies`)

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
