# Changelog

All notable changes to OSDuo DashHub will be documented in this file.

> Current version: **1.0.18** (2026-08-24)

## [1.0.18] - 2026-08-24

### Added
- **CalDAV event management** — create and delete events directly from the Calendar widget via CalDAV protocol; day-click panel in month view with add/delete event forms
- **CalDAV credential persistence** — credentials resolved server-side by widget ID (`getWidgetConfig`), eliminating dependency on sanitized frontend state; `password` no longer lost after page refresh
- **GitHub Releases proxy** — server-side GitHub API proxy at `/api/github/releases` with 24h in-memory cache; client-side version cache with 24h TTL in `versions.ts`
- **GITHUB_TOKEN support** — optional GitHub Personal Access Token for 5000 req/hour API rate limit (`GITHUB_TOKEN` env var in docker-compose.yml and .env.example)
- **Upcoming rolling window** — Calendar upcoming mode fetches rolling 30 days from today instead of current calendar month

### Changed
- **Versions widget expand** — versions list now expands naturally like Notes/Reminders instead of using a fixed-height scrollable list (`max-height: 220px` removed)
- **Calendar base font size** — 14px default for all themes via `html { font-size: 14px; }` in `theme-dark.scss`
- **Dashboard vertical overflow** — flex layout (`flex: 1; min-height: 0; overflow-y: auto`) replaces `min-height: calc(100vh - 5.5rem)` to prevent unnecessary page scrolling

### Fixed
- **SSH host key test** — `generateHostKey` now uses `ssh-keygen` for Node 20/24 compatibility (replaces `crypto.generateKeyPairSync` with `openssh` export)
- **CalDAV date timezone** — `toISOString` replaced with local date components to prevent timezone shift
- **Calendar duplicate refresh** — removed duplicate refresh button in CalendarWidget
- **GitHub Actions Node.js 24** — upgraded to `checkout@v5`, `setup-node@v5`, docker actions `v4/v6/v7`

### Infrastructure
- **CI/CD** — full gate (typecheck, lint, tests, build) → buildx multi-arch → smoke test → GHCR push
- **arm64 Docker build** — multi-architecture support via buildx (amd64 + arm64)
- **SSH auto-accept** — host key auto-acceptance for terminal sessions
- **SSH multi-tab** — open multiple SSH terminals via `+` button
- **Glances widget IFrame** — dedicated Glances dashboard integration (no API proxy or SSH buttons)

## [1.0.17] - 2026-08-23

### Fixed
- **Dashboard vertical overflow** — flex layout prevents unnecessary page scrolling
- **Base font size** — 14px default for all themes (Dark, Light, Auto)

### Changed
- **GitHub Actions** — upgraded to Node.js 24 compatible versions
- **Active page persistence** — active page index saved to `localStorage` across refreshes
- **Screenshots** — added dashboard-overview.png, dashboard-speedtest.png, information-page.png to README

## [1.0.16] - 2026-08-23

### Changed
- **nginx security headers** — `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`
- **Docker compose hardening** — read-only root filesystem, `no-new-privileges`, drop all capabilities except `NET_BIND_SERVICE`, tmpfs for temp directories
- **Widget palette** — expanded icon set with AppIcon SVGs
- **Dependencies** — cleanup and security updates

## [1.0.15] - 2026-08-23

### Changed
- **Generic credential sanitization** — replaced SSH-only `SECRET_FIELDS` with `WIDGET_SECRET_FIELDS` registry; `sanitizeConfig()` and `preserveCredentials()` now handle all credential-bearing widgets (SSH, Calendar, Database Monitor) through a single mechanism

## [1.0.14] - 2026-08-23

### Fixed
- **SSH Terminal** — removed stale "Connecting..." text that persisted after connection
- **Service Status** — increased SSH timeout from 15s to 30s, fixed systemctl fallback

### Changed
- **Process List** — added "All Processes" vs "Selected Processes" view mode; add specific process names to monitor in settings; partial name matching (e.g., "python" matches "python3")

## [1.0.13] - 2026-08-23

### Added
- **System Info Widget** — CPU, RAM, Disk, Network monitoring via SSH with regex-based section extraction
- **Service Status Widget** — systemd service monitoring with live status dots via SSH
- **System Logs Widget** — journalctl logs with service/priority filtering via SSH
- **Database Monitor Widget** — MySQL/MariaDB stats with auto-detect credentials (Frappe, WordPress, Laravel)
- **Process List Enhancement** — summary cards, top-3 highlighting, mini usage bars

