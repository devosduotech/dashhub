# Troubleshooting

Quick matrix first, details below. Container-level commands assume the default compose service name `dashhub`.

## Problem matrix

| Problem | Possible cause | Resolution |
|---------|----------------|------------|
| Dashboard does not load | Container not running | `docker compose ps`; check `docker compose logs dashhub` |
| Page loads but widgets show "Failed to load config" | API still starting (brief window after container start) | Wait a few seconds and reload; the frontend auto-retries on boot |
| Widget shows an error state | Widget configuration invalid or target unreachable | Open Edit Mode → widget settings → review values; see the widget's chapter |
| Layout or settings changes vanished | Changes were made but the data volume is not persistent | Verify the compose file mounts `./data:/app/data` and the directory exists on the host |
| SSH connection fails | Network, credentials, or wrong port | Verify host/port/username; test from another machine; check the auth type matches what you configured |
| SSH connection fails with a host-key error | Server's key changed (rebuild/re-IP) | Confirm the change is genuine, then remove that host's entry from `data/known_hosts.json` and reconnect (see [SSH](ssh.md#host-keys)) |
| SSH widget shows "Connecting…" forever | Server unreachable or auth rejected | Check server reachability; verify username/auth; look at `docker compose logs` for the SSH bridge error |
| SSH to `127.0.0.1:22` fails ("Unable to obtain the host key" / unreachable) | Container loopback, not the host | If DashHub runs in Docker, `127.0.0.1` is the container. Use **`host.docker.internal`** as the Host instead (see [SSH](ssh.md#connecting-to-the-machine-that-runs-dashhub)); ensure sshd is running on the host |
| Glances widget blank | Glances URL unreachable **from your browser** | Open the Glances URL directly in a tab; confirm `glances -w` is running; check firewall |
| Server Uptime shows gray segments | Page was closed (checks run only while the page is open) | Normal — keep the page open for continuous checks |
| Status Indicators show everything red | DashHub server cannot reach the endpoints | Test the URLs from the server; check expected status codes |
| Calendar empty | CalDAV URL/account issue | Re-run **Discover Calendars**; verify username + app password; confirm the calendar is shared/visible to the account |
| Calendar event creation fails with "CalDAV not configured" | Widget settings incomplete | Open the widget settings and complete server URL, username, password, and calendar selection |
| RSS not loading | Feed unreachable or invalid | Open the feed URL in a browser; increase cache time if the source rate-limits |
| YouTube widget empty | Wrong channel ID | Use the `channel/<ID>` form of the URL, not the channel handle |
| Embedded page blank in IFrame widget | Target site forbids framing | Check console for `X-Frame-Options` / `frame-ancestors`; adjust at the target's reverse proxy (see [IFrame](resources.md#iframe)) |
| Weather shows an error | Location not set or lookup failed | Re-pick the location from the search suggestions |
| Speedtest very slow or fails | Browser-side path congestion; custom endpoint misconfigured | Retry; verify a Custom base URL points at a LibreSpeed-compatible server |
| Latest Versions shows `!` | GitHub/npm/PyPI lookup failed (often rate limiting) | Press Refresh; for frequent GitHub 403s set `GITHUB_TOKEN` (see [Deployment](../deployment/README.md)) |
| Container restarts in a loop | Startup failure | `docker compose logs dashhub` — see below |
| Container can't write configuration | Read-only filesystem with missing tmpfs, or capability restrictions | Use the shipped `docker-compose.yml` from the current release (older copies predate the hardened settings); see [Deployment](../deployment/README.md) |
| Browser shows an old dashboard after an upgrade | Stale cached page | Hard refresh once (Ctrl+Shift+R). Since v1.0.18 the app shell is served `no-cache`, so this is needed at most once |

## Reading container logs

```bash
docker compose logs -f dashhub          # follow
docker compose logs dashhub | tail -50  # recent
```

Startup lines to expect: `Starting OSDuo DashHub…`, `Skipping TZ setup` (normal under read-only), `DashHub API listening on port …`, `Starting nginx…`.

## Resetting to a clean dashboard

Stop the container, move `data/conf.yml` aside (keep `uploads/` if you use uploaded images), and start again — DashHub recreates a default empty configuration on boot. Restore your backup any time (see [Backup & Restore](backup-restore.md)).

---

Next: [FAQ](faq.md)
