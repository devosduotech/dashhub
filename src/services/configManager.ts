import type { AppConfig } from '@/types/config'

export async function fetchConfig(): Promise<AppConfig> {
  const res = await fetch('/api/config')
  if (!res.ok) throw new Error(`Failed to fetch config: HTTP ${res.status}`)
  return res.json()
}

export async function saveConfig(config: AppConfig): Promise<void> {
  const res = await fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  })
  if (!res.ok) throw new Error(`Failed to save config: HTTP ${res.status}`)
}

export async function validateConfig(config: AppConfig): Promise<{ valid: boolean; errors: string[] }> {
  const res = await fetch('/api/config/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  })
  if (!res.ok) throw new Error(`Failed to validate config: HTTP ${res.status}`)
  return res.json()
}