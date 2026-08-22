export interface UptimeCheckResult {
  id: string
  status: 'up' | 'down' | 'unknown'
  latency: number
}

export interface UptimeEntry {
  timestamp: string
  status: 'up' | 'down' | 'unknown'
  latency: number
}

export async function checkEndpoints(
  endpoints: Array<{ id: string; url: string }>
): Promise<UptimeCheckResult[]> {
  const res = await fetch('/api/uptime/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls: endpoints })
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || `Check failed: HTTP ${res.status}`)
  }
  const data = await res.json()
  return data.results
}

export async function fetchUptimeHistory(): Promise<Record<string, UptimeEntry[]>> {
  const res = await fetch('/api/uptime/history')
  if (!res.ok) throw new Error('Failed to fetch history')
  return res.json()
}

export function calcUptimePercent(entries: UptimeEntry[]): number {
  if (entries.length === 0) return 0
  const upCount = entries.filter(e => e.status === 'up').length
  return Math.round((upCount / entries.length) * 1000) / 10
}

export function calcAvgLatency(entries: UptimeEntry[]): number {
  const upEntries = entries.filter(e => e.status === 'up' && e.latency > 0)
  if (upEntries.length === 0) return 0
  const total = upEntries.reduce((sum, e) => sum + e.latency, 0)
  return Math.round(total / upEntries.length)
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

export function buildUptimeBar(entries: UptimeEntry[]): Array<{ status: 'up' | 'down' | 'unknown'; hours: number }> {
  if (entries.length === 0) return []

  const sorted = [...entries].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  const segments: Array<{ status: 'up' | 'down' | 'unknown'; hours: number }> = []
  const now = Date.now()
  const start = now - SEVEN_DAYS_MS

  const buckets = Math.ceil(SEVEN_DAYS_MS / HOUR_MS)
  const bucketStatus: Array<'up' | 'down' | 'unknown'> = new Array(buckets).fill('unknown')

  for (const entry of sorted) {
    const ts = new Date(entry.timestamp).getTime()
    const bucketIdx = Math.floor((ts - start) / HOUR_MS)
    if (bucketIdx >= 0 && bucketIdx < buckets) {
      if (entry.status === 'down') {
        bucketStatus[bucketIdx] = 'down'
      } else if (bucketStatus[bucketIdx] === 'unknown') {
        bucketStatus[bucketIdx] = entry.status
      }
    }
  }

  let currentStatus = bucketStatus[0]
  let count = 0
  for (const status of bucketStatus) {
    if (status === currentStatus) {
      count++
    } else {
      segments.push({ status: currentStatus, hours: count })
      currentStatus = status
      count = 1
    }
  }
  segments.push({ status: currentStatus, hours: count })

  return segments
}
