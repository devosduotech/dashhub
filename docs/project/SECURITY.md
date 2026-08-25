# OSDuo DashHub — Security

> Last updated: 2026-08-25 | Version: **1.0.18**

## Deployment Boundary (Phase 1)

> **Phase-1 Security Boundary:** DashHub is intended for **local or trusted private-LAN**
> deployment. It must **not** be exposed directly to the public Internet or deployed as a
> shared multi-user service until the Phase-2 security controls below are implemented.

Recommended deployment modes:

| Mode | Network | Suitable for |
| --- | --- | --- |
| A — Personal | `127.0.0.1` only | Single-user local dashboard |
| B — Private LAN | `192.168.x.x` | NOC / ops-room / office / server-room displays |
| C — Shared / Remote | Internet / VPN / cloud | **Phase 2 only** — requires security hardening |

Exposing the Phase-1 build on a public IP is the single biggest operational risk. Even
with the Phase-1 hardening already applied, DashHub has **no authentication** and stores
SSH credentials in a plaintext config file.

---

## Phase 1 — Security Measures in Place

- **Credential sanitization** — `GET /api/config` never returns `password`, `privateKey`
  or `passphrase`. Connections only expose a `hasCredential` flag. Secrets are preserved
  server-side on save and used only by the SSH bridge.
- **SSH host-key verification** — First connection to an unknown host requires explicit
  fingerprint acceptance; the accepted key is persisted to `data/known_hosts.json` and
  verified on every subsequent connection. There is no "accept any host" fallback.
- **Configuration validation** — `PUT /api/config` enforces structural rules: valid widget
  types, required fields, limits on pages/widgets/connections/lengths, port ranges,
  auth-type enumeration, and duplicate-ID detection.
- **Request limits** — JSON body limited to 2 MB.
- **Structured error responses** — API returns `{ error, message }` codes; internal exception details are logged server-side, never sent to the client.
- **CalDAV credential resolution** — CalDAV endpoints resolve credentials server-side by widget ID via `getWidgetConfig()`, so passwords are never exposed to the frontend after initial config save.
- **Non-root container** — The Node API runs as the unprivileged `dashhub` user.
- **Modern runtime** — Node 24 LTS; `npm ci` for reproducible installs.
- **Security headers** — `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **Docker hardening** — Read-only root filesystem (nginx temp paths pinned to `/tmp`, entrypoint TZ/chown guarded), `no-new-privileges`, `cap_drop ALL` plus a minimal bootstrap set (CHOWN, DAC_OVERRIDE, FOWNER, SETGID, SETUID) used only to prepare the data dir and dropped irreversibly when the API assumes the unprivileged `dashhub` user; `NET_BIND_SERVICE` retained for nginx. CI smoke test runs with the identical flag set.

---

## Phase 2 — Security Backlog (planned)

Tracked as deliberate design work, not defects:

1. Authentication (session / OIDC)
2. Role-based access control (Administrator / Operator / Viewer)
3. Credential vault with encryption (`config.yml` + `credentials.enc`, PBKDF2/AES)
4. CSRF protection
5. Restricted CORS (same-origin or allowlist)
6. API authorization + per-user SSH connection authorization
7. Audit logging
8. Rate limiting
9. Security headers (CSP, HSTS at TLS layer, etc.)
10. Multi-user isolation
11. Remote / shared deployment security

---

## Known residual risks (Phase 1 accepted)

- No authentication — anyone with network access can read/modify config and open SSH sessions.
- SSH credentials are stored in plaintext in `data/conf.yml` (protected by OS file permissions).
- Open CORS.
- SSH connection access is not individually authorized.

These are acceptable for the local / private-LAN Phase-1 deployment boundary and are
scheduled for Phase 2.
