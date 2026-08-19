import { XMLParser } from 'fast-xml-parser'
import { createHash } from 'crypto'

const FETCH_TIMEOUT_MS = 8000
const MAX_FEED_BYTES = 4 * 1024 * 1024

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_'
})

const cache = new Map() // urlHash -> { expiresAt, payload }
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

function stripTags(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toDate(value) {
  const ms = Date.parse(String(value || ''))
  return Number.isNaN(ms) ? null : new Date(ms).toISOString()
}

function asArray(value) {
  return Array.isArray(value) ? value : value === undefined ? [] : [value]
}

function httpUrl(value) {
  try {
    const u = new URL(String(value || ''))
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : ''
  } catch {
    return ''
  }
}

export function isValidFeedUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url.trim())
}

function extractThumbnail(entry) {
  const candidates = []
  const media = entry['media:group'] || entry['media:content'] || entry['media:thumbnail']
  const mediaGroup = entry['media:group']

  const mediaThumbs = mediaGroup ? asArray(mediaGroup['media:thumbnail']) : []
  for (const t of mediaThumbs) candidates.push(t?.['@_url'])
  candidates.push(entry['media:thumbnail']?.['@_url'])
  candidates.push(entry['media:content']?.['@_url'])
  const enclosure = asArray(entry.enclosure).find((e) => String(e?.['@_type'] || '').startsWith('image/'))
  candidates.push(enclosure?.['@_url'])
  candidates.push(entry['itunes:image']?.['@_href'])

  for (const c of candidates) {
    const url = httpUrl(c)
    if (url) return url
  }
  return ''
}

function parseEntry(entry) {
  const links = asArray(entry.link)
  const link = links.find((l) => (l['@_rel'] || 'alternate') === 'alternate')?.['@_href'] || links[0]?.['@_href'] || entry.link || ''
  const description = stripTags(decodeHtmlEntities(entry.description || entry.summary || entry.content?.['#text'] || entry.content || ''))
  return {
    title: decodeHtmlEntities(entry.title),
    url: httpUrl(link),
    thumbnail: extractThumbnail(entry),
    description: description.slice(0, 320) || '',
    publishedAt: toDate(entry.pubDate || entry.published || entry.updated)
  }
}

function parseFeed(xml) {
  const doc = parser.parse(xml)

  if (doc?.rss?.channel) {
    const channel = doc.rss.channel
    const items = asArray(channel.item)
      .map(parseEntry)
      .filter((i) => i.title || i.url)
    return { title: decodeHtmlEntities(channel.title), items }
  }

  if (doc?.feed) {
    const items = asArray(doc.feed.entry)
      .map(parseEntry)
      .filter((i) => i.title || i.url)
    return { title: decodeHtmlEntities(doc.feed.title), items }
  }

  const error = new Error('Feed is not valid RSS 2.0 or Atom XML')
  error.code = 'FEED_INVALID'
  throw error
}

export async function getFeedItems(url, { max = 5, cacheMinutes } = {}) {
  const normalized = httpUrl(url)
  if (!normalized) {
    const error = new Error('Invalid feed URL')
    error.code = 'FEED_INVALID'
    throw error
  }

  const clampedMax = Math.min(Math.max(Math.trunc(max) || 5, 1), 20)
  const ttl = Number.isFinite(cacheMinutes) && cacheMinutes > 0 ? cacheMinutes * 60 * 1000 : DEFAULT_TTL_MS
  const hash = createHash('sha1').update(normalized).digest('hex')

  const cached = cache.get(hash)
  if (cached && cached.expiresAt > Date.now()) {
    return { cached: true, title: cached.payload.title, items: cached.payload.items.slice(0, clampedMax) }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  let xml
  try {
    const res = await fetch(normalized, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' }
    })
    if (!res.ok) {
      const error = new Error(`Feed returned HTTP ${res.status}`)
      error.code = 'FEED_HTTP'
      throw error
    }
    xml = await res.text()
    if (Buffer.byteLength(xml, 'utf8') > MAX_FEED_BYTES) {
      const error = new Error('Feed payload is too large')
      error.code = 'FEED_TOO_LARGE'
      throw error
    }
  } catch (err) {
    const error = new Error(err.name === 'AbortError' ? 'Feed request timed out' : err.message)
    error.code = err.code || 'FEED_FETCH'
    throw error
  } finally {
    clearTimeout(timer)
  }

  const payload = parseFeed(xml)
  cache.set(hash, { expiresAt: Date.now() + ttl, payload })
  return { cached: false, title: payload.title, items: payload.items.slice(0, clampedMax) }
}

export function clearRssCache(url) {
  if (url) cache.delete(createHash('sha1').update(httpUrl(url)).digest('hex'))
  else cache.clear()
}