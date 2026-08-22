import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  readConfigSync,
  writeConfigSync,
  validateConfig,
  ensureIds,
  sanitizeConfig,
  preserveCredentials,
  CONFIG_FILE
} from './configManager.js'
import { setupSshBridge } from './sshBridge.js'
import { UPLOADS_DIR, listUploads, saveUpload, deleteUpload, MAX_UPLOAD_SIZE } from './uploadsManager.js'
import { getChannelVideos, isValidChannelId } from './youtube.js'
import { getFeedItems, isValidFeedUrl } from './rss.js'
import { getHistory as getUptimeHistory, appendResults as appendUptimeResults } from './uptimeStore.js'
import { discoverCalendars, fetchEvents } from './caldavClient.js'
import { fetchProcesses } from './processClient.js'
import { fetchSystemInfo } from './systemInfoClient.js'
import { fetchServiceStatus } from './serviceStatusClient.js'
import { fetchSystemLogs } from './systemLogsClient.js'
import { fetchDatabaseMonitor } from './databaseMonitorClient.js'

const app = express()
const PORT = process.env.API_PORT || 48231

app.use(cors())
app.use(express.json({ limit: '2mb' }))

function sendError(res, status, code, message) {
  res.status(status).json({ error: code, message })
}

app.get('/api/config', (req, res) => {
  try {
    const config = readConfigSync()
    res.json(sanitizeConfig(config))
  } catch (err) {
    console.error('[config] read failed:', err)
    sendError(res, 500, 'CONFIG_READ_FAILED', 'Unable to load configuration')
  }
})

app.put('/api/config', (req, res) => {
  try {
    const config = req.body
    const { valid, errors } = validateConfig(config)
    if (!valid) {
      return sendError(res, 400, 'CONFIG_INVALID', errors.join('; '))
    }
    ensureIds(config)
    let existing = null
    try {
      existing = readConfigSync()
    } catch (err) {
      console.warn('[config] could not read existing config for credential preservation:', err.message)
    }
    if (existing) preserveCredentials(config, existing)
    writeConfigSync(config)
    res.json({ ok: true })
  } catch (err) {
    console.error('[config] save failed:', err)
    sendError(res, 500, 'CONFIG_WRITE_FAILED', 'Unable to save configuration')
  }
})

app.post('/api/config/validate', (req, res) => {
  try {
    const { valid, errors } = validateConfig(req.body)
    res.json({ valid, errors })
  } catch (err) {
    console.error('[config] validate failed:', err)
    sendError(res, 400, 'CONFIG_INVALID', 'Unable to validate configuration')
  }
})

// ---- Uploaded media (icons/images) ------------------------------------------

app.get('/api/uploads', (req, res) => {
  try {
    res.json(listUploads())
  } catch (err) {
    console.error('[uploads] list failed:', err)
    sendError(res, 500, 'UPLOAD_LIST_FAILED', 'Unable to list uploaded images')
  }
})

app.post('/api/uploads', express.raw({ type: () => true, limit: MAX_UPLOAD_SIZE }), (req, res) => {
  try {
    const entry = saveUpload(req.body)
    if (!entry) {
      return sendError(res, 400, 'UPLOAD_INVALID', 'Unsupported image format or file too large (max 2 MB)')
    }
    res.status(201).json(entry)
  } catch (err) {
    console.error('[uploads] save failed:', err)
    sendError(res, 500, 'UPLOAD_WRITE_FAILED', 'Unable to store the uploaded image')
  }
})

app.delete('/api/uploads/:name', (req, res) => {
  try {
    if (!deleteUpload(req.params.name)) {
      return sendError(res, 404, 'UPLOAD_NOT_FOUND', 'Uploaded image not found')
    }
    res.json({ ok: true })
  } catch (err) {
    console.error('[uploads] delete failed:', err)
    sendError(res, 500, 'UPLOAD_DELETE_FAILED', 'Unable to delete the uploaded image')
  }
})

// ---- RSS/Atom feed proxy (server-side fetch + parse + cache) ----------------

