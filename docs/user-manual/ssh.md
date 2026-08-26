# SSH Management

The SSH Terminal widget provides browser-based SSH access to your servers. One widget can hold many saved **connections**, and other widgets (System Info, Process List, Service Status, System Logs, Database Monitor) reuse those same connections.

> **Figure 7 — Configuring an SSH connection** *(placeholder: `../images/ssh-settings.png`)*

## Before you configure SSH

Make sure:

- SSH is enabled on the target server
- The server is reachable from where you run DashHub
- You know the SSH port (22 unless changed)
- You have a valid username and one of: a password, a private key, or an SSH agent

## Adding a connection

1. Enable **Edit Mode** and open the SSH widget's **Settings**.
2. Under **Connections**, click **Add Connection**.
3. Fill in the fields below.
4. Save the connection.

### Connection settings

| Setting | Required | Description |
|---------|----------|-------------|
| Connection Name | ✅ | Label shown in the widget's connection list (e.g. `demo.example.com`) |
| Group | — | Optional grouping label to organise long connection lists |
| Host | ✅ | Server hostname or IP address |
| Port | ✅ | SSH port — default `22` |
| Username | ✅ | SSH login user |
| Authentication | ✅ | **Password**, **Private Key**, or **Agent** |

### Authentication types

**Password** — paste the login password. It is stored server-side in the configuration file and never sent back to the browser.

**Private Key** — paste an OpenSSH-format private key (the contents of an `id_ed25519` / `id_rsa` file). The corresponding public key must be present in the server's `authorized_keys`. A key passphrase can be supplied if the key is encrypted.

**Agent** — uses an SSH agent running where the DashHub container runs. Useful when keys are managed outside DashHub; requires agent forwarding to be available to the container.

> **Note (security):** Credentials are stored in the local configuration file in plaintext. Encryption at rest is planned for Phase 2 — until then, protect the `data/` directory with normal file permissions. See [SECURITY.md](../project/SECURITY.md).

### Terminal preferences (per widget)

| Setting | Options |
|---------|---------|
| Default Shell | Command run on connect (default `/bin/bash`) |
| Terminal Theme | Monokai, Solarized Dark, Dracula, Nord |
| Font Size | Terminal font size (default 14) |

## Connecting to a server

1. Leave Edit Mode.
2. In the SSH widget, select the connection from the dropdown.
3. Click **Connect**. The terminal opens in the widget.
4. Use the terminal like any SSH session.

**Open in a full tab:** the widget's external-link control opens the same session as a full-page terminal (`/ssh/<connection>`), useful on small screens.

**Multiple sessions:** the **+** button in the terminal opens additional tabs within the widget; each tab is an independent session. Tabs can be renamed and closed.

> **Figure 9 — SSH terminal session** *(placeholder: `../images/ssh-terminal.png`)*

## Host keys

On the **first connection to a server**, DashHub records the server's host key in `data/known_hosts.json` and reuses it for every future connection to that host.

> **Note (current behavior):** In v1.0.18 the host key is accepted and pinned automatically — you are not asked to compare the fingerprint by hand. The connection is still verified against the pinned key on every subsequent connection: if the server's key ever changes, the connection is refused until the stored entry is reviewed. Explicit fingerprint approval before first connection is planned for Phase 2.

If a server is rebuilt and its key legitimately changes, connections fail with a host-key error. Resolve it by removing that host's entry from `data/known_hosts.json` (inside the `data/` volume) and reconnecting — after verifying out-of-band that the new key is genuine.

## Managing connections

- **Edit** a connection: open widget settings, click the connection's edit control, change fields, save.
- **Delete** a connection: open widget settings, click the connection's delete control. Other widgets that referenced it must be re-pointed to another connection.
- **Reusing connections:** System Info, Process List, Service Status, System Logs, and Database Monitor all show a **Connection** dropdown fed by the SSH widget's saved connections. Add connections in an SSH widget once, then select them everywhere.

---

Next: [Monitoring Widgets](monitoring.md)
