# Security Policy

## Phase-1 Security Boundary

DashHub is a **local-first, self-hosted operations dashboard**. The current
architecture is designed for:

- **Local access** (same machine)
- **Trusted LAN** access

It is **not** designed for:

- Public Internet exposure without additional hardening
- Shared multi-user hosting
- Untrusted network environments

Phase-2 features (authentication, RBAC, credential vault, SSRF policy, audit
logging) will address shared-hosting requirements in a future release.

## Development Rule: Credential Registration

**Any new widget that introduces credentials, tokens, API keys, private keys,
or other secrets must register those fields in `WIDGET_SECRET_FIELDS` in
`server/api/configManager.js`.**

Secrets must never be returned through the public configuration API
(`GET /api/config`). The central mechanism handles:

- **Stripping** secret fields from `GET /api/config` responses
- **Preserving** secret fields when omitted from `PUT /api/config` requests
- **Flagging** `hasCredential` so the frontend knows a secret exists

### How to register secret fields

In `server/api/configManager.js`, add an entry to `WIDGET_SECRET_FIELDS`:

```js
const WIDGET_SECRET_FIELDS = {
  ssh: {
    fields: ['password', 'privateKey', 'passphrase'],
    restoreBy: 'connection',       // secrets live on nested connection objects
    authTypeGated: true            // restore depends on authType
  },
  calendar: {
    fields: ['password'],
    restoreBy: 'widget',           // secret lives directly on item.config
    authTypeGated: false
  },
  'database-monitor': {
    fields: ['dbPassword'],
    restoreBy: 'widget',
    authTypeGated: false
  },
  // Add new credential-bearing widgets here:
  // 'my-new-widget': {
  //   fields: ['apiKey', 'token'],
  //   restoreBy: 'widget',
  //   authTypeGated: false
  // }
}
```

### Field naming convention

Use the same field name as the TypeScript interface in `src/types/config.ts`.
For example, if your widget config has `apiKey: string`, register `'apiKey'`
in the `fields` array.

### Frontend behavior

When `hasCredential` is `true` and the actual secret value is empty, the
settings form should display a placeholder (e.g., a masked input or
"Configured" text) rather than an empty field. On save, emit
`hasCredential: true` without the secret value so the server restores it.
