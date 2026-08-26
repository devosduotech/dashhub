# Information & Resources

Quick Links, RSS, YouTube, IFrame, and Latest Versions — the widgets that surface information you choose.

---

## Quick Links

### Purpose
Bookmark shortcuts with categories, icons, and multiple display modes.

### Configuration

| Setting | Required | Description |
|---------|----------|-------------|
| Links | ✅ | One or more: **Title**, **URL**, **Category**, **Icon** (from the icon grid or an uploaded image), **Description**, **Open in** (same/new tab) |
| Display Mode | — | `Grid`, `List`, or `Bar` (compact horizontal pills) |
| Columns | — | Grid columns (default 3) |

### Using the widget
- Links can be reordered by drag & drop in settings
- Icons come from the built-in SVG icon grid or the media library (uploaded images)

---

## RSS Feed

### Purpose
Aggregates RSS 2.0 / Atom feeds with titles, excerpts, thumbnails, and relative dates.

### Before you configure
- Feed URLs that are publicly reachable from the DashHub server

### Configuration

| Setting | Required | Description |
|---------|----------|-------------|
| Feeds | ✅ | One or more feed URLs |
| Items Per Feed | — | Rows per feed (default 5) |
| Show Thumbnails | — | Toggle feed images |
| Cache Time | — | Minutes the server caches each feed (default 15) |

> **Note:** Feeds are fetched by the DashHub server (no CORS issues), cached, and served to the widget.

---

## YouTube

### Purpose
Latest videos from chosen YouTube channels — no API key required.

### Before you configure
- The **channel ID** (not the channel name). Find it in the channel page URL (`youtube.com/channel/<ID>`) or via its RSS feed link

### Configuration

| Setting | Required | Description |
|---------|----------|-------------|
| Channels | ✅ | Channel IDs |
| Videos Per Channel | — | Default 3 |
| Display Mode / Thumbnail Size | — | Grid or list; small/medium/large thumbnails |
| Cache Time | — | Minutes (default 60) |

---

## IFrame

### Purpose
Embeds any compatible web page — internal tools, dashboards, documentation, status pages.

### Before you configure
- The target page must **allow embedding**. Many sites send `X-Frame-Options: SAMEORIGIN` or a restrictive `Content-Security-Policy: frame-ancestors`, which browsers honour by refusing to render. If the page is under your control, adjust those headers at your reverse proxy; if it is not, the page cannot be embedded.

### Configuration

| Setting | Required | Description |
|---------|----------|-------------|
| URL | ✅ | Page to embed |
| Height / Width | — | Frame size |
| Full Width | — | Span all columns |
| Allow Fullscreen | — | Fullscreen button inside the frame |
| Refresh Interval | — | 0 = off; otherwise seconds between reloads |

### Worked example: embedding an Uptime Kuma status page
Uptime Kuma serves status pages with `X-Frame-Options: SAMEORIGIN`. To embed one, strip/replace that header at the reverse proxy in front of Kuma, scoped to DashHub only:

```nginx
proxy_hide_header X-Frame-Options;
add_header Content-Security-Policy "frame-ancestors 'self' http://<dashhub-host>:<port>" always;
```

Then add the IFrame widget with the status-page URL. If the frame stays blank, check the browser console for a `frame-ancestors` violation — the allowlisted origin must exactly match how you open DashHub (scheme + host + port).

---

## Latest Versions

### Purpose
Tracks the latest release versions of packages you care about, from npm, GitHub releases, and PyPI.

### Configuration

| Setting | Required | Description |
|---------|----------|-------------|
| Items | ✅ | Package entries: name + source (npm / GitHub / PyPI) + identifier |

### Using the widget
- The list expands naturally with the number of items (no internal scrollbar)
- Results are cached for 24 hours (server-side GitHub proxy + browser cache); use **Refresh** to force a re-check
- Optional: set a `GITHUB_TOKEN` environment variable for higher GitHub API rate limits (see the [Deployment Guide](../deployment/README.md))

---

Next: [Network & Utilities](network.md)