app.get('/api/rss/feed', async (req, res) => {
  const feedUrl = String(req.query.url || '')
  if (!isValidFeedUrl(feedUrl)) {
    return sendError(res, 400, 'FEED_INVALID', 'A valid http(s) feed URL is required')
  }
  const max = Number(req.query.max) || 5
  const cacheMinutes = Number(req.query.cacheMinutes) || undefined
  try {
    const result = await getFeedItems(feedUrl, { max, cacheMinutes })
    res.json({ url: feedUrl, title: result.title, items: result.items, cached: result.cached })
  } catch (err) {
    console.error(`[rss] feed fetch failed for ${feedUrl}:`, err.message)
    sendError(res, err.code === 'FEED_INVALID' ? 400 : 502, err.code || 'FEED_FETCH', 'Unable to load the feed')
  }
})

app.use('/uploads', express.static(UPLOADS_DIR))
app.use('/uploads', (req, res) => sendError(res, 404, 'UPLOAD_NOT_FOUND', 'Uploaded image not found'))

// ---- YouTube channel feed (RSS proxy, no API key required) -----------------

app.get('/api/youtube/feed', async (req, res) => {
  const channelId = String(req.query.channelId || '')
  if (!isValidChannelId(channelId)) {
    return sendError(res, 400, 'CHANNEL_INVALID', 'A valid YouTube channel id is required')
  }
  const max = Number(req.query.max) || 6
  const cacheMinutes = Number(req.query.cacheMinutes) || undefined
  try {
    const result = await getChannelVideos(channelId, { max, cacheMinutes })
    res.json({ channelId, videos: result.videos, cached: result.cached })
  } catch (err) {
    console.error(`[youtube] feed fetch failed for ${channelId}:`, err.message)
    sendError(res, err.code === 'CHANNEL_INVALID' ? 400 : 502, err.code || 'FEED_FETCH', 'Unable to load the YouTube channel feed')
  }
})

app.post('/api/public-ip', async (req, res) => {
  const provider = req.body?.provider || 'ip-api'
  const PROXY_PROVIDERS = {
    'ip-api': 'http://ip-api.com/json/?fields=query,city,regionName,country',
    'ipapi': 'https://ipapi.co/json/',
    'freeipapi': 'https://freeipapi.com/api/json',
    'ipquery': 'https://ipquery.io/api'
  }
  const url = PROXY_PROVIDERS[provider] || PROXY_PROVIDERS['ip-api']
  try {
    const r = await fetch(url)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const d = await r.json()
    let ip, location
    if (provider === 'ip-api') {
      ip = d.query; location = `${d.city}, ${d.regionName}, ${d.country}`
    } else if (provider === 'ipapi') {
      ip = d.ip; location = `${d.city}, ${d.region}, ${d.country_name}`
    } else if (provider === 'freeipapi') {
      ip = d.ip; location = `${d.cityName}, ${d.regionName}, ${d.countryName}`
    } else if (provider === 'ipquery') {
      ip = d.ip; location = `${d.city}, ${d.region}, ${d.country}`
    } else {
      ip = d.ip || d.query; location = ''
    }
    res.json({ ip, location })
  } catch (err) {
    console.error(`[public-ip] fetch failed for ${provider}:`, err.message)
    sendError(res, 502, 'IP_FETCH_FAILED', `Unable to fetch IP from ${provider}`)
  }
})

app.post('/api/status-check', async (req, res) => {
  const { url, method = 'GET', timeout = 5, expectedStatus = 200 } = req.body || {}
  if (!url) return sendError(res, 400, 'MISSING_URL', 'URL is required')
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout * 1000)
    const start = Date.now()
    const response = await fetch(url, {
      method: method.toUpperCase(),
      signal: controller.signal,
      redirect: 'follow'
    })
    clearTimeout(timer)
    const latency = Date.now() - start
    const status = response.status
    const ok = status === expectedStatus
    res.json({ ok, status, latency })
  } catch (err) {
    const latency = err.name === 'AbortError' ? timeout * 1000 : undefined
    res.json({ ok: false, status: 0, latency, error: err.name === 'AbortError' ? 'timeout' : err.message })
  }
})

// ─── Speedtest endpoints ───────────────────────────────────────────

app.get('/api/speedtest/ping', (_req, res) => {
  res.json({ ts: Date.now() })
})

