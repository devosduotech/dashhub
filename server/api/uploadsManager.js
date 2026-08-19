import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { CONFIG_DIR } from './configManager.js'

export const UPLOADS_DIR = path.join(CONFIG_DIR, 'uploads')
export const MAX_UPLOAD_SIZE = 2 * 1024 * 1024

const SAFE_NAME = /^[a-f0-9-]{36}\.(png|jpg|gif|webp)$/

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}

/**
 * Identifies the image type from magic bytes. The declared Content-Type is
 * never trusted; only the file contents decide the extension.
 */
function detectImageType(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 8) return null
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return 'png'
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg'
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'gif'
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) return 'webp'
  return null
}

function listUploads() {
  ensureUploadsDir()
  const entries = []
  for (const name of fs.readdirSync(UPLOADS_DIR)) {
    const filePath = path.join(UPLOADS_DIR, name)
    let stat
    try {
      stat = fs.statSync(filePath)
    } catch {
      continue
    }
    if (!stat.isFile()) continue
    entries.push({
      name,
      url: `/uploads/${name}`,
      size: stat.size,
      addedAt: stat.mtime.toISOString()
    })
  }
  entries.sort((a, b) => b.addedAt.localeCompare(a.addedAt))
  return entries
}

function saveUpload(buf) {
  const ext = detectImageType(buf)
  if (!ext) return null
  if (buf.length > MAX_UPLOAD_SIZE) return null
  ensureUploadsDir()
  const name = `${crypto.randomUUID()}.${ext}`
  const filePath = path.join(UPLOADS_DIR, name)
  const tmp = filePath + '.tmp'
  fs.writeFileSync(tmp, buf)
  fs.renameSync(tmp, filePath)
  return { name, url: `/uploads/${name}`, size: buf.length, addedAt: new Date().toISOString() }
}

function deleteUpload(name) {
  if (!SAFE_NAME.test(name)) return false
  const filePath = path.join(UPLOADS_DIR, name)
  if (!fs.existsSync(filePath)) return false
  fs.unlinkSync(filePath)
  return true
}

export { listUploads, saveUpload, deleteUpload, detectImageType }