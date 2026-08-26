# FAQ

## General

**Is DashHub free?**
Yes — open source under the MIT license.

**Does DashHub send data to external servers (telemetry)?**
No. DashHub does not phone home and sends no usage data to any vendor. It is local-first: configuration stays in your `data/` directory. Individual widgets query the services you configure (weather, RSS, public-IP lookup, package registries) — nothing else leaves your network.

**Can several people use the same dashboard?**
DashHub v1.x is designed for a single user on a local machine or a trusted private LAN. There is no authentication yet — anyone who can reach the port can view and change the dashboard. Multi-user access with authentication is the headline Phase 2 feature; until then, do not expose DashHub to the public internet.

**Where is my configuration stored?**
In `data/conf.yml` inside the mounted data volume, alongside `known_hosts.json`, `uptime-history.json`, and `uploads/`. See [Backup & Restore](backup-restore.md).

## Layout & widgets

**What dashboard layouts do you recommend?**
Anything — that is the point. Common starting points:

```text
IT Operations   : SSH · Glances · Service Status · System Logs · Process List · Server Uptime
Personal        : Calendar · Reminders · Notes · Weather · Clock · Quick Links
Customer view   : Quick Links · Server Uptime · Status Indicators · SSH
Developer       : Latest Versions · RSS · YouTube · Quick Links · SSH
```

**Can two widgets use the same SSH connection?**
Yes — add the connection once in any SSH widget; every SSH-backed widget's **Connection** dropdown lists it.

**Why did my widget stop refreshing?**
Polling widgets refresh while their page is open. Switch to the page (or reload) to resume. Also check the widget's Refresh Interval setting — it is read when the widget loads.

**Can I edit a note after creating it?**
Yes — click the note text to open the inline editor. Enter saves, Escape cancels. Reminders work the same way, with a checkbox for completion.

**Why does my embedded page show blank in the IFrame widget?**
The target site forbids framing (`X-Frame-Options` / `frame-ancestors`). See [IFrame](resources.md#iframe) for the reverse-proxy fix.

## SSH

**Where are SSH credentials stored?**
Server-side, in `data/conf.yml`. The browser never receives them — widgets reference connections by ID. Encryption at rest is planned for Phase 2.

**The SSH connection worked yesterday and fails today with a host-key error.**
The server presented a different host key — typical after a rebuild. Verify the change is genuine out-of-band, then remove the host from `data/known_hosts.json` and reconnect. See [Host keys](ssh.md#host-keys).

**Can I use a YubiKey / hardware key?**
If your SSH agent can expose it where the DashHub container runs, use **Agent** authentication; otherwise export a standard private key and use **Private Key** auth.

## Operations

**How do I upgrade?**
`docker compose pull && docker compose up -d`. Your `data/` directory is untouched. Details: [Deployment — Upgrading](../deployment/upgrade.md).

**How do I move DashHub to another machine?**
Back up `data/`, deploy on the new host, restore `data/`, start. See [Backup & Restore](backup-restore.md).

**Which ports does it use?**
One published port for the web UI/API (default 48215 with the shipped compose file). Outbound: whatever your widgets need (SSH 22, CalDAV 443, feeds, etc.).

**Is there a dark/light theme?**
Yes — Dark, Light, and Auto (follows the OS) in app settings, along with title, logo, and footer text.

---

*Something missing? Check [Troubleshooting](troubleshooting.md) or open an issue at the project repository.*
