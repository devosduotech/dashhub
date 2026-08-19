import { XMLParser } from 'fast-xml-parser'

const RSS_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id='
const FETCH_TIMEOUT_MS = 8000

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_'
})

// Server-side cache so we do not hammer YouTube on every widget render.
const cache = new Map() // channelId -> { expiresAt, videos }
const DEFAULT_TTL_MS = 15 * 60 * 1000

function decodeHtmlEntities(value) {
  return String(value ?? '')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'")
}

function toDate(value) {
  const ms = Date.parse(String(value || ''))
  return Number.isNaN(ms) ? null : new Date(ms).toISOString()
}

function asArray(value) {
  return Array.isArray(value) ? value : value === undefined ? [] : [value]
}

export function isValidChannelId(channelId) {
  return typeof channelId === 'string' && /^[\w-]{6,64}$/.test(channelId)
}

export async function getChannelVideos(channelId, { max = 6, cacheMinutes } = {}) {
  if (!isValidChannelId(channelId)) {
    const error = new Error('Invalid channel id')
    error.code = 'CHANNEL_INVALID'
    throw error
  }

  const clampedMax = Math.min(Math.max(Math.trunc(max) || 6, 1), 12)
  const ttl = Number.isFinite(cacheMinutes) && cacheMinutes > 0 ? cacheMinutes * 60 * 1000 : DEFAULT_TTL_MS

  const cached = cache.get(channelId)
  if (cached && cached.expiresAt > Date.now()) {
    return { cached: true, videos: cached.videos.slice(0, clampedMax) }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  let xml
  try {
    const res = await fetch(`${RSS_URL}${encodeURIComponent(channelId)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/atom+xml, application/xml, text/xml' }
    })
    if (!res.ok) {
      const error = new Error(`YouTube feed returned HTTP ${res.status}`)
      error.code = 'FEED_HTTP'
      throw error
    }
    xml = await res.text()
  } catch (err) {
    const error = new Error(err.name === 'AbortError' ? 'YouTube feed timed out' : err.message)
    error.code = err.code || 'FEED_FETCH'
    throw error
  } finally {
    clearTimeout(timer)
  }

  const feed = parser.parse(xml)
  const entries = asArray(feed?.feed?.entry)

  const videos = entries.map((entry) => {
    const id = String(entry['yt:videoId'] || entry['yt:video_id'] || '')
    const link = asArray(entry.link).find((l) => (l['@_rel'] || 'alternate') === 'alternate')?.['@_href'] || ''
    const media = entry['media:group'] || {}
    const thumb = asArray(media['media:thumbnail'] || media['media:thumb'])[0]
    return {
      id,
      title: decodeHtmlEntities(entry.title),
      url: link || (id ? `https://www.youtube.com/watch?v=${id}` : ''),
      thumbnail: thumb?.['@_url'] || '',
      publishedAt: toDate(entry.published)
    }
  }).filter((v) => v.id || v.url)

  cache.set(channelId, { expiresAt: Date.now() + ttl, videos })
  return { cached: false, videos: videos.slice(0, clampedMax) }
}

export function clearYoutubeCache(channelId) {
  if (channelId) cache.delete(channelId)
  else cache.clear()
}