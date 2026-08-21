export interface PublicIpResult {
  ip: string
  location: string
  provider: string
}

export async function fetchPublicIp(
  provider: string = 'ipinfo',
  useProxy: boolean = false
): Promise<PublicIpResult> {
  let ipData: PublicIpResult

  // Client-side: use browser's native fetch
  if (!useProxy && typeof window !== 'undefined') {
    try {
      const result = await fetch(`https://${provider}.com/json`)
      const data = await result.json()

      ipData = {
        ip: data.ip || data.query || 'Unknown',
        location: data.loc || data.city || data.country || '',
        provider
      }
    } catch {
      throw new Error(`Failed to fetch IP from ${provider}`)
    }
  } else {
    // Server-side proxy via API
    const result = await fetch('/api/public-ip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider })
    })
    const data = await result.json()

    ipData = {
      ip: data.ip || data.query || 'Unknown',
      location: data.loc || data.city || data.country || '',
      provider
    }
  }

  return ipData
}