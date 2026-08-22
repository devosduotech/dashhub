export interface DatabaseStats {
  connected: number
  running: number
  maxConnections: number
  queries: number
  slowQueries: number
  uptime: number
  bytesSent: number
  bytesReceived: number
}

export async function fetchDatabaseMonitor(
  connectionId: string,
  options: { dbHost?: string; dbPort?: number; dbUser?: string; dbPassword?: string } = {}
): Promise<DatabaseStats> {
  const params = new URLSearchParams({ connectionId })
  if (options.dbHost) params.set('dbHost', options.dbHost)
  if (options.dbPort) params.set('dbPort', String(options.dbPort))
  if (options.dbUser) params.set('dbUser', options.dbUser)
  if (options.dbPassword) params.set('dbPassword', options.dbPassword)

  const res = await fetch(`/api/database-monitor?${params}`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || `Failed to fetch database stats: HTTP ${res.status}`)
  }
  return res.json()
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export function calcQps(queries: number, uptime: number): number {
  if (uptime === 0) return 0
  return Math.round((queries / uptime) * 10) / 10
}
