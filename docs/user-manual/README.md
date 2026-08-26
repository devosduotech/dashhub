# DashHub User Manual

**A local-first, self-hosted operations dashboard — you decide what it looks like.**

Welcome to DashHub. This manual explains how to build, configure, and use your own dashboard workspace. It is written for **end users**: anyone who has a running DashHub installation and wants to make it their own.

> Installation steps live in the separate [Installation & Deployment Guide](../deployment/README.md). Security architecture lives in [SECURITY.md](../../docs/project/SECURITY.md).

---

## What is DashHub?

DashHub brings server monitoring, SSH access, productivity tools, service health, bookmarks, and information feeds into a single web page that runs on your own infrastructure.

It is **local-first**: there is no cloud account, no hosted service, and no external dependency. Everything — your layout, your widgets, your credentials — is stored on your own machine inside a single data directory.

## Key concepts

| Concept | Meaning |
|---------|---------|
| **Dashboard** | Your whole workspace — everything you see after opening DashHub |
| **Page** | A tab within the dashboard. Each page has its own name, icon, and column layout |
| **Column** | A vertical stack on a page. Pages hold 1–6 columns |
| **Widget** | A building block (clock, SSH terminal, weather, uptime monitor…) placed in a column |
| **Widget configuration** | The settings that make a widget yours — URLs, endpoints, connections, display options |
| **Edit Mode** | A special mode in which pages and widgets can be added, arranged, and configured |

## Local-first architecture

DashHub is configuration-driven. The application ships **empty** — no pages, no widgets, no opinions about your layout. You build the workspace that matches your needs, and DashHub persists it locally in `data/conf.yml`.

> Your DashHub installation may contain different pages and page names depending on how the dashboard has been configured. This manual therefore explains capabilities and workflows rather than a fixed layout.

## Terminology used in this manual

- **Edit Mode** — toggled from the toolbar; enables the widget palette, page settings, drag & drop
- **Connection** — a saved SSH server profile (host, port, user, authentication) reused by several widgets
- **Endpoint** — an HTTP URL monitored by the Server Uptime or Status Indicators widgets

---

## Table of contents

| Chapter | File | Covers |
|---------|------|--------|
| 1–2 | [Getting Started](getting-started.md) | Accessing DashHub, the interface, navigation, Edit Mode |
| 3 | [Building Your Dashboard](dashboard.md) | Pages, columns, adding/moving/removing widgets, saving |
| 4 | [Widgets Overview](widgets.md) | Full widget catalog and common configuration patterns |
| 5 | [SSH Management](ssh.md) | Connections, authentication, terminal usage, known hosts |
| 6 | [Monitoring Widgets](monitoring.md) | Glances, Server Uptime, Status Indicators, System Info, Process List, Service Status, System Logs, Database Monitor |
| 7 | [Productivity Widgets](productivity.md) | Calendar, Notes, Reminders, Clock |
| 8 | [Information & Resources](resources.md) | Quick Links, RSS, YouTube, IFrame, Latest Versions |
| 9 | [Network & Utilities](network.md) | Public IP, Weather, Speedtest |
| 10 | [Backup & Restore](backup-restore.md) | What to back up and how |
| 11 | [Troubleshooting](troubleshooting.md) | Problem → cause → resolution matrix |
| 12 | [FAQ](faq.md) | Frequently asked questions |

---

*Applies to DashHub v1.0.18. Screenshots are inserted as numbered placeholders; see [docs/SHOTLIST.md](../SHOTLIST.md) for the capture list.*
