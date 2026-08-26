# Widgets Overview

DashHub ships 21 widgets. This chapter is the catalog and explains configuration patterns common to all of them. Per-widget details live in the category chapters:

| Chapter | Widgets |
|---------|---------|
| [SSH Management](ssh.md) | SSH Terminal |
| [Monitoring](monitoring.md) | Glances, Server Uptime, Status Indicators, System Info, Process List, Service Status, System Logs, Database Monitor |
| [Productivity](productivity.md) | Calendar, Notes, Reminders, Clock |
| [Information & Resources](resources.md) | Quick Links, RSS, YouTube, IFrame, Latest Versions |
| [Network & Utilities](network.md) | Public IP, Weather, Speedtest |

## Catalog

| Widget | Palette category | Purpose |
|--------|------------------|---------|
| SSH Terminal | Infrastructure | Web-based SSH terminal with saved connections |
| Glances Server | Infrastructure | Server monitoring via an embedded Glances page |
| System Info | Infrastructure | CPU / memory / disk / network overview over SSH |
| Process List | Infrastructure | Sortable process table over SSH |
| Service Status | Infrastructure | systemd service status over SSH |
| System Logs | Infrastructure | journalctl log viewer over SSH |
| Database Monitor | Infrastructure | MySQL/MariaDB statistics over SSH |
| Latest Versions | Infrastructure | Track latest package versions (npm, GitHub, PyPI) |
| Server Uptime | Network | Endpoint availability with 1-hour / 7-day history |
| Status Indicators | Network | Color-coded endpoint health dots |
| Speedtest | Network | Ping / download / upload test |
| Public IP | Network | Public IP address and location |
| Weather | General | Current conditions and 5-day forecast |
| Calendar | Productivity | CalDAV calendar (Nextcloud and compatible) |
| Notes | Productivity | Personal notes with priority and inline editing |
| Reminders | Productivity | Task list with checkboxes and priorities |
| Clock | General | Live time and date with timezone support |
| Quick Links | General | Bookmark shortcuts with categories and icons |
| RSS Feed | Content | News and article aggregation |
| YouTube | Content | Latest videos from YouTube channels |
| IFrame | Content | Embed any compatible web page |

## Common patterns

### Adding and configuring

1. Enable **Edit Mode**.
2. Open the **widget palette** and click a widget.
3. Click the widget's **Settings** (gear) control.
4. Fill in the configuration — values apply and save automatically.
5. Close the dialog.

### Settings that appear everywhere

| Setting | Meaning |
|---------|---------|
| **Refresh Interval** | How often the widget re-fetches data. Applies while the page is open; changing it takes effect the next time the widget loads (reload the page after changing if needed) |
| **Connection** (SSH-backed widgets) | Which saved SSH connection the widget uses — see [SSH Management](ssh.md) |
| **Display Mode** | Some widgets offer grid/list or embedded/link presentation |

### Credentials and security

Widgets that hold secrets (SSH passwords/keys, Calendar app password, database password) store them **server-side** in the configuration file. The API never returns secrets to the browser — widgets reference credentials by connection ID. Encryption at rest is planned for Phase 2; until then the data directory must be protected with normal file permissions (see [SECURITY.md](../project/SECURITY.md)).

### Widget errors

A widget that cannot load data shows an error state inside its own frame — the rest of the dashboard keeps working. Open the widget's settings to review its configuration, and see [Troubleshooting](troubleshooting.md).

---

Chapter 5: [SSH Management](ssh.md)
