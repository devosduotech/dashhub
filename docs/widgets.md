# OSDuo DashHub - Widget Documentation

## Overview

OSDuo DashHub supports the following widget types:

| Widget | Description | Config Options |
|--------|-------------|----------------|
| **Glances** | Server monitoring metrics | URL, display mode, dimensions, SSH |
| **Quick Links** | Bookmarks and shortcuts | Links with icons, categories, bar mode |
| **IFrame** | Embed external content | URL, dimensions, fullscreen |
| **SSH Terminal** | Web-based terminal | Connections, auth, theme |
| **YouTube** | Video aggregation | Channel IDs, count |
| **RSS Feed** | News feed aggregation | Feed URLs, item count |
| **Clock** | Live-updating time/date | Timezone, format, display options |
| **Public IP** | Public IP & location | Provider selection |
| **Latest Versions** | Package version tracking | npm/GitHub/PyPI items |
| **Notes & Reminders** | Personal notes and tasks | Checklist, priority, display modes |
| **Status Indicators** | Endpoint health monitor | Color-coded dots, auto-refresh |

All widgets support:
- Custom titles
- Grid positioning (row, column, width, height)
- Full UI configuration (no YAML editing required)

Widgets are the building blocks of OSDuo DashHub. Each widget displays specific data or provides functionality.

## Available Widgets

| Widget | Purpose | Status |
|--------|---------|--------|
| Quick Links | Web bookmarks | Available |
| Glances Server | Server monitoring (iframe) | Available |
| SSH Terminal | Web terminal | Available |
| YouTube | Video aggregation | Available |
| RSS Feed | News aggregation | Available |
| IFrame | External content | Available |
| Clock | Live time/date display | Available |
| Public IP | IP address & location | Available |
| Latest Versions | Package version tracker | Available |
| Notes & Reminders | Personal notes and tasks | Available |
| Status Indicators | Endpoint health monitor | Available |

## Glances Server Widget (IFrame-based)

### Purpose
Display real-time server metrics by embedding the Glances web interface directly via iframe.

