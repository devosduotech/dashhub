# Documentation Screenshot Shotlist

Capture these figures from a **sanitized demo instance** — never from production OSDuo infrastructure (see "Sanitization checklist" below). Save files into `docs/images/` using the listed filenames; the manual's placeholders already reference them.

## Demo instance setup

A pre-built configuration is provided at [`conf.yml`](demo/conf.yml). It creates three pages (Dashboard, Server Operations, Content & Resources) with widgets covering every screenshot in the shotlist. SSH connects to your local machine; uptime/status endpoints use live public URLs.

**Quick start:**

```bash
# 1. Start a fresh DashHub instance (data/ must be empty)
docker compose up -d

# 2. Replace the generated config with the demo config
cp docs/demo/conf.yml data/conf.yml

# 3. Restart so the new config loads
docker compose restart
```

### Prerequisites for live data

The demo config points SSH at `localhost` (your machine). For the monitoring widgets to show real data:

| Requirement | Why | How to check |
|-------------|-----|--------------|
| SSH enabled on localhost | System Info, Process List, Service Status, System Logs, SSH Terminal | `ssh localhost echo ok` |
| Your SSH key in `~/.ssh/authorized_keys` | Auth type is `key` (password auth not used in demo) | `ssh localhost echo ok` should work without password |
| Glances web server (optional) | Glances iframe widget | `pip install glances[web] && glances -w` on port 61208 |

If SSH is not available, the SSH-backed widgets show a "connecting" state — crop or capture them as-is for the shotlist.

### Pre-configured live endpoints

These work out of the box with no setup:

| Widget | Endpoint | Status |
|--------|----------|--------|
| Server Uptime | `https://www.example.com` | Returns 200 ✓ |
| Server Uptime | `https://httpbin.org/get` | Returns 200 ✓ |
| Status Indicators | `https://www.example.com` | Returns 200 ✓ |
| Status Indicators | `https://httpbin.org/status/200` | Returns 200 ✓ |
| IFrame | `https://www.example.com` | Embeds ✓ |
| RSS | Hacker News + BBC Tech | Live feeds ✓ |
| YouTube | MKBHD + Fireship | Live channels ✓ |
| Weather | London (Open-Meteo) | Live data ✓ |
| Public IP | ipinfo.io | Live data ✓ |
| Speedtest | Cloudflare | Live test ✓ |
| Latest Versions | npm + PyPI | Live lookups ✓ |

## Demo data to prepare

| Instead of | Use |
|------------|-----|
| Real server IPs | `192.0.2.100`, `192.0.2.101` (RFC 5737 documentation range) |
| Real hostnames | `demo.example.com`, `web01.demo.example.com` |
| Customer names | `Example Customer`, `Demo Corp` |
| Usernames | `demo` |
| Real domains/URLs | `https://portal.example.com` |

## Shotlist

| # | File | Figure | Capture |
|---|------|--------|---------|
| 1 | `dashboard.png` | DashHub workspace | Normal mode, 3–4 pages with varied widgets (monitoring + productivity), demo data |
| 2 | `edit-mode.png` | Edit Mode and widget controls | Edit Mode ON — palette button, one widget hovered showing settings/move/remove controls, "Editing Dashboard" badge visible |
| 3 | `page-settings.png` | Configuring page columns | Page settings dialog: name, icon grid, column count |
| 4 | `widget-palette.png` | Adding a widget | Palette open, category groups visible (Infrastructure/Network/Productivity/Content/General) |
| 5 | `widget-settings.png` | Widget configuration | A settings dialog mid-edit (Weather or Clock — no secrets) |
| 6 | `drag-drop.png` | Moving a widget | Mid-drag with visible drop zones and highlighted destination column |
| 7 | `ssh-settings.png` | Configuring an SSH connection | Connection editor with `demo.example.com`, `192.0.2.100`, user `demo` — password field EMPTY |
| 8 | `ssh-terminal.png` | SSH terminal session | Connected to the demo host, prompt showing `demo@demo:~$`, harmless `ls`/`uptime` output |
| 9 | `calendar.png` | Calendar month view | Month mode with 2–3 demo events, day panel open |
| 10 | `monitoring.png` | Monitoring widgets | Page with Server Uptime (green bars), Status Indicators (green dots), System Info |

## Sanitization checklist (every screenshot)

- [ ] No real IPs, hostnames, domains, or customer/user names anywhere
- [ ] No credentials filled in — password/key fields empty
- [ ] Browser chrome cropped or in a clean profile (no personal bookmarks/history)
- [ ] Terminal output free of internal hostnames, keys, tokens
- [ ] PNG, ~1600px wide, readable text at 100%

## Insertion

Placeholders in the manual reference `../images/<file>` from the `user-manual/` pages and `images/<file>` where linked from elsewhere. Drop the PNGs into `docs/images/` and the figures go live.
