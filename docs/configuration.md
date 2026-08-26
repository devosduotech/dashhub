# OSDuo DashHub - Configuration Guide

## Configuration File Structure

The main configuration file is `data/conf.yml`. It contains all dashboard settings organized into sections.

## Configuration Sections

### appConfig - Application Settings

```yaml
appConfig:
  title: "OSDuo DashHub"        # Dashboard title
  theme: dark-navy              # Theme name
  language: en                  # Language code
  iconSet: material             # Icon library
  defaultPage: 0                # Default page index
```

### pages - Page Definitions

Each page contains widgets organized in a grid layout.

```yaml
pages:
  - name: "Page Name"           # Display name
    icon: "dashboard"            # Icon identifier
    items:                      # List of widgets
      - type: widget-type       # Widget type
        title: "Widget Title"  # Display title
        config:                # Widget-specific config
          # ... configuration options
```

## Widget Types

### Quick Links

```yaml
- type: quick-links
  title: "Quick Links"
  config:
    columns: 4                  # Grid columns
    displayMode: grid          # grid or list
    links:
      - title: "Link Title"
        url: "https://example.com"
        icon: "bookmark"       # Font Awesome icon
        description: "Description"
        target: newtab         # newtab, sametab, modal
        category: "Category"
```

### Glances Server

```yaml
- type: glances
  title: "Server Name"
  config:
    url: "http://192.168.1.10:61208"  # Full Glances URL
    displayMode: embedded              # embedded, link, compact
    height: 400                        # Iframe height in pixels
    refreshInterval: 30                # Seconds between refreshes (0 = off)
    ssh:
      enabled: true             # Enable SSH quick-connect
      host: "192.168.1.10"      # SSH server host
      port: 22                  # SSH port
      username: "admin"         # SSH username
```

### SSH Terminal

```yaml
- type: ssh
  title: "SSH Connections"
  config:
    defaultShell: "/bin/bash"
    theme: "monokai"
    fontSize: 14
    connections:
      - name: "Server Name"
        host: "192.168.1.10"
        port: 22
        username: "admin"
        authType: "key"         # key, password, agent
        group: "Production"
        tags: ["web", "prod"]
```

### YouTube

```yaml
- type: youtube
  title: "YouTube Videos"
  config:
    channels:
      - id: "UCXuqSBlHAE6Xw-yeJA0Tunw"
        name: "Channel Name"
    videosPerChannel: 4         # Videos per channel
    displayMode: grid           # grid or list
    thumbnailSize: medium        # small, medium, large
    cacheTime: 60               # Cache duration (minutes)
```

### RSS Feed

```yaml
- type: rss
  title: "News Feed"
  config:
    feeds:
      - url: "https://example.com/feed.xml"
        title: "Feed Title"
        icon: "rss"
        group: "Tech"
    itemsPerFeed: 5              # Items per feed
    showThumbnails: true         # Show article images
    cacheTime: 15               # Cache duration (minutes)
```

### IFrame Embed

```yaml
- type: iframe
  title: "Embedded Content"
  config:
    url: "https://example.com"   # URL to embed
    height: 400                  # Iframe height in pixels
    width: "100%"                # Width (px or %)
    fullWidth: true              # Span all grid columns
    allowFullscreen: true        # Allow fullscreen mode
    refreshInterval: 0           # Auto-refresh seconds (0 = off)
```

### Glances Server (Alternative IFrame-based)

```yaml
- type: glances
  title: "Server Name"
  config:
    url: "http://192.168.1.10:61208"  # Full Glances URL
    displayMode: embedded              # embedded, link, compact
    height: 400                        # Iframe height in pixels
    width: "100%"                      # Width (px or %)
    fullWidth: true                    # Span all grid columns
    refreshInterval: 30                # Seconds between refreshes (0 = off)
    ssh:
      enabled: true             # Enable SSH quick-connect
      host: "192.168.1.10"      # SSH server host
      port: 22                  # SSH port
      username: "admin"         # SSH username
      authType: "password"      # password or key
      password: "secret"        # Stored in data/conf.yml (never returned by the API)
```

## SSH Connections

SSH connections are defined inside the SSH widget's `config.connections` array. Credentials (passwords, private keys) are stored in the same `data/conf.yml` file; the API never returns them (`GET /api/config` exposes only a `hasCredential` flag).

```yaml
- type: ssh
  title: "SSH Connections"
  config:
    defaultShell: "/bin/bash"
    theme: "monokai"
    fontSize: 14
    connections:
      - name: "Connection Name"
        host: "192.168.1.10"
        port: 22
        username: "admin"
        authType: "key"            # key, password, agent
        group: "Production"
        tags:
          - web
          - production
```

### Authentication Types

| Type | Description | Configuration |
|------|-------------|---------------|
| key | SSH key authentication | Requires privateKey field |
| password | Password authentication | Requires password field |
| agent | SSH agent forwarding | Uses system SSH agent |

## Example Configuration

See [config/default.yml](../config/default.yml) for a complete example.

## Validation

Configuration is validated on load. Common issues:

- Invalid URLs
- Missing required fields
- Invalid port numbers
- Invalid widget type

## Tips

- Use comments (`#`) to document your configuration
- Keep sensitive data in `data/conf.yml`; it is excluded from API responses
- Test configuration changes incrementally
- Use the UI to configure - no need to edit YAML manually
- Backup your `data/conf.yml` before major changes
- All widget settings can be configured via the web UI
- Export working configurations as backup
