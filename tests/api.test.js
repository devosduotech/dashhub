import fs from 'fs'
import os from 'os'
import path from 'path'
import { generateKeyPairSync } from 'crypto'
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { WebSocket } from 'ws'
import request from 'supertest'
import { Server as SshServer, utils } from 'ssh2'

process.env.CONFIG_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'dashhub-api-test-'))

const { app, server } = await import('../server/api/server.js')
const { getConnectionConfig, fingerprintOf, saveKnownHost, findKnownHost } = await import('../server/api/sshBridge.js')
const { UPLOADS_DIR } = await import('../server/api/uploadsManager.js')
const ytModule = await import('../server/api/youtube.js')
const rssModule = await import('../server/api/rss.js')

const CONFIG_FILE = path.join(process.env.CONFIG_DIR, 'conf.yml')

function writeConfig(obj) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(obj), 'utf8')
}

function validConfig() {
  return {
    appConfig: { title: 'Test DashHub', defaultPage: 0 },
    pages: [
      {
        id: 'page-1',
        name: 'Home',
        items: [
          {
            id: 'item-1',
            type: 'ssh',
            title: 'Servers',
            config: {
              connections: [
                {
                  id: 'conn-1',
                  name: 'Prod',
                  host: '10.0.0.1',
                  port: 22,
                  username: 'admin',
                  authType: 'password',
                  password: 'supersecret'
                }
              ]
            }
          }
        ]
      }
    ]
  }
}

function sshConfigWith(port, connId = 'conn-host') {
  return {
    appConfig: { title: 'T', defaultPage: 0 },
    pages: [
      {
        id: 'page-x',
        name: 'Home',
        items: [
          {
            id: 'item-x',
            type: 'ssh',
            title: 'S',
            config: {
              connections: [
                {
                  id: connId,
                  name: 'TestHost',
                  host: '127.0.0.1',
                  port,
                  username: 'test',
                  authType: 'password',
                  password: 'pw'
                }
              ]
            }
          }
        ]
      }
    ]
  }
}

// --- Real SSH host used to exercise the bridge's host-key verification -----

function generateHostKey() {
  const { execSync } = require('child_process')
  const fs = require('fs')
  const tmp = fs.mkdtempSync(require('os').tmpdir() + '/ssh-hostkey-')
  execSync(`ssh-keygen -t ed25519 -f ${tmp}/key -N '' -q`)
  const key = fs.readFileSync(`${tmp}/key`, 'utf8')
  fs.rmSync(tmp, { recursive: true })
  return key
}

function startSshHost(port = 0) {
  return new Promise((resolve, reject) => {
    const srv = new SshServer({ hostKeys: [generateHostKey()] }, (client) => {
      // The bridge's host-key probe deliberately aborts the handshake; swallow
      // the resulting server-side disconnect so it does not become an unhandled error.
      client.on('error', () => {})
      client.on('authentication', (ctx) => ctx.accept())
      client.on('ready', () => {
        client.on('session', (accept) => {
          const session = accept()
          session.on('pty', (acceptPty) => acceptPty())
          session.on('shell', (acceptShell) => {
            const stream = acceptShell()
            stream.write('hello\r\n')
          })
        })
      })
    })
    srv.on('error', reject)
    srv.listen(port, '127.0.0.1', () => {
      resolve({ server: srv, port: srv.address().port })
    })
  })
}

function stopSshHost(srv) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(), 5000)
    srv.close(() => {
      clearTimeout(timer)
      resolve()
    })
  })
}

// --- WebSocket helpers ------------------------------------------------------

function openTerminalWs(connId, expectFinal = true) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${server.address().port}/api/ssh?id=${connId}`)
    const messages = []
    const timer = setTimeout(() => {
      ws.close()
      reject(new Error(`ws timeout waiting for final message for ${connId}`))
    }, 8000)
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString())
      messages.push(msg)
      if (expectFinal && (msg.type === 'connected' || msg.type === 'closed' || msg.type === 'error')) {
        clearTimeout(timer)
        ws.close()
        resolve(messages)
      }
    })
    ws.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

function acceptHostKeyAndConnect(connId) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${server.address().port}/api/ssh?id=${connId}`)
    const messages = []
    const timer = setTimeout(() => {
      ws.close()
      reject(new Error('accept flow timeout'))
    }, 10000)
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString())
      messages.push(msg)
      if (msg.type === 'host-key') {
        ws.send(JSON.stringify({ type: 'host-key-accept' }))
      } else if (msg.type === 'connected') {
        clearTimeout(timer)
        ws.close()
        resolve(messages)
      } else if (msg.type === 'error') {
        clearTimeout(timer)
        ws.close()
        reject(new Error('unexpected error during accept flow: ' + msg.message))
      }
    })
    ws.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

