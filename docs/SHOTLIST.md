# Documentation Screenshot Shotlist

Capture these figures from a **sanitized demo instance** — never from production OSDuo infrastructure (see "Sanitization checklist" below). Save files into `docs/images/` using the listed filenames; the manual's placeholders already reference them.

## Demo instance setup

A pre-built configuration is provided at [`conf.yml`](demo/conf.yml). It creates three pages (Dashboard, Server Operations, Content & Resources) with widgets covering every screenshot in the shotlist. All IPs use RFC 5737 documentation addresses and all hostnames use `.example.com`.

**Quick start:**

```bash
# 1. Start a fresh DashHub instance (data/ must be empty)
docker compose up -d

# 2. Replace the generated config with the demo config
cp docs/demo/conf.yml data/conf.yml

# 3. Restart so the new config loads
docker compose restart
```

Open DashHub and enable **Edit Mode**. The three page tabs (Dashboard, Server Operations, Content & Resources) are ready to capture.

> **Note:** The SSH, Glances, and Database Monitor widgets point at `demo.example.com` / `192.0.2.100` which will not resolve on your network. They will show "connecting" or empty states — crop or capture them in that state for the shotlist, or connect them to a real lab box if available.

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
