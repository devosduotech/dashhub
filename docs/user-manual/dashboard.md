# Building Your Dashboard

This is the core chapter. DashHub does not impose a fixed structure — you create the workspace that matches your requirements.

## Dashboard concept

> A DashHub installation can contain multiple **pages**. Each page has its own name, icon, number of **columns**, and collection of **widgets**. Widgets are configured individually and can be moved within and between columns and pages.

```text
Dashboard
│
├── Page
│    ├── Name
│    ├── Order
│    ├── Columns
│    └── Widgets
│          ├── Widget configuration
│          └── Column placement
│
├── Page
│    └── ...
│
└── Page
     └── ...
```

## The workflow

```text
Enable Edit Mode
     ↓
Create a page (name + icon)
     ↓
Choose the number of columns
     ↓
Add widgets from the palette
     ↓
Configure each widget
     ↓
Drag widgets into place
     ↓
Repeat per page
```

> **Figure 2 — Edit Mode and widget controls** *(placeholder: `../images/edit-mode.png`)*

All steps below require **Edit Mode** to be enabled.

## Creating a page

1. Click the **+ (Add Page)** control at the end of the page tabs.
2. A new page is created with a default name and becomes active.

## Renaming a page and choosing columns

1. In Edit Mode, open the current page's **settings** (page-tab menu).
2. Set **Page Name**, pick an **icon** from the icon grid, and set **Column Count** (1–6).
3. Close the dialog — changes apply immediately.

> **Figure 3 — Page configuration** *(placeholder: `../images/page-settings.png`)*

## Reordering pages

Drag page tabs horizontally; a blue insertion bar shows where the tab will land. Drop to reorder. Your active page stays active.

## Deleting a page

Use the page tab's **delete** control in Edit Mode. The page and its widgets are removed. This cannot be undone (short of restoring a [backup](backup-restore.md)).

## Adding a widget

1. In Edit Mode, open the **widget palette**.
2. Widgets are grouped by category: **Infrastructure**, **Network**, **Productivity**, **Content**, **General**.
3. Click a widget to add it to the current page.

> **Figure 4 — Widget palette** *(placeholder: `../images/widget-palette.png`)*

See the [Widgets Overview](widgets.md) for the full catalog, and the category chapters (5–9) for per-widget configuration.

## Configuring a widget

1. Click the widget's **Settings** (gear) control.
2. Change values — they apply live.
3. Close the dialog when done.

Each widget's settings are documented in its own section (chapters 5–9).

## Moving widgets

**Within a page:** drag a widget by its header. Drop zones appear between widgets; the destination column highlights. Drop to place.

> **Figure 6 — Moving a widget between columns** *(placeholder: `../images/drag-drop.png`)*

**To another page:** click the widget's **Move to page** (arrow) control and pick the target page from the dropdown. DashHub moves the widget and switches to that page.

## Removing widgets

Click the widget's **Remove** (trash) control in Edit Mode. The widget and its configuration are deleted. This cannot be undone.

## Saving configuration

You do not need to save manually. Every layout and configuration change is written automatically (about one second after your last change) to `data/conf.yml` on the server.

> **Note:** Because saving is automatic, the settings dialog's **Cancel** button only closes the dialog — it cannot roll back changes you have already made.

## Example: a Server Operations dashboard

A three-page workspace built entirely from defaults:

```text
Page: Server Operations        (3 columns)
├── Column 1: Glances, System Info
├── Column 2: SSH Terminal, Process List
└── Column 3: Service Status, System Logs, Server Uptime

Page: Customers                (3 columns)
├── Quick Links (customer portals)
├── Server Uptime (customer endpoints)
└── Status Indicators (health dots)

Page: Home                     (4 columns)
├── Calendar, Clock
├── Notes, Reminders
├── Weather
└── Quick Links (team resources)
```

More layout ideas: see the [Recommended dashboard layouts](faq.md#what-dashboard-layouts-do-you-recommend) in the FAQ.

---

Next: [Widgets Overview](widgets.md)
