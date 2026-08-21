import express from 'express'
import cors from 'cors'
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