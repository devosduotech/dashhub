import { runSshCommand } from './sshUtils.js'

function parseJournalOutput(stdout) {
  const entries = []
  const lines = stdout.trim().split('\n')
  for (const line of lines) {
    if (!line.trim()) continue
    const match = line.match(/^(\d{4}-\d{2}-\d{2}T[\d:+-]+)\s+\S+\s+(\S+?)\[\d+\]:\s*(.*)$/)
    if (match) {
      entries.push({
        timestamp: match[1],
        service: match[2],
        message: match[3]
      })
    } else {
      entries.push({
        timestamp: new Date().toISOString(),
        service: 'kernel',
        message: line.trim()
      })
    }
  }
  return entries
}

export async function fetchSystemLogs(connId, options = {}) {
  const { service = '', priority = 'info', lines = 100 } = options
  const priorityMap = {
    emerg: 0, alert: 1, crit: 2, err: 3, warning: 4, notice: 5, info: 6, debug: 7
  }
  const prioNum = priorityMap[priority] ?? 6
  const serviceFlag = service ? `-u ${service}` : ''
  const cmd = `journalctl ${serviceFlag} -p ${prioNum} -n ${lines} --no-pager -o short-iso 2>/dev/null || echo "No logs available"`
  const stdout = await runSshCommand(connId, cmd, 20000)
  return parseJournalOutput(stdout)
}
