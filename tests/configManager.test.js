import { describe, it, expect } from 'vitest'
import {
  sanitizeConfig,
  preserveCredentials,
  validateConfig,
  ensureIds
} from '../server/api/configManager.js'

function sshConn(overrides = {}) {
  return {
    id: 'conn-1',
    name: 'Prod',
    host: '10.0.0.1',
    port: 22,
    username: 'admin',
    authType: 'password',
    password: 'secret',
    ...overrides
  }
}

function baseConfig() {
  return {
    appConfig: { title: 'OSDuo DashHub', defaultPage: 0 },
    pages: [
      {
        id: 'page-1',
        name: 'Home',
        items: [
          {
            id: 'item-1',
            type: 'ssh',
            title: 'SSH',
            config: { connections: [sshConn()] }
          }
        ]
      }
    ]
  }
}

describe('sanitizeConfig', () => {
  it('strips secrets and flags connections that have credentials', () => {
    const cfg = baseConfig()
    cfg.pages[0].items[0].config.connections.push(
      sshConn({ id: 'conn-2', name: 'Agent', authType: 'agent', password: undefined })
    )
    const sanitized = sanitizeConfig(cfg)

    const c1 = sanitized.pages[0].items[0].config.connections[0]
    expect(c1.password).toBeUndefined()
    expect(c1.hasCredential).toBe(true)

    const c2 = sanitized.pages[0].items[0].config.connections[1]
    expect(c2.hasCredential).toBe(false)
  })

  it('does not mutate the source config', () => {
    const cfg = baseConfig()
    sanitizeConfig(cfg)
    expect(cfg.pages[0].items[0].config.connections[0].password).toBe('secret')
  })

  it('strips privateKey and passphrase', () => {
    const cfg = baseConfig()
    cfg.pages[0].items[0].config.connections[0] = sshConn({
      authType: 'key',
      privateKey: '-----BEGIN KEY-----',
      passphrase: 'pp'
    })
    const sanitized = sanitizeConfig(cfg)
    const conn = sanitized.pages[0].items[0].config.connections[0]
    expect(conn.privateKey).toBeUndefined()
    expect(conn.passphrase).toBeUndefined()
    expect(conn.hasCredential).toBe(true)
  })

  it('strips password from calendar widgets and sets hasCredential', () => {
    const cfg = {
      appConfig: { title: 'T', defaultPage: 0 },
      pages: [{
        id: 'page-1', name: 'Home',
        items: [{
          id: 'item-cal', type: 'calendar', title: 'Cal',
          config: { serverUrl: 'https://caldav.test', username: 'user', password: 'cal-pw',
                    calendarUrl: '/cal', displayName: 'Me', displayMode: 'upcoming',
                    eventCount: 10, refreshInterval: 300 }
        }]
      }]
    }
    const sanitized = sanitizeConfig(cfg)
    const item = sanitized.pages[0].items[0]
    expect(item.config.password).toBeUndefined()
    expect(item.config.hasCredential).toBe(true)
    expect(item.config.username).toBe('user')
    expect(item.config.serverUrl).toBe('https://caldav.test')
  })

  it('strips dbPassword from database-monitor widgets and sets hasCredential', () => {
    const cfg = {
      appConfig: { title: 'T', defaultPage: 0 },
      pages: [{
        id: 'page-1', name: 'Home',
        items: [{
          id: 'item-db', type: 'database-monitor', title: 'DB',
          config: { connectionId: 'conn-1', dbHost: '127.0.0.1', dbPort: 3306,
                    dbUser: 'root', dbPassword: 'db-secret', refreshInterval: 30 }
        }]
      }]
    }
    const sanitized = sanitizeConfig(cfg)
    const item = sanitized.pages[0].items[0]
    expect(item.config.dbPassword).toBeUndefined()
    expect(item.config.hasCredential).toBe(true)
    expect(item.config.dbUser).toBe('root')
    expect(item.config.dbHost).toBe('127.0.0.1')
  })

  it('sanitizes mixed configs with SSH, calendar, and database-monitor', () => {
    const cfg = baseConfig()
    cfg.pages[0].items.push(
      { id: 'item-cal', type: 'calendar', title: 'Cal',
        config: { serverUrl: 'https://caldav.test', username: 'u', password: 'cal-pw',
                  calendarUrl: '/cal', displayName: 'Me', displayMode: 'upcoming',
                  eventCount: 10, refreshInterval: 300 } },
      { id: 'item-db', type: 'database-monitor', title: 'DB',
        config: { connectionId: 'conn-1', dbHost: '127.0.0.1', dbPort: 3306,
                  dbUser: 'root', dbPassword: 'db-pw', refreshInterval: 30 } }
    )
    const sanitized = sanitizeConfig(cfg)
    // SSH
    expect(sanitized.pages[0].items[0].config.connections[0].password).toBeUndefined()
    expect(sanitized.pages[0].items[0].config.connections[0].hasCredential).toBe(true)
    // Calendar
    expect(sanitized.pages[0].items[1].config.password).toBeUndefined()
    expect(sanitized.pages[0].items[1].config.hasCredential).toBe(true)
    // Database Monitor
    expect(sanitized.pages[0].items[2].config.dbPassword).toBeUndefined()
    expect(sanitized.pages[0].items[2].config.hasCredential).toBe(true)
  })
})

