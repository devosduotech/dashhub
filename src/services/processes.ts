export interface ProcessInfo {
  user: string
  pid: number
  cpu: number
  mem: number
  vsz: number
  rss: number
  stat: string
  start: string
  time: string
  command: string
  name: string
}

export async function fetchProcesses(
  connectionId: string,
  sortBy: string,
  sortOrder: string,
  maxProcesses: number
): Promise<ProcessInfo[]> {
  const params = new URLSearchParams({
    connectionId,
    sortBy,
    sortOrder,
    maxProcesses: String(maxProcesses)
  })
  const res = await fetch(`/api/processes?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Fetch failed: HTTP ${res.status}`)
  }
  const data = await res.json()
  return data.processes
}

export function formatBytes(kb: number): string {
  if (kb < 1024) return kb + 'K'
  const mb = kb / 1024
  if (mb < 1024) return mb.toFixed(1) + 'M'
  return (mb / 1024).toFixed(1) + 'G'
}

export function statLabel(stat: string): string {
  if (stat.includes('R')) return 'Running'
  if (stat.includes('S')) return 'Sleeping'
  if (stat.includes('D')) return 'Disk Sleep'
  if (stat.includes('Z')) return 'Zombie'
  if (stat.includes('T')) return 'Stopped'
  return stat
}

export function statColor(stat: string): string {
  if (stat.includes('R')) return 'var(--color-success)'
  if (stat.includes('Z')) return 'var(--color-danger)'
  if (stat.includes('T')) return 'var(--color-warning)'
  return 'var(--color-text-muted)'
}