describe('config API', () => {
  it('GET /api/config returns credentials sanitized', async () => {
    writeConfig(validConfig())
    const res = await request(app).get('/api/config').expect(200)
    const conn = res.body.pages[0].items[0].config.connections[0]
    expect(conn.password).toBeUndefined()
    expect(conn.hasCredential).toBe(true)
    expect(res.body.pages[0].items[0].config.connections[0].name).toBe('Prod')
  })

  it('GET /api/config creates a default config when missing', async () => {
    fs.rmSync(CONFIG_FILE, { force: true })
    const res = await request(app).get('/api/config').expect(200)
    expect(res.body.appConfig).toBeTruthy()
    expect(Array.isArray(res.body.pages)).toBe(true)
  })

  it('PUT /api/config persists a valid config', async () => {
    const cfg = validConfig()
    await request(app).put('/api/config').send(cfg).expect(200)
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8')
    expect(raw).toContain('supersecret')
    expect(raw).toContain('Test DashHub')
  })

  it('PUT /api/config preserves existing credentials when client omits them', async () => {
    writeConfig(validConfig())
    const sanitized = (await request(app).get('/api/config').expect(200)).body
    await request(app).put('/api/config').send(sanitized).expect(200)
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8')
    expect(raw).toContain('supersecret')
  })

  it('PUT /api/config rejects an invalid config with a structured error', async () => {
    const bad = { appConfig: { title: 123 }, pages: [] }
    const res = await request(app).put('/api/config').send(bad).expect(400)
    expect(res.body.error).toBe('CONFIG_INVALID')
    expect(typeof res.body.message).toBe('string')
  })

  it('POST /api/config/validate reports validity', async () => {
    const ok = await request(app).post('/api/config/validate').send(validConfig()).expect(200)
    expect(ok.body.valid).toBe(true)
    const bad = await request(app).post('/api/config/validate').send({ appConfig: {}, pages: 'x' }).expect(200)
    expect(bad.body.valid).toBe(false)
  })

  it('does not leak internal error details', async () => {
    fs.writeFileSync(CONFIG_FILE, ':::: not valid yaml ::::', 'utf8')
    const res = await request(app).get('/api/config').expect(500)
    expect(res.body.error).toBe('CONFIG_READ_FAILED')
    expect(res.body.detail).toBeUndefined()
  })

  it('GET /api/config sanitizes calendar password', async () => {
    const cfg = validConfig()
    cfg.pages[0].items.push({
      id: 'item-cal', type: 'calendar', title: 'Cal',
      config: { serverUrl: 'https://caldav.test', username: 'user', password: 'cal-secret',
                calendarUrl: '/cal', displayName: 'Me', displayMode: 'upcoming',
                eventCount: 10, refreshInterval: 300 }
    })
    writeConfig(cfg)
    const res = await request(app).get('/api/config').expect(200)
    const cal = res.body.pages[0].items.find(i => i.type === 'calendar')
    expect(cal.config.password).toBeUndefined()
    expect(cal.config.hasCredential).toBe(true)
    expect(cal.config.username).toBe('user')
  })

  it('GET /api/config sanitizes database-monitor dbPassword', async () => {
    const cfg = validConfig()
    cfg.pages[0].items.push({
      id: 'item-db', type: 'database-monitor', title: 'DB',
      config: { connectionId: 'conn-1', dbHost: '127.0.0.1', dbPort: 3306,
                dbUser: 'root', dbPassword: 'db-secret', refreshInterval: 30 }
    })
    writeConfig(cfg)
    const res = await request(app).get('/api/config').expect(200)
    const db = res.body.pages[0].items.find(i => i.type === 'database-monitor')
    expect(db.config.dbPassword).toBeUndefined()
    expect(db.config.hasCredential).toBe(true)
    expect(db.config.dbUser).toBe('root')
  })

  it('PUT /api/config preserves calendar password through round-trip', async () => {
    const cfg = validConfig()
    cfg.pages[0].items.push({
      id: 'item-cal', type: 'calendar', title: 'Cal',
      config: { serverUrl: 'https://caldav.test', username: 'user', password: 'cal-secret',
                calendarUrl: '/cal', displayName: 'Me', displayMode: 'upcoming',
                eventCount: 10, refreshInterval: 300 }
    })
    writeConfig(cfg)
    const sanitized = (await request(app).get('/api/config').expect(200)).body
    await request(app).put('/api/config').send(sanitized).expect(200)
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8')
    expect(raw).toContain('cal-secret')
  })

  it('PUT /api/config preserves database-monitor password through round-trip', async () => {
    const cfg = validConfig()
    cfg.pages[0].items.push({
      id: 'item-db', type: 'database-monitor', title: 'DB',
      config: { connectionId: 'conn-1', dbHost: '127.0.0.1', dbPort: 3306,
                dbUser: 'root', dbPassword: 'db-secret', refreshInterval: 30 }
    })
    writeConfig(cfg)
    const sanitized = (await request(app).get('/api/config').expect(200)).body
    await request(app).put('/api/config').send(sanitized).expect(200)
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8')
    expect(raw).toContain('db-secret')
  })
})

