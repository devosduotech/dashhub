import type { SpeedtestServer } from '@/types/config'

export interface SpeedtestUrls {
  ping: string
  download: string
  upload: string
}

export interface PingResult {
  rtt: number
  jitter: number
}

export interface BandwidthResult {
  speed: number
  points: number[]
}

export interface SpeedtestResult {
  ping: PingResult
  download: BandwidthResult
  upload: BandwidthResult
}

function proxyUrl(target: string): string {
  return `/api/speedtest/proxy?url=${encodeURIComponent(target)}`
}

export function buildUrls(server: SpeedtestServer, customBaseUrl?: string): SpeedtestUrls {
  if (server === 'cloudflare') {
    return {
      ping: 'https://speed.cloudflare.com/__ping',
      download: 'https://speed.cloudflare.com/__down',
      upload: 'https://speed.cloudflare.com/__up'
    }
  }

  if (server === 'dashhub') {
    const origin = window.location.origin
    return {
      ping: `${origin}/api/speedtest/ping`,
      download: `${origin}/api/speedtest/download`,
      upload: `${origin}/api/speedtest/upload`
    }
  }

  if (server === 'custom') {
    const base = (customBaseUrl || '').replace(/\/+$/, '')
    return {
      ping: proxyUrl(`${base}/__ping`),
      download: proxyUrl(`${base}/__down`),
      upload: proxyUrl(`${base}/__up`)
    }
  }

  return buildUrls('cloudflare')
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function stddev(arr: number[]): number {
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length
  const squareDiffs = arr.map(v => (v - avg) ** 2)
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / arr.length
  return Math.sqrt(avgSquareDiff)
}

export async function measurePing(
  pingUrl: string,
  count = 10,
  onProgress?: (current: number) => void
): Promise<PingResult> {
  const times: number[] = []
  for (let i = 0; i < count; i++) {
    const start = performance.now()
    try {
      await fetch(`${pingUrl}?_=${Date.now()}`, { cache: 'no-store' })
    } catch { /* timeout is fine */ }
    times.push(performance.now() - start)
    onProgress?.(i + 1)
  }
  return {
    rtt: Math.round(median(times) * 100) / 100,
    jitter: Math.round(stddev(times) * 100) / 100
  }
}

const CHUNK_SIZES = [256 * 1024, 1024 * 1024, 5 * 1024 * 1024, 10 * 1024 * 1024, 25 * 1024 * 1024]

async function fetchChunk(url: string, bytes: number): Promise<number> {
  const sep = url.includes('?') ? '&' : '?'
  const start = performance.now()
  const res = await fetch(`${url}${sep}bytes=${bytes}`, { cache: 'no-store' })
  const blob = await res.blob()
  const duration = performance.now() - start
  return (blob.size * 8) / (duration / 1000)
}

async function postChunk(url: string, bytes: number): Promise<number> {
  const data = new Uint8Array(bytes)
  const maxBlock = 65536
  for (let offset = 0; offset < bytes; offset += maxBlock) {
    const block = data.subarray(offset, Math.min(offset + maxBlock, bytes))
    crypto.getRandomValues(block)
  }
  const start = performance.now()
  await fetch(url, {
    method: 'POST',
    body: data,
    headers: { 'Content-Type': 'application/octet-stream' }
  })
  const duration = performance.now() - start
  return (bytes * 8) / (duration / 1000)
}

export async function measureDownload(
  downloadUrl: string,
  duration = 10,
  streams = 4,
  onProgress?: (speed: number, phase: string) => void
): Promise<BandwidthResult> {
  const points: number[] = []
  const startTime = performance.now()
  let chunkIdx = 0

  while ((performance.now() - startTime) / 1000 < duration && chunkIdx < CHUNK_SIZES.length) {
    const bytes = CHUNK_SIZES[chunkIdx]
    const promises: Promise<number>[] = []
    for (let s = 0; s < streams; s++) {
      promises.push(fetchChunk(downloadUrl, bytes))
    }
    const results = await Promise.all(promises)
    const maxBps = Math.max(...results)
    points.push(maxBps / 1e6)
    onProgress?.(maxBps / 1e6, 'download')

    if (maxBps / 1e6 > 0) chunkIdx++
    await new Promise(r => setTimeout(r, 100))
  }

  const validPoints = points.filter(p => p > 0)
  const speed = validPoints.length ? Math.max(...validPoints) : 0
  return { speed: Math.round(speed * 100) / 100, points }
}

export async function measureUpload(
  uploadUrl: string,
  duration = 10,
  streams = 4,
  onProgress?: (speed: number, phase: string) => void
): Promise<BandwidthResult> {
  const points: number[] = []
  const startTime = performance.now()
  let chunkIdx = 0

  while ((performance.now() - startTime) / 1000 < duration && chunkIdx < CHUNK_SIZES.length) {
    const bytes = Math.min(CHUNK_SIZES[chunkIdx], 10 * 1024 * 1024)
    const promises: Promise<number>[] = []
    for (let s = 0; s < streams; s++) {
      promises.push(postChunk(uploadUrl, bytes))
    }
    const results = await Promise.all(promises)
    const maxBps = Math.max(...results)
    points.push(maxBps / 1e6)
    onProgress?.(maxBps / 1e6, 'upload')

    if (maxBps / 1e6 > 0) chunkIdx++
    await new Promise(r => setTimeout(r, 100))
  }

  const validPoints = points.filter(p => p > 0)
  const speed = validPoints.length ? Math.max(...validPoints) : 0
  return { speed: Math.round(speed * 100) / 100, points }
}
