# Backup & Restore

DashHub is local-first: everything that makes your dashboard *yours* lives in one directory on the server. Back it up and you can rebuild anywhere.

## What to back up

Everything inside the mounted `data/` directory:

```text
data/
├── conf.yml               ← all pages, layout, widget configuration, credentials
├── known_hosts.json       ← pinned SSH host keys
├── uptime-history.json    ← Server Uptime check history
└── uploads/               ← uploaded logos, link icons, images
```

> **The `data` directory contains the persistent DashHub configuration — including credentials — and should be part of your regular backup strategy.** Protect it with normal file permissions; credentials are stored in it (encryption at rest is planned for Phase 2).

## How DashHub stores data

- Configuration is written atomically (temp file + rename) roughly one second after each change
- The container reads and writes this directory through the volume mount configured at deployment — see [Deployment: Backup & Restore](../deployment/backup-restore.md) for mount paths and step-by-step procedures

## Backing up

From the host running DashHub:

```bash
# Simple point-in-time copy
tar czf dashhub-backup-$(date +%F).tar.gz -C /path/to/dashhub data

# Or with the container running (safe — writes are atomic)
docker exec dashhub tar czf - /app/data > dashhub-backup-$(date +%F).tar.gz
```

Schedule it with cron on the host for automatic protection.

## Restoring

1. Stop the container: `docker compose stop` (or `docker stop dashhub`)
2. Extract the backup over the data directory (or point a fresh deployment's volume at the restored copy)
3. Ensure ownership is readable by the container (the entrypoint fixes ownership on start when permitted)
4. Start again: `docker compose up -d`
5. Reload the dashboard — your pages, widgets, and history are back

## What is *not* persisted

- Anything outside `data/` (the application itself comes from the image)
- In-flight widget state (terminal sessions, a speed test in progress)

Full procedures including volume layouts and migration between hosts: [Deployment — Backup & Restore](../deployment/backup-restore.md).

---

Next: [Troubleshooting](troubleshooting.md)