describe('ssh connection lookup', () => {
  it('finds a connection by immutable id', () => {
    writeConfig(validConfig())
    const conn = getConnectionConfig('conn-1')
    expect(conn).not.toBeNull()
    expect(conn.name).toBe('Prod')
  })

  it('returns null for an unknown connection', () => {
    writeConfig(validConfig())
    expect(getConnectionConfig('does-not-exist')).toBeNull()
  })
})

describe('host key helpers', () => {
  it('produces a stable SHA256 fingerprint', () => {
    const key = Buffer.from('dummy-host-key')
    const fp = fingerprintOf(key)
    expect(fp.startsWith('SHA256:')).toBe(true)
    expect(fp).toBe(fingerprintOf(Buffer.from('dummy-host-key')))
    expect(fp).not.toBe(fingerprintOf(Buffer.from('other-key')))
  })

  it('persists and retrieves known hosts', () => {
    const key = Buffer.from('some-host-key')
    const fp = fingerprintOf(key)
    saveKnownHost('10.0.0.99', 22, fp, key)
    const known = findKnownHost('10.0.0.99', 22)
    expect(known).not.toBeNull()
    expect(known.fingerprint).toBe(fp)
    expect(findKnownHost('10.0.0.100', 22)).toBeNull()
  })
})

describe('ssh websocket host-key verification', () => {
  it('rejects an unknown connection with an error message and closes', async () => {
    const messages = await openTerminalWs('unknown-conn')
    expect(messages.length).toBeGreaterThan(0)
    expect(messages[0].type).toBe('error')
    expect(messages[0].message).toContain('not found')
  })

  it('accepts an unknown host key, persists it, reconnects without prompting, and rejects a changed key', async () => {
    const connId = 'conn-hostkey'
    const hostA = await startSshHost()
    try {
      // 1. First connection: unknown host -> explicit fingerprint prompt
      writeConfig(sshConfigWith(hostA.port, connId))
      const first = await acceptHostKeyAndConnect(connId)

      const hostKeyMsg = first.find((m) => m.type === 'host-key')
      expect(hostKeyMsg).toBeTruthy()
      expect(hostKeyMsg.fingerprint).toMatch(/^SHA256:/)
      expect(first.some((m) => m.type === 'connected')).toBe(true)

      // 2. The accepted key must be persisted
      const known = findKnownHost('127.0.0.1', hostA.port)
      expect(known).not.toBeNull()
      expect(known.fingerprint).toBe(hostKeyMsg.fingerprint)

      // 3. Reconnect: known host, no prompt, same key accepted
      const second = await openTerminalWs(connId)
      expect(second.some((m) => m.type === 'host-key')).toBe(false)
      expect(second.some((m) => m.type === 'connected')).toBe(true)

      // 4. Host presents a different key -> must be rejected
      await stopSshHost(hostA.server)
      const hostB = await startSshHost(hostA.port)
      try {
        const third = await openTerminalWs(connId)
        expect(third.some((m) => m.type === 'host-key')).toBe(false)
        const err = third.find((m) => m.type === 'error')
        expect(err).toBeTruthy()
        expect(err.message).toMatch(/host (denied|key verification failed)/i)
      } finally {
        await stopSshHost(hostB.server)
      }
    } finally {
      await stopSshHost(hostA.server).catch(() => {})
    }
  })
})