app.get('/api/speedtest/download', (req, res) => {
  const bytes = Math.min(Math.max(parseInt(req.query.bytes) || 1048576, 1), 52428800)
  res.setHeader('Content-Type', 'application/octet-stream')
  res.setHeader('Content-Length', bytes)
  res.setHeader('Cache-Control', 'no-store')
  let sent = 0
  const chunk = Buffer.allocUnsafe(65536)
  crypto.randomFillSync(chunk)
  function sendChunk() {
    if (sent >= bytes) return res.end()
    const toSend = Math.min(chunk.length, bytes - sent)
    res.write(toSend === chunk.length ? chunk : chunk.subarray(0, toSend))
    sent += toSend
    setImmediate(sendChunk)
  }
  sendChunk()
})

app.post('/api/speedtest/upload', express.raw({ limit: '50mb', type: '*/*' }), (req, res) => {
  res.json({ bytesReceived: req.body ? req.body.length : 0 })
})

app.all('/api/speedtest/proxy', async (req, res) => {
  try {
    const targetUrl = req.query.url
    if (!targetUrl || typeof targetUrl !== 'string') {
      return sendError(res, 400, 'MISSING_URL', 'Missing url parameter')
    }
    const parsed = new URL(targetUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return sendError(res, 400, 'INVALID_PROTOCOL', 'Only http/https URLs allowed')
    }
    const response = await fetch(targetUrl, { method: req.method, redirect: 'follow' })
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Access-Control-Allow-Origin', '*')
    if (contentType.includes('text') || contentType.includes('json')) {
      const text = await response.text()
      res.send(text)
    } else {
      const buffer = Buffer.from(await response.arrayBuffer())
      res.send(buffer)
    }
  } catch (err) {
    sendError(res, 502, 'PROXY_FAILED', err instanceof Error ? err.message : 'Proxy request failed')
  }
})

// --- Process list endpoint ---

app.get('/api/processes', async (req, res) => {
  try {
    const { connectionId, sortBy, sortOrder, maxProcesses } = req.query
    if (!connectionId) {
      return sendError(res, 400, 'MISSING_FIELDS', 'connectionId is required')
    }
    const processes = await fetchProcesses(
      connectionId,
      sortBy || 'cpu',
      sortOrder || 'desc',
      parseInt(maxProcesses) || 25
    )
    res.json({ processes })
  } catch (err) {
    sendError(res, 502, 'PROCESS_FETCH_FAILED', err instanceof Error ? err.message : 'Failed to fetch processes')
  }
})

// --- CalDAV calendar endpoints ---

app.post('/api/caldav/discover', express.json({ limit: '1mb' }), async (req, res) => {
  try {
    const { baseUrl, username, password } = req.body
    if (!baseUrl || !username || !password) {
      return sendError(res, 400, 'MISSING_FIELDS', 'baseUrl, username, and password are required')
    }
    const calendars = await discoverCalendars(baseUrl, username, password)
    res.json({ calendars })
  } catch (err) {
    sendError(res, 502, 'CALDAV_DISCOVER_FAILED', err instanceof Error ? err.message : 'Discovery failed')
  }
})

app.post('/api/caldav/events', express.json({ limit: '1mb' }), async (req, res) => {
  try {
    const { baseUrl, username, password, calendarUrl, start, end } = req.body
    if (!baseUrl || !username || !password || !calendarUrl) {
      return sendError(res, 400, 'MISSING_FIELDS', 'baseUrl, username, password, and calendarUrl are required')
    }
    const startDate = start ? new Date(start) : new Date()
    const endDate = end ? new Date(end) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const events = await fetchEvents(baseUrl, username, password, calendarUrl, startDate, endDate)
    res.json({ events })
  } catch (err) {
    sendError(res, 502, 'CALDAV_EVENTS_FAILED', err instanceof Error ? err.message : 'Failed to fetch events')
  }
})

// --- Uptime monitoring endpoints ---

app.get('/api/uptime/history', (req, res) => {
  try {
    const hours = req.query.hours ? parseInt(req.query.hours, 10) : undefined
    const history = getUptimeHistory(hours)
    res.json(history)
  } catch (err) {
    sendError(res, 500, 'UPTIME_HISTORY_FAILED', err instanceof Error ? err.message : 'Failed to read history')
  }
})

