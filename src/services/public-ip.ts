export interface PublicIpResult {
  ip: string
  location: string
}

export async function fetchPublicIp(
  _provider: string = 'ip-api'
): Promise<PublicIpResult> {
  const result = await fetch('/api/public-ip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'ip-api' })
  })
  if (!result.ok) throw new Error(`IP lookup failed: ${result.status}`)
  const data = await result.json()
  return { ip: data.ip || 'Unknown', location: data.location || '' }
}