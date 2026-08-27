# Distribution & Release Pipeline

This document describes how DashHub is packaged, versioned, and published.

## Container Registry

Images are published to GitHub Container Registry:

```
ghcr.io/devosduotech/dashhub
```

| Tag | Meaning |
| --- | --- |
| `1.0.20` (current) | Pinned release tag |
| `latest` | Latest stable release |
| `dev` | **Not published.** Only `v*` tags and `workflow_dispatch` builds push images. |

## Continuous Integration

`.github/workflows/docker.yml` runs on every push to a `v*` tag (and can be triggered manually via `workflow_dispatch` with a `version` input).

1. **Gate** — `typecheck`, `lint`, `test` (Vitest + supertest), `build` (vue-tsc + vite).
2. **Build & Publish** — multi-arch build (`linux/amd64`, `linux/arm64`) with Buildx + QEMU, a `read-only` smoke test (nginx health probe + API check + unprivileged user), then push to GHCR.

Concurrency is scoped to `docker-${{ github.ref }}` with `cancel-in-progress: true`.

> **Tag re-push note:** re-pushing an existing tag name does **not** re-trigger a CI run. Use `workflow_dispatch` (branch `v1`, `version: <semver>`) to rebuild an existing release, or push a new tag.

## Versioning

The version lives in `package.json` (`1.0.20`). After bumping it, run:

```bash
bash scripts/sync-version.sh
```

This updates the version in `README.md` (Docker Images table) and `docker-compose.yml` (image tag). The in-app manual version string in `src/help/useHelpDocs.ts` and `HelpViewer.vue` should be updated manually.

## Cutting a Release

1. Commit the change and push to `develop` and `v1` (kept in sync).
2. Tag the release commit: `git tag -a v1.0.20 -m "..."` and `git push origin v1.0.20`.
3. CI builds and pushes `ghcr.io/devosduotech/dashhub:1.0.20` + `:latest`.
4. Create/restore the GitHub Release for the tag (deleting and re-pushing a tag flips the release to draft — restore it afterward with name, body, and `draft: false`).

## Local Build (manual)

```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  -t ghcr.io/devosduotech/dashhub:1.0.20 \
  -t ghcr.io/devosduotech/dashhub:latest \
  --push .
```

Requires `docker login ghcr.io` with a token that has `write:packages`.
