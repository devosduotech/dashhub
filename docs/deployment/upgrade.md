# Upgrading DashHub

## Standard upgrade (pinned release)

```bash
cd dashhub
docker compose pull
docker compose up -d
```

`pull` fetches the newer image for the pinned tag; `up -d` recreates the container. Your `data/` directory is untouched — configuration, history, and uploads survive upgrades.

After upgrading, reload the browser tab. Since v1.0.18 the app shell is served with `Cache-Control: no-cache`, so a normal refresh picks up new releases (one final hard refresh may be needed from installs older than v1.0.18).

## Moving to a newer pinned version

1. Update the `image:` tag in `docker-compose.yml` (or re-download the compose file from the new release tag — **recommended**, as compose hardening evolves between releases).
2. `docker compose pull && docker compose up -d`.

> **Tip:** Always take the compose file from the release you deploy:
> `curl -O https://raw.githubusercontent.com/devosduotech/dashhub/v<VERSION>/docker-compose.yml`

## Using `latest`

If your compose file pins `ghcr.io/devosduotech/dashhub:latest`, `docker compose pull` tracks the newest stable release. Pinned version tags are recommended for predictable upgrades.

## Before you upgrade

- [ ] `data/` directory backed up (see [Backup & Restore](backup-restore.md))
- [ ] Compose file matches the target release
- [ ] Note the currently running version: `docker inspect dashhub --format '{{.Config.Image}}'`

## After you upgrade

- [ ] `docker compose ps` shows **Up (healthy)**
- [ ] Dashboard loads and pages/widgets are intact
- [ ] Spot-check one SSH-backed widget and one monitoring widget

## Rollback

Pin the previous version tag in `docker-compose.yml`, then:

```bash
docker compose pull && docker compose up -d
```

Configuration written by a newer release is generally readable by the previous one (the schema is validated and additive), but the safe sequence is: back up `data/` **before** upgrading, so rollback restores both image and data.
