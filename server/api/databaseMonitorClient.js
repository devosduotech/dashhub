import { runSshCommand } from './sshUtils.js'

function parseMysqlOutput(stdout) {
  const lines = stdout.trim().split('\n')
  if (lines.length < 2) return null
  const values = lines[1].split('\t').map(v => v.trim())
  return {
    connected: parseInt(values[0]) || 0,
    running: parseInt(values[1]) || 0,
    maxConnections: parseInt(values[2]) || 0,
    queries: parseInt(values[3]) || 0,
    slowQueries: parseInt(values[4]) || 0,
    uptime: parseInt(values[5]) || 0,
    bytesSent: parseInt(values[6]) || 0,
    bytesReceived: parseInt(values[7]) || 0
  }
}

export async function fetchDatabaseMonitor(connId, options = {}) {
  const { dbHost = '127.0.0.1', dbPort = 3306, dbUser = 'root', dbPassword = '' } = options

  const checkCmd = 'which mysql 2>/dev/null || echo "NOT_INSTALLED"'
  const checkResult = await runSshCommand(connId, checkCmd)
  if (checkResult.trim() === 'NOT_INSTALLED') {
    throw new Error('MySQL client not installed on remote server. Install with: apt install mysql-client or yum install mysql')
  }

  const passArg = dbPassword ? `-p${dbPassword}` : ''
  const cmd = `mysql -u ${dbUser} ${passArg} -h ${dbHost} -P ${dbPort} -N -e "SELECT (SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME='Threads_connected') AS connected, (SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME='Threads_running') AS running, (SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME='Max_connections') AS max_conn, (SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME='Queries') AS queries, (SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME='Slow_queries') AS slow_queries, (SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME='Uptime') AS uptime, (SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME='Bytes_sent') AS bytes_sent, (SELECT VARIABLE_VALUE FROM performance_schema.global_status WHERE VARIABLE_NAME='Bytes_received') AS bytes_received;" 2>&1`
  const stdout = await runSshCommand(connId, cmd, 20000)
  const result = parseMysqlOutput(stdout)
  if (!result) {
    const errMsg = stdout.trim() || 'Unknown error'
    if (errMsg.includes('Access denied')) {
      throw new Error('Access denied. Check MySQL username and password.')
    }
    if (errMsg.includes("Can't connect")) {
      throw new Error(`Cannot connect to MySQL at ${dbHost}:${dbPort}. Check host and port.`)
    }
    throw new Error(`MySQL error: ${errMsg.substring(0, 200)}`)
  }
  return result
}
