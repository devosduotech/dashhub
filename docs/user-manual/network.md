# Network & Utilities

Public IP, Weather, and Speedtest — widgets about your connection and environment.

---

## Public IP

### Purpose
Shows the public IP address of the DashHub network, with location details.

### Configuration

| Setting | Required | Description |
|---------|----------|-------------|
| Hide Location | — | Show the IP only, without city/region |
| Use Proxy | — | Fetch via the DashHub server instead of the browser |
| Provider | — | *Reserved for future use* — the current release queries ip-api |

### Using the widget
Press **Refresh** to re-query. The lookup uses the public internet; no data leaves your network except this query.

---

## Weather

### Purpose
Current conditions and a 5-day forecast, powered by [Open-Meteo](https://open-meteo.com) (free, no API key).

### Configuration

| Setting | Required | Description |
|---------|----------|-------------|
| Location | ✅ | Search by city name and pick from suggestions (stores coordinates) |
| Temperature Unit | — | °C or °F |
| Wind Speed Unit | — | km/h or mph |

### Using the widget
- Shows current temperature, humidity, wind, and condition icon, plus 5 daily high/low cards
- Auto-refreshes every 30 minutes; the header button forces a refresh

---

## Speedtest

### Purpose
Measures ping, jitter, download, and upload speed from the **browser** to a speed-test endpoint.

### Configuration

| Setting | Required | Description |
|---------|----------|-------------|
| Test Server | — | `Cloudflare` (default) or `Custom` |
| Base URL | — | With Custom: base URL of a self-hosted LibreSpeed-compatible endpoint |
| Test Duration | — | Seconds per direction (default 10) |
| Parallel Streams | — | Simultaneous connections (default 4) |

### Using the widget
1. Press **Start**.
2. Watch the live gauge — ping and jitter appear first, then download and upload with a real-time Mbps counter.
3. Results stay until the next run.

> **Notes:**
> - The test runs from your browser, so results reflect the machine you are browsing from — not the DashHub server.
> - Closing the dashboard mid-test does not immediately stop in-flight transfers; let a test finish or reload the page.
> - A self-hosted LibreSpeed backend avoids consuming metered internet bandwidth.

---

Next: [Backup & Restore](backup-restore.md)
