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

export async function fetchUptimeHistory(hours?: number): Promise<Record<string, UptimeEntry[]>> {
  const url = hours ? `/api/uptime/history?hours=${hours}` : '/api/uptime/history'
  const res = await fetch(url)
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

const HOUR_MS = 60 * 60 * 1000

// Fine-grained bucketing for the compact 1-hour bar: 12 x 5-minute slots,
// so a recovered endpoint turns green on the next slot instead of staying
// red for up to an hour (worst-check-in-bucket semantics kept per slot).
export const BAR_BUCKET_1H_MS = 5 * 60 * 1000

export function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / (60 * 1000))
  if (totalMinutes < 60) return `${totalMinutes}m`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

export interface UptimeSegment {
  status: 'up' | 'down' | 'unknown'
  count: number
}

export function buildUptimeBar(
  entries: UptimeEntry[],
  windowMs: number = HOUR_MS,
  bucketMs: number = HOUR_MS
): UptimeSegment[] {
  if (entries.length === 0 || bucketMs <= 0) return []

  const sorted = [...entries].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  const segments: UptimeSegment[] = []
  const now = Date.now()
  const start = now - windowMs

  const buckets = Math.ceil(windowMs / bucketMs)
  const bucketStatus: Array<'up' | 'down' | 'unknown'> = new Array(buckets).fill('unknown')

  for (const entry of sorted) {
    const ts = new Date(entry.timestamp).getTime()
    const bucketIdx = Math.floor((ts - start) / bucketMs)
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
      segments.push({ status: currentStatus, count })
      currentStatus = status
      count = 1
    }
  }
  segments.push({ status: currentStatus, count })

  return segments
}
