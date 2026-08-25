# OSDuo DashHub — Phase 2 Work Plan

> **Purpose:** Prioritized, actionable work plan for Phase 2 derived from the v1.0.18
> security & code-quality audit (2026-08-25). Each item references its audit finding ID.
>
> Last updated: 2026-08-25 | Baseline version: **1.0.18**

## Scope & Context

Phase 1 established DashHub as a **local-first, trusted-LAN dashboard** with an accepted
risk posture (no auth, plaintext credentials). Phase 2 closes the security gaps required
before any exposure beyond a fully trusted LAN, hardens build/deploy infrastructure, and
delivers the committed feature/widget roadmap.

**Severity legend:** P0 = critical blocker · P1 = high · P2 = medium · P3 = low/cleanup
**Effort:** S = hours · M = 1–3 days · L = multi-day

---

## Progress Log

Completed or partially completed since the audit (2026-08-25):

- ✅ **P1-3 / C6 — Read-only container crash loop** (`0cfc44e`, `7dc3504`): entrypoint TZ/chown guarded non-fatal, complete nginx main config with `/tmp` temp paths + stderr error log, minimal bootstrap cap set (CHOWN/DAC_OVERRIDE/FOWNER/SETGID/SETUID) dropped at runtime via `su-exec`. CI smoke test now runs with `--read-only` + matching cap/tmpfs flags, permanently gating this failure class. Verified: healthy boot with root-owned data volumes under full flag set.
- ✅ **M6 — Stale app after upgrade** (`85356b1`): `index.html` served with `Cache-Control: no-cache`; security headers repeated inside the location per nginx `add_header` inheritance rules.
- ◐ **P2-19 — Debug logging** (`38073aa`): CalDAV client per-request logs removed. *Remaining:* `server.js` create-event dump, CalendarWidget console.log.
- ◐ **P3-8 — nginx/CI polish** (`0cfc44e`, `85356b1`): `server_tokens off`, access log off, error log → stderr, SPA cache policy done. *Remaining:* SBOM/cosign signing, CI `timeout-minutes`, per-job permissions, `X-Forwarded-Proto`, gzip types.

---

## Priority 0 — Critical Security Remediations (blockers)

| ID | Finding | Item | Files | Effort |
|----|---------|------|-------|--------|
| P0-1 | C1, C2, C3 | Eliminate shell command injection in SSH-backed endpoints | `systemLogsClient.js`, `serviceStatusClient.js`, `databaseMonitorClient.js` | M |

**Work:**
- Replace shell-string interpolation with argument arrays or strict whitelists/escaping (single-quote wrapping + `'` filtering) for `journalctl`, `systemctl`, and `mysql` invocations.
- Validate inputs at route level AND inside client modules (defense-in-depth; see M14).
- Stop passing DB passwords on command lines (`--defaults-extra-file` or env); fixes password visibility in remote `ps aux`.

**Acceptance criteria:**
- [ ] Metacharacter-bearing inputs (`;`, `$()`, backticks, quotes, newlines) are rejected or neutralized — verified by tests
- [ ] Negative test suite covers all three clients
- [ ] Passwords never appear in process listings

---

| ID | Finding | Item | Files | Effort |
|----|---------|------|-------|--------|
| P0-2 | C5, H1 | Authentication layer + CORS restriction + localhost binding by default | `server.js`, `sshBridge.js`, `docker-compose.yml`, `docker-compose.dev.yml` | L |

**Work:**
- Session/token authentication middleware covering ALL REST routes and the WS handshake (`/api/ssh?id=`).
- Restrict `cors()` to same-origin/dashboard origin allowlist.
- Publish ports as `127.0.0.1:` prefixed by default; opt-out for LAN via env var.
- Documented credential bootstrap flow (first-run setup).

**Acceptance criteria:**
- [ ] Every endpoint and WS connection rejects unauthenticated requests (401/pre-handshake reject)
- [ ] Cross-site browser requests blocked (CSRF-safe)
- [ ] Fresh `docker compose up` binds loopback only unless explicitly configured
- [ ] Tests cover auth rejection paths

---

| ID | Finding | Item | Files | Effort |
|----|---------|------|-------|--------|
| P0-3 | C4, H2 | SSRF elimination across all user-driven fetches | `server.js` (speedtest proxy, status-check, uptime), `rss.js`, `caldavClient.js` callers | M |

