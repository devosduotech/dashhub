# OSDuo DashHub - Project Report

**Version**: 1.0  
**Date**: 2026-04-06  
**Status**: APPROVED FOR IMPLEMENTATION

> **Note (2026-08-19):** This report is the original specification and intentionally
> ahead of the codebase. For the current, accurate view of what exists, see
> **[STATUS.md](./STATUS.md)** (Implemented / Partial / Planned) and
> **[SECURITY.md](./SECURITY.md)** (Phase-1 boundary and Phase-2 backlog).

---

## Document Information

| Field | Value |
|-------|-------|
| Project Name | OSDuo DashHub |
| Project Type | Self-hosted Dashboard Platform |
| Lead Developer | TBD |
| Start Date | TBD |
| Target Completion | 10 weeks (estimated) |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [Technical Architecture](#3-technical-architecture)
4. [Feature Specifications](#4-feature-specifications)
5. [Data Models](#5-data-models)
6. [API Specifications](#6-api-specifications)
7. [Security Specifications](#7-security-specifications)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Implementation Phases](#9-implementation-phases)
10. [File Structure](#10-file-structure)
11. [Dependencies](#11-dependencies)
12. [User Stories](#12-user-stories)
13. [Non-Functional Requirements](#13-non-functional-requirements)
14. [Glossary](#14-glossary)
15. [References](#15-references)
16. [Appendices](#16-appendices)

---

## 1. Executive Summary

### 1.1 Project Purpose

OSDuo DashHub is a unified, modular, self-hosted dashboard platform designed to consolidate server management, terminal access, media feeds, and quick links into a single customizable web interface.

### 1.2 Key Objectives

- Provide centralized visibility into multiple server environments
- Enable one-click SSH access to servers without credential memorization
- Display real-time server metrics via Glances integration
- Aggregate news feeds and YouTube channels in one location
- Offer 100% web-based configuration
- Support Docker-based deployment for portability

### 1.3 Target Audience

- System administrators managing multiple Linux/Unix servers
- DevOps engineers requiring quick infrastructure access
- Homelab enthusiasts with diverse service setups
- Teams needing unified infrastructure monitoring

### 1.4 Technology Foundation

The project is a **fresh build** (Vue 3 + Pinia + Vite) inspired by existing self-hosted dashboards (Dashy, Glance) and SSH clients (Tabby, Termix), with significant enhancements for server monitoring, SSH terminal access, and media aggregation.

### 1.5 Key Benefits

| Benefit | Description |
|---------|------------|
| **Unified Access** | Single dashboard for all server and service needs |
| **Time Savings** | One-click SSH eliminates credential lookup |
| **Real-time Monitoring** | Live server metrics at a glance |
| **Customizable** | Fully configurable via web UI |
| **Self-hosted** | Complete control over data and deployment |
| **Modular** | Add/remove widgets as needs change |

---

## 2. Project Overview

### 2.1 Project Name

**OSDuo DashHub**

### 2.2 Project Summary

A modular dashboard platform combining:
- Server monitoring via Glances agents
- Web-based SSH terminal (Tabby/Termix-style)
- YouTube channel video aggregation
- RSS feed aggregation
- Quick links and bookmarks

### 2.3 Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                     OSDuo DashHub                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │    Pages      │  │   Widgets     │  │   Settings    │   │
│  │   System      │  │   Engine     │  │   Panel       │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Widget Types                         │  │
│  ├─────────┬─────────┬─────────┬─────────┬───────────────┤  │
│  │ Quick   │ Glances │   SSH   │YouTube  │     RSS      │  │
│  │ Links   │ Server  │Terminal │ Videos  │    Feeds     │  │
│  └─────────┴─────────┴─────────┴─────────┴───────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  External Services                       │  │
│  │   Glances Agents  │  SSH Bridge      │  YouTube/RSS     │  │
│  │                     (Node.js ssh2)    │                    │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 Reference Projects

| Project | Purpose | Integration Method |
|---------|---------|-------------------|
| Dashy | Feature reference | Inspiration (not forked) |
| Glances | Server monitoring | REST API on agents |
| Termix | SSH terminal | WebSocket bridge |
| Tabby | SSH connection management | UI patterns |
| Glance | Feed aggregation | Feature reference |

### 2.5 Project Scope

#### In Scope
- Multi-page dashboard with widget system
- Glances server monitoring integration
- Web-based SSH terminal with saved connections
- YouTube channel video display
- RSS feed aggregation
- Full UI-based configuration
- Docker deployment

#### Out of Scope (Phase 1)
- User authentication/RBAC
- Multi-user support
- Cloud backup/sync
- Historical charting
- Alerting system
- Mobile native app
- API access for automation

---

## 3. Technical Architecture

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            OSDuo DashHub                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      Frontend Layer                                │  │
│  │                                                                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │  │
│  │  │ Vue.js 3 │  │  Pinia  │  │ Vite 5  │  │Axios/HTTP│       │  │
│  │  │  UI      │  │  State  │  │  Build  │  │  Client  │       │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │  │
│  │                                                                  │  │
│  │  ┌──────────────────────────────────────────────────────────┐   │  │
│  │  │                   Vue Components                          │   │  │
│  │  │  Pages │ Widgets │ Forms │ Layout │ Common               │   │  │
│  │  └──────────────────────────────────────────────────────────┘   │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                   │
│                                    │                                   │
│  ┌────────────────────────────────┼──────────────────────────────────┐  │
│  │                         Services Layer                             │  │
│  │                                                                  │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐│  │
│  │  │ Glances   │  │   RSS     │  │ YouTube   │  │   SSH   ││  │
│  │  │   API     │  │  Parser  │  │   Fetcher │  │  Bridge ││  │
│  │  └────────────┘  └────────────┘  └────────────┘  └──────────┘│  │
│  │                                                                  │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │              Backend Services (Node.js)                    │  │  │
│  │  │   Config Manager │ Credentials │ WebSocket Terminal       │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                   │
│                                    │                                   │
│  ┌────────────────────────────────┼──────────────────────────────────┐  │
│  │                     External Services                              │  │
│  │                                                                  │  │
│  │  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐│  │
│  │  │   Glances       │   │  SSH Bridge     │   │   YouTube       ││  │
│  │  │   Agent         │   │  (Node.js ssh2) │   │   RSS/API       ││  │
│  │  │   :61208        │   │  (internal)     │   │                 ││  │
│  │  └────────┬────────┘   └────────┬────────┘   └────────┬────────┘│  │
│  │           │                     │                     │          │  │
│  └───────────┼─────────────────────┼─────────────────────┼──────────┘  │
│              │                     │                     │              │
│              ▼                     ▼                     ▼              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      Target Infrastructure                         │  │
│  │                                                                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │  │
│  │  │ Server 1 │  │ Server 2 │  │ Server 3 │  │ Internet │       │  │
│  │  │          │  │          │  │          │  │ Services │       │  │
│  │  │ glances  │  │ glances  │  │ glances  │  │ YouTube │       │  │
│  │  │   -w     │  │   -w     │  │   -w     │  │  RSS    │       │  │
│  │  │  sshd    │  │  sshd    │  │  sshd    │  │  Feeds  │       │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Communication Flow

```
┌─────────────────┐         ┌─────────────────┐
│   Browser       │         │   Dashboard     │
│   (Vue.js)      │◄───────►│   Container     │
│                 │  HTTP   │   (Nginx)       │
└────────┬────────┘         └────────┬────────┘
         │                         │
         │                         │ REST API
         │                         ▼
         │                 ┌─────────────────┐
         │                 │   Glances API    │
         │                 │   :61208/api/4  │
         │                 └─────────────────┘
         │
         │  WebSocket
         ▼
┌─────────────────┐         ┌─────────────────┐
│   Browser       │◄───────►│   Dashboard     │
│   (xterm.js)    │  WS    │   Container     │
│                 │         │   (Nginx+API)   │
│                 │         │   :48215        │
└─────────────────┘         └────────┬────────┘
                                     │
                                     │ SSH (ssh2)
                                     ▼
                             ┌─────────────────┐
                             │   Target        │
                             │   Server        │
                             │   :22           │
                             └─────────────────┘
```

### 3.3 Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend Framework** | Vue.js 3 | 3.4+ | UI framework |
| **Build Tool** | Vite | 5+ | Fast builds, HMR |
| **State Management** | Pinia | 2+ | Reactive state |
| **HTTP Client** | Axios | 1+ | API communication |
| **Terminal** | xterm.js | 5+ | Terminal emulation |
| **SSH Bridge** | Node.js ssh2 | 1.15+ | Native WebSocket SSH |
| **Server Monitoring** | Glances | 4.x | Agent-based stats |
| **Web Server** | Nginx | Latest | Frontend serving |
| **Container** | Docker | 24+ | Packaging |
| **Orchestration** | Docker Compose | 2+ | Multi-container |

---

## 4. Feature Specifications

### 4.1 Multi-Page Dashboard System

#### Description
Full multi-page support allowing users to organize widgets into logical groups. Each page can contain multiple widgets in a configurable grid layout.

#### Feature List
| ID | Feature | Priority | Status |
|----|---------|----------|--------|
| F1 | Create, rename, delete pages | P0 | Planned |
| F2 | Reorder pages via drag-and-drop | P1 | Planned |
| F3 | Independent widget configuration per page | P0 | Planned |
| F4 | Page-level icon selection | P1 | Planned |
| F5 | Default landing page configurable | P1 | Planned |
| F6 | Pages persist in YAML configuration | P0 | Planned |

#### Configuration Schema
```yaml
pages:
  - name: "Page Name"
    icon: "icon-name"
    items:
      - widget configuration
```

---

### 4.2 Widget System

#### Description
Modular, reusable components that display specific data or provide functionality. Widgets are the building blocks of each page.

#### Widget Types
1. **Quick Links** - Web bookmark shortcuts
2. **Glances Server** - Server monitoring display
3. **SSH Terminal** - Web-based terminal access
4. **YouTube Channel** - Video thumbnail aggregator
5. **RSS Feed** - News/article aggregator
6. **IFrame** - Embed external content

#### Common Widget Features
| ID | Feature | Priority | Status |
|----|---------|----------|--------|
| F7 | Draggable positioning within page | P1 | Planned |
| F8 | Resizable (when supported) | P2 | Planned |
| F9 | Settings modal for configuration | P0 | Planned |
| F10 | Remove widget from page | P0 | Planned |
| F11 | Widget-level refresh button | P1 | Planned |
| F12 | Error state display | P0 | Planned |

---

### 4.3 Quick Links Widget

#### Purpose
Display clickable shortcuts to web services and applications.

#### Features
| ID | Feature | Priority | Status |
|----|---------|----------|--------|
| F13 | Add/remove/edit links | P0 | Planned |
| F14 | Icon selection (emoji, FA, image URL) | P0 | Planned |
| F15 | Custom display title | P0 | Planned |
| F16 | Target URL configuration | P0 | Planned |
| F17 | Open behavior: new tab, same tab, modal | P0 | Planned |
| F18 | Group links into categories | P1 | Planned |
| F19 | Grid/list view toggle | P1 | Planned |
| F20 | Custom descriptions | P2 | Planned |
| F21 | Status indicator (optional ping check) | P2 | Planned |

#### UI Mockup
```
┌──────────────────────────────────────────────────────────┐
│ 📌 Quick Links                              [Edit] [+]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  🏠 Home Services                                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐        │
│  │    🏠     │ │    📦     │ │    🌐     │        │
│  │ Home      │ │ Portainer  │ │  NAS      │        │
│  │ Assistant │ │           │ │           │        │
│  └────────────┘ └────────────┘ └────────────┘        │
│                                                          │
│  📊 Monitoring                                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐        │
│  │    📈     │ │    🖥️     │ │    🔧     │        │
│  │ Grafana   │ │ Prometheus │ │  Uptime   │        │
│  │           │ │           │ │  Kuma    │        │
│  └────────────┘ └────────────┘ └────────────┘        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### Configuration Schema
```yaml
type: quick-links
title: "Quick Links"
config:
  columns: 3
  displayMode: grid
  links:
    - title: "Home Assistant"
      url: "https://ha.example.com"
      icon: "home"
      description: "Home automation"
      target: newtab
      category: "Smart Home"
```

---

### 4.4 Glances Server Widget (IFrame-based)

#### Purpose
Display real-time server metrics by embedding the Glances web interface via iframe.

#### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Dashboard Page                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Server: Web Server 01                    [⚙️] [↗️]  │  │
│  │  ┌───────────────────────────────────────────────┐  │  │
│  │  │                                               │  │  │
│  │  │          Glances Web UI (iframe)             │  │  │
│  │  │          http://157.10.98.22:61208/         │  │  │
│  │  │                                               │  │  │
│  │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│  │  │
│  │  │  │ CPU │ │ MEM │ │DISK │ │NET  │ │PROC ││  │  │
│  │  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘│  │  │
│  │  │                                               │  │  │
│  │  └───────────────────────────────────────────────┘  │  │
│  │  🔗 SSH  │  🔄 Refresh  │  ✕ Remove               │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### Features
| ID | Feature | Priority | Status |
|----|---------|----------|--------|
| F22 | Iframe embedding of Glances web UI | P0 | Planned |
| F23 | Configurable iframe URL (host:port) | P0 | Planned |
| F24 | Quick SSH button (links to SSH widget) | P0 | Planned |
| F25 | Refresh iframe content | P0 | Planned |
| F26 | Connection status indicator | P1 | Planned |
| F27 | Error state for unreachable servers | P0 | Planned |
| F28 | Configurable iframe height/width | P1 | Planned |
| F29 | Open Glances in new tab | P0 | Planned |
| F30 | SSH quick-connect configuration | P0 | Planned |

#### Display Modes
1. **Embedded**: Full Glances UI in iframe (default)
2. **Link Only**: Just a card with server info and links
3. **Compact**: Small iframe with essential stats

**Note**: Glances provides a full-featured web interface. By using iframe, we get all Glances features (CPU, RAM, Disk, Network, Processes, Docker, etc.) without building custom metric displays.

#### Compact View UI
```
┌──────────────────────────────────────────────────────────┐
│ 🖥️ server-web-01                          🟢 Online   │
│ root@192.168.1.10:61208                       [⚙️] [↗️]│
├──────────────────────────────────────────────────────────┤
│                                                          │
│  CPU  ████████████░░░░░░░░░  34%                      │
│  RAM  ████████████████░░░░░  68%    10.8 / 16 GB       │
│  DISK /  ████░░░░░░░░░░░░░░  23%    92 / 500 GB       │
│                                                          │
│  LOAD  0.45 | 0.32 | 0.28          UPTIME  45d 3h     │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  🔗 SSH  │  📊 Details  │  🔄 Refresh  │  ✕ Remove   │
└──────────────────────────────────────────────────────────┘
```

#### Expanded View UI
```
┌──────────────────────────────────────────────────────────┐
│  🖥️ server-web-01 - Full Stats           [✕ Close]    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │    CPU Stats    │  │   MEM Stats     │              │
│  │ ┌─────────────┐ │  │ ┌─────────────┐ │              │
│  │ │  [Graph]    │ │  │ │  [Graph]    │ │              │
│  │ └─────────────┘ │  │ └─────────────┘ │              │
│  │ User: 24%      │  │ Used: 10.8 GB   │              │
│  │ System: 8%     │  │ Free: 5.2 GB   │              │
│  │ I/O: 2%        │  │ Buffers: 1GB   │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Network I/O    │  │   Top Processes │              │
│  │ RX: 1.2 MB/s   │  │ 1. nginx    12%│              │
│  │ TX: 0.8 MB/s   │  │ 2. docker   8% │              │
│  └─────────────────┘  │ 3. mysql    5% │              │
│                       └─────────────────┘              │
│                                                          │
│  ┌─────────────────────────────────────────┐           │
│  │  Docker Containers (5 running)          │           │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │           │
│  │  │ nginx│ │ redis│ │app:1 │ │app:2 │ │           │
│  │  │  ✓   │ │  ✓   │ │  ✓   │ │  ✓   │ │           │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ │           │
│  └─────────────────────────────────────────┘           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### Configuration Schema
```yaml
type: glances
title: "Server Alpha"
config:
  url: "http://192.168.1.10:61208"  # Full Glances URL
  displayMode: embedded               # embedded, link, compact
  height: 400                        # iframe height in pixels
  refreshInterval: 60                # Auto-refresh interval (optional)
  ssh:
    enabled: true                    # Enable SSH quick-connect
    host: "192.168.1.10"
    port: 22
    username: "admin"
```

---

### 4.5 SSH Terminal Widget

#### Purpose
Provide web-based terminal access to servers with saved connection credentials.

#### Features
| ID | Feature | Priority | Status |
|----|---------|----------|--------|
| F41 | Connection manager (add/edit/delete) | P0 | Planned |
| F42 | Group connections by category/folder | P1 | Planned |
| F43 | One-click connect from widget | P0 | Planned |
| F44 | Multi-tab terminal support | P0 | Planned |
| F45 | Session persistence (reconnect on refresh) | P1 | Planned |
| F46 | Password authentication | P0 | Planned |
| F47 | SSH key authentication | P0 | Planned |
| F48 | SSH key agent forwarding | P1 | Planned |
| F49 | Jump host/bastion support | P1 | Planned |
| F50 | Encrypted credential storage | P0 | Planned |
| F51 | Connection status indicators | P0 | Planned |
| F52 | Terminal theme selection | P1 | Planned |
| F53 | Terminal font size adjustment | P1 | Planned |
| F54 | Scrollback buffer | P0 | Planned |
| F55 | Copy/paste support | P0 | Planned |
| F56 | Full-screen terminal mode | P1 | Planned |

#### Connection Manager UI
```
┌──────────────────────────────────────────────────────────┐
│ 🖥️ SSH Terminal                              [⚙️] [+]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─ Production ─────────────────────────────────────┐   │
│  │                                                    │   │
│  │  🟢 web-server-01        root@192.168.1.10  [▶] │   │
│  │  🟢 db-server-01         admin@192.168.1.11  [▶] │   │
│  │  🟢 nas-server-01       admin@192.168.1.12  [▶] │   │
│  │  🔴 backup-server-01     (offline)           [▶] │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ Development ────────────────────────────────────┐   │
│  │                                                    │   │
│  │  🟢 dev-server-01        dev@192.168.2.10   [▶] │   │
│  │  🟢 test-server-01      test@192.168.2.11 [▶] │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [+ Add Connection]  [🔐 Manage Credentials]            │
└──────────────────────────────────────────────────────────┘
```

#### Terminal Modal UI
```
┌──────────────────────────────────────────────────────────┐
│  🖥️ web-server-01 - root@192.168.1.10         [↗️][🔇][✕]│
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Last login: Mon Apr  6 09:23:45 2026 from 192.168.1.5 │
│  root@web-server-01:~# █                               │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [+] New Tab  │  Tab 1: web-01  │  [Tab 2] [Tab 3]     │
└──────────────────────────────────────────────────────────┘
```

#### Connection Form Fields
| Field | Type | Required | Default |
|-------|------|----------|---------|
| name | string | Yes | - |
| host | string | Yes | - |
| port | number | No | 22 |
| username | string | Yes | - |
| authType | enum | Yes | key |
| password | string | Conditional | - |
| privateKey | string | Conditional | - |
| passphrase | string | No | - |
| jumpHost | string | No | - |
| group | string | No | - |
| tags | array | No | - |

#### Architecture
```
Browser (xterm.js) → WebSocket → Node.js ssh2 → SSH → Target Server
                         ↑
                   Credential Store
                   (encrypted)
```

#### Configuration Schema
```yaml
type: ssh
title: "SSH Connections"
config:
  defaultShell: "/bin/bash"
  theme: "monokai"
  fontSize: 14
  connections:
    - name: "Web Server Alpha"
      host: "192.168.1.10"
      port: 22
      username: "admin"
      authType: "key"
      group: "Production"
```

---

### 4.6 YouTube Widget

#### Purpose
Display latest videos from YouTube channels as clickable thumbnails.

#### Features
| ID | Feature | Priority | Status |
|----|---------|----------|--------|
| F57 | Add channel by ID or URL | P0 | Planned |
| F58 | Display video thumbnails | P0 | Planned |
| F59 | Show video title | P0 | Planned |
| F60 | Show view count | P1 | Planned |
| F61 | Show publish date/relative time | P0 | Planned |
| F62 | Configurable videos per channel | P0 | Planned |
| F63 | Grid/list view toggle | P1 | Planned |
| F64 | Thumbnail size options | P1 | Planned |
| F65 | Click to open video (new tab) | P0 | Planned |
| F66 | Click to open channel page | P1 | Planned |
| F67 | Channel grouping | P1 | Planned |
| F68 | Manual refresh button | P1 | Planned |
| F69 | Cache videos (reduce API calls) | P0 | Planned |

#### UI Mockup
```
┌──────────────────────────────────────────────────────────┐
│ 📺 YouTube                               [⚙️] [↻] [+]  │
├──────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │    │
│  │ │ ▶       │ │  │ │ ▶       │ │  │ │ ▶       │ │    │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │    │
│  │ Video Title │  │ Video Title │  │ Video Title │    │
│  │ 12K views   │  │ 45K views   │  │ 8.2K views  │    │
│  │ 2 days ago  │  │ 5 days ago  │  │ 1 week ago  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │    │
│  │ │ ▶       │ │  │ │ ▶       │ │  │ │ ▶       │ │    │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │    │
│  │ Video Title │  │ Video Title │  │ Video Title │    │
│  │ 23K views   │  │ 67K views   │  │ 15K views   │    │
│  │ 3 days ago  │  │ 1 week ago  │  │ 2 weeks ago │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  Channels: Tech (3) | News (2) | DIY (1)  │ [More]    │
└──────────────────────────────────────────────────────────┘
```

#### Data Source
| Option | Method | Pros | Cons |
|--------|--------|------|------|
| RSS Feed | Channel RSS URL | No API key, free | Limited metadata |
| YouTube API | Data API v3 | Full features | Quota limits |

**Decision**: Use RSS first, upgrade to API if needed

#### RSS Feed URL Format
```
https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}
https://www.youtube.com/@{USERNAME}/videos
```

#### Configuration Schema
```yaml
type: youtube
title: "Tech Videos"
config:
  sources:
    - channelId: "UCXuqSBlHAE6Xw-yeJA0Tunw"
      name: "Linus Tech Tips"
    - channelId: "UCR-DXc1voovS8nhAvccRZhg"
      name: "Jeff Geerling"
  videosPerChannel: 3
  displayMode: grid
  thumbnailSize: medium
  cacheTime: 60  # minutes
```

---

### 4.7 RSS Feed Widget

#### Purpose
Aggregate and display items from RSS/Atom feeds.

#### Features
| ID | Feature | Priority | Status |
|----|---------|----------|--------|
| F71 | Add RSS/Atom feed by URL | P0 | Planned |
| F72 | Support for multiple feeds | P0 | Planned |
| F73 | Display item title | P0 | Planned |
| F74 | Display item description/excerpt | P0 | Planned |
| F75 | Display publish date | P0 | Planned |
| F76 | Display source feed name | P0 | Planned |
| F77 | Thumbnail from feed media (if available) | P1 | Planned |
| F78 | Click to open full article | P0 | Planned |
| F79 | Configurable items per feed | P0 | Planned |
| F80 | Collapse/expand feed sections | P1 | Planned |
| F81 | Mark as read (local) | P2 | Planned |
| F82 | Search within feeds | P2 | Planned |
| F83 | Feed validation on add | P0 | Planned |
| F84 | Error handling for failed feeds | P0 | Planned |
| F85 | Feed grouping by category | P1 | Planned |

#### UI Mockup
```
┌──────────────────────────────────────────────────────────┐
│ 📰 News Feeds                               [⚙️] [↻]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ▼ Hacker News                           ┌────────────┐│
│    ├─ Article: New AI Model Released...  │ [Settings] ││
│    │   2 hours ago • 342 comments         │ [+ Add]    ││
│    ├─ Post: Docker Alternatives...        │            ││
│    │   4 hours ago • 128 comments         │            ││
│    └─ Ask: What's your homelab setup?     │            ││
│        6 hours ago • 89 comments          │            ││
│                                            └────────────┘│
│  ▼ The Verge                                          │
│    ├─ Tech Review: Latest Gadgets...    │            ││
│    │   1 hour ago                         │            ││
│    └─ News: Industry Updates...          │            ││
│        3 hours ago                         │            ││
│                                                          │
│  ▼ Reddit r/selfhosted                                 │
│    ├─ Post: My 10-server setup...      │            ││
│    │   30 mins ago • 56 comments      │            ││
│    └─ Showcase: Homelab tour...        │            ││
│        2 hours ago • 112 comments     │            ││
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### Configuration Schema
```yaml
type: rss
title: "News Feeds"
config:
  feeds:
    - url: "https://news.ycombinator.com/rss"
      title: "Hacker News"
      icon: "hacker-news"
      group: "Tech"
    - url: "https://www.theverge.com/rss/index.xml"
      title: "The Verge"
      icon: "news"
      group: "Tech"
  itemsPerFeed: 5
  showThumbnails: true
  cacheTime: 15  # minutes
```

---

### 4.8 IFrame/Embed Widget

#### Purpose
Embed any web content (including Glances) directly into the dashboard.

#### Features
| ID | Feature | Priority | Status |
|----|---------|----------|--------|
| F85 | Embed external URL via iframe | P0 | Planned |
| F86 | Configurable iframe dimensions | P0 | Planned |
| F87 | Refresh button | P0 | Planned |
| F88 | Open in new tab option | P1 | Planned |
| F89 | Sandbox restrictions | P1 | Planned |
| F90 | Load timeout handling | P2 | Planned |

#### Configuration Schema
```yaml
type: iframe
title: "Embedded Content"
config:
  url: "http://157.10.98.22:61208"
  height: 400
  width: "100%"
  allowFullscreen: true
  refreshInterval: 0  # 0 = no auto-refresh
```

#### Use Cases
- Glances server monitoring (primary use case)
- Embedded dashboards
- External web applications
- Status pages

### 4.9 UI Configuration System

#### Purpose
Allow all configuration changes through the web interface without editing YAML files directly.

#### Features
| ID | Feature | Priority | Status |
|----|---------|----------|--------|
| F91 | Visual widget palette | P0 | Planned |
| F92 | Drag-and-drop widget placement | P1 | Planned |
| F93 | Inline widget editing | P0 | Planned |
| F94 | Page management (add/edit/delete/reorder) | P0 | Planned |
| F95 | Live preview of changes | P0 | Planned |
| F96 | Save to disk functionality | P0 | Planned |
| F97 | Export configuration | P1 | Planned |
| F98 | Import configuration | P1 | Planned |
| F99 | Reset to defaults | P1 | Planned |
| F100 | Undo/redo support | P2 | Planned |
| F101 | Auto-save option | P1 | Planned |

#### Configuration Editor Components
1. **Widget Palette**: Grid of available widget types
2. **Page Settings**: Name, icon, layout options
3. **Widget Settings**: Type-specific configuration form
4. **Settings Page**: Global app settings

---

## 5. Data Models

### 5.1 Configuration Schema

```typescript
interface AppConfig {
  appConfig: AppSettings;
  pages: Page[];
}

interface AppSettings {
  title: string;
  theme: string;
  language: string;
  iconSet: string;
}

interface Page {
  id: string;
  name: string;
  icon: string;
  items: PageItem[];
}

interface PageItem {
  id: string;
  type: WidgetType;
  title: string;
  position: Position;
  size: Size;
  config: WidgetConfig;
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

type WidgetType = 
  | 'quick-links'
  | 'glances'
  | 'ssh'
  | 'youtube'
  | 'rss'
  | 'iframe';

interface SshConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: 'password' | 'key' | 'agent';
  group?: string;
  tags?: string[];
}

interface WidgetConfig {
  // Widget-specific configuration
  [key: string]: any;
}
```

### 5.2 Credential Storage

```typescript
interface EncryptedCredentials {
  version: number;
  salt: string;
  iv: string;
  data: string;  // Encrypted JSON
}

interface DecryptedCredentials {
  sshKeys: {
    [keyName: string]: string;  // Private key content
  };
  passwords: {
    [connectionId: string]: string;  // Encrypted passwords
  };
}
```

### 5.3 Glances Response Structure

```typescript
interface GlancesResponse {
  cpu: {
    total: number;
    user: number;
    system: number;
    idle: number;
  };
  mem: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
  disk: {
    [mountPoint: string]: {
      total: number;
      used: number;
      free: number;
      percent: number;
    };
  };
  load: {
    min1: number;
    min5: number;
    min15: number;
  };
  system: {
    uptime: number;  // seconds
  };
  docker?: {
    containers: DockerContainer[];
  };
}

interface DockerContainer {
  name: string;
  status: 'running' | 'stopped' | 'paused';
  cpu: number;
  memory: number;
}
```

---

## 6. API Specifications

### 6.1 Glances API

**Endpoint**: `GET http://{host}:{port}/api/4/all`

**Authentication**: None (internal network only)

**Response**: JSON object containing system metrics

**Example Response**:
```json
{
  "cpu": {
    "total": 25.5,
    "user": 20.0,
    "system": 5.0,
    "idle": 74.5
  },
  "mem": {
    "total": 16384,
    "used": 8192,
    "free": 8192,
    "percent": 50.0
  },
  "disk": {
    "/": {
      "total": 500000,
      "used": 250000,
      "free": 250000,
      "percent": 50.0
    }
  },
  "load": {
    "min1": 0.5,
    "min5": 0.3,
    "min15": 0.2
  },
  "system": {
    "uptime": 3600000
  }
}
```

### 6.2 Internal API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/config` | GET | Get current configuration |
| `/api/config` | PUT | Save configuration |
| `/api/servers` | GET | List configured servers |
| `/api/servers` | POST | Add server |
| `/api/servers/:id` | DELETE | Remove server |
| `/api/servers/:id/stats` | GET | Fetch server stats from Glances |
| `/api/connections` | GET | List SSH connections |
| `/api/connections` | POST | Add connection |
| `/api/connections/:id` | PUT | Update connection |
| `/api/connections/:id` | DELETE | Delete connection |
| `/api/credentials/decrypt` | POST | Decrypt credentials |
| `/api/credentials/encrypt` | POST | Encrypt credentials |
| `/api/feeds` | GET | List RSS feeds |
| `/api/feeds` | POST | Add feed |
| `/api/feeds/:id` | DELETE | Remove feed |
| `/api/feeds/:id/items` | GET | Fetch feed items |

---

## 7. Security Specifications

### 7.1 Credential Encryption

| Aspect | Specification |
|--------|---------------|
| **Algorithm** | AES-256-CBC |
| **Key Derivation** | PBKDF2 with SHA-256 |
| **Iterations** | 10000 (minimum) |
| **Salt** | Random 16 bytes per encryption |
| **IV** | Random 16 bytes per encryption |
| **Storage** | Local file `credentials.enc` |

### 7.2 SSH Security

- Support for SSH key authentication
- SSH agent forwarding support
- Jump host/bastion support
- No plaintext password storage
- Connection timeout handling
- Host key verification

### 7.3 Web Security

- HTTPS enforcement (when behind reverse proxy)
- CORS restrictions
- Input validation on all forms
- XSS prevention
- CSRF tokens for sensitive operations
- Content Security Policy headers

### 7.4 Network Security

- All external communication over HTTPS
- Glances API restricted to internal network
- SSH credentials never logged
- Secure WebSocket connections

---

## 8. Deployment Architecture

### 8.1 Docker Container Structure

```
┌─────────────────────────────────────────┐
│            Docker Network               │
│  (dashhub-network)                     │
├─────────────────────────────────────────┤
│                                          │
│  ┌───────────────────────────────────┐  │
│  │         dashhub (single)          │  │
│  │  - Nginx (static frontend)        │  │
│  │  - Node.js API (config, SSH)      │  │
│  │  Port: 48215                      │  │
│  └─────────────────┬─────────────────┘  │
│                    │                     │
│         ┌──────────┴───────────┐        │
│         │   Persistent Volume  │        │
│         │   /app/user-data     │        │
│         │   - conf.yml         │        │
│           │   - credentials.enc  │       │
│           └─────────────────────┘       │
│                                          │
└─────────────────────────────────────────┘
```

### 8.2 Docker Compose Configuration

> **Superseded:** This section is the *original* two-container plan (GoTTY + encrypted
> credentials). The actual release uses a **single container** (no GoTTY, plaintext
> `data/conf.yml` with API-side credential sanitization). See
> [ARCHITECTURE.md](../ARCHITECTURE.md) and [distribution.md](../distribution.md).

```yaml
version: '3.8'

services:
  dashhub:
    image: ghcr.io/devosduotech/dashhub:1.0.1
    container_name: dashhub
    ports:
      - "48215:80"
    volumes:
      - ./user-data:/app/user-data
      - ./credentials.enc:/app/credentials.enc:ro
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - dashhub-network

  dashhub-gotty:
    image: osduo/dashhub-gotty:latest
    container_name: dashhub-gotty
    ports:
      - "48216:8080"
    volumes:
      - ./credentials.enc:/app/credentials.enc:ro
      - ~/.ssh:/root/.ssh:ro
    restart: unless-stopped
    networks:
      - dashhub-network

networks:
  dashhub-network:
    driver: bridge

volumes:
  user-data:
    driver: local
```

### 8.3 Glances Agent Setup (Per Server)

```yaml
# On each monitored server
version: '3.8'

services:
  glances:
    image: nicolargo/glances:latest-full
    container_name: glances
    ports:
      - "61208:61208"
    environment:
      - GLANCES_OPT="-w"  # Web server mode
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /run/user/1000/podman/podman.sock:/run/user/1000/podman/podman.sock:ro
    restart: unless-stopped
    network_mode: host
    pid: host
```

### 8.4 Glances Installation Options

#### Option A: Docker (Recommended)
```bash
docker run -d \
  --name glances \
  --restart unless-stopped \
  -p 61208:61208 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  nicolargo/glances:latest-full
```

#### Option B: Docker Compose
```yaml
services:
  glances:
    image: nicolargo/glances:latest-full
    container_name: glances
    ports:
      - "61208:61208"
    environment:
      - GLANCES_OPT="-w"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    restart: unless-stopped
    network_mode: host
    pid: host
```

#### Option C: Standalone
```bash
pip install glances
glances -w  # Web server mode on port 61208
```

---

## 9. Implementation Phases

### Phase 1: Foundation (Week 1-2)

| Task ID | Task | Hours | Priority | Deliverable |
|---------|------|-------|----------|-------------|
| P1-T1 | Initialize Vue 3 + Pinia + Vite project | 4h | P0 | Clean repo, Git initialized |
| P1-T2 | Configure Docker build system | 6h | P0 | Dockerfile, docker-compose |
| P1-T3 | Implement custom dark theme | 8h | P1 | Theme files, CSS variables |
| P1-T4 | Multi-page navigation system | 6h | P0 | Page tabs, routing |
| P1-T5 | Widget wrapper framework | 8h | P0 | Base widget component |
| P1-T6 | YAML configuration system | 6h | P0 | Config read/write service |
| P1-T7 | UI configuration editor base | 8h | P1 | Edit mode, palette UI |

**Phase 1 Deliverables**:
- Working Docker container
- Multi-page layout functional
- Widget framework established
- Configuration persists to YAML

### Phase 2: Core Widgets (Week 3-4)

| Task ID | Task | Hours | Priority | Deliverable |
|---------|------|-------|----------|-------------|
| P2-T1 | Quick Links widget | 8h | P0 | Links display, add/edit |
| P2-T2 | Glances API client service | 6h | P0 | API communication |
| P2-T3 | Glances widget (compact view) | 10h | P0 | Server metrics display |
| P2-T4 | Glances expanded view modal | 6h | P1 | Full stats view |
| P2-T5 | Server add/edit form | 6h | P0 | Server configuration UI |
| P2-T6 | Widget drag-drop positioning | 8h | P1 | Drag-drop support |

**Phase 2 Deliverables**:
- Quick Links widget functional
- Glances widget showing real metrics
- Server configuration via UI

### Phase 3: SSH Terminal (Week 5-6)

| Task ID | Task | Hours | Priority | Deliverable |
|---------|------|-------|----------|-------------|
| P3-T1 | Native SSH bridge (ssh2) | 6h | P0 | Node.js WebSocket server |
| P3-T2 | Credential encryption service | 8h | P0 | AES encryption |
| P3-T3 | SSH connection manager UI | 10h | P0 | Connection CRUD |
| P3-T4 | xterm.js integration | 8h | P0 | Terminal component |
| P3-T5 | WebSocket terminal bridge | 8h | P0 | ssh2 integration |
| P3-T6 | Multi-tab terminal support | 6h | P1 | Tab management |

**Phase 3 Deliverables**:
- Web terminal functional
- Saved SSH connections
- Encrypted credential storage
- Multi-tab support
- Single-container deployment (no GoTTY)

### Phase 4: Feeds & Media (Week 7-8)

| Task ID | Task | Hours | Priority | Deliverable |
|---------|------|-------|----------|-------------|
| P4-T1 | RSS parser service | 6h | P0 | Feed fetching |
| P4-T2 | RSS feed widget | 8h | P0 | Feed display |
| P4-T3 | YouTube RSS fetcher | 4h | P0 | Channel videos |
| P4-T4 | YouTube thumbnail widget | 10h | P0 | Video grid |
| P4-T5 | Feed add/edit UI | 6h | P1 | Feed configuration |
| P4-T6 | Feed caching system | 4h | P1 | Cache implementation |

**Phase 4 Deliverables**:
- RSS feeds displaying
- YouTube videos showing
- Feed caching working

### Phase 5: Polish & Integration (Week 9)

| Task ID | Task | Hours | Priority | Deliverable |
|---------|------|-------|----------|-------------|
| P5-T1 | Page management UI | 8h | P1 | Add/edit/delete pages |
| P5-T2 | Settings page | 6h | P1 | Global settings |
| P5-T3 | Error handling & loading | 6h | P1 | Error states |
| P5-T4 | Mobile responsive | 8h | P2 | Mobile layout |
| P5-T5 | Performance optimization | 4h | P2 | Lazy loading |
| P5-T6 | Documentation | 8h | P1 | README, guides |

**Phase 5 Deliverables**:
- Complete UI configuration
- Mobile responsive
- Error handling comprehensive

### Phase 6: Testing & Release (Week 10)

| Task ID | Task | Hours | Priority | Deliverable |
|---------|------|-------|----------|-------------|
| P6-T1 | Unit testing | 8h | P1 | Test coverage |
| P6-T2 | Integration testing | 8h | P1 | E2E tests |
| P6-T3 | Docker image build | 4h | P0 | Published images |
| P6-T4 | README & documentation | 6h | P1 | User docs |
| P6-T5 | Example configurations | 4h | P2 | Sample configs |
| P6-T6 | Release preparation | 4h | P1 | GitHub release |

**Phase 6 Deliverables**:
- All tests passing
- Docker images built
- Documentation complete
- Release ready

### Total Estimated Hours

| Phase | Hours |
|-------|-------|
| Phase 1: Foundation | 46h |
| Phase 2: Core Widgets | 44h |
| Phase 3: SSH Terminal | 44h |
| Phase 4: Feeds & Media | 38h |
| Phase 5: Polish & Integration | 40h |
| Phase 6: Testing & Release | 34h |
| **Total** | **246h** |

---

## 10. File Structure

```
osduo-dashhub/
├── src/
│   ├── components/
│   │   ├── widgets/
│   │   │   ├── QuickLinksWidget.vue
│   │   │   ├── GlancesWidget.vue
│   │   │   ├── SshWidget.vue
│   │   │   ├── SshTerminal.vue
│   │   │   ├── YouTubeWidget.vue
│   │   │   ├── RssWidget.vue
│   │   │   ├── WidgetWrapper.vue
│   │   │   ├── WidgetPalette.vue
│   │   │   └── WidgetSettings.vue
│   │   ├── layout/
│   │   │   ├── PageTabs.vue
│   │   │   ├── PageEditor.vue
│   │   │   └── EditModeToolbar.vue
│   │   ├── forms/
│   │   │   ├── ServerForm.vue
│   │   │   ├── SshConnectionForm.vue
│   │   │   ├── FeedForm.vue
│   │   │   ├── YouTubeChannelForm.vue
│   │   │   └── LinkForm.vue
│   │   └── common/
│   │       ├── IconPicker.vue
│   │       ├── ColorPicker.vue
│   │       └── StatusIndicator.vue
│   ├── views/
│   │   ├── Dashboard.vue
│   │   └── Settings.vue
│   ├── stores/
│   │   ├── pages.js
│   │   ├── widgets.js
│   │   ├── servers.js
│   │   ├── ssh.js
│   │   └── feeds.js
│   ├── services/
│   │   ├── glancesApi.js
│   │   ├── rssParser.js
│   │   ├── youtubeApi.js
│   │   ├── sshBridge.js
│   │   ├── credentials.js
│   │   └── configManager.js
│   ├── utils/
│   │   ├── encryption.js
│   │   └── validators.js
│   ├── assets/
│   │   ├── styles/
│   │   │   ├── variables.scss
│   │   │   ├── theme-dark.scss
│   │   │   └── widgets.scss
│   │   └── icons/
│   └── App.vue
├── server/
│   ├── gotty/
│   │   └── Dockerfile
│   └── api/
│       └── server.js
├── user-data/
│   ├── conf.yml
│   └── credentials.enc
├── docker/
│   ├── nginx.conf
│   └── entrypoint.sh
├── docker-compose.yml
├── Dockerfile
├── Dockerfile.gotty
├── package.json
├── vite.config.js
└── README.md
```

---

## 11. Dependencies

### 11.1 Frontend Dependencies

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "pinia": "^2.1.0",
    "vue-router": "^4.2.0",
    "axios": "^1.6.0",
    "xterm": "^5.3.0",
    "xterm-addon-fit": "^0.8.0",
    "xterm-addon-web-links": "^0.9.0",
    "crypto-js": "^4.2.0",
    "yaml": "^2.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0",
    "sass": "^1.69.0"
  }
}
```

### 11.2 Backend Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "node-ssh": "^13.0.0",
    "ssh2": "^1.15.0",
    "js-yaml": "^4.1.0"
  }
}
```

---

## 12. User Stories

### 12.1 Add New Server

**Story**: As a user, I want to add a new server for monitoring, so that I can track its performance.

**Pre-conditions**: User has access to dashboard, server has Glances running

**Steps**:
1. Navigate to a page or click "Add Widget"
2. Select "Glances Server" widget type
3. Enter server details (name, host, port)
4. Configure display preferences
5. Optionally enable SSH quick-connect
6. Click "Save"
7. Widget appears on page showing server metrics

**Acceptance Criteria**:
| ID | Criteria | Verified |
|----|----------|----------|
| AC1 | Widget displays within 5 seconds of adding | [ ] |
| AC2 | Error shown if server unreachable | [ ] |
| AC3 | SSH button visible if SSH enabled | [ ] |
| AC4 | Configuration persists after refresh | [ ] |

---

### 12.2 Connect to Server via SSH

**Story**: As a user, I want to connect to a server with one click, so that I can perform maintenance tasks.

**Pre-conditions**: SSH connection configured, credentials stored

**Steps**:
1. Click SSH button on Glances widget OR navigate to Terminal page
2. Click saved connection
3. Terminal opens with authenticated session
4. Execute commands
5. Close terminal when done

**Acceptance Criteria**:
| ID | Criteria | Verified |
|----|----------|----------|
| AC5 | No password prompt if key configured | [ ] |
| AC6 | Multiple tabs can be opened | [ ] |
| AC7 | Terminal supports standard commands | [ ] |
| AC8 | Session can be closed without affecting others | [ ] |

---

### 12.3 Add YouTube Channel

**Story**: As a user, I want to add a YouTube channel, so that I can see latest videos.

**Pre-conditions**: None

**Steps**:
1. Click "Add Widget" or widget settings
2. Select "YouTube" widget type
3. Paste channel URL or ID
4. Set number of videos to show
5. Click "Save"
6. Thumbnails display on page

**Acceptance Criteria**:
| ID | Criteria | Verified |
|----|----------|----------|
| AC9 | Videos load within 10 seconds | [ ] |
| AC10 | Thumbnails are clickable | [ ] |
| AC11 | Videos open in new tab | [ ] |
| AC12 | Channel name displays correctly | [ ] |

---

### 12.4 Configure Widgets via UI

**Story**: As a user, I want to configure everything via UI, so that I don't need to edit files.

**Pre-conditions**: None

**Steps**:
1. Enter edit mode (click edit icon)
2. Click any widget to edit
3. Modify settings in modal form
4. Click "Save"
5. Changes apply immediately
6. Exit edit mode

**Acceptance Criteria**:
| ID | Criteria | Verified |
|----|----------|----------|
| AC13 | All widgets have settings forms | [ ] |
| AC14 | Changes persist after reload | [ ] |
| AC15 | Invalid input shows validation error | [ ] |
| AC16 | Can undo changes before saving | [ ] |

---

## 13. Non-Functional Requirements

### 13.1 Performance

| Metric | Target | Measurement |
|--------|-------|-------------|
| Initial page load | < 3 seconds | Lighthouse |
| Widget data refresh | < 2 seconds | Manual timing |
| Terminal latency | < 100ms | Network trace |
| Memory usage | < 512MB | Docker stats |
| Bundle size | < 2MB | Build output |

### 13.2 Scalability

| Resource | Target | Status |
|----------|--------|--------|
| Widgets per page | 50+ | Planned |
| Servers | 20+ | Planned |
| RSS feeds | 10+ | Planned |
| YouTube channels | 10+ | Planned |

### 13.3 Compatibility

| Browser | Minimum Version | Tested |
|---------|-----------------|--------|
| Chrome | 90+ | Planned |
| Firefox | 88+ | Planned |
| Safari | 14+ | Planned |
| Edge | 90+ | Planned |
| Mobile Safari | iOS 14+ | Planned |
| Chrome Android | Android 10+ | Planned |

### 13.4 Availability

| Aspect | Requirement |
|--------|-------------|
| Container restart | Auto-recovery |
| Glances unreachable | Graceful degradation |
| Network timeout | User notification |
| Error display | Non-intrusive |

---

## 14. Glossary

| Term | Definition |
|------|------------|
| **Widget** | Reusable UI component displaying specific data or providing functionality |
| **Glances** | Open-source system monitoring tool running on each server |
| **ssh2** | Pure JavaScript SSH2 client library for Node.js |
| **xterm.js** | JavaScript-based terminal emulator |
| **YAML** | Human-readable data serialization format for configuration |
| **Bastion/Jump Host** | Intermediate server for SSH connections through restricted networks |
| **Agent** | Software running on target servers for monitoring (Glances) |
| **PBKDF2** | Password-Based Key Derivation Function 2 |
| **AES-256** | Advanced Encryption Standard with 256-bit key |
| **HMR** | Hot Module Replacement - development feature for instant updates |
| **CORS** | Cross-Origin Resource Sharing - web security mechanism |

---

## 15. References

| Project | URL | Purpose |
|---------|-----|---------|
| Dashy | https://github.com/Lissy93/dashy | Feature reference (not forked) |
| Glances | https://github.com/nicolargo/glances | Server monitoring |
| ssh2 | https://github.com/mscdex/ssh2 | SSH2 client library |
| xterm.js | https://github.com/xtermjs/xterm.js | Terminal emulator |
| Glance | https://github.com/glanceapp/glance | Feed aggregation reference |
| Termix | https://github.com/Termix-SSH/Termix | SSH terminal reference |
| Tabby | https://github.com/eugeny/tabby | SSH connection management reference |
| Docker | https://www.docker.com/ | Containerization |
| Vue.js | https://vuejs.org/ | Frontend framework |

---

## 16. Appendices

### Appendix A: Glances API Response Fields

```json
{
  "cpu": {
    "total": 0.0,
    "user": 0.0,
    "system": 0.0,
    "idle": 100.0,
    "iowait": 0.0,
    "steal": 0.0
  },
  "mem": {
    "total": 0,
    "available": 0,
    "percent": 0.0,
    "used": 0,
    "free": 0,
    "active": 0,
    "inactive": 0,
    "buffers": 0,
    "cached": 0
  },
  "swap": {
    "total": 0,
    "used": 0,
    "free": 0,
    "percent": 0.0
  },
  "disk": {
    "/": {
      "total": 0,
      "used": 0,
      "free": 0,
      "percent": 0.0,
      "fs_type": "",
      "mount": ""
    }
  },
  "fs": [
    {
      "device": "",
      "mnt_point": "",
      "type": "",
      "size": 0,
      "used": 0,
      "free": 0,
      "percent": 0.0
    }
  ],
  "load": {
    "min1": 0.0,
    "min5": 0.0,
    "min15": 0.0
  },
  "system": {
    "hostname": "",
    "os_name": "",
    "os_version": "",
    "platform": "",
    "uptime": 0,
    "boottime": 0
  },
  "network": {
    "interface_name": {
      "rx": 0,
      "tx": 0,
      "cx": 0,
      "rx_rate": 0.0,
      "tx_rate": 0.0
    }
  },
  "processes": [
    {
      "pid": 0,
      "name": "",
      "cpu": 0.0,
      "memory": 0.0,
      "status": ""
    }
  ]
}
```

### Appendix B: YouTube Channel ID Extraction

**From Channel URL**:
```
https://www.youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw
                               ^^^^^^^^^^^^^^^^^^^^^^^^^
                               Channel ID (directly usable)
```

**From Custom URL**:
```
https://www.youtube.com/@LinusTechTips
                          ^^^^^^^^^^^^^^
                          Username (needs conversion)
```

**RSS Feed URL**:
```
https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}
```

### Appendix C: Example Configuration

```yaml
# user-data/conf.yml
appConfig:
  title: "OSDuo DashHub"
  theme: dark-navy
  language: en
  iconSet: material

pages:
  - name: "Dashboard"
    icon: dashboard
    items:
      - type: quick-links
        title: "Quick Links"
        config:
          columns: 4
          links:
            - title: "Home Assistant"
              url: "https://ha.local"
              icon: "home"
            - title: "Portainer"
              url: "https://portainer.local"
              icon: "docker"

  - name: "Servers"
    icon: server
    items:
      - type: glances
        title: "Web Server"
        config:
          url: "http://192.168.1.10:61208"  # Glances web UI
          displayMode: embedded
          height: 400
          ssh:
            enabled: true
            host: "192.168.1.10"
            port: 22
            username: "admin"

  - name: "YouTube"
    icon: video
    items:
      - type: youtube
        title: "Tech Videos"
        config:
          channels:
            - id: "UCXuqSBlHAE6Xw-yeJA0Tunw"
              name: "Linus Tech Tips"
          videosPerChannel: 6

  - name: "News"
    icon: rss
    items:
      - type: rss
        title: "Tech News"
        config:
          feeds:
            - url: "https://news.ycombinator.com/rss"
              title: "Hacker News"
          itemsPerFeed: 10

  - name: "Terminal"
    icon: terminal
    items:
      - type: ssh
        title: "SSH Connections"
        config:
          defaultShell: "/bin/bash"
          theme: "monokai"
          connections:
            - name: "Web Server"
              host: "192.168.1.10"
              port: 22
              username: "admin"
              authType: "key"
              group: "Production"
```

### Appendix D: Docker Installation Scripts

**Glances Agent Installation**:
```bash
#!/bin/bash
# install-glances.sh

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Installing..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
fi

# Run Glances container
docker run -d \
  --name glances \
  --restart unless-stopped \
  -p 61208:61208 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  nicolargo/glances:latest-full

echo "Glances installed on port 61208"
```

**Dashboard Installation**:
```bash
#!/bin/bash
# install-dashhub.sh

# Create project directory
mkdir -p ~/dashhub
cd ~/dashhub

# Create user-data directory
mkdir -p user-data

# Create initial configuration
cat > user-data/conf.yml << 'EOF'
appConfig:
  title: "OSDuo DashHub"
  theme: dark-navy

pages:
  - name: "Dashboard"
    icon: dashboard
    items: []
EOF

# Download docker-compose.yml
curl -O https://raw.githubusercontent.com/devosduotech/dashhub/v1/docker-compose.yml

# Start containers
docker-compose up -d

echo "OSDuo DashHub installed on http://localhost:48215"
```

---

## Document Approval

| Role | Name | Date | Status |
|------|------|------|--------|
| Author | OSDuo Tech - Development Team | 2026-04-06 | Draft |
| Reviewer | TBD | Pending | Pending |
| Approver | TBD | Pending | Pending |

---

**End of Document**

*Last Updated: 2026-04-06*
