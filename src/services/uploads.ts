import axios from 'axios'

export interface UploadEntry {
  name: string
  url: string
  size: number
  addedAt: string
}

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
})

export async function listUploads(): Promise<UploadEntry[]> {
  const { data } = await api.get<UploadEntry[]>('/uploads')
  return data
}

export async function uploadImage(file: File): Promise<UploadEntry> {
  const { data } = await api.post<UploadEntry>('/uploads', file, {
    headers: { 'Content-Type': file.type || 'application/octet-stream' }
  })
  return data
}

export async function deleteUpload(name: string): Promise<void> {
  await api.delete(`/uploads/${name}`)
}