describe('preserveCredentials', () => {
  it('restores previously stored secrets by id', () => {
    const existing = baseConfig()
    const incoming = sanitizeConfig(existing)
    const restored = preserveCredentials(incoming, existing)
    expect(restored.pages[0].items[0].config.connections[0].password).toBe('secret')
    expect(restored.pages[0].items[0].config.connections[0].hasCredential).toBeUndefined()
  })

  it('keeps a newly supplied secret and drops the flag', () => {
    const existing = baseConfig()
    const incoming = sanitizeConfig(existing)
    incoming.pages[0].items[0].config.connections[0].password = 'newpass'
    const restored = preserveCredentials(incoming, existing)
    expect(restored.pages[0].items[0].config.connections[0].password).toBe('newpass')
  })

  it('does not attach secrets to connections that do not request them', () => {
    const existing = baseConfig()
    const incoming = sanitizeConfig(existing)
    delete incoming.pages[0].items[0].config.connections[0].hasCredential
    const restored = preserveCredentials(incoming, existing)
    expect(restored.pages[0].items[0].config.connections[0].password).toBeUndefined()
  })

  it('restores by id even after a connection is renamed', () => {
    const existing = baseConfig()
    const incoming = sanitizeConfig(existing)
    incoming.pages[0].items[0].config.connections[0].name = 'Renamed'
    const restored = preserveCredentials(incoming, existing)
    expect(restored.pages[0].items[0].config.connections[0].password).toBe('secret')
  })

  it('does not restore credentials by name when the id is new', () => {
    const existing = baseConfig()
    const incoming = sanitizeConfig(existing)
    const conn = incoming.pages[0].items[0].config.connections[0]
    conn.id = 'conn-brand-new'
    conn.name = 'Prod'
    conn.hasCredential = true
    const restored = preserveCredentials(incoming, existing)
    expect(restored.pages[0].items[0].config.connections[0].password).toBeUndefined()
  })

  it('restores only the fields matching the current authType', () => {
    const existing = baseConfig()
    existing.pages[0].items[0].config.connections.push(
      sshConn({ id: 'conn-key', name: 'KeyHost', authType: 'key', privateKey: 'PRIV', passphrase: 'PP' })
    )
    existing.pages[0].items[0].config.connections.push(
      sshConn({ id: 'conn-ag', name: 'AgentHost', authType: 'agent' })
    )
    const incoming = sanitizeConfig(existing)
    incoming.pages[0].items[0].config.connections[0].authType = 'key'
    const restored = preserveCredentials(incoming, existing)

    const c0 = restored.pages[0].items[0].config.connections[0]
    expect(c0.password).toBeUndefined()
    expect(c0.privateKey).toBeUndefined()
    expect(c0.passphrase).toBeUndefined()

    const c1 = restored.pages[0].items[0].config.connections[1]
    expect(c1.privateKey).toBe('PRIV')
    expect(c1.passphrase).toBe('PP')

    const c2 = restored.pages[0].items[0].config.connections[2]
    expect(c2.password).toBeUndefined()
  })

  it('restores calendar password when hasCredential is true and field is empty', () => {
    const existing = {
      appConfig: { title: 'T', defaultPage: 0 },
      pages: [{
        id: 'page-1', name: 'Home',
        items: [{
          id: 'item-cal', type: 'calendar', title: 'Cal',
          config: { serverUrl: 'https://caldav.test', username: 'user', password: 'cal-pw',
                    calendarUrl: '/cal', displayName: 'Me', displayMode: 'upcoming',
                    eventCount: 10, refreshInterval: 300 }
        }]
      }]
    }
    const incoming = sanitizeConfig(existing)
    // Password should be stripped, hasCredential should be true
    expect(incoming.pages[0].items[0].config.password).toBeUndefined()
    expect(incoming.pages[0].items[0].config.hasCredential).toBe(true)
    const restored = preserveCredentials(incoming, existing)
    expect(restored.pages[0].items[0].config.password).toBe('cal-pw')
    expect(restored.pages[0].items[0].config.hasCredential).toBeUndefined()
  })

  it('restores database-monitor password when hasCredential is true and field is empty', () => {
    const existing = {
      appConfig: { title: 'T', defaultPage: 0 },
      pages: [{
        id: 'page-1', name: 'Home',
        items: [{
          id: 'item-db', type: 'database-monitor', title: 'DB',
          config: { connectionId: 'conn-1', dbHost: '127.0.0.1', dbPort: 3306,
                    dbUser: 'root', dbPassword: 'db-secret', refreshInterval: 30 }
        }]
      }]
    }
    const incoming = sanitizeConfig(existing)
    expect(incoming.pages[0].items[0].config.dbPassword).toBeUndefined()
    expect(incoming.pages[0].items[0].config.hasCredential).toBe(true)
    const restored = preserveCredentials(incoming, existing)
    expect(restored.pages[0].items[0].config.dbPassword).toBe('db-secret')
    expect(restored.pages[0].items[0].config.hasCredential).toBeUndefined()
  })

  it('does not overwrite a newly supplied calendar password', () => {
    const existing = {
      appConfig: { title: 'T', defaultPage: 0 },
      pages: [{
        id: 'page-1', name: 'Home',
        items: [{
          id: 'item-cal', type: 'calendar', title: 'Cal',
          config: { serverUrl: 'https://caldav.test', username: 'user', password: 'old-pw',
                    calendarUrl: '/cal', displayName: 'Me', displayMode: 'upcoming',
                    eventCount: 10, refreshInterval: 300 }
        }]
      }]
    }
    const incoming = sanitizeConfig(existing)
    incoming.pages[0].items[0].config.password = 'new-pw'
    const restored = preserveCredentials(incoming, existing)
    expect(restored.pages[0].items[0].config.password).toBe('new-pw')
  })

  it('does not overwrite a newly supplied database-monitor password', () => {
    const existing = {
      appConfig: { title: 'T', defaultPage: 0 },
      pages: [{
        id: 'page-1', name: 'Home',
        items: [{
          id: 'item-db', type: 'database-monitor', title: 'DB',
          config: { connectionId: 'conn-1', dbHost: '127.0.0.1', dbPort: 3306,
                    dbUser: 'root', dbPassword: 'old-db', refreshInterval: 30 }
        }]
      }]
    }
    const incoming = sanitizeConfig(existing)
    incoming.pages[0].items[0].config.dbPassword = 'new-db'
    const restored = preserveCredentials(incoming, existing)
    expect(restored.pages[0].items[0].config.dbPassword).toBe('new-db')
  })
})

