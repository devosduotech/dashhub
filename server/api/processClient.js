import { Client } from 'ssh2'
import { readConfigSync } from './configManager.js'

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
    console.error('[processes] Error reading config:', e.message)
  }
  return null
}

function buildSshConfig(connConfig) {
  const sshConfig = {
    host: connConfig.host,
    port: connConfig.port || 22,
    username: connConfig.username,
    readyTimeout: 10000,
    keepaliveInterval: 0
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

function parsePsOutput(stdout) {
  const lines = stdout.trim().split('\n')
  if (lines.length < 2) return []
  const processes = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const parts = line.split(/\s+/)
    if (parts.length < 11) continue
    const user = parts[0]
    const pid = parseInt(parts[1])
    const cpu = parseFloat(parts[2])
    const mem = parseFloat(parts[3])
    const vsz = parseInt(parts[4])
    const rss = parseInt(parts[5])
    const stat = parts[7]
    const start = parts[8]
    const time = parts[9]
    const command = parts.slice(10).join(' ')
    const name = command.split('/').pop().split(' ')[0]
    processes.push({ user, pid, cpu, mem, vsz, rss, stat, start, time, command, name })
  }
  return processes
}

export function fetchProcesses(connId, sortBy = 'cpu', sortOrder = 'desc', maxProcesses = 25) {
  return new Promise((resolve, reject) => {
    const connConfig = getConnectionConfig(connId)
    if (!connConfig) {
      return reject(new Error('SSH connection not found'))
    }

    const sortFlag = sortBy === 'mem' ? '-m' : sortBy === 'pid' ? '-n' : '-r'
    const sortField = sortBy === 'mem' ? '%mem' : sortBy === 'pid' ? 'pid' : '%cpu'
    const cmd = `ps aux --sort=${sortOrder === 'asc' ? '' : '-'}${sortField} | head -n ${maxProcesses + 1}`

    const ssh = new Client()
    const timer = setTimeout(() => {
      ssh.end()
      reject(new Error('SSH connection timed out'))
    }, 15000)

    ssh.on('ready', () => {
      ssh.exec(cmd, (err, stream) => {
        if (err) {
          clearTimeout(timer)
          ssh.end()
          return reject(err)
        }
        let stdout = ''
        let stderr = ''
        stream.on('close', (code) => {
          clearTimeout(timer)
          ssh.end()
          if (code !== 0) {
            return reject(new Error(stderr || `Command exited with code ${code}`))
          }
          const processes = parsePsOutput(stdout)
          resolve(processes)
        })
        stream.on('data', (data) => { stdout += data.toString() })
        stream.stderr.on('data', (data) => { stderr += data.toString() })
      })
    })

    ssh.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })

    ssh.connect(buildSshConfig(connConfig))
  })
}