describe('uploads API', () => {
  const PNG = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from('fake-png-payload')
  ])

  it('stores an uploaded image and returns its path', async () => {
    const res = await request(app)
      .post('/api/uploads')
      .set('Content-Type', 'image/png')
      .send(PNG)
      .expect(201)
    expect(res.body.name).toMatch(/^[a-f0-9-]{36}\.png$/)
    expect(res.body.url).toBe(`/uploads/${res.body.name}`)
    expect(res.body.size).toBe(PNG.length)
    expect(fs.existsSync(path.join(UPLOADS_DIR, res.body.name))).toBe(true)
  })

  it('lists uploaded images newest first', async () => {
    await request(app)
      .post('/api/uploads')
      .set('Content-Type', 'image/png')
      .send(PNG)
      .expect(201)
    const res = await request(app).get('/api/uploads').expect(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
    expect(res.body[0].url).toMatch(/^\/uploads\//)
    expect(res.body[0].name).toMatch(/\.png$/)
  })

  it('serves the stored image bytes', async () => {
    const up = await request(app)
      .post('/api/uploads')
      .set('Content-Type', 'image/png')
      .send(PNG)
      .expect(201)
    const res = await request(app).get(up.body.url).expect(200)
    expect(res.body).toEqual(PNG)
  })

  it('rejects a non-image payload', async () => {
    const res = await request(app)
      .post('/api/uploads')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('not an image at all, definitely not'))
      .expect(400)
    expect(res.body.error).toBe('UPLOAD_INVALID')
  })

  it('deletes an uploaded image', async () => {
    const up = await request(app)
      .post('/api/uploads')
      .set('Content-Type', 'image/png')
      .send(PNG)
      .expect(201)
    await request(app).delete(`/api/uploads/${up.body.name}`).expect(200)
    expect(fs.existsSync(path.join(UPLOADS_DIR, up.body.name))).toBe(false)
    const res = await request(app).delete(`/api/uploads/${up.body.name}`).expect(404)
    expect(res.body.error).toBe('UPLOAD_NOT_FOUND')
  })

  it('rejects unsafe filenames on delete', async () => {
    await request(app).delete('/api/uploads/../../etc/passwd').expect(404)
  })
})

