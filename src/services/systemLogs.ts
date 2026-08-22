export interface LogEntry {
  timestamp: string
  service: string
  message: string
}

export async function fetchSystemLogs(
  connectionId: string,
  options: { service?: string; priority?: string; lines?: number } = {}
): Promise<LogEntry[]> {
  const params = new URLSearchParams({ connectionId })
  if (options.service) params.set('service', options.service)
  if (options.priority) params.set('priority', options.priority)
  if (options.lines) params.set('lines', String(options.lines))

  const res = await fetch(`/api/system-logs?${params}`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || `Failed to fetch logs: HTTP ${res.status}`)
  }
  return res.json()
}

export function getPriorityColor(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('error') || lower.includes('fail') || lower.includes('crit') || lower.includes('emerg')) {
    return 'var(--color-danger, #ef4444)'
  }
  if (lower.includes('warn')) {
    return 'var(--color-warning, #eab308)'
  }
  if (lower.includes('notice')) {
    return 'var(--color-info, #3b82f6)'
  }
  return 'var(--color-text-muted)'
}

export function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts)
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
  } catch {
    return ts
  }
}
