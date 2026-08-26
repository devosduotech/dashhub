# Backup & Restore (Deployment)

Procedures for protecting and restoring the DashHub data directory. For *what* the data directory contains, see the [User Manual — Backup & Restore](../user-manual/backup-restore.md).

## The data directory

The compose file mounts the host directory `./data` into the container at `/app/data`:

```text
<dashhub>/data
├── conf.yml               # pages, layout, widget configuration, credentials
├── known_hosts.json       # pinned SSH host keys
├── uptime-history.json    # uptime check history
└── uploads/               # uploaded logos and images
```

> **Credentials are stored in `conf.yml`** (encryption at rest is planned for Phase 2). Treat backups as sensitive: encrypt them at rest and restrict who can read them.

## Backup

### One-off archive (host-side)

```bash
tar czf dashhub-backup-$(date +%F).tar.gz -C /path/to/dashhub data
```

### While the container runs

Writes are atomic (temp file + rename), so archiving live is safe:

```bash
docker exec dashhub tar czf - /app/data > dashhub-backup-$(date +%F).tar.gz
```

### Scheduled

Example cron entry on the host (daily 02:00, keep 14):

```cron
0 2 * * * tar czf /backups/dashhub-$(date +\%F).tar.gz -C /path/to/dashhub data && find /backups -name 'dashhub-*.tar.gz' -mtime +14 -delete
```

## Restore

1. Stop the stack: `docker compose stop`
2. Clear or move aside the current `data/` (keep it until the restore is verified)
3. Extract:

   ```bash
   tar xzf dashhub-backup-YYYY-MM-DD.tar.gz -C /path/to/dashhub
   ```

4. Fix ownership if the archive came from another system — the entrypoint repairs ownership on start when the container has the bootstrap capabilities (default in the shipped compose file). Otherwise:

   ```bash
   sudo chown -R 101:102 /path/to/dashhub/data
   ```

5. Start: `docker compose up -d`
6. Verify: `docker compose ps` → *Up (healthy)*; open the dashboard and check pages/widgets

## Migrating to another host

1. Back up `data/` on the old host (above)
2. Install Docker + the same release compose file on the new host (see [README](README.md))
3. Restore `data/` next to the compose file
4. `docker compose up -d` and verify

The image tag pins the application version; the data directory pins *your* dashboard. Together they fully reconstruct an installation.
