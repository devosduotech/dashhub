export interface VersionItem {
  name: string
  source: 'npm' | 'github' | 'pypi'
  identifier: string
  latestVersion?: string
  publishedAt?: string
  url?: string
  error?: string
}

async function fetchNpmVersion(pkg: string): Promise<Partial<VersionItem>> {
  const r = await fetch(`https://registry.npmjs.org/${pkg}/latest`)
  if (!r.ok) throw new Error(`npm: ${r.status}`)
  const d = await r.json()
  return {
    latestVersion: d.version,
    publishedAt: d.time?.[d.version] || '',
    url: `https://www.npmjs.com/package/${pkg}`
  }
}

async function fetchGitHubVersion(repo: string): Promise<Partial<VersionItem>> {
  const r = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: { 'Accept': 'application/vnd.github.v3+json' }
  })
  if (!r.ok) throw new Error(`GitHub: ${r.status}`)
  const d = await r.json()
  return {
    latestVersion: d.tag_name,
    publishedAt: d.published_at || '',
    url: d.html_url
  }
}

async function fetchPyPIVersion(pkg: string): Promise<Partial<VersionItem>> {
  const r = await fetch(`https://pypi.org/pypi/${pkg}/json`)
  if (!r.ok) throw new Error(`PyPI: ${r.status}`)
  const d = await r.json()
  return {
    latestVersion: d.info.version,
    publishedAt: '',
    url: `https://pypi.org/project/${pkg}/`
  }
}

export async function fetchLatestVersions(items: VersionItem[]): Promise<VersionItem[]> {
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