describe('youtube feed API', () => {
  const CHANNEL_ID = 'UCXuqSBlHAE6Xw-yeJA0Tunw'
  const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/">
  <entry>
    <yt:videoId>abc123</yt:videoId>
    <published>2026-08-01T12:00:00+00:00</published>
    <title>First video &amp; more</title>
    <link rel="alternate" type="text/html" href="https://www.youtube.com/watch?v=abc123"/>
    <media:group>
      <media:thumbnail url="https://i.ytimg.com/vi/abc123/hqdefault.jpg" height="360" width="480"/>
    </media:group>
  </entry>
  <entry>
    <yt:videoId>xyz789</yt:videoId>
    <published>2026-08-10T09:30:00+00:00</published>
    <title>Second video</title>
    <link rel="alternate" type="text/html" href="https://www.youtube.com/watch?v=xyz789"/>
    <media:group>
      <media:thumbnail url="https://i.ytimg.com/vi/xyz789/hqdefault.jpg" height="360" width="480"/>
    </media:group>
  </entry>
</feed>`

  afterEach(() => {
    vi.unstubAllGlobals()
    const { clearYoutubeCache } = ytModule
    clearYoutubeCache(CHANNEL_ID)
  })

  it('returns parsed videos from the RSS feed and decodes entities', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => SAMPLE_RSS })))
    const res = await request(app).get(`/api/youtube/feed?channelId=${CHANNEL_ID}`).expect(200)
    expect(res.body.channelId).toBe(CHANNEL_ID)
    expect(res.body.cached).toBe(false)
    expect(res.body.videos).toHaveLength(2)
    expect(res.body.videos[0]).toMatchObject({
      id: 'abc123',
      title: 'First video & more',
      url: 'https://www.youtube.com/watch?v=abc123',
      thumbnail: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg'
    })
    expect(res.body.videos[0].publishedAt).toMatch(/^2026-08-01T/)
  })

  it('honors the max parameter', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => SAMPLE_RSS })))
    const res = await request(app).get(`/api/youtube/feed?channelId=${CHANNEL_ID}&max=1`).expect(200)
    expect(res.body.videos).toHaveLength(1)
    expect(res.body.videos[0].id).toBe('abc123')
  })

  it('serves the second request from cache', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, text: async () => SAMPLE_RSS }))
    vi.stubGlobal('fetch', fetchMock)
    await request(app).get(`/api/youtube/feed?channelId=${CHANNEL_ID}`).expect(200)
    await request(app).get(`/api/youtube/feed?channelId=${CHANNEL_ID}`).expect(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const res = await request(app).get(`/api/youtube/feed?channelId=${CHANNEL_ID}`).expect(200)
    expect(res.body.cached).toBe(true)
  })

  it('rejects an invalid channel id', async () => {
    await request(app).get('/api/youtube/feed?channelId=bad id!').expect(400)
  })

  it('returns a structured error when the feed is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })))
    const res = await request(app).get(`/api/youtube/feed?channelId=${CHANNEL_ID}`).expect(502)
    expect(res.body.error).toBe('FEED_HTTP')
  })
})

describe('rss feed API', () => {
  const FEED_URL = 'https://example.com/rss.xml'
  const RSS_2_0 = `<?xml version="1.0"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Example Feed</title>
    <link>https://example.com</link>
    <item>
      <title>Post one &amp; two</title>
      <link>https://example.com/1</link>
      <pubDate>Wed, 19 Aug 2026 10:00:00 GMT</pubDate>
      <description>&lt;p&gt;Hello &lt;b&gt;world&lt;/b&gt;.&lt;/p&gt; This is a longer description that keeps going and going and going past the truncation limit of three hundred and twenty characters so we can be sure the excerpt is clamped.</description>
      <enclosure url="https://example.com/thumb1.jpg" type="image/jpeg"/>
    </item>
    <item>
      <title>Post two</title>
      <link>https://example.com/2</link>
      <pubDate>Mon, 17 Aug 2026 08:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`
  const ATOM = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <title>Atom Feed</title>
  <entry>
    <title>Atom entry</title>
    <link rel="alternate" href="https://example.com/atom/1"/>
    <published>2026-08-19T10:00:00Z</published>
    <media:group>
      <media:thumbnail url="https://example.com/atom-thumb.jpg"/>
    </media:group>
  </entry>
</feed>`

  afterEach(() => {
    vi.unstubAllGlobals()
    rssModule.clearRssCache(FEED_URL)
  })

  it('parses RSS 2.0 items, strips HTML, decodes entities, and extracts thumbnails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => RSS_2_0 })))
    const res = await request(app).get(`/api/rss/feed?url=${encodeURIComponent(FEED_URL)}`).expect(200)
    expect(res.body.title).toBe('Example Feed')
    expect(res.body.cached).toBe(false)
    expect(res.body.items).toHaveLength(2)
    expect(res.body.items[0]).toMatchObject({
      title: 'Post one & two',
      url: 'https://example.com/1',
      thumbnail: 'https://example.com/thumb1.jpg'
    })
    expect(res.body.items[0].description).not.toContain('<')
    expect(res.body.items[0].publishedAt).toMatch(/^2026-08-19T/)
    expect(res.body.items[1].thumbnail).toBe('')
  })

  it('parses Atom feeds with media thumbnails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => ATOM })))
    const res = await request(app).get(`/api/rss/feed?url=${encodeURIComponent(FEED_URL)}`).expect(200)
    expect(res.body.title).toBe('Atom Feed')
    expect(res.body.items[0].title).toBe('Atom entry')
    expect(res.body.items[0].thumbnail).toBe('https://example.com/atom-thumb.jpg')
  })

  it('honors the max parameter', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => RSS_2_0 })))
    const res = await request(app).get(`/api/rss/feed?url=${encodeURIComponent(FEED_URL)}&max=1`).expect(200)
    expect(res.body.items).toHaveLength(1)
    expect(res.body.items[0].title).toBe('Post one & two')
  })

  it('serves subsequent requests from cache', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, text: async () => RSS_2_0 }))
    vi.stubGlobal('fetch', fetchMock)
    await request(app).get(`/api/rss/feed?url=${encodeURIComponent(FEED_URL)}`).expect(200)
    await request(app).get(`/api/rss/feed?url=${encodeURIComponent(FEED_URL)}`).expect(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects a non-http URL and returns structured errors', async () => {
    await request(app).get('/api/rss/feed?url=file:///etc/passwd').expect(400)
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })))
    const res = await request(app).get(`/api/rss/feed?url=${encodeURIComponent(FEED_URL)}`).expect(502)
    expect(res.body.error).toBe('FEED_HTTP')
  })
})

beforeAll(async () => {
  await new Promise((resolve) => server.listen(0, resolve))
})

afterAll(() => {
  server.close()
})