## [1.0.12] - 2026-08-22

### Changed
- **Server Uptime** — status bar shows last 1 hour (was 7 days); footer displays both 1h and 7-day uptime percentages; click bar to open history modal
- **Uptime API** — backend accepts `?hours=N` query parameter to filter history by time range

### Added
- **MIT License**
- **Public README** — updated for public repo with all widget types listed

## [1.0.7] - 2026-08-22

### Added
- **Weather Widget** — current conditions (temperature, humidity, wind, icon), 5-day forecast, location search via Open-Meteo geocoding, selectable units (°C/°F, km/h/mph), auto-refresh every 30 minutes
- **Server Uptime Widget** — monitor multiple endpoints, visual 7-day uptime bar (green=up, red=down), configurable check interval

## [1.0.6] - 2026-08-22

### Added
- **Speedtest Widget** — network speed test measuring ping, jitter, download, and upload speed; live SVG gauge with real-time Mbps counter; progressive ramp-up (5MB to 25MB chunks), parallel streams, peak throughput reporting

## [1.0.5] - 2026-08-22

### Added
- **Page reordering** — drag-and-drop reorder page tabs in edit mode; visual drop indicator (blue bar) shows insertion point; active page index updates correctly after reorder
- **Move widget to page** — new "Move to" button (↗ icon) on each widget header in edit mode; dropdown lists other pages; clicking moves the widget and auto-switches to the target page

### Changed
- **Page reorder logic** — `reorderPages` store function now uses splice-based reorder (was swap-based); preserves correct `activePageIndex` when the active page moves or other pages shift

## [1.0.3] - 2026-08-21

### Added
- **Notes & Reminders widget** — personal notes and task reminders with two display modes: Reminders (single-line checkbox list with priority badges) and Notes (multi-line text view). Quick-add directly from the widget input, priority flags (high/medium/low), strikethrough for completed items, sort by date or priority, delete on hover
- **Status Indicators widget** — monitor endpoints with color-coded health dots (green=up, red=down, yellow=warning). Category grouping, optional latency/status code display, manual refresh button, configurable auto-refresh interval (15m to 24h, default 30m). Server-side health check proxy (`POST /api/status-check`) to avoid CORS restrictions
- **Quick Links bar mode** — new horizontal compact pill display mode for Quick Links widget, ideal for quick-access bookmark bars
- **Quick Links drag-and-drop reorder** — links can now be reordered via drag-and-drop in the settings form

### Changed
- **WidgetWrapper config flow** — widget components now receive a live draft config that updates inline; opening settings first saves any pending inline changes to the store, preventing data loss
- **Widget component events** — widget components now emit `update` events directly, enabling inline interactions (e.g., adding notes) without requiring the settings modal

### Fixed
- **WidgetWrapper missing @update listener** — widget components were not catching `update` events, so inline config changes (like quick-adding notes) were lost

## [1.0.2] - 2026-08-21

### Added
- **Clock widget** - live-updating time and date display with timezone selection, format options, hide seconds/date toggles; ticks every second
- **Public IP widget** - displays public IP address and location info with refresh button; supports multiple providers (IPInfo, FreeIPAPI, IPQuery, IP-API, IPGeolocation) and server-side proxy mode
- **GitHub Trending widget** - shows trending repositories from GitHub sorted by stars; configurable time period (daily/weekly/monthly), language filter, star limit, and repo count

### Changed
- **Version** - bumped to 1.0.2 across all project files

## [1.0.1] - 2026-08-19

### Added (distribution pipeline)
- **GHCR Docker image publishing** - the app is now distributed as a pre-built, multi-architecture Docker image (`linux/amd64` + `linux/arm64`) at `ghcr.io/devosduotech/dashhub` via GitHub Actions. Tags: release (`1.0.1`), `latest` (newest stable), `dev` (local builds)
- **CI workflow** (`.github/workflows/docker.yml`) - full gate (typecheck, lint, tests, production build) then buildx multi-arch build, in-container smoke test (healthcheck, API reachable, `conf.yml` init, non-root `dashhub` runtime), and push to GHCR. Triggers on `v*` tags and manual `workflow_dispatch`
- **Image-based `docker-compose.yml`** - end-user compose now pulls the pinned release image (`ghcr.io/devosduotech/dashhub:1.0.1`); no `build:`, no `.env` requirement. Zero-config install for users
- **`docker-compose.dev.yml`** - developer override that builds from source; runs as `dashhub-dev` on port 48216 so it can run in parallel with a released image container (`dashhub` on 48215). Uses `ports: !override` to replace (not duplicate) the base port mapping
- **README install options** - three paths documented: Docker Compose (recommended), bare `docker run`, and build-from-source

