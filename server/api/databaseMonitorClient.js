import { runSshCommand } from './sshUtils.js'

function parseMysqlOutput(stdout) {
  const lines = stdout.trim().split('\n')
  if (lines.length < 1) return null
  const map = {}
  for (const line of lines) {
    const parts = line.split('\t')
    if (parts.length >= 2) {
      map[parts[0].trim().toLowerCase()] = parseInt(parts[1]) || 0
    }
  }
  if (Object.keys(map).length === 0) return null
  return {
    connected: map['threads_connected'] ?? 0,
    running: map['threads_running'] ?? 0,
    maxConnections: map['max_connections'] ?? 0,
    queries: map['queries'] ?? 0,
    slowQueries: map['slow_queries'] ?? 0,
    uptime: map['uptime'] ?? 0,
    bytesSent: map['bytes_sent'] ?? 0,
    bytesReceived: map['bytes_received'] ?? 0
  }
}

async function detectDbCredentials(connId) {
  const checks = [
    // Frappe / ERPNext
    'cat ~/frappe-bench/sites/*/site_config.json 2>/dev/null | head -10',
    // WordPress
    'grep -h "DB_USER\\|DB_PASSWORD\\|DB_HOST" ~/wordpress*/wp-config.php ~/www/*/wp-config.php /var/www/*/wp-config.php 2>/dev/null | head -6',
    // Laravel
    'grep -h "DB_USERNAME\\|DB_PASSWORD\\|DB_HOST" ~/aravel*/.env ~/www*/.env /var/www*/.env 2>/dev/null | head -6',
    // Docker MySQL
    'docker exec $(docker ps -q --filter ancestor=mysql 2>/dev/null | head -1) env 2>/dev/null | grep MYSQL',
  ]

  for (const check of checks) {
    try {
      const out = await runSshCommand(connId, check)
      if (!out.trim()) continue

      // Frappe
      const dbNameMatch = out.match(/"db_name"\s*:\s*"([^"]+)"/)
      const dbPassMatch = out.match(/"db_password"\s*:\s*"([^"]+)"/)
      if (dbNameMatch && dbPassMatch) {
        return { dbUser: dbNameMatch[1], dbPassword: dbPassMatch[1] }
      }

      // WordPress / Laravel .env style
      const userMatch = out.match(/(?:DB_USER(?:NAME)?)\s*=\s*['"]?([^'"\s]+)/)
      const passMatch = out.match(/(?:DB_PASSWORD)\s*=\s*['"]?([^'"\s]+)/)
      if (userMatch && passMatch) {
        return { dbUser: userMatch[1], dbPassword: passMatch[1] }
      }
    } catch { /* continue */ }
  }
  return null
}

export async function fetchDatabaseMonitor(connId, options = {}) {
  let { dbHost = '127.0.0.1', dbPort = 3306, dbUser = '', dbPassword = '' } = options

  const checkCmd = 'which mysql 2>/dev/null || echo "NOT_INSTALLED"'
  const checkResult = await runSshCommand(connId, checkCmd)
  if (checkResult.trim() === 'NOT_INSTALLED') {
    throw new Error('MySQL client not installed on remote server. Install with: apt install mysql-client or yum install mysql')
  }

  if (!dbPassword) {
    const detected = await detectDbCredentials(connId)
    if (detected) {
      dbUser = detected.dbUser
      dbPassword = detected.dbPassword
    }
  }

  if (!dbUser) {
    throw new Error('MySQL credentials not found. Enter username and password in widget settings.')
  }

  const passArg = dbPassword ? `-p${dbPassword}` : ''
  const cmd = `mysql -u ${dbUser} ${passArg} -h ${dbHost} -P ${dbPort} -N -e "SHOW GLOBAL STATUS WHERE Variable_name IN ('Threads_connected','Threads_running','Queries','Slow_queries','Uptime','Bytes_sent','Bytes_received'); SHOW VARIABLES WHERE Variable_name = 'Max_connections';" 2>&1 || true`
  const stdout = await runSshCommand(connId, cmd, 20000)
  const result = parseMysqlOutput(stdout)
  if (!result) {
    const errMsg = stdout.trim() || 'Unknown error'
    if (errMsg.includes('Access denied')) {
      throw new Error(`Access denied for '${dbUser}' — check username and password in widget settings.`)
    }
    if (errMsg.includes("Can't connect")) {
      throw new Error(`Cannot connect to MySQL at ${dbHost}:${dbPort} — check host and port.`)
    }
    throw new Error(`MySQL: ${errMsg.substring(0, 200)}`)
  }
  return result
}