app.post('/api/uptime/check', express.json({ limit: '1mb' }), async (req, res) => {
  try {
    const { urls } = req.body
    if (!Array.isArray(urls) || urls.length === 0) {
      return sendError(res, 400, 'MISSING_URLS', 'urls array is required')
    }
    if (urls.length > 20) {
      return sendError(res, 400, 'TOO_MANY_URLS', 'Maximum 20 URLs per request')
    }
    const results = await Promise.all(
      urls.map(async (item) => {
        const start = Date.now()
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 5000)
          const response = await fetch(item.url, {
            method: 'HEAD',
            signal: controller.signal,
            redirect: 'follow'
          })
          clearTimeout(timeout)
          const latency = Date.now() - start
          return {
            id: item.id,
            status: response.ok ? 'up' : 'down',
            latency
          }
        } catch (err) {
          return {
            id: item.id,
            status: 'down',
            latency: Date.now() - start
          }
        }
      })
    )
    appendUptimeResults(results)
    res.json({ results })
  } catch (err) {
    sendError(res, 500, 'UPTIME_CHECK_FAILED', err instanceof Error ? err.message : 'Check failed')
  }
})

// --- System Info endpoint ---

app.get('/api/system-info', async (req, res) => {
  try {
    const { connectionId } = req.query
    if (!connectionId) return sendError(res, 400, 'MISSING_CONNECTION', 'connectionId is required')
    const info = await fetchSystemInfo(connectionId)
    res.json(info)
  } catch (err) {
    sendError(res, 500, 'SYSTEM_INFO_FAILED', err instanceof Error ? err.message : 'Failed to fetch system info')
  }
})

// --- Service Status endpoint ---

app.get('/api/service-status', async (req, res) => {
  try {
    const { connectionId, services } = req.query
    if (!connectionId) return sendError(res, 400, 'MISSING_CONNECTION', 'connectionId is required')
    if (!services) return sendError(res, 400, 'MISSING_SERVICES', 'services is required')
    const serviceList = services.split(',').map(s => s.trim()).filter(Boolean)
    const result = await fetchServiceStatus(connectionId, serviceList)
    res.json({ services: result })
  } catch (err) {
    sendError(res, 500, 'SERVICE_STATUS_FAILED', err instanceof Error ? err.message : 'Failed to fetch service status')
  }
})

// --- System Logs endpoint ---

app.get('/api/system-logs', async (req, res) => {
  try {
    const { connectionId, service, priority, lines } = req.query
    if (!connectionId) return sendError(res, 400, 'MISSING_CONNECTION', 'connectionId is required')
    const result = await fetchSystemLogs(connectionId, {
      service: service || '',
      priority: priority || 'info',
      lines: lines ? parseInt(lines, 10) : 100
    })
    res.json(result)
  } catch (err) {
    sendError(res, 500, 'SYSTEM_LOGS_FAILED', err instanceof Error ? err.message : 'Failed to fetch logs')
  }
})

// --- Database Monitor endpoint ---

app.get('/api/database-monitor', async (req, res) => {
  try {
    const { connectionId, dbHost, dbPort, dbUser, dbPassword } = req.query
    if (!connectionId) return sendError(res, 400, 'MISSING_CONNECTION', 'connectionId is required')
    const result = await fetchDatabaseMonitor(connectionId, {
      dbHost: dbHost || '127.0.0.1',
      dbPort: dbPort ? parseInt(dbPort, 10) : 3306,
      dbUser: dbUser || 'root',
      dbPassword: dbPassword || ''
    })
    if (!result) return sendError(res, 500, 'DB_CONNECT_FAILED', 'Failed to connect to database')
    res.json(result)
  } catch (err) {
    sendError(res, 500, 'DATABASE_MONITOR_FAILED', err instanceof Error ? err.message : 'Failed to fetch database stats')
  }
})

app.use((err, req, res, _next) => {
  if (err.type === 'entity.too.large') {
    return sendError(res, 413, 'REQUEST_TOO_LARGE', 'Request payload exceeds the maximum allowed size')
  }
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 400, 'INVALID_JSON', 'Request body is not valid JSON')
  }
  console.error('[api] unhandled error:', err)
  sendError(res, 500, 'INTERNAL_ERROR', 'Unexpected server error')
})

const server = http.createServer(app)
setupSshBridge(server)

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectRun) {
  server.listen(PORT, () => {
    console.log(`DashHub API listening on port ${PORT}`)
    console.log(`Config file: ${CONFIG_FILE}`)
  })
}

export { app, server }