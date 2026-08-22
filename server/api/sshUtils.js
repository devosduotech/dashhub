import { Client } from 'ssh2'
import { readConfigSync } from './configManager.js'

export function getConnectionConfig(connId) {
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
    console.error('[sshUtils] Error reading config:', e.message)
  }
  return null
}

export function buildSshConfig(connConfig) {
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

export function runSshCommand(connId, command, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const connConfig = getConnectionConfig(connId)
    if (!connConfig) {
      return reject(new Error('SSH connection not found'))
    }

    const ssh = new Client()
    const timer = setTimeout(() => {
      ssh.end()
      reject(new Error('SSH connection timed out'))
    }, timeoutMs)

    ssh.on('ready', () => {
      ssh.exec(command, (err, stream) => {
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
          resolve(stdout)
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
