import axios from 'axios'
import type { AppConfig } from '@/types/config'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
})

export async function fetchConfig(): Promise<AppConfig> {
  const { data } = await api.get<AppConfig>('/config')
  return data
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await api.put('/config', config)
}

export async function validateConfig(config: AppConfig): Promise<{ valid: boolean; errors: string[] }> {
  const { data } = await api.post<{ valid: boolean; errors: string[] }>('/config/validate', config)
  return data
}