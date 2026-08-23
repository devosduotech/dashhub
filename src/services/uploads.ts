export interface UploadEntry {
  name: string
  url: string
  size: number
  addedAt: string
}

export async function listUploads(): Promise<UploadEntry[]> {
  const res = await fetch('/api/uploads')
  if (!res.ok) throw new Error(`Failed to list uploads: HTTP ${res.status}`)
  return res.json()
}

export async function uploadImage(file: File): Promise<UploadEntry> {
  const res = await fetch('/api/uploads', {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file
  })
  if (!res.ok) throw new Error(`Failed to upload: HTTP ${res.status}`)
  return res.json()
}

export async function deleteUpload(name: string): Promise<void> {
  const res = await fetch(`/api/uploads/${name}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete upload: HTTP ${res.status}`)
}