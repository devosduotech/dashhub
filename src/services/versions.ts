const CACHE_KEY = 'dashhub_versions_cache'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export interface VersionItem {
  name: string
  source: 'npm' | 'github' | 'pypi'
  identifier: string
  latestVersion?: string
  publishedAt?: string
  url?: string
  error?: string
}

// --- Client-side cache (localStorage) ---

function readCache(): Record<string, { expiresAt: number; data: Partial<VersionItem> }> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeCache(cache: Record<string, { expiresAt: number; data: Partial<VersionItem> }>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch { /* quota exceeded — ignore */ }
}

function cacheKey(source: string, identifier: string) {
  return `${source}:${identifier}`
}

function getCached(source: string, identifier: string): Partial<VersionItem> | null {
  const cache = readCache()
  const entry = cache[cacheKey(source, identifier)]
  if (entry && entry.expiresAt > Date.now()) return entry.data
  return null
}

function setCache(source: string, identifier: string, data: Partial<VersionItem>) {
  const cache = readCache()
  cache[cacheKey(source, identifier)] = { expiresAt: Date.now() + CACHE_TTL_MS, data }
  writeCache(cache)
}

export function clearVersionCache() {
  try { localStorage.removeItem(CACHE_KEY) } catch { /* ignore */ }
}

// --- Fetch functions ---

async function fetchNpmVersion(pkg: string): Promise<Partial<VersionItem>> {
  const cached = getCached('npm', pkg)
  if (cached) return cached

  const r = await fetch(`https://registry.npmjs.org/${pkg}/latest`)
  if (!r.ok) throw new Error(`npm: ${r.status}`)
  const d = await r.json()
  const result: Partial<VersionItem> = {
    latestVersion: d.version,
    publishedAt: d.time?.[d.version] || '',
    url: `https://www.npmjs.com/package/${pkg}`
  }
  setCache('npm', pkg, result)
  return result
}

async function fetchGitHubVersion(repo: string): Promise<Partial<VersionItem>> {
  const cached = getCached('github', repo)
  if (cached) return cached

  const r = await fetch(`/api/github/releases?repo=${encodeURIComponent(repo)}`)
  if (!r.ok) throw new Error(`GitHub: ${r.status}`)
  const d = await r.json()
  const result: Partial<VersionItem> = {
    latestVersion: d.tagName,
    publishedAt: d.publishedAt || '',
    url: d.url
  }
  setCache('github', repo, result)
  return result
}

async function fetchPyPIVersion(pkg: string): Promise<Partial<VersionItem>> {
  const cached = getCached('pypi', pkg)
  if (cached) return cached

  const r = await fetch(`https://pypi.org/pypi/${pkg}/json`)
  if (!r.ok) throw new Error(`PyPI: ${r.status}`)
  const d = await r.json()
  const result: Partial<VersionItem> = {
    latestVersion: d.info.version,
    publishedAt: '',
    url: `https://pypi.org/project/${pkg}/`
  }
  setCache('pypi', pkg, result)
  return result
}

export async function fetchLatestVersions(items: VersionItem[], forceRefresh = false): Promise<VersionItem[]> {
  if (forceRefresh) clearVersionCache()

  return Promise.all(
    items.map(async (item) => {
      try {
        let result: Partial<VersionItem>
        switch (item.source) {
          case 'npm':
            result = await fetchNpmVersion(item.identifier)
            break
          case 'github':
            result = await fetchGitHubVersion(item.identifier)
            break
          case 'pypi':
            result = await fetchPyPIVersion(item.identifier)
            break
          default:
            throw new Error(`Unknown source: ${item.source}`)
        }
        return { ...item, ...result, error: undefined }
      } catch (e: any) {
        return { ...item, error: e.message || 'Failed to fetch' }
      }
    })
  )
}