**Work:**
- Delete `/api/speedtest/proxy` or restrict to fixed upstream targets.
- Shared `safeFetch()` helper: http/https scheme allowlist, private/loopback/link-local IP deny-listing (incl. DNS-resolved), redirect policy = manual with re-validation per hop, response size cap, timeout.
- Apply helper to status-check, RSS, YouTube, uptime-check, CalDAV base URLs, public-ip providers.

**Acceptance criteria:**
- [ ] Requests to `127.0.0.1`, RFC1918, `169.254.169.254`, and redirect-following into private ranges are blocked — unit tested
- [ ] Response bodies capped; no full-body passthrough proxies remain

---

## Priority 1 — High Severity

| ID | Finding | Item | Effort |
|----|---------|------|--------|
| P1-1 | H3 | Opaque error codes to clients; internal detail logged server-side only | S |
| P1-2 | H4, H5 | Consistent host-key verification: add `hostVerifier` to `sshUtils.buildSshConfig`; restore frontend TOFU prompt (remove auto-accept in `TerminalModal.vue` / `SshTerminalPage.vue`) | M |
| P1-3 | C6 | ~~Fix read-only container crash loop~~ **✅ Done** — see Progress Log | S |
| P1-4 | H7 | Add `client_max_body_size 2m` (and larger for speedtest upload route) to `nginx.conf` | S |
| P1-5 | H6 | CI pre-merge gating: add `push: branches:[develop,v1]` + `pull_request` triggers running gate job (no publish) | S |
| P1-6 | H8 | Extend `.dockerignore`: `data/`, `data-dev/`, `*.png` root images, `.env` | S |
| P1-7 | H9, M2 | SHA-pin all GitHub Actions; digest-pin Dockerfile base images | S |

**Acceptance criteria highlights:**
- P1-1: grep-verifiable that no route passes raw `err.message` from upstream fetches/SSH output to `sendError`
- P1-2: unknown key prompts user; changed key blocks connection; monitoring commands honor known_hosts
- P1-3: `read_only: true` compose boots clean with default TZ and custom TZ (add smoke test WITH `--read-only`)
- P1-5: gate job green required before merge (branch protection)

---

## Priority 2 — Medium Severity Hardening

### Data integrity & concurrency
| ID | Finding | Item | Effort |
|----|---------|------|--------|
| P2-1 | M1 | Atomic config writes: unique tmp filename (`${file}.${pid}.${rand}.tmp`) + write lock/versioning | S |
| P2-2 | H5(uptime) | Uptime store: validate/reject `__proto__`/`constructor` ids, atomic writes, bounded entries per id, loud parse-failure handling | M |
| P2-3 | M2 | Known-hosts writes: serialize via queue or file lock | S |

### Resource safety
| ID | Finding | Item | Effort |
|----|---------|------|--------|
| P2-4 | M3, M3(front) | AbortController/timeouts on ALL outbound calls (CalDAV client priority) and frontend services; pass signals through widget polling loops | M |
| P2-5 | M4 | Bounded caches: max entries + LRU eviction for github/rss/youtube caches | S |
| P2-6 | M17(speedtest) | Speedtest download respects client disconnect; upload/download concurrency cap | S |
| P2-7 | M7(compose) | Memory/CPU limits in compose | S |
| P2-8 | M16 | WS idle timeout config on `/api/ssh` nginx location | S |

### Input/output safety
| ID | Finding | Item | Effort |
|----|---------|------|--------|
| P2-9 | M5 | Sanitize CalDAV `eventUid` (reject path separators, `?`, `#`) | S |
| P2-10 | M7(ics) | ICS escaping handles lone `\r` | S |
| P2-11 | M8 | Validate status-check `timeout` (numeric, range-clamped) | S |
| P2-12 | M9(front) | URL scheme allowlist (http/https only) before `href`/`iframe src` binding | S |
| P2-13 | M10 | Abort speedtest loops on unmount via signal | S |
| P2-14 | M10(uploads) | Re-encode/sanitize uploads or serve with `Content-Disposition` + nosniff guaranteed | M |

