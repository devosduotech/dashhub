export interface GithubTrendingRepo {
  name: string
  full_name: string
  html_url: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  pushed_at: string
}

export interface GithubTrendingResult {
  kind: string
  items: GithubTrendingRepo[]
}

// Fetch trending repositories from GitHub
export async function fetchGithubTrending(_since: 'daily' | 'weekly' | 'monthly' = 'daily', 
  _language?: string, _stars?: number, limit: number = 5): Promise<GithubTrendingResult> {
  // Use GitHub's search API for trending repos sorted by stars
  const searchUrl = `https://api.github.com/search/repositories?q=sort:stars&sort=order:desc&per_page=${limit}`
  
  const result = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'DashHub',
      'Accept': 'application/vnd.github.v3+json'
    }
  })
  
  if (!result.ok) {
    throw new Error(`GitHub API error: ${result.status}`)
  }
  
  const data = await result.json()
  const items: GithubTrendingRepo[] = data.items.map((repo: any) => ({
    name: repo.name,
    full_name: repo.full_name,
    html_url: repo.html_url,
    description: repo.description || null,
    language: repo.language || null,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    open_issues_count: repo.open_issues_count,
    pushed_at: repo.pushed_at
  }))
  
  return { kind: 'repos', items }
}