import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.CONFIG_DIR || path.resolve(__dirname, '../../data')
const HISTORY_FILE = path.join(DATA_DIR, 'uptime-history.json')
const MAX_AGE_DAYS = 7

function ensureDir() {
  const dir = path.dirname(HISTORY_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function readHistory() {
  ensureDir()
  if (!fs.existsSync(HISTORY_FILE)) return {}
  try {
    const raw = fs.readFileSync(HISTORY_FILE, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    return {}
  }
}

function writeHistory(history) {
  ensureDir()
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2))
}

function pruneOldEntries(entries) {
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000
  return entries.filter(e => new Date(e.timestamp).getTime() >= cutoff)
}

export function getHistory() {
  const history = readHistory()
  for (const id of Object.keys(history)) {
    history[id] = pruneOldEntries(history[id])
  }
  return history
}

export function appendResults(results) {
  const history = readHistory()
  const now = new Date().toISOString()
  for (const r of results) {
    if (!history[r.id]) history[r.id] = []
    history[r.id].push({ timestamp: now, status: r.status, latency: r.latency })
    history[r.id] = pruneOldEntries(history[r.id])
  }
  writeHistory(history)
}