describe('validateConfig', () => {
  it('accepts a valid config', () => {
    expect(validateConfig(baseConfig()).valid).toBe(true)
  })

  it('rejects an unknown widget type', () => {
    const cfg = baseConfig()
    cfg.pages[0].items[0].type = 'nonexistent-widget'
    const { valid, errors } = validateConfig(cfg)
    expect(valid).toBe(false)
    expect(errors.join(' ')).toContain('not a valid widget type')
  })

  it('rejects duplicate widget ids', () => {
    const cfg = baseConfig()
    cfg.pages[0].items.push({ id: 'item-1', type: 'iframe', title: 'IF', config: { url: 'https://x' } })
    const { valid, errors } = validateConfig(cfg)
    expect(valid).toBe(false)
    expect(errors.join(' ')).toContain('duplicate widget id')
  })

  it('rejects an invalid ssh port and authType', () => {
    const cfg = baseConfig()
    cfg.pages[0].items[0].config.connections[0].port = 70000
    cfg.pages[0].items[0].config.connections[0].authType = 'magic'
    const { valid, errors } = validateConfig(cfg)
    expect(valid).toBe(false)
    expect(errors.join(' ')).toContain('port must be an integer')
    expect(errors.join(' ')).toContain('authType')
  })

  it('rejects a connection missing username', () => {
    const cfg = baseConfig()
    delete cfg.pages[0].items[0].config.connections[0].username
    const { valid, errors } = validateConfig(cfg)
    expect(valid).toBe(false)
    expect(errors.join(' ')).toContain('username is required')
  })

  it('rejects an out-of-range item.column', () => {
    const cfg = baseConfig()
    cfg.pages[0].items[0].column = 999
    const { valid, errors } = validateConfig(cfg)
    expect(valid).toBe(false)
    expect(errors.join(' ')).toContain('column')

    const cfg2 = baseConfig()
    cfg2.pages[0].items[0].column = -1
    expect(validateConfig(cfg2).valid).toBe(false)
  })

  it('accepts a valid item.column', () => {
    const cfg = baseConfig()
    cfg.pages[0].items[0].column = 2
    expect(validateConfig(cfg).valid).toBe(true)
  })

  it('rejects a missing appConfig', () => {
    const cfg = baseConfig()
    delete cfg.appConfig
    expect(validateConfig(cfg).valid).toBe(false)
  })

  it('rejects non-object config', () => {
    expect(validateConfig(null).valid).toBe(false)
    expect(validateConfig([]).valid).toBe(false)
  })
})

describe('ensureIds', () => {
  it('adds ids to pages, items and ssh connections and is idempotent', () => {
    const cfg = {
      appConfig: { title: 't', defaultPage: 0 },
      pages: [
        {
          name: 'Home',
          items: [
            { type: 'ssh', title: 'SSH', config: { connections: [{ name: 'x', host: 'h', username: 'u', authType: 'agent' }] } }
          ]
        }
      ]
    }
    ensureIds(cfg)
    expect(cfg.pages[0].id).toBeTruthy()
    expect(cfg.pages[0].items[0].id).toBeTruthy()
    expect(cfg.pages[0].items[0].config.connections[0].id).toBeTruthy()
    const snapshot = JSON.stringify(cfg)
    ensureIds(cfg)
    expect(JSON.stringify(cfg)).toBe(snapshot)
  })
})