### Changed
- **Version finalized** - all project files standardized on `1.0.1` (`package.json`, `server/api/package.json`, both lockfiles, footer, STATUS deployment boundary)
- **YouTube video thumbnails** - the YouTube widget now loads live video thumbnails per channel (server-side RSS proxy at `GET /api/youtube/feed`, no API key required), with grid/list display mode, small/medium/large thumbnail size, per-widget video count and cache-time settings. Each video links to its watch page with title + relative publish date; the "Phase 4 placeholder" hint was removed
- **RSS feed items** - the RSS widget now loads live feed items per feed (server-side proxy at `GET /api/rss/feed` parsing both RSS 2.0 and Atom), showing title, thumbnail (via `media:`/enclosure/`itunes:image`), an HTML-stripped excerpt, and relative publish date, with per-feed item count, a "Show Thumbnails" toggle, and cache-time settings; the "Phase 4 placeholder" hint was removed
- **Keyboard focus styling** - global `:focus-visible` rule gives buttons and links a visible primary-color outline for keyboard/AT navigation

### Changed (icon system audit)
- **Icon consolidation** - the legacy emoji/Unicode icon system was removed; `src/utils/icons.ts` now only exposes the SVG `AppIcon` registry (`iconNames`, `isImageIcon`, `safeIconName`), and the media picker "Emoji" tab became an "Icons" grid of SVG icons
- **Icon registry expansion** - `iconPaths.ts` grew from ~20 to ~65 icons (devices, media, maps, weather, tags, flags, UI, etc.) with optional `fill` support; user-picked page/widget icons are validated against the registry with a safe fallback
- **PageTabs accessibility fix** - removed nested `<button>` elements (invalid HTML) by splitting each tab into a main button plus sibling action buttons
- **Drag & drop highlight fix** - defined `--color-primary-rgb` in every theme palette (`dark-navy`, `dark`, `light`) so drop-zone and drag highlights render correctly
- **Widget chrome polish** - remaining Unicode glyphs (⚙ ✎ × ↗ ↻) replaced with `AppIcon` in Rss/Iframe/Glances/Quick Links widgets and modals

### Added
- **Reusable media library** - uploaded icons/images stored in `data/uploads/` (Docker volume) as files, referenced by path (`/uploads/<uuid>.<ext>`), selectable and reusable across widgets
- **Media picker** - shared `MediaPicker` component with Emoji and Images tabs, upload + delete, used by Quick Links icons and the app logo
- **Uploads API** - `GET/POST/DELETE /api/uploads` with magic-byte validation (PNG/JPEG/GIF/WebP), 2 MB limit, safe server-generated filenames
- **Static image serving** - `/uploads/*` served by the API (nginx `^~ /uploads` proxy)

