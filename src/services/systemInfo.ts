export interface SystemInfo {
  cpu: {
    cores: number
    model: string
    usagePercent: number
    loadAvg: number[]
  }
  memory: {
    totalMb: number
    usedMb: number
    percent: number
  }
  disk: Array<{
    mount: string
    total: string
    used: string
    percent: number
  }>
  network: Array<{
    interface: string
    ip: string
    rxMb?: number
    txMb?: number
  }>
}

export async function fetchSystemInfo(connectionId: string): Promise<SystemInfo> {
  const params = new URLSearchParams({ connectionId })
  const res = await fetch(`/api/system-info?${params}`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || `Failed to fetch system info: HTTP ${res.status}`)
  }
  return res.json()
}

export function formatBytes(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb} MB`
}

export function formatBytesTraffic(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb} MB`
}

export function getHealthColor(percent: number): string {
  if (percent < 50) return 'var(--color-success, #22c55e)'
  if (percent < 80) return 'var(--color-warning, #eab308)'
  return 'var(--color-danger, #ef4444)'
}

export function getHealthLevel(percent: number): 'good' | 'warning' | 'critical' {
  if (percent < 50) return 'good'
  if (percent < 80) return 'warning'
  return 'critical'
}