**Note**: Glances provides a full-featured web interface. By using iframe, we get all Glances features (CPU, RAM, Disk, Network, Processes, Docker, etc.) without building custom displays.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | string | Required | Full Glances URL (e.g., http://192.168.1.10:61208) |
| displayMode | string | embedded | embedded, link, compact |
| height | number | 400 | Iframe height in pixels |
| refreshInterval | number | 0 | Auto-refresh interval in seconds (0 = off) |

### SSH Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| enabled | boolean | false | Enable SSH quick-connect |
| host | string | Required | SSH server hostname/IP |
| port | number | 22 | SSH port |
| username | string | Required | SSH username |

### Example

```yaml
- type: glances
  title: "Web Server 01"
  config:
    url: "http://192.168.1.10:61208"
    displayMode: embedded
    height: 400
    ssh:
      enabled: true
      host: "192.168.1.10"
      port: 22
      username: "admin"
```

### Features

- **Full Glances UI**: CPU, Memory, Disk, Network, Processes, Docker monitoring
- **One-click SSH**: Quick access to terminal
- **Refresh**: Manually refresh the Glances view
- **Open in new tab**: View Glances in full browser tab
- **Connection status**: Visual indicator of server availability

---

## Quick Links Widget

### Purpose
Display clickable shortcuts to web services and applications.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| columns | number | 3 | Grid columns (2, 3, 4) |
| displayMode | string | grid | grid, list, or bar |
| links | array | [] | List of link objects |

### Link Object

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| title | string | Yes | Display name |
| url | string | Yes | Target URL |
| icon | string | No | `AppIcon` name or uploaded image path |
| description | string | No | Optional description |
| target | string | No | newtab, sametab, modal |
| category | string | No | Group name |

### Example

```yaml
- type: quick-links
  title: "Quick Links"
  config:
    columns: 4
    links:
      - title: "Home Assistant"
        url: "https://ha.local:8123"
        icon: "🏠"
        target: newtab
```

---

## IFrame Widget

### Purpose
Embed any web content directly into the dashboard.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | string | Required | URL to embed |
| height | number | 400 | Iframe height in pixels |
| width | string | 100% | Iframe width |
| allowFullscreen | boolean | true | Allow fullscreen mode |

### Example

```yaml
- type: iframe
  title: "Embedded Dashboard"
  config:
    url: "http://grafana.local:3000"
    height: 600
    allowFullscreen: true
```

### Use Cases

- Glances server monitoring
- Embedded Grafana dashboards
- External web applications
- Status pages
- Documentation links

---

## SSH Terminal Widget

### Purpose
Provide web-based terminal access to servers.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| defaultShell | string | /bin/bash | Default shell |
| theme | string | monokai | Terminal theme |
| fontSize | number | 14 | Font size in pixels |

### Connection Object

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| name | string | Yes | Connection name |
| host | string | Yes | Server hostname/IP |
| port | number | 22 | SSH port |
| username | string | Yes | SSH username |
| authType | string | Yes | key, password, agent |
| group | string | No | Group/folder name |
| tags | array | No | Tags for filtering |

### Authentication

#### Key Authentication
```yaml
authType: "key"
# Private key stored in data/conf.yml (excluded from API responses)
```

#### Password Authentication
```yaml
authType: "password"
# Password stored in data/conf.yml (excluded from API responses)
```

#### Agent Forwarding
```yaml
authType: "agent"
# Uses system SSH agent
```

---

## YouTube Widget

### Purpose
Display the latest videos from configured YouTube channels as thumbnails. A server-side RSS proxy (`GET /api/youtube/feed`) fetches each channel's recent videos — no YouTube API key required — and the widget renders them as a grid or list, linking each thumbnail to its watch page. Results are cached server-side (15 min default) and per-widget (`cacheTime`).

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| channels | array | [] | Channel list |
| videosPerChannel | number | 3 | Videos per channel |
| displayMode | string | grid | grid or list |
| thumbnailSize | string | medium | small, medium, large |
| cacheTime | number | 60 | Cache duration (minutes) |

### Channel Object

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| id | string | Yes | YouTube channel ID |
| name | string | No | Display name |

### Finding Channel ID

From channel URL:
```
https://www.youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw
                                       ^^^^^^^^^^^^^^^^^
                                       This is the ID
```

From RSS feed:
```
https://www.youtube.com/feeds/videos.xml?channel_id=UCXuqSBlHAE6Xw-yeJA0Tunw
```

---

## RSS Feed Widget

### Purpose
Aggregate and display items from RSS/Atom feeds.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| feeds | array | [] | Feed list |
| itemsPerFeed | number | 5 | Items per feed |
| showThumbnails | boolean | true | Show article images |
| cacheTime | number | 15 | Cache duration (minutes) |

### Feed Object

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| url | string | Yes | RSS/Atom feed URL |
| title | string | No | Display name |
| icon | string | No | Icon identifier |
| group | string | No | Group name |

### Supported Feed Formats

- RSS 2.0
- Atom 1.0

The server fetches and parses feeds (`GET /api/rss/feed`), extracts thumbnails from `<media:thumbnail>`, `<media:content>`, `<enclosure type="image/*">`, and `<itunes:image>`, strips HTML from descriptions, and caches per URL (15 min default, configurable per widget via `cacheTime`).

### Example Feeds

```yaml
feeds:
  - url: "https://news.ycombinator.com/rss"
    title: "Hacker News"
  - url: "https://www.theverge.com/rss/index.xml"
    title: "The Verge"
```

---

## Clock Widget

### Purpose
Display a live-updating clock with configurable timezone, format, and display options. Ticks every second.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| timeZone | string | "" (local) | IANA timezone (e.g., `Europe/London`, `Asia/Tokyo`, `UTC`) |
| hideDate | boolean | false | Hide the date line below the time |
| hideSeconds | boolean | false | Hide the seconds display |
| use12Hour | boolean | false | Use 12-hour format with AM/PM; when off, displays 24-hour format |

### Examples

**12-hour with AM/PM:**
```yaml
- type: clock
  title: "Clock"
  config:
    use12Hour: true
    hideSeconds: true
```

**24-hour with specific timezone:**
```yaml
- type: clock
  title: "London Time"
  config:
    timeZone: "Europe/London"
    use12Hour: false
```

**Time only (no date):**
```yaml
- type: clock
  title: "Clock"
  config:
    hideDate: true
    hideSeconds: true
```

### Timezone Examples

| Region | Timezone | Value |
|--------|----------|-------|
| UTC | Coordinated Universal Time | `UTC` |
| **Americas** | | |
| US Eastern | America/New_York | `America/New_York` |
| US Central | America/Chicago | `America/Chicago` |
| US Mountain | America/Denver | `America/Denver` |
| US Pacific | America/Los_Angeles | `America/Los_Angeles` |
| Canada Toronto | America/Toronto | `America/Toronto` |
| Canada Vancouver | America/Vancouver | `America/Vancouver` |
| Brazil Sao Paulo | America/Sao_Paulo | `America/Sao_Paulo` |
| Argentina Buenos Aires | America/Argentina/Buenos_Aires | `America/Argentina/Buenos_Aires` |
| Mexico City | America/Mexico_City | `America/Mexico_City` |
| **Europe** | | |
| UK London | Europe/London | `Europe/London` |
| France Paris | Europe/Paris | `Europe/Paris` |
| Germany Berlin | Europe/Berlin | `Europe/Berlin` |
| Spain Madrid | Europe/Madrid | `Europe/Madrid` |
| Italy Rome | Europe/Rome | `Europe/Rome` |
| Netherlands Amsterdam | Europe/Amsterdam | `Europe/Amsterdam` |
| Poland Warsaw | Europe/Warsaw | `Europe/Warsaw` |
| Russia Moscow | Europe/Moscow | `Europe/Moscow` |
| Turkey Istanbul | Europe/Istanbul | `Europe/Istanbul` |
| **Asia** | | |
| India Kolkata | Asia/Kolkata | `Asia/Kolkata` |
| Japan Tokyo | Asia/Tokyo | `Asia/Tokyo` |
| China Shanghai | Asia/Shanghai | `Asia/Shanghai` |
| Korea Seoul | Asia/Seoul | `Asia/Seoul` |
| Singapore | Asia/Singapore | `Asia/Singapore` |
| Hong Kong | Asia/Hong_Kong | `Asia/Hong_Kong` |
| Taiwan Taipei | Asia/Taipei | `Asia/Taipei` |
| UAE Dubai | Asia/Dubai | `Asia/Dubai` |
| Saudi Arabia Riyadh | Asia/Riyadh | `Asia/Riyadh` |
| Thailand Bangkok | Asia/Bangkok | `Asia/Bangkok` |
| Pakistan Karachi | Asia/Karachi | `Asia/Karachi` |
| **Australia / Pacific** | | |
| Australia Sydney | Australia/Sydney | `Australia/Sydney` |
| Australia Melbourne | Australia/Melbourne | `Australia/Melbourne` |
| Australia Perth | Australia/Perth | `Australia/Perth` |
| New Zealand Auckland | Pacific/Auckland | `Pacific/Auckland` |
| Fiji | Pacific/Fiji | `Pacific/Fiji` |
| Hawaii | Pacific/Honolulu | `Pacific/Honolulu` |
| **Africa** | | |
| Egypt Cairo | Africa/Cairo | `Africa/Cairo` |
| South Africa Johannesburg | Africa/Johannesburg | `Africa/Johannesburg` |
| Kenya Nairobi | Africa/Nairobi | `Africa/Nairobi` |
| Nigeria Lagos | Africa/Lagos | `Africa/Lagos` |

---

## Public IP Widget

### Purpose
Display the server's public IP address and approximate location. Uses a server-side proxy to avoid CORS issues — no API key required.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| provider | string | ip-api | IP lookup provider (server-side proxy) |
| hideLocation | boolean | false | Hide the city/region/country line |

### Supported Providers

| Provider | Data |
|----------|------|
| `ip-api` | IP, city, region, country |
| `ipapi` | IP, city, region, country |
| `freeipapi` | IP, city, region, country |
| `ipquery` | IP, city, region, country |

All providers are free and require no API key. Requests are routed through the DashHub API server (`POST /api/public-ip`) to avoid browser CORS restrictions.

### Examples

**Default (shows IP + location):**
```yaml
- type: public-ip
  title: "Public IP"
```

**IP only (no location):**
```yaml
- type: public-ip
  title: "My IP"
  config:
    hideLocation: true
```

---

## Latest Versions Widget

### Purpose
Track the latest versions of npm packages, GitHub releases, and PyPI packages in a customizable list. Click **Refresh** to check for updates manually.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| items | array | [] | List of packages/repos to track |

### Item Object

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| name | string | Yes | Display name (e.g., "Vue", "Node.js") |
| source | string | Yes | `npm`, `github`, or `pypi` |
| identifier | string | Yes | Package name or `owner/repo` for GitHub |

### Source Types

| Source | Identifier Format | What It Checks |
|--------|-------------------|----------------|
| `npm` | Package name (e.g., `vue`, `express`) | Latest version on npm registry |
| `github` | `owner/repo` (e.g., `nodejs/node`) | Latest GitHub release tag |
| `pypi` | Package name (e.g., `requests`, `flask`) | Latest version on PyPI |

### Examples

**Track npm packages:**
```yaml
- type: latest-versions
  title: "NPM Packages"
  config:
    items:
      - name: "Vue"
        source: "npm"
        identifier: "vue"
      - name: "Express"
        source: "npm"
        identifier: "express"
      - name: "TypeScript"
        source: "npm"
        identifier: "typescript"
```

**Track GitHub releases:**
```yaml
- type: latest-versions
  title: "GitHub Releases"
  config:
    items:
      - name: "Node.js"
        source: "github"
        identifier: "nodejs/node"
      - name: "Docker"
        source: "github"
        identifier: "moby/moby"
      - name: "DashHub"
        source: "github"
        identifier: "devosduotech/dashhub"
```

**Mixed sources:**
```yaml
- type: latest-versions
  title: "Version Tracker"
  config:
    items:
      - name: "Vue"
        source: "npm"
        identifier: "vue"
      - name: "DashHub"
        source: "github"
        identifier: "devosduotech/dashhub"
      - name: "Requests"
        source: "pypi"
        identifier: "requests"
```

### How It Works
- Click **Refresh** to fetch latest versions from all configured sources
- Each item shows its latest version or an error indicator if the fetch failed
- Add, edit, or remove items through the widget settings
- No caching — always fetches live data on refresh

---

## Notes & Reminders Widget

### Purpose
Personal notes and task reminders with checkboxes, priority flags, and two display modes. Notes can be added directly from the widget without opening settings.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| items | array | [] | List of notes |
| displayMode | string | reminders | reminders (checkbox list) or notes (multi-line text) |
| showCompleted | boolean | true | Show completed items |
| sortBy | string | created | Sort by created (newest first) or priority (high first) |

### Display Modes

| Mode | Description |
|------|-------------|
| **Reminders** | Single-line checkbox list with priority badges; completed items shown with strikethrough |
| **Notes** | Multi-line text view with word wrapping; completed items shown with strikethrough |

### Item Object

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| id | string | Auto | Unique identifier (auto-generated) |
| text | string | Yes | Note/reminder text |
| completed | boolean | No | Completion status (default: false) |
| priority | string | No | low, medium, or high (default: medium) |
| createdAt | string | Auto | ISO 8601 timestamp (auto-generated) |

### Quick Add

Notes can be added directly from the widget:
1. Type your note in the input field at the bottom
2. Select priority (Low / Med / High)
3. Press **Enter** or click the **+** button

### Examples

**Reminders mode (default):**
```yaml
- type: notes
  title: "Tasks"
  config:
    displayMode: reminders
    sortBy: priority
    items:
      - text: "Deploy update to production"
        priority: high
        completed: false
      - text: "Review PR #42"
        priority: medium
        completed: true
      - text: "Update documentation"
        priority: low
        completed: false
```

**Notes mode:**
```yaml
- type: notes
  title: "Meeting Notes"
  config:
    displayMode: notes
    showCompleted: false
    items:
      - text: "Discussed Q3 roadmap - focus on mobile experience"
        priority: medium
      - text: "Action item: schedule follow-up with design team"
        priority: high
```

### Features
- **Quick add** — add notes directly from the widget without opening settings
- **Priority badges** — high (red), medium (default), low (muted)
- **Strikethrough** — completed items shown with line-through text
- **Delete** — hover any note to reveal the delete button
- **Sort options** — by creation date or priority level

---

## Status Indicators Widget

### Purpose
Monitor a list of URLs/endpoints and show their health status with color-coded dots. Endpoints can be grouped by category. Uses a server-side proxy to avoid CORS issues.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| endpoints | array | [] | List of endpoints to monitor |
| showLatency | boolean | false | Show response time in milliseconds |
| showStatusCode | boolean | false | Show HTTP status code |
| refreshInterval | number | 1800 | Auto-refresh interval in seconds (0 = manual only, default: 30 minutes) |

### Endpoint Object

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| name | string | Yes | Display name |
| url | string | Yes | URL to check |
| method | string | No | GET, HEAD, or OPTIONS (default: GET) |
| expectedStatus | number | No | Expected HTTP status code (default: 200) |
| timeout | number | No | Timeout in seconds (default: 5) |
| category | string | No | Category for grouping |

### Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| Up | Green | Response matches expected status |
| Down | Red | Timeout, network error, or connection refused |
| Warning | Yellow | Responded but status code doesn't match |

### Auto-Refresh Intervals

| Option | Value |
|--------|-------|
| Off | 0 |
| 15 minutes | 900 |
| 30 minutes | 1800 (default) |
| 1 hour | 3600 |
| 6 hours | 21600 |
| 12 hours | 43200 |
| 24 hours | 86400 |

### Examples

**Basic monitoring:**
```yaml
- type: status-indicators
  title: "Service Status"
  config:
    endpoints:
      - name: "Google"
        url: "https://google.com"
        category: "Search"
      - name: "GitHub"
        url: "https://github.com"
        category: "Development"
```

**With latency and status codes:**
```yaml
- type: status-indicators
  title: "Health Check"
  config:
    showLatency: true
    showStatusCode: true
    refreshInterval: 3600
    endpoints:
      - name: "API Server"
        url: "https://api.example.com/health"
        method: GET
        expectedStatus: 200
        timeout: 10
        category: "Production"
      - name: "Database"
        url: "https://db.example.com:5432"
        method: HEAD
        timeout: 5
        category: "Production"
      - name: "Staging"
        url: "https://staging.example.com"
        category: "Staging"
```

### Features
- **Color-coded dots** — instant visual health status
- **Category grouping** — organize endpoints by service/type
- **Latency display** — optional response time in milliseconds
- **Status codes** — optional HTTP status code display
- **Auto-refresh** — configurable interval from 15 minutes to 24 hours
- **Manual refresh** — click the Refresh button to check all endpoints immediately
- **Server-side proxy** — health checks run server-side to avoid CORS restrictions

---

## Widget Common Features

### Refresh
All widgets have a refresh button to manually reload data.

### Settings
Click the gear icon to open widget settings.

### Remove
Click the X icon or remove from edit mode.

### Error States
Widgets display error messages when data cannot be loaded.

### Widget Sizing
- **Full Width**: Spans all grid columns (use for wide widgets)
- **Custom Width**: Set specific pixel width when not full-width
- **Height**: Configurable in pixels for most widgets

---

## Creating Custom Widgets

To add a custom widget type:

1. **Create Vue Component**: Add `src/components/widgets/YourWidget.vue`
2. **Add Settings Form**: Create `src/components/widgets/YourWidgetSettingsForm.vue`
3. **Register Widget**: Add to widget registry in `src/components/widgets/registry.ts`
4. **Define Config Type**: Add interface in `src/types/config.ts`
5. **Implement Data Service**: Create data fetching logic
6. **Add to Palette**: Widget appears in edit mode automatically

See the [Project Report](./project/OSDuo-DashHub-Project-Report.md) for detailed development guidelines.
