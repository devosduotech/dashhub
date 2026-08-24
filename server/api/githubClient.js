import { createHash } from 'crypto'

const FETCH_TIMEOUT_MS = 8000
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

const cache = new Map() // repoHash -> { expiresAt, payload }

function getHeaders() {
  const headers = { Accept: 'application/vnd.github.v3+json' }
  const token = process.env.GITHUB_TOKEN
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export async function fetchGitHubRelease(repo) {
  const normalized = String(repo || '').trim()
  if (!normalized || !normalized.includes('/')) {
    const error = new Error('Invalid GitHub repo format (expected owner/name)')
    error.code = 'GITHUB_INVALID_REPO'
    throw error
  }

  const hash = createHash('sha1').update(normalized).digest('hex')

  const cached = cache.get(hash)
  if (cached && cached.expiresAt > Date.now()) {
    return { cached: true, ...cached.payload }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(`https://api.github.com/repos/${normalized}/releases/latest`, {
      signal: controller.signal,
      headers: getHeaders()
    })

    if (!res.ok) {
      const error = new Error(`GitHub: ${res.status}`)
      error.code = res.status === 403 ? 'GITHUB_RATE_LIMIT' : 'GITHUB_HTTP'
      throw error
    }

    const data = await res.json()
    const payload = {
      tagName: data.tag_name || '',
      publishedAt: data.published_at || '',
      url: data.html_url || ''
    }

    cache.set(hash, { expiresAt: Date.now() + DEFAULT_TTL_MS, payload })
    return { cached: false, ...payload }
  } catch (err) {
    if (err.name === 'AbortError') {
      const error = new Error('GitHub request timed out')
      error.code = 'GITHUB_TIMEOUT'
      throw error
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export function clearGitHubCache(repo) {
  if (repo) {
    cache.delete(createHash('sha1').update(String(repo).trim()).digest('hex'))
  } else {
    cache.clear()
  }
}
