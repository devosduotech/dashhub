import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { WebSocketServer } from 'ws'
import { Client } from 'ssh2'
import { readConfigSync, CONFIG_DIR } from './configManager.js'

const KNOWN_HOSTS_FILE = path.join(CONFIG_DIR, 'known_hosts.json')

function loadKnownHosts() {
  try {
    if (fs.existsSync(KNOWN_HOSTS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(KNOWN_HOSTS_FILE, 'utf8'))
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (e) {
    console.error('Failed to read known_hosts:', e.message)
  }
  return []
}

function findKnownHost(host, port) {
  return loadKnownHosts().find((k) => k.host === host && k.port === port) || null
}

function saveKnownHost(host, port, fingerprint, key) {
  try {
    fs.mkdirSync(path.dirname(KNOWN_HOSTS_FILE), { recursive: true })
    const known = loadKnownHosts().filter((k) => !(k.host === host && k.port === port))
    known.push({
      host,
      port,
      fingerprint,
      key: key.toString('base64'),
      addedAt: new Date().toISOString()
    })
    const tmp = KNOWN_HOSTS_FILE + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(known, null, 2), 'utf8')
    fs.renameSync(tmp, KNOWN_HOSTS_FILE)
    return true
  } catch (e) {
    console.error('Failed to save known host:', e.message)
    return false
  }
}

function fingerprintOf(key) {
  const digest = crypto.createHash('sha256').update(key).digest()
  return 'SHA256:' + digest.toString('base64').replace(/=+$/, '')
}

function getConnectionConfig(connId) {
  try {
    const config = readConfigSync()
    for (const page of config.pages || []) {
      for (const item of page.items || []) {
        if (item.type === 'ssh' && item.config && Array.isArray(item.config.connections)) {
          for (const conn of item.config.connections) {
            if (conn.id === connId) return conn
          }
        }
      }
    }
  } catch (e) {
    console.error('Error reading config for SSH connection:', e.message)
  }
  return null
}

function buildSshConfig(connConfig, hostVerifier) {
  const sshConfig = {
    host: connConfig.host,
    port: connConfig.port || 22,
    username: connConfig.username,
    readyTimeout: 15000,
    keepaliveInterval: 30000,
    hostVerifier
  }
  if (connConfig.authType === 'password' && connConfig.password) {
    sshConfig.password = connConfig.password
  } else if (connConfig.authType === 'key' && connConfig.privateKey) {
    sshConfig.privateKey = connConfig.privateKey
    if (connConfig.passphrase) sshConfig.passphrase = connConfig.passphrase
  } else if (connConfig.authType === 'agent') {
    sshConfig.agent = process.env.SSH_AUTH_SOCK
  }
  return sshConfig
}

/**
 * Opens a throwaway connection to discover the target's host key fingerprint.
 * The hostVerifier captures the presented key and rejects the handshake, so the
 * connection fails with HOST_KEY_NOT_VERIFIED before any authentication runs.
 */
function probeFingerprint(connConfig, cb) {
  const ssh = new Client()
  let captured = null
  let done = false
  const finish = (result) => {
    if (done) return
    done = true
    clearTimeout(timer)
    try {
      ssh.end()
    } catch (e) { /* ignore */ }
    cb(result)
  }
  const timer = setTimeout(() => finish(null), 15000)
  ssh.on('error', () => {
    if (captured) finish({ fingerprint: fingerprintOf(captured), key: captured })
    else finish(null)
  })
  ssh.on('ready', () => finish(captured ? { fingerprint: fingerprintOf(captured), key: captured } : null))
  ssh.connect(buildSshConfig(connConfig, (key) => {
    captured = key
    return false
  }))
}

function setupSshBridge(server) {
  const wss = new WebSocketServer({ server, path: '/api/ssh' })

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost')
    const params = url.searchParams
    const connId = params.get('id') || ''
    const cols = parseInt(params.get('cols') || '80', 10)
    const rows = parseInt(params.get('rows') || '24', 10)

    const connConfig = getConnectionConfig(connId)
    if (!connConfig) {
      ws.send(JSON.stringify({ type: 'error', message: `Connection "${connId}" not found in config` }))
      ws.close()
      return
    }

    const state = {
      stage: 'checking-host',
      pendingHostKey: null,
      stream: null,
      ssh: null
    }

    const send = (obj) => {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj))
    }

    function startSsh() {
      const host = connConfig.host
      const port = connConfig.port || 22
      const ssh = new Client()
      state.ssh = ssh

      const sshConfig = buildSshConfig(connConfig, (key) => {
        if (!key) return false
        const known = findKnownHost(host, port)
        if (!known) return false
        if (known.key) return Buffer.compare(Buffer.from(known.key, 'base64'), key) === 0
        return fingerprintOf(key) === known.fingerprint
      })

      ssh.on('ready', () => {
        ssh.shell({ term: 'xterm-256color', cols, rows }, (err, s) => {
          if (err) {
            send({ type: 'error', message: 'Shell error: ' + err.message })
            ws.close()
            return
          }
          state.stream = s
          send({ type: 'connected', host, port: connConfig.port })

          s.on('data', (data) => send({ type: 'data', data: data.toString('utf8') }))
          s.on('close', () => {
            send({ type: 'closed' })
            ws.close()
          })
          s.stderr.on('data', (data) => send({ type: 'data', data: data.toString('utf8') }))
        })
      })

      ssh.on('error', (err) => {
        const msg = err.message || 'SSH connection failed'
        let hint = ''
        if (msg.includes('ECONNREFUSED')) hint = ' - Connection refused. Is SSH running on the target?'
        else if (msg.includes('ETIMEDOUT')) hint = ' - Connection timed out. Check host and firewall.'
        else if (msg.includes('All configured authentication methods failed')) hint = ' - Authentication failed. Check credentials.'
        else if (msg.includes('Cannot parse privateKey')) hint = ' - Invalid private key format.'
        else if (msg.includes('HOST_KEY')) hint = ' - Host key verification failed.'
        send({ type: 'error', message: msg + hint })
      })

      ssh.on('close', () => {
        send({ type: 'closed' })
        ws.close()
      })

      ssh.connect(sshConfig)
    }

    function checkHostKey() {
      const host = connConfig.host
      const port = connConfig.port || 22
      if (findKnownHost(host, port)) {
        startSsh()
        return
      }
      probeFingerprint(connConfig, (result) => {
        if (!result) {
          send({ type: 'error', message: 'Unable to obtain the host key from the target.' })
          ws.close()
          return
        }
        state.stage = 'awaiting-host-key'
        state.pendingHostKey = { ...result, host, port }
        send({ type: 'host-key', host, port, fingerprint: result.fingerprint })
      })
    }

    checkHostKey()

    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg.toString())
        if (state.stage === 'awaiting-host-key') {
          if (data.type === 'host-key-accept' && state.pendingHostKey) {
            const { host, port, fingerprint, key } = state.pendingHostKey
            if (!saveKnownHost(host, port, fingerprint, key)) {
              send({ type: 'error', message: 'Failed to persist the accepted host key.' })
              ws.close()
              return
            }
            state.pendingHostKey = null
            state.stage = 'connecting'
            startSsh()
          } else if (data.type === 'host-key-reject') {
            send({ type: 'error', message: 'Host key rejected.' })
            ws.close()
          }
          return
        }
        if (data.type === 'input' && state.stream) {
          state.stream.write(data.data)
        } else if (data.type === 'resize' && state.stream) {
          state.stream.setWindow(data.rows || 24, data.cols || 80, 0, 0)
        }
      } catch (e) {
        // ignore malformed messages
      }
    })

    ws.on('close', () => {
      if (state.stream) state.stream.end()
      if (state.ssh) state.ssh.end()
    })

    ws.on('error', () => {
      if (state.stream) state.stream.end()
      if (state.ssh) state.ssh.end()
    })
  })

  console.log('SSH WebSocket bridge ready at /api/ssh')
}

export {
  setupSshBridge,
  getConnectionConfig,
  fingerprintOf,
  findKnownHost,
  saveKnownHost,
  KNOWN_HOSTS_FILE
}