### UX data-integrity
| ID | Finding | Item | Effort |
|----|---------|------|--------|
| P2-15 | M6 | Settings modal: keep edits in local draft; commit to store only on Save (Cancel reverts) | M |
| P2-16 | M7 | Refresh interval composable: watch `cfg.refreshInterval`, restart timers on change (fixes 9 widgets); wire Weather interval setting | M |
| P2-17 | M8 | Surface autosave failures in normal mode (toast/banner) | S |
| P2-18 | M18 | Honor Public IP provider selection; remove dead code path | S |
| P2-19 | M6(prod logs) | Remove/gate debug console logging behind dev flag (`server.js:346`, CalendarWidget) | S |

---

## Priority 3 — Low / Cleanup

| ID | Finding | Item | Effort |
|----|---------|------|--------|
| P3-1 | L1, M14 | Consolidate 3× duplicated `getConnectionConfig` + divergent `buildSshConfig` into one SSH module; bring server JS under lint/typecheck scope (JSDoc check or TS migration) | M |
| P3-2 | L2, M11 | Dead code removal (`LIMITS.maxRequestBody`, `clearGitHubCache`, test dead imports); align ssh2 versions; add `engines` field | S |
| P3-3 | L8 | Journal parse fallback stops fabricating "kernel" entries | S |
| P3-4 | L6 | Enforce numeric bounds inside `processClient` module | S |
| P3-5 | L10 | Feed size limit enforced during streaming (pre-buffer) | S |
| P3-6 | L3 | Remove redundant per-route `express.json` instances | S |
| P3-7 | M13 | Toolchain refresh: ESLint 9, Vite/Vitest upgrades, Dependabot/Renovate, `npm audit` in CI | M |
| P3-8 | L4/L7/nginx | CI per-job permissions, `timeout-minutes`, SBOM+cosign signing, `server_tokens off`, index.html cache policy, `X-Forwarded-Proto`, SPA cache-bust safety | M |
| P3-9 | M12 | README quick-start hardened `docker run` variant; optional `USER` directive investigation | S |
| P3-10 | H10 | Test coverage push: priority endpoints (caldav/*, database-monitor, system-logs, service-status, status-check, github/releases), error branches, and first component tests + coverage tooling | L |

---

## Feature Track (parallel with security work)

Committed Phase 2 features (see STATUS.md roadmap):

1. **Widgets:** Disk Usage · Network Interfaces · Cron Job Monitor · Markdown Notes · Port Scanner
2. **Features:** Export/Import/Reset configuration · Auto-save option · Undo/redo · SSH jump host/bastion · IFrame sandbox restrictions + load timeout
3. **Cleanup:** Move `ssh2` from `devDependencies` to `dependencies`

New widget implementations MUST use the shared `safeFetch()` (P0-3) and follow the
refresh-interval composable (P2-16) from day one.

## Credential Vault (P2 flagship, prerequisite: P0-2)

Design sketch (from SECURITY.md backlog):
- `data/credentials.enc` — AES-256-GCM, key from PBKDF2(env master secret)
- Widgets reference credentials by ID; secrets never round-trip through frontend config
- Migration: one-time import of existing plaintext `conf.yml` secrets, then strip
- UI: credential manager modal; per-widget dropdown instead of password fields

---

## Suggested Milestones

| Milestone | Contents | Outcome |
|-----------|----------|---------|
| **M2.1 — Injection & SSRF closed** | P0-1, P0-3, P1-1 | No unauthenticated RCE/read primitives |
| **M2.2 — Auth foundation** | P0-2, P1-2 | Authenticated surface, TOFU restored, loopback default |
| **M2.3 — Deploy hardening** | P1-3..P1-7, P2-7 | Safe releases, gated CI, pinned supply chain |
| **M2.4 — Vault + data integrity** | Vault design+impl, P2-1..P2-3, C7 | Encrypted credentials at rest |
| **M2.5 — UX integrity** | P2-15..P2-19 | No silent data loss; settings behave predictably |
| **M2.6 — Feature drop** | Widget + feature track | 5 new widgets, export/import, jump host |
| **Ongoing** | P2-4..P2-14, P3-x | Continuous hardening & cleanup |

## Tracking

- Check off acceptance criteria in this file as items complete
- Mirror completed items into CHANGELOG.md under the release version
- Update STATUS.md feature table rows from Planned → Implemented