### UI (visual system pass)
- **`AppIcon`** - reusable SVG icon component backed by a typed path registry (Lucide-style, no dependency), replacing emoji/system glyphs in the chrome
- **`AppLogo`** - reusable branding component (mark + full wordmark) used in header, footer, and empty states
- **`AppEmptyState`** - consistent empty/loading states with mark and CTA
- **Edit-mode clarity** - distinct "Editing Dashboard" badge, tinted toolbar, subtle background shift
- **Widget headers** - icon tile + stronger hierarchy; icon buttons for settings/refresh/remove
- **Widget palette** - SVG icon tiles for each widget type
- **SSH widget semantics** - neutral "Disconnected" status dot (no more misleading green online dot); auth badges now icons (lock/key/bot) with tooltips
- **Host-key verification dialog** - proper security prompt with warning shield, connection info, labeled SHA256 fingerprint, and "Verify before accepting" guidance
- **Drag & drop targets** - visible drop zones during drag with "Drop here" cue and highlighted destination column
- **Footer** - minimal configurable footer text only (no logo or version line; logo/version can be re-added in a later phase if decided)
- **Header layout** - logo/mark now sits left of the dashboard title in the toolbar (removed the separate centered top header)
- **Runtime themes** - theme setting now actually applies: `dark-navy`, `dark`, `light`, and `auto` (follows OS via `prefers-color-scheme`); palettes driven by `[data-theme]` CSS variables, applied on load and on save
- **Fixed** - `--color-primary-dim` and `--color-border-hover` were referenced by components but never emitted; both are now defined in every theme palette
- **Fixed** - YouTube widget channel link pointed at the raw RSS feed XML (`feeds/videos.xml`) and was labeled "RSS feed"; it now opens the channel page (`youtube.com/channel/<id>`) labeled "View Channel" with a YouTube icon
- **Fixed** - 502 on container start: nginx served the page before the Node API was listening, so the first `/api/config` call was refused and the frontend showed "Request failed with status code 502" until a manual refresh. Now the API starts before nginx, the healthcheck probes the API (`/api/config`), and the frontend auto-retries config load (4 attempts, 1s apart) instead of failing permanently

### Fixed
- **nginx DELETE interception** - asset-cache regex captured `DELETE /api/uploads/*.png`; `/api` and `/api/ssh` locations are now `^~` so API routes are never shadowed by static-file rules (405 → 200)

### Security (Phase 1)
- **Credential sanitization** - `GET /api/config` no longer returns SSH passwords, private keys, or passphrases; connections expose only `hasCredential`
- **SSH host-key verification** - explicit first-connect fingerprint acceptance, persisted to `known_hosts.json`, verified on every reconnect
- **SSH connections identified by immutable UUID** instead of display name
- **Config validation hardening** - widget type/field validation, limits, port ranges, duplicate-ID detection, 2 MB body limit
- **Structured API errors** - `{ error, message }` codes; internal details logged server-side only

### Runtime
- **Node 24 LTS** (replaces EOL Node 20)
- **Non-root runtime** - Node API runs as unprivileged `dashhub` user
- **`npm ci`** for reproducible builds
- **Automated tests** - Vitest + supertest suite (`npm test`, 38 tests)

### Layout
- **Column-based stacking** - widgets keep an explicit column assignment; drag & drop across/within columns with drop zones

### Documentation
- Added `STATUS.md` (Implemented/Partial/Planned) and `SECURITY.md` (Phase-1 boundary + Phase-2 backlog)
- Corrected overstated feature claims (encrypted credentials, etc.) in CHANGELOG and Project Report

## [1.0.0] - 2026-08-18

### Added
- **Glances Widget** - Server monitoring via Glances REST API (CPU, memory, disk, network, processes)
- **SSH Terminal Widget** - Full xterm.js terminal with saved connections
- **IFrame Widget** - Embed any web content with configurable dimensions
- **Quick Links Widget** - Bookmark management with icons and categories
- **YouTube Widget** - Video aggregation from YouTube channels
- **RSS Feed Widget** - News and article aggregation
- **Multi-Page Support** - Organize widgets into logical pages
- **Dark/Light Themes** - Built-in theme support (dark-navy, light, etc.)
- **Full UI Configuration** - 100% web-based setup, no YAML editing required
- **Credential Sanitization** - SSH passwords and keys never exposed via the API (see SECURITY.md)
- **SSH Host-Key Verification** - First-connect fingerprint prompt with persisted known-hosts
- **Docker Deployment** - Single container with nginx + Express API

### Changed
- Updated README with implementation status and feature details
- Enhanced documentation with widget-specific guides
- Improved settings form reactivity using Vue 3 computed refs
- Optimized build output with Vite

### Fixed
- Settings forms now properly save widget configuration
- IFrame and Glances widgets render with correct dimensions
- Full Width checkbox properly spans grid columns
- SSH terminal connects with saved credentials

### Technical
- Frontend: Vue 3 (Composition API) + Vite + Pinia
- Terminal: xterm.js with WebSocket bridge
- SSH: Node.js ssh2 library
- API: Express + chokidar (config hot-reload)
- Container: nginx (static) + Express (API) in single image

## [0.1.0] - 2026-04-06

### Added
- Initial project specification
- Technical architecture design
- Widget system design
- Configuration schema

