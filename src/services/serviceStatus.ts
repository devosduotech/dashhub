export interface ServiceStatus {
  name: string
  active: boolean
  state: string
  since: string
}

export interface ServiceStatusResponse {
  services: ServiceStatus[]
}

export async function fetchServiceStatus(connectionId: string, services: string[]): Promise<ServiceStatus[]> {
  const params = new URLSearchParams({
    connectionId,
    services: services.join(',')
  })
  const res = await fetch(`/api/service-status?${params}`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || `Failed to fetch service status: HTTP ${res.status}`)
  }
  const data: ServiceStatusResponse = await res.json()
  return data.services
}

export function getStatusColor(active: boolean, state: string): string {
  if (state === 'active') return 'var(--color-success, #22c55e)'
  if (state === 'activating' || state === 'reloading') return 'var(--color-warning, #eab308)'
  if (state === 'failed') return 'var(--color-danger, #ef4444)'
  return 'var(--color-text-dim, #666)'
}

export function formatSince(since: string): string {
  if (!since) return 'Unknown'
  try {
    const date = new Date(since)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  } catch {
    return since
  }
}
