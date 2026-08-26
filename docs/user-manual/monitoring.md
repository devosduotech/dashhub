# Monitoring Widgets

Eight widgets cover server and endpoint monitoring. All SSH-backed widgets share a **Connection** dropdown fed by your saved [SSH connections](ssh.md).

---

## Glances Server

### Purpose
Embeds a [Glances](https://github.com/nicolargo/glances) web dashboard for real-time server metrics.

### Before you configure
- Glances is installed on the target server **in web-server mode** (`glances -w`)
- You know the Glances web URL (e.g. `http://192.0.2.100:61208`)

> **Note:** The widget loads the Glances page directly in your browser (iframe). The Glances URL must therefore be reachable from the machine where you *open DashHub*, not only from the DashHub server.

### Configuration

| Setting | Required | Description |
|---------|----------|-------------|
| Glances URL | ✅ | Full web URL of the Glances endpoint |
| Display Mode | — | `Embedded` (inside the widget) or `Link` (opens in a new tab) |
| Height / Width | — | Frame size in pixels / percent |
| Full Width | — | Span all dashboard columns |
| Refresh Interval | — | Seconds between frame reloads (Glances also self-updates) |

---

## Server Uptime

### Purpose
Monitors HTTP endpoints for availability with a 1-hour live bar and 7-day history.

### Before you configure
- The URLs to monitor are reachable from the DashHub server

### Configuration

| Setting | Required | Description |
|---------|----------|-------------|
| Endpoints | ✅ | One or more Name + URL pairs |
| Check Interval | — | Seconds between checks (default 300 = 5 minutes) |

### Using the widget
- The bar shows the last hour as **12 five-minute segments**: green = all checks up, red = at least one failure in that slot, gray = no data yet
- The footer shows 1-hour and 7-day uptime percentages plus average latency
- **Click the bar** to open the history modal: a 7-day hourly bar, the last-hour bar, and the 20 most recent checks with timestamps
- Checks run while the widget's page is open; gaps appear as gray while the page is closed

---

## Status Indicators

### Purpose
Compact color-coded health dots for many endpoints, optionally grouped by category.

### Configuration

| Setting | Required | Description |
|---------|----------|-------------|
| Endpoints | ✅ | Name, URL, HTTP **Method**, **Expected Status**, **Timeout (seconds)**, optional **Category** |
| Show Latency / Show Status Code | — | Extra detail next to each dot |
| Auto-refresh interval | — | Default 30 minutes |

### Using the widget
- Green = up, red = down, yellow = warning (unexpected status code)
- A manual refresh button forces an immediate re-check

---

## System Info

### Purpose
CPU, memory, disk, and network summary cards for a server, collected over SSH.

### Configuration

| Setting | Required | Description |
|---------|----------|-------------|
| Connection | ✅ | A saved SSH connection (see [SSH Management](ssh.md)) |
| Refresh Interval | — | Seconds (default 30) |
| Show CPU / Memory / Disk / Network | — | Toggle individual cards |

---

## Process List

### Purpose
Sortable table of server processes with usage bars, collected over SSH.

### Configuration

| Setting | Required | Description |
|---------|----------|-------------|
| Connection | ✅ | Saved SSH connection |
| Refresh Interval | — | Seconds (default 10) |
| Max Processes | — | Rows fetched (default 25) |
| Sort By / Order | — | cpu / memory / pid, ascending or descending |
| View Mode | — | `All Processes` or `Selected Processes` |
| Filter / Selected Processes | — | Text filter, or a watch-list of process names (partial match: `python` matches `python3`) |

---

## Service Status

### Purpose
Live status dots for systemd services, over SSH.

### Configuration

| Setting | Required | Description |
|---------|----------|-------------|
| Connection | ✅ | Saved SSH connection |
| Services | ✅ | Service unit names to watch (e.g. `nginx`, `docker`) |
| Refresh Interval | — | Seconds (default 30) |

> **Note:** Checks use a 30-second SSH timeout; unresponsive hosts show as unknown rather than blocking the dashboard.

---

## System Logs

### Purpose
journalctl log viewer with service and priority filters, over SSH.

### Configuration

| Setting | Required | Description |
|---------|----------|-------------|
| Connection | ✅ | Saved SSH connection |
| Service | — | Restrict to one unit (e.g. `nginx`) |
| Priority | — | `emerg` … `debug` (default `info`) |
| Lines | — | Lines fetched (default 100) |
| Refresh Interval | — | Seconds (default 30) |

---

## Database Monitor

### Purpose
MySQL/MariaDB health and statistics, collected over SSH on the database host.

### Before you configure
- The `mysql` client exists on the target server
- A database user with permission to read status variables is available

### Configuration

| Setting | Required | Description |
|---------|----------|-------------|
| Connection | ✅ | Saved SSH connection to the DB host |
| DB Host / Port | ✅ | As seen **from that server** (default `127.0.0.1:3306`) |
| DB User / Password | ✅ | Database credentials |

> **Tip:** The widget can auto-detect credentials from well-known application configs on the target server (Frappe, WordPress, Laravel).

---

Next: [Productivity Widgets](productivity.md)
