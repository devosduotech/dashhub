import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import yaml from 'js-yaml'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONFIG_DIR = process.env.CONFIG_DIR || path.resolve(__dirname, '../../data')
const CONFIG_FILE = path.join(CONFIG_DIR, 'conf.yml')
const DEFAULT_CONFIG_FILE = path.resolve(__dirname, '../../config/default.yml')

const VALID_WIDGET_TYPES = new Set([
  'quick-links', 'glances', 'ssh', 'youtube', 'rss', 'iframe', 'clock', 'public-ip', 'latest-versions',
  'notes', 'reminders', 'status-indicators', 'speedtest', 'weather', 'uptime', 'calendar', 'process-list'
])

const VALID_AUTH_TYPES = new Set(['password', 'key', 'agent'])

// Fields that must never leave the backend via /api/config.
const SECRET_FIELDS = ['password', 'privateKey', 'passphrase']

// Only restore the secrets that match the connection's current auth type.
const CREDENTIAL_FIELDS_BY_AUTH = {
  password: ['password'],
  key: ['privateKey', 'passphrase'],
  agent: []
}

const LIMITS = {
  maxPages: 50,
  maxItemsPerPage: 200,
  maxConnectionsPerWidget: 100,
  maxStringLength: 1000,
  maxPageNameLength: 100,
  maxRequestBody: 2 * 1024 * 1024
}

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

function generateId(prefix = 'id') {
  return `${prefix}-${crypto.randomUUID()}`
}

function readConfigSync() {
  ensureConfigDir()
  if (!fs.existsSync(CONFIG_FILE)) {
    if (fs.existsSync(DEFAULT_CONFIG_FILE)) {
      const template = fs.readFileSync(DEFAULT_CONFIG_FILE, 'utf8')
      fs.writeFileSync(CONFIG_FILE, template, 'utf8')
      const parsed = yaml.load(template)
      ensureIds(parsed)
      return parsed
    }
    const empty = { appConfig: { title: 'OSDuo DashHub', theme: 'dark-navy', language: 'en', iconSet: 'material', defaultPage: 0 }, pages: [] }
    writeConfigSync(empty)
    return empty
  }
  const raw = fs.readFileSync(CONFIG_FILE, 'utf8')
  const parsed = yaml.load(raw) || { appConfig: {}, pages: [] }
  let changed = ensureIds(parsed)
  if (changed) writeConfigSync(parsed)
  return parsed
}

function ensureIds(config) {
  let changed = false
  if (!Array.isArray(config.pages)) return changed
  for (const page of config.pages) {
    if (!page.id) { page.id = generateId('page'); changed = true }
    if (!Array.isArray(page.items)) continue
    for (const item of page.items) {
      if (!item.id) { item.id = generateId('item'); changed = true }
      if (item.type === 'ssh' && Array.isArray(item.config?.connections)) {
        for (const conn of item.config.connections) {
          if (!conn.id) { conn.id = generateId('conn'); changed = true }
        }
      }
    }
  }
  return changed
}

function writeConfigSync(config) {
  ensureConfigDir()
  const yamlStr = yaml.dump(config, { lineWidth: -1, indent: 2 })
  const tmp = CONFIG_FILE + '.tmp'
  fs.writeFileSync(tmp, yamlStr, 'utf8')
  fs.renameSync(tmp, CONFIG_FILE)
}

/**
 * Returns a deep copy of the config with all SSH secrets removed.
 * Connections that carry credentials expose only `hasCredential`.
 */
function sanitizeConfig(config) {
  const copy = JSON.parse(JSON.stringify(config || {}))
  if (!Array.isArray(copy.pages)) return copy
  for (const page of copy.pages) {
    if (!Array.isArray(page.items)) continue
    for (const item of page.items) {
      if (item.type !== 'ssh' || !Array.isArray(item.config?.connections)) continue
      for (const conn of item.config.connections) {
        conn.hasCredential = SECRET_FIELDS.some(
          (f) => typeof conn[f] === 'string' && conn[f].length > 0
        )
        for (const f of SECRET_FIELDS) delete conn[f]
      }
    }
  }
  return copy
}

/**
 * When the client saves a sanitized config, restore previously stored secrets
 * for connections that still reference them via `hasCredential` but did not
 * supply new values. Restoration uses the immutable connection id only, and
 * only restores fields that match the connection's current auth type.
 */
function preserveCredentials(incoming, existing) {
  const byId = new Map()
  for (const page of existing.pages || []) {
    for (const item of page.items || []) {
      if (item.type !== 'ssh') continue
      for (const conn of item.config?.connections || []) {
        const creds = {}
        for (const f of SECRET_FIELDS) {
          if (typeof conn[f] === 'string' && conn[f].length > 0) creds[f] = conn[f]
        }
        if (Object.keys(creds).length === 0 || !conn.id) continue
        byId.set(conn.id, creds)
      }
    }
  }
  for (const page of incoming.pages || []) {
    for (const item of page.items || []) {
      if (item.type !== 'ssh') continue
      for (const conn of item.config?.connections || []) {
        const wantsCredential = conn.hasCredential === true
        delete conn.hasCredential
        if (!wantsCredential || !conn.id) continue
        const creds = byId.get(conn.id)
        if (!creds) continue
        for (const f of CREDENTIAL_FIELDS_BY_AUTH[conn.authType] || []) {
          if (!conn[f] && creds[f]) conn[f] = creds[f]
        }
      }
    }
  }
  return incoming
}

