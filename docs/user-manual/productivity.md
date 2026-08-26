# Productivity Widgets

Calendar, Notes, Reminders, and Clock — the everyday tools of the dashboard.

---

## Calendar

### Purpose
Shows events from a CalDAV calendar (Nextcloud, and other CalDAV-compatible servers) as an upcoming list or a month grid — with create and delete directly from the dashboard.

### Before you configure
- A CalDAV server you have access to (e.g. Nextcloud)
- For Nextcloud: an **app password** is recommended (Settings → Security → Create new app password)
- The calendar's CalDAV URL (Nextcloud: Calendar app → Settings → copy the CalDAV link, or the discovery helper below)

### Configuration

| Setting | Required | Description |
|---------|----------|-------------|
| CalDAV Server URL | ✅ | Server base URL (e.g. `https://cloud.example.com`) |
| Username | ✅ | Account login |
| Password | ✅ | App password (recommended) |
| Calendar | ✅ | Pick from discovered calendars |
| Display Mode | — | `Upcoming Events` list or `Month` grid |
| Event Count | — | Rows shown in upcoming mode (5/10/15) |
| Refresh Interval | — | Minutes between refreshes (default 15) |

### Using the widget
- **Discover Calendars** fills the calendar dropdown from the server
- **Upcoming mode** fetches a rolling 30-day window from today
- **Month mode**: click any day to open the day panel; add events with the form (title required, start/end date-time) and delete events with the trash control
- Credentials are stored server-side and resolved by widget ID — they survive page refreshes

> **Figure 10 — Calendar month view with day panel** *(placeholder: `../images/calendar.png`)*

---

## Notes

### Purpose
Quick personal notes with low/medium/high priority, edited directly on the dashboard.

### Configuration

| Setting | Required | Description |
|---------|----------|-------------|
| Sort By | — | `created` (newest first) or `priority` |

### Using the widget
- **Add:** type in the input at the bottom, pick a priority, press Enter (Shift+Enter for a new line)
- **Edit:** click the note text — an inline editor opens with a wide auto-resizing textarea and a stacked ✓ save / priority / ✕ cancel column. Enter saves, Escape cancels
- **Delete:** hover the note and use the trash control in the top-right cluster
- **Priority at a glance:** the colored left border (red = high, indigo = medium, gray = low); the badge appears in the hover cluster
- In Edit Mode the widget switches to a compact read-only list so dragging widgets doesn't fight with text editing

---

## Reminders

### Purpose
A task list with checkboxes and priorities — same editing model as Notes.

### Configuration

| Setting | Required | Description |
|---------|----------|-------------|
| Show Completed | — | Keep finished tasks visible (struck through) |
| Sort By | — | `created` or `priority` |

### Using the widget
Identical to Notes, plus a **checkbox** per task for completion. Completed tasks are struck through and hidden when *Show Completed* is off.

---

## Clock

### Purpose
Live time and date display.

### Configuration

| Setting | Required | Description |
|---------|----------|-------------|
| Time Zone | — | Any IANA zone (e.g. `Asia/Kolkata`); empty = browser local |
| Format / Use 12-Hour | — | 12- or 24-hour display |
| Hide Date / Hide Seconds | — | Minimal display options |

---

Next: [Information & Resources](resources.md)
