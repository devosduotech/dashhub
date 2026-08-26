# OSDuo DashHub — Distribution & Release Pipeline

> **Purpose:** Reference for how DashHub is distributed as Docker images, how the
> Compose files are organized, and the release process. Read this before working on
> anything related to release, deployment, or the CI pipeline.
>
> Last updated: 2026-08-19

---

## Overview

DashHub is published as a multi-architecture Docker image to the **GitHub Container
Registry (GHCR)**, built and pushed automatically by a **GitHub Actions** workflow.
End users consume the pre-built image — no Node.js, npm, or source code required.

```
GitHub repo: devosduotech/dashhub
      │  tag vX.Y.Z  /  manual dispatch
      ▼
GitHub Actions (.github/workflows/docker.yml)
      │  typecheck → lint → test → build
      │  docker buildx (linux/amd64 + linux/arm64)
      │  smoke test
      ▼
GHCR: ghcr.io/devosduotech/dashhub
      ├── X.Y.Z      (release, matches git tag without the "v")
      ├── latest     (latest stable release only)
      └── dev        (local builds via the dev compose file)
```

## Image & Registry

| Item | Value |
| --- | --- |
| Registry | `ghcr.io` (GitHub Container Registry) |
| Image | `ghcr.io/devosduotech/dashhub` |
| Release tag | `ghcr.io/devosduotech/dashhub:1.0.1` (git tag `v1.0.1`, `v` stripped) |
| Latest tag | `ghcr.io/devosduotech/dashhub:latest` |
| Dev tag | `ghcr.io/devosduotech/dashhub:dev` (local builds only, not published by CI) |
| Architectures | `linux/amd64`, `linux/arm64` (via Docker Buildx + QEMU) |
| Visibility | **Public** — anonymous `docker pull` works, no login required |

The repository owner `devosduotech` is a **personal** GitHub account (not an org), so
the GHCR package lives under `/users/devosduotech/packages/container/dashhub`.

## Compose Files

### `docker-compose.yml` (root) — end-user / released image

- Pulls the pinned release image: `image: ghcr.io/devosduotech/dashhub:1.0.1`
- **No `build:` block** — end users never build from source
- `container_name: dashhub`, host port `48215` (`${HOST_PORT:-48215}:80`)
- Persistent volume `./data:/app/data`
- **No `env_file: .env` requirement** — all env vars have defaults, so a fresh
  install works with zero config files

```bash
# Install
mkdir dashhub && cd dashhub && mkdir data
curl -O https://raw.githubusercontent.com/devosduotech/dashhub/v1/docker-compose.yml
docker compose up -d          # pulls the image automatically if missing

# Upgrade
docker compose pull && docker compose up -d
```

### `docker-compose.dev.yml` — developer / build from source

- Override file, applied with: `docker compose -f docker-compose.yml -f docker-compose.dev.yml`
- Adds `build: .` (local Dockerfile build) and re-tags the image as `ghcr.io/devosduotech/dashhub:dev`
- Runs as `container_name: dashhub-dev` on host port **48216** (`${HOST_PORT_DEV:-48216}:80`)
- Uses `ports: !override` so the base 48215 mapping is **replaced**, not duplicated
- Lets a dev build run **in parallel** with a released image container
  (`dashhub` on 48215 vs `dashhub-dev` on 48216)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
# Open http://localhost:48216
```

> **Compose gotcha:** `!reset` silently drops the whole `ports` list in Docker Compose
> v5.x. Use `!override` when replacing a base service's port mapping.

## GitHub Actions Workflow (`.github/workflows/docker.yml`)

### Triggers
- `push` of a tag matching `v*` (e.g. `v1.0.2`, `v1.1.0`)
- `workflow_dispatch` with an optional `version` input (default `1.0.1`) — used to
  (re)publish an image for an existing tag without pushing a new tag

### Jobs
1. **test** — `npm ci` (root) **plus `npm ci --prefix server/api`** (the API tests import
   `server/api/server.js`, which needs `express` and friends from `server/api`), then
   `typecheck`, `lint`, `test`, `build`. This is the release gate.
2. **docker** — depends on `test`:
   - Setup QEMU (multi-arch) + Buildx
   - Login to GHCR with `GITHUB_TOKEN` (`permissions: packages: write`)
   - `docker/metadata-action` generates tags/labels:
     - `type=semver,pattern={{version}}` → tag → `1.0.1`
     - `latest` enabled on tag pushes **and** manual dispatch
   - **Smoke test first**: builds `linux/amd64` image, `docker run`s it with a temp
     data dir, waits for the Dockerfile `HEALTHCHECK` (probes `/api/config`), curls the
     API through nginx, and verifies inside the container that `conf.yml` was
     initialized and the API runs as the unprivileged `dashhub` user. Only then pushes.
   - Multi-arch build+push: `linux/amd64,linux/arm64`, gha layer cache

> **CI gotchas discovered:**
> - Tests fail on a fresh runner unless `server/api` dependencies are installed
>   (`npm ci --prefix server/api`).
> - The smoke test must verify files **inside the container** (`docker exec ... test -f`),
>   not on the host bind mount — the entrypoint `chown -R dashhub:dashhub /app/data`
>   re-owns the host directory, so the runner user cannot read it.

## Release Process

A new release = **one git tag push**. Everything else is automated:

```bash
# On develop: bump versions (package.json, server/api/package.json, lockfiles,
# CHANGELOG, STATUS) and commit.
git checkout v1
git merge --ff-only develop
git tag v1.0.2
git push origin v1.0.2      # triggers the workflow → builds + publishes 1.0.2 + latest
```

Then create the GitHub Release (title + notes) for the tag.

### Tag / version mapping

| Git | Docker | Branches |
| --- | --- | --- |
| `v1.0.1` | `ghcr.io/devosduotech/dashhub:1.0.1` | `develop` (dev) + `v1` (stable) |
| `v1.0.2` | `ghcr.io/devosduotech/dashhub:1.0.2` | `v1` branch fast-forwarded |

- `develop` — ongoing development
- `v1` — stable/release line; **must** be fast-forwarded to `develop` before tagging
- `latest` always points at the newest stable release; the pinned end-user compose file
  intentionally references the exact version, never `latest`

## Common Operations

| Task | Command |
| --- | --- |
| Pull/reinstall the release image | `docker pull ghcr.io/devosduotech/dashhub:1.0.1` |
| Run released image directly | `docker run -d --name dashhub -p 48215:80 -v "$PWD/data":/app/data ghcr.io/devosduotech/dashhub:1.0.1` |
| Build from source (dev) | `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build` |
| Re-publish image for existing tag | GitHub UI → Actions → Build & Publish Docker Image → Run workflow (version input) |
| Check published tags | `docker manifest inspect ghcr.io/devosduotech/dashhub:1.0.1` |
| Check CI run | https://github.com/devosduotech/dashhub/actions |

## Persistent Data

Images contain **application code only**. All user data lives in the mounted
`./data` directory (host path) → `/app/data` (container):

```
./data/
├── conf.yml          # active config (SSH credentials included, sanitized by API)
├── known_hosts.json  # trusted SSH host fingerprints
└── uploads/          # uploaded icons/images
```

The container is disposable — delete/recreate freely; `./data` persists. Back it up.