function validateConfig(config) {
  const errors = []
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return { valid: false, errors: ['Config must be an object'] }
  }
  if (!config.appConfig || typeof config.appConfig !== 'object' || Array.isArray(config.appConfig)) {
    errors.push('appConfig must be an object')
  } else {
    if (typeof config.appConfig.title !== 'string') errors.push('appConfig.title must be a string')
    else if (config.appConfig.title.length > LIMITS.maxStringLength) errors.push('appConfig.title is too long')
    if (typeof config.appConfig.defaultPage !== 'number' || !Number.isInteger(config.appConfig.defaultPage) || config.appConfig.defaultPage < 0) {
      errors.push('appConfig.defaultPage must be a non-negative integer')
    }
  }
  if (!Array.isArray(config.pages)) {
    errors.push('pages must be an array')
    return { valid: errors.length === 0, errors }
  }
  if (config.pages.length > LIMITS.maxPages) {
    errors.push(`pages exceeds the maximum of ${LIMITS.maxPages}`)
  }
  const pageIds = new Set()
  config.pages.forEach((page, i) => {
    const ref = `pages[${i}]`
    if (!page || typeof page !== 'object') {
      errors.push(`${ref} must be an object`)
      return
    }
    if (typeof page.name !== 'string' || page.name.length === 0) errors.push(`${ref}.name is required`)
    else if (page.name.length > LIMITS.maxPageNameLength) errors.push(`${ref}.name is too long`)
    if (page.id !== undefined && typeof page.id !== 'string') errors.push(`${ref}.id must be a string`)
    if (typeof page.id === 'string' && pageIds.has(page.id)) errors.push(`duplicate page id "${page.id}"`)
    if (typeof page.id === 'string') pageIds.add(page.id)
    if (page.columnCount !== undefined && (typeof page.columnCount !== 'number' || !Number.isInteger(page.columnCount) || page.columnCount < 1 || page.columnCount > 6)) {
      errors.push(`${ref}.columnCount must be an integer between 1 and 6`)
    }
    if (!Array.isArray(page.items)) {
      errors.push(`${ref}.items must be an array`)
      return
    }
    if (page.items.length > LIMITS.maxItemsPerPage) {
      errors.push(`${ref}.items exceeds the maximum of ${LIMITS.maxItemsPerPage}`)
    }
    const itemIds = new Set()
    page.items.forEach((item, j) => {
      const itemRef = `${ref}.items[${j}]`
      if (!item || typeof item !== 'object') {
        errors.push(`${itemRef} must be an object`)
        return
      }
      if (!VALID_WIDGET_TYPES.has(item.type)) {
        errors.push(`${itemRef}.type "${item.type}" is not a valid widget type`)
      }
      if (typeof item.title !== 'string' || item.title.length === 0) errors.push(`${itemRef}.title is required`)
      else if (item.title.length > LIMITS.maxStringLength) errors.push(`${itemRef}.title is too long`)
      if (item.id !== undefined && typeof item.id !== 'string') errors.push(`${itemRef}.id must be a string`)
      if (typeof item.id === 'string' && itemIds.has(item.id)) errors.push(`duplicate widget id "${item.id}"`)
      if (typeof item.id === 'string') itemIds.add(item.id)
      const columnLimit = page.columnCount ?? 3
      if (item.column !== undefined && (typeof item.column !== 'number' || !Number.isInteger(item.column) || item.column < 0)) {
        errors.push(`${itemRef}.column must be a non-negative integer`)
      } else if (typeof item.column === 'number' && item.column >= columnLimit) {
        errors.push(`${itemRef}.column must be less than the page column count (${columnLimit})`)
      }
      if (!item.config || typeof item.config !== 'object' || Array.isArray(item.config)) {
        errors.push(`${itemRef}.config must be an object`)
        return
      }
      if (item.type !== 'ssh' || !Array.isArray(item.config.connections)) return
      if (item.config.connections.length > LIMITS.maxConnectionsPerWidget) {
        errors.push(`${itemRef}.config.connections exceeds the maximum of ${LIMITS.maxConnectionsPerWidget}`)
      }
      const connIds = new Set()
      item.config.connections.forEach((conn, k) => {
        const connRef = `${itemRef}.config.connections[${k}]`
        if (!conn || typeof conn !== 'object') {
          errors.push(`${connRef} must be an object`)
          return
        }
        if (typeof conn.name !== 'string' || conn.name.length === 0) errors.push(`${connRef}.name is required`)
        else if (conn.name.length > LIMITS.maxStringLength) errors.push(`${connRef}.name is too long`)
        if (typeof conn.host !== 'string' || conn.host.length === 0) errors.push(`${connRef}.host is required`)
        else if (conn.host.length > LIMITS.maxStringLength) errors.push(`${connRef}.host is too long`)
        if (typeof conn.username !== 'string' || conn.username.length === 0) errors.push(`${connRef}.username is required`)
        if (conn.port !== undefined && (typeof conn.port !== 'number' || !Number.isInteger(conn.port) || conn.port < 1 || conn.port > 65535)) {
          errors.push(`${connRef}.port must be an integer between 1 and 65535`)
        }
        if (!VALID_AUTH_TYPES.has(conn.authType)) {
          errors.push(`${connRef}.authType must be one of password, key, agent`)
        }
        if (conn.id !== undefined && typeof conn.id !== 'string') errors.push(`${connRef}.id must be a string`)
        if (typeof conn.id === 'string' && connIds.has(conn.id)) errors.push(`duplicate connection id "${conn.id}"`)
        if (typeof conn.id === 'string') connIds.add(conn.id)
      })
    })
  })
  return { valid: errors.length === 0, errors }
}

export {
  CONFIG_DIR,
  CONFIG_FILE,
  readConfigSync,
  writeConfigSync,
  validateConfig,
  ensureIds,
  sanitizeConfig,
  preserveCredentials,
  LIMITS
}